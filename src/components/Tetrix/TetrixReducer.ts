import type { TetrixAction, Tile } from '../../utils/types';
import { TetrixReducerState } from '../../utils/types';
import { getShapeGridPositions, generateRandomShape, rotateShape, cloneShape, detectSuperComboPattern, generateSuperShape } from '../../utils/shapeUtils';
import { clearFullLines } from '../../utils/lineUtils';
import { calculateScore } from '../../utils/scoringUtils';
import { safeBatchSave, saveModifiers } from '../../utils/persistenceUtils';
import { playSound } from '../../utils/soundEffects';

// Helper function to play line clear sound effects
function playLineClearSounds(clearedRows: number[], clearedColumns: number[]) {
  if (clearedRows.length > 0 && clearedRows.length <= 4) {
    playSound(`clear_combo_${clearedRows.length}` as 'clear_combo_1' | 'clear_combo_2' | 'clear_combo_3' | 'clear_combo_4');
  }
  if (clearedColumns.length > 0 && clearedColumns.length <= 4) {
    playSound(`clear_combo_${clearedColumns.length}` as 'clear_combo_1' | 'clear_combo_2' | 'clear_combo_3' | 'clear_combo_4');
  }
}

const makeTiles = () => {
  const tiles: Tile[] = [];
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      tiles.push({
        id: `(row: ${row}, column: ${column})`,
        location: { row, column },
        block: { isFilled: false, color: 'grey' }
      })
    }
  }
  return tiles;
}

export const initialState: TetrixReducerState = {
  // Game state management - simplified
  gameState: 'playing',
  currentLevel: 0,
  isMapUnlocked: false,

  tiles: makeTiles(),
  nextShapes: [],
  savedShape: null,
  selectedShape: null,
  selectedShapeIndex: null,
  mouseGridLocation: null,
  mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, // Default to center instead of null
  gemIconPosition: { x: 100, y: 50 }, // Default position, will be updated by ScoreDisplay
  gridTileSize: null,
  gridBounds: null,
  isShapeDragging: false,
  isValidPlacement: false,
  hoveredBlockPositions: [],
  placementAnimationState: 'none',
  animationStartPosition: null,
  animationTargetPosition: null,
  removingShapeIndex: null,
  shapeRemovalAnimationState: 'none',
  newShapeAnimationStates: [], // Initialize as empty array
  shapeOptionBounds: [],
  score: 0,
  totalLinesCleared: 0,
  showCoinDisplay: false,
  queueSize: -1, // Infinite by default
  shapesUsed: 0,
  openRotationMenus: [], // Dynamic array based on actual shapes
  hasPlacedFirstShape: false, // Track first shape placement for background music trigger
  isTurningModeActive: false, // Whether turning mode is currently active
  turningDirection: null, // Which direction turning is active for
  isDoubleTurnModeActive: false, // Whether double turn mode is currently active
  unlockedModifiers: new Set(), // Set of prime IDs that have been unlocked
};

export function tetrixReducer(state: TetrixReducerState, action: TetrixAction): TetrixReducerState {

  switch (action.type) {
    case "SELECT_SHAPE": {
      const { shape, shapeIndex, initialPosition } = action.value;

      return {
        ...state,
        selectedShape: shape,
        selectedShapeIndex: shapeIndex,
        isShapeDragging: true,
        mousePosition: initialPosition || state.mousePosition,
        hoveredBlockPositions: [],
      };
    }

    case "UPDATE_MOUSE_LOCATION": {
      const { location, position, tileSize, gridBounds, isValid } = action.value;

      // Calculate hovered block positions based on selected shape and mouse location
      const hoveredBlockPositions = state.selectedShape && location
        ? getShapeGridPositions(state.selectedShape, location)
        : [];

      return {
        ...state,
        mouseGridLocation: location,
        mousePosition: position ?? state.mousePosition ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        gridTileSize: tileSize ?? state.gridTileSize ?? null,
        gridBounds: gridBounds ?? state.gridBounds ?? null,
        isValidPlacement: isValid ?? false,
        hoveredBlockPositions,
      };
    }

    case "PLACE_SHAPE": {
      const { location, mousePosition: clickPosition } = action.value;

      if (!state.selectedShape || state.selectedShapeIndex === null) {
        return state;
      }

      // Start placement animation
      if (!state.gridTileSize || !state.gridBounds) {
        return state;
      }

      // Use the click position if provided, otherwise fall back to current mouse position
      const useMousePosition = clickPosition || state.mousePosition;
      if (!useMousePosition) {
        return state;
      }

      // Calculate the target position
      const tileWithGap = state.gridTileSize + 2;
      const targetCellLeft = state.gridBounds.left + (location.column - 1) * tileWithGap;
      const targetCellTop = state.gridBounds.top + (location.row - 1) * tileWithGap;
      const targetCellCenterX = targetCellLeft + state.gridTileSize / 2;
      const targetCellCenterY = targetCellTop + state.gridTileSize / 2;

      // Get the positions where the shape will be placed
      const shapePositions = getShapeGridPositions(state.selectedShape, location);

      return {
        ...state,
        placementAnimationState: 'placing',
        animationStartPosition: { ...useMousePosition },
        animationTargetPosition: { x: targetCellCenterX, y: targetCellCenterY },
        mouseGridLocation: location,
        mousePosition: useMousePosition, // Update current mouse position with click position
        hoveredBlockPositions: shapePositions,
        isShapeDragging: false,
      };
    }

    case "COMPLETE_PLACEMENT": {
      if (!state.selectedShape || !state.mouseGridLocation || state.selectedShapeIndex === null) {
        return state;
      }

      // Get the positions where the shape would be placed
      const shapePositions = getShapeGridPositions(state.selectedShape, state.mouseGridLocation);

      // Create a map for quick lookup
      const positionMap = new Map<string, typeof shapePositions[0]>();
      for (const pos of shapePositions) {
        const key = `${pos.location.row},${pos.location.column}`;
        positionMap.set(key, pos);
      }

      // Update tiles with the placed shape
      const tilesWithShape = state.tiles.map(tile => {
        const key = `${tile.location.row},${tile.location.column}`;
        const shapePos = positionMap.get(key);

        if (shapePos?.block.isFilled) {
          return {
            ...tile,
            block: { ...shapePos.block, isFilled: true }
          };
        }
        return tile;
      });

      // Check for and clear full lines
      const { tiles: newTiles, clearedRows, clearedColumns } = clearFullLines(tilesWithShape);

      // Play sound effects for line clearing
      playLineClearSounds(clearedRows, clearedColumns);

      // Calculate score for lines cleared
      const scoreData = calculateScore(clearedRows.length, clearedColumns.length);
      const newScore = state.score + scoreData.pointsEarned;
      const newTotalLinesCleared = state.totalLinesCleared + clearedRows.length + clearedColumns.length;

      // Save game state to browser DB asynchronously (don't block UI)
      if (scoreData.pointsEarned > 0 || newTiles.some(tile => tile.block.isFilled)) {
        safeBatchSave(newScore, newTiles, state.nextShapes, state.savedShape)
          .catch((error: Error) => {
            console.error('Failed to save game state:', error);
          });
      }

      // Emit gems for GemShower animation
      // Start the removal animation but keep the shape in the array until animation completes
      const removedIndex = state.selectedShapeIndex;

      // Check if super combo pattern exists after this placement
      const hasSuperComboPattern = detectSuperComboPattern(newTiles);

      // Add a new shape immediately to create the 4th shape during removal animation
      const updatedNextShapes = [...state.nextShapes];
      if (state.queueSize === -1 || state.shapesUsed < state.queueSize) {
        // Generate super shape if pattern detected, otherwise generate random shape
        const newShape = hasSuperComboPattern ? generateSuperShape() : generateRandomShape();
        updatedNextShapes.push(newShape);
      }

      // Extend rotation menu states for the new shape
      const newOpenRotationMenus = [...state.openRotationMenus];
      if (updatedNextShapes.length > newOpenRotationMenus.length) {
        newOpenRotationMenus.push(false); // New shape starts with menu closed
      }

      // Extend animation states for the new shape (no animation needed)
      const newAnimationStates = [...state.newShapeAnimationStates];
      if (updatedNextShapes.length > newAnimationStates.length) {
        newAnimationStates.push('none'); // New shape appears normally
      }

      const newState = {
        ...state,
        tiles: newTiles,
        score: newScore,
        totalLinesCleared: newTotalLinesCleared,
        nextShapes: updatedNextShapes,
        shapesUsed: state.shapesUsed, // Don't increment until shape is fully removed
        openRotationMenus: newOpenRotationMenus,
        newShapeAnimationStates: newAnimationStates,
        shapeOptionBounds: new Array(updatedNextShapes.length).fill(null),
        selectedShape: null,
        selectedShapeIndex: null,
        mouseGridLocation: null,
        isShapeDragging: false,
        hoveredBlockPositions: [],
        placementAnimationState: 'none' as const,
        animationStartPosition: null,
        animationTargetPosition: null,
        hasPlacedFirstShape: true, // Mark that first shape has been placed
        // Start the removal animation
        removingShapeIndex: removedIndex,
        shapeRemovalAnimationState: 'removing' as const,
      };

      return newState;
    }

    case "START_SHAPE_REMOVAL": {
      const { shapeIndex } = action.value;
      return {
        ...state,
        removingShapeIndex: shapeIndex,
        shapeRemovalAnimationState: 'removing',
      };
    }

    case "COMPLETE_SHAPE_REMOVAL": {
      // This should be called when the removal animation completes
      // Now actually remove the shape from the array
      if (state.removingShapeIndex === null) {
        return state; // No removal in progress
      }

      const removedIndex = state.removingShapeIndex;

      // Remove the shape from the array and its associated states
      const updatedNextShapes = state.nextShapes.filter((_, index) => index !== removedIndex);
      const newOpenRotationMenus = state.openRotationMenus.filter((_, index) => index !== removedIndex);
      const newAnimationStates = state.newShapeAnimationStates.filter((_, index) => index !== removedIndex);

      // No need to add a new shape here - it was already added during COMPLETE_PLACEMENT

      return {
        ...state,
        nextShapes: updatedNextShapes,
        openRotationMenus: newOpenRotationMenus,
        newShapeAnimationStates: newAnimationStates,
        shapeOptionBounds: new Array(updatedNextShapes.length).fill(null),
        removingShapeIndex: null,
        shapeRemovalAnimationState: 'none',
        shapesUsed: state.shapesUsed + 1, // Increment when shape is fully removed and replaced
      };
    }

    case "CLEAR_SELECTION": {
      // Clear selection immediately (ESC key)
      return {
        ...state,
        selectedShape: null,
        selectedShapeIndex: null,
        mouseGridLocation: null,
        mousePosition: state.mousePosition, // Keep current mouse position
        isShapeDragging: false,
        hoveredBlockPositions: [],
        placementAnimationState: 'none',
        animationStartPosition: null,
        animationTargetPosition: null,
      };
    }

    case "SET_AVAILABLE_SHAPES": {
      const { shapes } = action.value;
      // Use the provided shapes directly - no automatic virtual buffer
      const enhancedShapes = [...shapes];

      const newState = {
        ...state,
        nextShapes: enhancedShapes,
        openRotationMenus: new Array(enhancedShapes.length).fill(false),
        shapeOptionBounds: new Array(enhancedShapes.length).fill(null),
        newShapeAnimationStates: new Array(enhancedShapes.length).fill('none'),
      };

      // Save shapes to database when they are updated
      safeBatchSave(undefined, undefined, enhancedShapes, newState.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });

      return newState;
    }

    case "SET_SHAPE_OPTION_BOUNDS": {
      const { index, bounds } = action.value;
      const newBounds = [...state.shapeOptionBounds];
      newBounds[index] = bounds;
      return {
        ...state,
        shapeOptionBounds: newBounds,
      };
    }

    case "RETURN_SHAPE_TO_SELECTOR": {
      // Return shape to selector (invalid placement or drag outside grid)
      return {
        ...state,
        selectedShape: null,
        selectedShapeIndex: null,
        mouseGridLocation: null,
        mousePosition: state.mousePosition, // Keep current mouse position
        isShapeDragging: false,
        isValidPlacement: false,
        hoveredBlockPositions: [],
        placementAnimationState: 'none' as const,
        animationStartPosition: null,
        animationTargetPosition: null,
      };
    }

    case "ADD_SCORE": {
      const { scoreData, mousePosition: clickPosition } = action.value;
      const newScore = state.score + scoreData.pointsEarned;

      // Save updated score
      safeBatchSave(newScore)
        .catch((error: Error) => {
          console.error('Failed to save score:', error);
        });

      return {
        ...state,
        score: newScore,
        mousePosition: clickPosition || state.mousePosition, // Update mouse position if provided
      };
    }

    case "LOAD_GAME_STATE": {
      const { gameData } = action.value;
      return {
        ...state,
        score: gameData.score,
        tiles: gameData.tiles,
        nextShapes: gameData.nextShapes || state.nextShapes,
        savedShape: gameData.savedShape || state.savedShape,
      };
    }

    case "SHOW_COIN_DISPLAY": {
      return {
        ...state,
        showCoinDisplay: true,
      };
    }

    case "HIDE_COIN_DISPLAY": {
      return {
        ...state,
        showCoinDisplay: false,
      };
    }

    case "RESET_GAME": {
      return {
        ...initialState,
      };
    }

    case "ROTATE_SHAPE": {
      const { shapeIndex, clockwise } = action.value;

      if (shapeIndex < 0 || shapeIndex >= state.nextShapes.length) {
        return state;
      }

      const newShapes = [...state.nextShapes];
      let rotatedShape = cloneShape(newShapes[shapeIndex]);

      if (clockwise) {
        rotatedShape = rotateShape(rotatedShape);
      } else {
        // Rotate counter-clockwise (3 clockwise rotations)
        rotatedShape = rotateShape(rotateShape(rotateShape(rotatedShape)));
      }

      newShapes[shapeIndex] = rotatedShape;

      const newState = {
        ...state,
        nextShapes: newShapes,
        // If this is the currently selected shape, update it too
        selectedShape: state.selectedShapeIndex === shapeIndex ? rotatedShape : state.selectedShape,
      };

      // Save updated shapes to database
      safeBatchSave(undefined, undefined, newShapes, newState.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });

      return newState;
    }

    case "SPEND_COIN": {
      const { shapeIndex, mousePosition: clickPosition } = action.value;

      if (state.score <= 0 || shapeIndex < 0 || shapeIndex >= state.nextShapes.length) {
        return state; // Can't spend if no coins or invalid index
      }

      const newScore = Math.max(0, state.score - 1);
      const newOpenRotationMenus = [...state.openRotationMenus];
      newOpenRotationMenus[shapeIndex] = true;

      // Save updated score
      safeBatchSave(newScore)
        .catch((error: Error) => {
          console.error('Failed to save score:', error);
        });

      return {
        ...state,
        score: newScore,
        openRotationMenus: newOpenRotationMenus,
        mousePosition: clickPosition || state.mousePosition,
      };
    }

    case "ADD_SHAPE_OPTION": {
      const newShape = generateRandomShape();
      const updatedShapes = [...state.nextShapes, newShape];

      const newState = {
        ...state,
        nextShapes: updatedShapes,
        openRotationMenus: [...state.openRotationMenus, false], // New shape starts with menu closed
        shapeOptionBounds: [...state.shapeOptionBounds, null], // New shape has no bounds initially
        newShapeAnimationStates: [...state.newShapeAnimationStates, 'none' as const], // New shape appears immediately
      };

      // Save updated shapes to database
      safeBatchSave(undefined, undefined, updatedShapes, newState.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });

      return newState;
    }

    case "REMOVE_SHAPE_OPTION": {
      // Never remove below 1 shape
      if (state.nextShapes.length <= 1) {
        return state;
      }

      // Remove the last shape
      const updatedShapes = state.nextShapes.slice(0, -1);
      const updatedRotationMenus = state.openRotationMenus.slice(0, -1);
      const updatedBounds = state.shapeOptionBounds.slice(0, -1);
      const updatedAnimationStates = state.newShapeAnimationStates.slice(0, -1);

      // If the currently selected shape is being removed, clear selection
      const isRemovingSelectedShape = state.selectedShapeIndex === state.nextShapes.length - 1;

      const newState = {
        ...state,
        nextShapes: updatedShapes,
        openRotationMenus: updatedRotationMenus,
        shapeOptionBounds: updatedBounds,
        newShapeAnimationStates: updatedAnimationStates,
        selectedShape: isRemovingSelectedShape ? null : state.selectedShape,
        selectedShapeIndex: isRemovingSelectedShape ? null : state.selectedShapeIndex,
        isShapeDragging: isRemovingSelectedShape ? false : state.isShapeDragging,
        hoveredBlockPositions: isRemovingSelectedShape ? [] : state.hoveredBlockPositions,
      };

      // Save updated shapes to database
      safeBatchSave(undefined, undefined, updatedShapes, newState.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes state:', error);
        });

      return newState;
    }

    case "SET_LEVEL": {
      const { levelIndex } = action.value;
      return {
        ...state,
        currentLevel: levelIndex,
      };
    }

    case "OPEN_MAP": {
      return {
        ...state,
        gameState: 'map',
      };
    }

    case "CLOSE_MAP": {
      return {
        ...state,
        gameState: 'playing',
      };
    }

    case "UNLOCK_MAP": {
      return {
        ...state,
        isMapUnlocked: true,
      };
    }

    case "UNLOCK_MODIFIER": {
      const { primeId } = action.value;
      const newUnlockedModifiers = new Set(state.unlockedModifiers);
      newUnlockedModifiers.add(primeId);

      // Save unlocked modifiers to database
      saveModifiers(newUnlockedModifiers).catch((error: Error) => {
        console.error('Failed to save unlocked modifiers:', error);
      });

      return {
        ...state,
        unlockedModifiers: newUnlockedModifiers,
      };
    }

    case "LOAD_MODIFIERS": {
      const { unlockedModifiers } = action.value;
      return {
        ...state,
        unlockedModifiers,
      };
    }

    case "TRIGGER_BACKGROUND_MUSIC": {
      // This action doesn't modify state, just triggers background music
      // The actual music trigger will be handled by the BackgroundMusic component
      return state;
    }

    case "ACTIVATE_TURNING_MODE": {
      const { direction } = action.value;
      return {
        ...state,
        isTurningModeActive: true,
        turningDirection: direction,
      };
    }

    case "DEACTIVATE_TURNING_MODE": {
      return {
        ...state,
        isTurningModeActive: false,
        turningDirection: null,
      };
    }

    case "ACTIVATE_DOUBLE_TURN_MODE": {
      return {
        ...state,
        isDoubleTurnModeActive: true,
      };
    }

    case "DEACTIVATE_DOUBLE_TURN_MODE": {
      return {
        ...state,
        isDoubleTurnModeActive: false,
      };
    }

    case "GENERATE_SUPER_COMBO_PATTERN": {
      // Generate a 4x4 super combo pattern for testing
      // Pattern: rows 4-7 are completely filled except for diagonal empty spaces
      // AND columns 4-7 are completely filled except for diagonal empty spaces
      const newTiles = state.tiles.map(tile => {
        const { row, column } = tile.location;

        // Check if this tile is in pattern rows (4-7) OR pattern columns (4-7)
        const isInPatternRows = row >= 4 && row <= 7;
        const isInPatternCols = column >= 4 && column <= 7;

        // Check if this tile is on the diagonal of the 4x4 area
        const isOnDiagonal = isInPatternRows && isInPatternCols && (row - 4) === (column - 4);

        // Fill if in pattern rows OR pattern columns, but NOT on diagonal
        if ((isInPatternRows || isInPatternCols) && !isOnDiagonal) {
          return {
            ...tile,
            block: { color: 'blue' as const, isFilled: true }
          };
        }

        // Empty if on diagonal
        if (isOnDiagonal) {
          return {
            ...tile,
            block: { ...tile.block, isFilled: false }
          };
        }

        // Keep all other tiles as-is
        return tile;
      });

      // Save the new tile state
      safeBatchSave(undefined, newTiles)
        .catch((error: Error) => {
          console.error('Failed to save tiles after generating super combo pattern:', error);
        });

      return {
        ...state,
        tiles: newTiles,
      };
    }

    case "UPDATE_GEM_ICON_POSITION": {
      console.log('UPDATE_GEM_ICON_POSITION: new position =', action.value);
      return {
        ...state,
        gemIconPosition: action.value,
      };
    }
  }

  return state;
}
