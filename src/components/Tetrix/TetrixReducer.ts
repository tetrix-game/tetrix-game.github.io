import type { TetrixAction, Tile } from '../../utils/types';
import { TetrixReducerState } from '../../utils/types';
import { getShapeGridPositions, generateRandomShape, rotateShape, cloneShape } from '../../utils/shapeUtils';
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

const emptyColor = {
  lightest: '#000000',
  light: '#000000',
  main: '#000000',
  dark: '#000000',
  darkest: '#000000'
};

const makeTiles = () => {
  const tiles: Tile[] = [];
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      tiles.push({
        id: `(row: ${row}, column: ${column})`,
        location: { row, column },
        block: { isFilled: false, color: emptyColor }
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
  showerLocation: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, // Default coin shower location
  gridTileSize: null,
  gridBounds: null,
  isShapeDragging: false,
  isValidPlacement: false,
  hoveredBlockPositions: [],
  placementAnimationState: 'none',
  animationStartPosition: null,
  animationTargetPosition: null,
  shapeOptionBounds: [],
  score: 0,
  totalLinesCleared: 0,
  showCoinDisplay: false,
  queueSize: -1, // Infinite by default
  shapesUsed: 0,
  removingShapeIndex: null,
  shapesSliding: false,
  openRotationMenus: [], // Dynamic array based on actual shapes
  hasPlacedFirstShape: false, // Track first shape placement for background music trigger
  isTurningModeActive: false, // Whether turning mode is currently active
  turningDirection: null, // Which direction turning is active for
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
        showerLocation: useMousePosition, // Set dedicated shower location for coin emission
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

      // Calculate currency breakdown for CoinShower
      const newState = {
        ...state,
        tiles: newTiles,
        score: newScore,
        totalLinesCleared: newTotalLinesCleared,
        removingShapeIndex: state.selectedShapeIndex,
        shapesSliding: true,
        selectedShape: null,
        selectedShapeIndex: null,
        mouseGridLocation: null,
        isShapeDragging: false,
        hoveredBlockPositions: [],
        placementAnimationState: 'none' as const,
        animationStartPosition: null,
        animationTargetPosition: null,
        hasPlacedFirstShape: true, // Mark that first shape has been placed
      };

      return newState;
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
        // showerLocation intentionally NOT updated - only update on shape placement
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

    case "START_SHAPE_REMOVAL": {
      const { shapeIndex } = action.value;
      return {
        ...state,
        removingShapeIndex: shapeIndex,
        shapesSliding: true,
      };
    }

    case "COMPLETE_SHAPE_REMOVAL": {
      if (state.removingShapeIndex === null) {
        return state;
      }

      // For virtual container system: remove the shape and shift remaining shapes
      const removedIndex = state.removingShapeIndex;
      const remainingShapes = state.nextShapes.filter((_, index) => index !== removedIndex);
      const newShapesUsed = state.shapesUsed + 1;

      // Maintain the same number of shapes by adding a new one when one is removed
      const updatedNextShapes = [...remainingShapes];

      if (state.queueSize === -1 || newShapesUsed < state.queueSize) {
        // Add one new shape to replace the removed one
        updatedNextShapes.push(generateRandomShape());
      }

      // Preserve rotation menu states for remaining shapes, removing the used shape's state
      const newOpenRotationMenus = state.openRotationMenus
        .filter((_, index) => index !== removedIndex) // Remove the state for the removed shape
        .concat(new Array(Math.max(0, updatedNextShapes.length - remainingShapes.length)).fill(false)); // Add false for any new shapes

      const newState = {
        ...state,
        nextShapes: updatedNextShapes,
        shapesUsed: newShapesUsed,
        removingShapeIndex: null,
        shapesSliding: false,
        openRotationMenus: newOpenRotationMenus,
        shapeOptionBounds: new Array(updatedNextShapes.length).fill(null),
      };

      // Save shapes to database
      safeBatchSave(undefined, undefined, updatedNextShapes, newState.savedShape)
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
        showerLocation: clickPosition || state.showerLocation, // Update shower location for coin effect
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

      // If the currently selected shape is being removed, clear selection
      const isRemovingSelectedShape = state.selectedShapeIndex === state.nextShapes.length - 1;

      const newState = {
        ...state,
        nextShapes: updatedShapes,
        openRotationMenus: updatedRotationMenus,
        shapeOptionBounds: updatedBounds,
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
  }

  return state;
}
