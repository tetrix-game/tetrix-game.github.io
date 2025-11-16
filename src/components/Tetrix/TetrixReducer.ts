import type { TetrixAction, TilesSet, TileData, ColorName } from '../../utils/types';
import { TetrixReducerState } from '../../utils/types';
import { getShapeGridPositions, generateRandomShape, rotateShape, cloneShape, detectSuperComboPattern, generateSuperShape } from '../../utils/shapeUtils';
import { clearFullLines } from '../../utils/lineUtils';
import { calculateScore } from '../../utils/scoringUtils';
import { safeBatchSave, saveModifiers } from '../../utils/persistenceUtils';
import { playSound } from '../SoundEffectsContext';

// Helper function to play line clear sound effects
function playLineClearSounds(clearedRows: number[], clearedColumns: number[]) {
  if (clearedRows.length > 0 && clearedRows.length <= 4) {
    playSound(`clear_combo_${clearedRows.length}` as 'clear_combo_1' | 'clear_combo_2' | 'clear_combo_3' | 'clear_combo_4');
  }
  if (clearedColumns.length > 0 && clearedColumns.length <= 4) {
    playSound(`clear_combo_${clearedColumns.length}` as 'clear_combo_1' | 'clear_combo_2' | 'clear_combo_3' | 'clear_combo_4');
  }
}

// Helper function to create a tile key from location
export function makeTileKey(row: number, column: number): string {
  return `R${row}C${column}`;
}

// Helper function to parse a tile key back to location
export function parseTileKey(key: string): { row: number; column: number } {
  const match = key.match(/R(\d+)C(\d+)/);
  if (!match) throw new Error(`Invalid tile key: ${key}`);
  return { row: parseInt(match[1], 10), column: parseInt(match[2], 10) };
}

// Helper function to create tiles Set
const makeTiles = (): TilesSet => {
  const tiles = new Map<string, TileData>();
  for (let row = 1; row <= 10; row++) {
    for (let column = 1; column <= 10; column++) {
      tiles.set(makeTileKey(row, column), {
        isFilled: false,
        color: 'grey',
      });
    }
  }
  return tiles;
};

export const initialState: TetrixReducerState = {
  // Game state management - simplified
  gameState: 'playing',
  currentLevel: 0,
  isMapUnlocked: false,

  tiles: makeTiles(),
  nextShapes: [],
  savedShape: null,
  mouseGridLocation: null,
  mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, // Default to center instead of null
  gemIconPosition: { x: 100, y: 50 }, // Default position, will be updated by ScoreDisplay
  gridTileSize: null,
  gridBounds: null,
  dragState: {
    phase: 'none',
    selectedShape: null,
    selectedShapeIndex: null,
    isValidPlacement: false,
    hoveredBlockPositions: [],
    invalidBlockPositions: [],
    sourcePosition: null,
    targetPosition: null,
    placementLocation: null,
    startTime: null,
  },
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
      const { shapeIndex } = action.value;
      const shape = state.nextShapes[shapeIndex];
      const bounds = state.shapeOptionBounds[shapeIndex];

      if (!shape || !bounds) {
        return state;
      }

      return {
        ...state,
        dragState: {
          phase: 'picking-up',
          selectedShape: shape,
          selectedShapeIndex: shapeIndex,
          isValidPlacement: false,
          hoveredBlockPositions: [],
          invalidBlockPositions: [],
          sourcePosition: {
            x: bounds.left,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height,
          },
          targetPosition: null,
          placementLocation: null,
          startTime: performance.now(),
        },
      };
    }

    case "UPDATE_MOUSE_LOCATION": {
      const { location, position, tileSize, gridBounds, isValid, invalidBlocks } = action.value;

      // Calculate hovered block positions based on selected shape and mouse location
      const hoveredBlockPositions = state.dragState.selectedShape && location
        ? getShapeGridPositions(state.dragState.selectedShape, location)
        : [];

      // Get invalid block positions from action (or default to empty array)
      const invalidBlockPositions = invalidBlocks ?? [];

      // Transition from picking-up to dragging after pickup animation completes
      const shouldTransitionToDragging = state.dragState.phase === 'picking-up' && state.dragState.startTime &&
        (performance.now() - state.dragState.startTime > 300); // 300ms pickup duration

      const newDragState = shouldTransitionToDragging
        ? { ...state.dragState, phase: 'dragging' as const, hoveredBlockPositions, invalidBlockPositions, isValidPlacement: isValid ?? false }
        : { ...state.dragState, hoveredBlockPositions, invalidBlockPositions, isValidPlacement: isValid ?? false };

      return {
        ...state,
        mouseGridLocation: location,
        mousePosition: position ?? state.mousePosition ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        gridTileSize: tileSize ?? state.gridTileSize ?? null,
        gridBounds: gridBounds ?? state.gridBounds ?? null,
        dragState: newDragState,
      };
    }

    case "PLACE_SHAPE": {
      const { location, mousePosition: clickPosition } = action.value;

      if (!state.dragState.selectedShape || state.dragState.selectedShapeIndex === null) {
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
      const shapePositions = getShapeGridPositions(state.dragState.selectedShape, location);

      return {
        ...state,
        dragState: {
          ...state.dragState,
          phase: 'placing',
          targetPosition: { x: targetCellCenterX, y: targetCellCenterY },
          placementLocation: location, // Lock in the placement location at release time
          hoveredBlockPositions: shapePositions,
          startTime: performance.now(),
        },
        mouseGridLocation: location,
        mousePosition: useMousePosition, // Update current mouse position with click position
      };
    }

    case "COMPLETE_PLACEMENT": {
      if (!state.dragState.selectedShape || state.dragState.selectedShapeIndex === null) {
        return state;
      }

      // Use the locked-in placement location from dragState (set during PLACE_SHAPE)
      // Fall back to mouseGridLocation for backward compatibility with tests
      const placementLocation = state.dragState.placementLocation || state.mouseGridLocation;
      if (!placementLocation) {
        return state;
      }

      // Get the positions where the shape would be placed
      const shapePositions = getShapeGridPositions(state.dragState.selectedShape, placementLocation);

      // Update tiles with the placed shape (working with Map)
      const newTiles = new Map(state.tiles);
      for (const pos of shapePositions) {
        if (pos.block.isFilled) {
          const key = makeTileKey(pos.location.row, pos.location.column);
          newTiles.set(key, {
            isFilled: true,
            color: pos.block.color,
          });
        }
      }

      // Check for and clear full lines
      const { tiles: finalTiles, clearedRows, clearedColumns } = clearFullLines(newTiles);

      // Play sound effects for line clearing
      playLineClearSounds(clearedRows, clearedColumns);

      // Calculate score for lines cleared
      const scoreData = calculateScore(clearedRows.length, clearedColumns.length);
      const newScore = state.score + scoreData.pointsEarned;
      const newTotalLinesCleared = state.totalLinesCleared + clearedRows.length + clearedColumns.length;

      // Save game state to browser DB asynchronously (don't block UI)
      // Convert tiles to serializable format for persistence
      const tilesPersistenceData = Array.from(finalTiles.entries()).map(([key, data]) => ({ key, data }));
      if (scoreData.pointsEarned > 0 || Array.from(finalTiles.values()).some(tileData => tileData.isFilled)) {
        safeBatchSave(newScore, tilesPersistenceData, state.nextShapes, state.savedShape)
          .catch((error: Error) => {
            console.error('Failed to save game state:', error);
          });
      }

      // Emit gems for GemShower animation
      // Start the removal animation but keep the shape in the array until animation completes
      const removedIndex = state.dragState.selectedShapeIndex;

      // Check if super combo pattern exists after this placement
      const hasSuperComboPattern = detectSuperComboPattern(finalTiles);

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
        tiles: finalTiles,
        score: newScore,
        totalLinesCleared: newTotalLinesCleared,
        nextShapes: updatedNextShapes,
        shapesUsed: state.shapesUsed, // Don't increment until shape is fully removed
        openRotationMenus: newOpenRotationMenus,
        newShapeAnimationStates: newAnimationStates,
        shapeOptionBounds: new Array(updatedNextShapes.length).fill(null),
        mouseGridLocation: null,
        dragState: {
          phase: 'none' as const,
          selectedShape: null,
          selectedShapeIndex: null,
          isValidPlacement: false,
          hoveredBlockPositions: [],
          invalidBlockPositions: [],
          sourcePosition: null,
          targetPosition: null,
          placementLocation: null,
          startTime: null,
        },
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
        mouseGridLocation: null,
        mousePosition: state.mousePosition, // Keep current mouse position
        dragState: {
          phase: 'none',
          selectedShape: null,
          selectedShapeIndex: null,
          isValidPlacement: false,
          hoveredBlockPositions: [],
          invalidBlockPositions: [],
          sourcePosition: null,
          targetPosition: null,
          placementLocation: null,
          startTime: null,
        },
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

    case "COMPLETE_RETURN": {
      // Clear shape after return animation completes
      return {
        ...state,
        mouseGridLocation: null,
        dragState: {
          phase: 'none',
          selectedShape: null,
          selectedShapeIndex: null,
          isValidPlacement: false,
          hoveredBlockPositions: [],
          invalidBlockPositions: [],
          sourcePosition: null,
          targetPosition: null,
          placementLocation: null,
          startTime: null,
        },
      };
    }

    case "RETURN_SHAPE_TO_SELECTOR": {
      // Return shape to selector (invalid placement or drag outside grid)
      // If we have a selected shape and bounds, animate the return
      if (state.dragState.selectedShape && state.dragState.selectedShapeIndex !== null) {
        const bounds = state.shapeOptionBounds[state.dragState.selectedShapeIndex];
        const canAnimate = bounds && (state.dragState.phase === 'dragging' || state.dragState.phase === 'picking-up');
        if (canAnimate) {
          // Start return animation
          return {
            ...state,
            dragState: {
              ...state.dragState,
              phase: 'returning',
              sourcePosition: {
                x: bounds.left,
                y: bounds.top,
                width: bounds.width,
                height: bounds.height,
              },
              targetPosition: null,
              placementLocation: null,
              startTime: performance.now(),
            },
          };
        }
      }

      // No animation needed - clear immediately
      return {
        ...state,
        mouseGridLocation: null,
        mousePosition: state.mousePosition,
        dragState: {
          phase: 'none',
          selectedShape: null,
          selectedShapeIndex: null,
          isValidPlacement: false,
          hoveredBlockPositions: [],
          invalidBlockPositions: [],
          sourcePosition: null,
          targetPosition: null,
          placementLocation: null,
          startTime: null,
        },
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
      // Convert tiles from persistence format to Map
      const tilesMap = new Map<string, TileData>();
      if (Array.isArray(gameData.tiles)) {
        gameData.tiles.forEach((tile: { location: { row: number; column: number }; block: { isFilled: boolean; color: string } }) => {
          tilesMap.set(
            makeTileKey(tile.location.row, tile.location.column),
            { isFilled: tile.block.isFilled, color: tile.block.color as ColorName }
          );
        });
      }
      return {
        ...state,
        score: gameData.score,
        tiles: tilesMap,
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

      // If this is the currently selected shape, update it in dragState too
      const newDragState = state.dragState.selectedShapeIndex === shapeIndex
        ? { ...state.dragState, selectedShape: rotatedShape }
        : state.dragState;

      const newState = {
        ...state,
        nextShapes: newShapes,
        dragState: newDragState,
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
      const isRemovingSelectedShape = state.dragState.selectedShapeIndex === state.nextShapes.length - 1;

      const newDragState = isRemovingSelectedShape
        ? {
          phase: 'none' as const,
          selectedShape: null,
          selectedShapeIndex: null,
          isValidPlacement: false,
          hoveredBlockPositions: [],
          invalidBlockPositions: [],
          sourcePosition: null,
          targetPosition: null,
          placementLocation: null,
          startTime: null,
        }
        : state.dragState;

      const newState = {
        ...state,
        nextShapes: updatedShapes,
        openRotationMenus: updatedRotationMenus,
        shapeOptionBounds: updatedBounds,
        newShapeAnimationStates: updatedAnimationStates,
        dragState: newDragState,
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
      // Supports both ascending and descending diagonals
      const newTiles = new Map(state.tiles);

      // Randomly choose which diagonal to use (50/50 chance)
      const useAscending = Math.random() > 0.5;

      for (let row = 1; row <= 10; row++) {
        for (let column = 1; column <= 10; column++) {
          const key = makeTileKey(row, column);

          // Check if this tile is in pattern rows (4-7) OR pattern columns (4-7)
          const isInPatternRows = row >= 4 && row <= 7;
          const isInPatternCols = column >= 4 && column <= 7;

          // Check if this tile is on either diagonal of the 4x4 area
          // Ascending diagonal: (4,4), (5,5), (6,6), (7,7)
          const isOnAscendingDiagonal = isInPatternRows && isInPatternCols && (row - 4) === (column - 4);
          // Descending diagonal: (4,7), (5,6), (6,5), (7,4)
          const isOnDescendingDiagonal = isInPatternRows && isInPatternCols && (row + column) === 11;

          const isOnDiagonal = useAscending ? isOnAscendingDiagonal : isOnDescendingDiagonal;

          // Fill if in pattern rows OR pattern columns, but NOT on diagonal
          if ((isInPatternRows || isInPatternCols) && !isOnDiagonal) {
            newTiles.set(key, { color: 'blue', isFilled: true });
          } else if (isOnDiagonal) {
            // Empty if on diagonal
            newTiles.set(key, { color: 'grey', isFilled: false });
          }
          // Keep all other tiles as-is
        }
      }

      // Save the new tile state (convert to serializable format)
      const tilesPersistenceData = Array.from(newTiles.entries()).map(([key, data]) => ({ key, data }));
      safeBatchSave(undefined, tilesPersistenceData)
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

    case "DEBUG_FILL_ROW": {
      const { row, excludeColumn, color } = action.value;
      const newTiles = new Map(state.tiles);

      for (let column = 1; column <= 10; column++) {
        if (column !== excludeColumn) {
          const key = makeTileKey(row, column);
          newTiles.set(key, { color, isFilled: true });
        }
      }

      const tilesPersistenceData = Array.from(newTiles.entries()).map(([key, data]) => ({ key, data }));
      safeBatchSave(undefined, tilesPersistenceData)
        .catch((error: Error) => {
          console.error('Failed to save tiles after debug fill row:', error);
        });

      return {
        ...state,
        tiles: newTiles,
      };
    }

    case "DEBUG_FILL_COLUMN": {
      const { column, excludeRow, color } = action.value;
      const newTiles = new Map(state.tiles);

      for (let row = 1; row <= 10; row++) {
        if (row !== excludeRow) {
          const key = makeTileKey(row, column);
          newTiles.set(key, { color, isFilled: true });
        }
      }

      const tilesPersistenceData = Array.from(newTiles.entries()).map(([key, data]) => ({ key, data }));
      safeBatchSave(undefined, tilesPersistenceData)
        .catch((error: Error) => {
          console.error('Failed to save tiles after debug fill column:', error);
        });

      return {
        ...state,
        tiles: newTiles,
      };
    }

    case "DEBUG_REMOVE_BLOCK": {
      const { location } = action.value;
      const newTiles = new Map(state.tiles);
      const key = makeTileKey(location.row, location.column);
      const currentTile = newTiles.get(key);

      if (currentTile) {
        newTiles.set(key, { ...currentTile, isFilled: false });
      }

      const tilesPersistenceData = Array.from(newTiles.entries()).map(([key, data]) => ({ key, data }));
      safeBatchSave(undefined, tilesPersistenceData)
        .catch((error: Error) => {
          console.error('Failed to save tiles after debug remove block:', error);
        });

      return {
        ...state,
        tiles: newTiles,
      };
    }

    case "DEBUG_ADD_BLOCK": {
      const { location, color } = action.value;
      const newTiles = new Map(state.tiles);
      const key = makeTileKey(location.row, location.column);

      newTiles.set(key, { color, isFilled: true });

      const tilesPersistenceData = Array.from(newTiles.entries()).map(([key, data]) => ({ key, data }));
      safeBatchSave(undefined, tilesPersistenceData)
        .catch((error: Error) => {
          console.error('Failed to save tiles after debug add block:', error);
        });

      return {
        ...state,
        tiles: newTiles,
      };
    }

    case "DEBUG_CLEAR_ALL": {
      const newTiles = new Map<string, TileData>();

      for (let row = 1; row <= 10; row++) {
        for (let column = 1; column <= 10; column++) {
          const key = makeTileKey(row, column);
          newTiles.set(key, { isFilled: false, color: 'grey' });
        }
      }

      const tilesPersistenceData = Array.from(newTiles.entries()).map(([key, data]) => ({ key, data }));
      safeBatchSave(undefined, tilesPersistenceData)
        .catch((error: Error) => {
          console.error('Failed to save tiles after debug clear all:', error);
        });

      return {
        ...state,
        tiles: newTiles,
      };
    }

    case "DEBUG_REPLACE_FIRST_SHAPE": {
      const { shape } = action.value;

      // Remove the first shape and add the new shape to the end
      if (state.nextShapes.length === 0) {
        // If there are no shapes, just add this one
        const newShapes = [shape];
        safeBatchSave(undefined, undefined, newShapes, state.savedShape)
          .catch((error: Error) => {
            console.error('Failed to save shapes after debug replace:', error);
          });

        return {
          ...state,
          nextShapes: newShapes,
          openRotationMenus: [false],
          shapeOptionBounds: [null],
          newShapeAnimationStates: ['none'],
        };
      }

      // Remove first shape and add new shape to the end
      const newShapes = [...state.nextShapes.slice(1), shape];

      safeBatchSave(undefined, undefined, newShapes, state.savedShape)
        .catch((error: Error) => {
          console.error('Failed to save shapes after debug replace:', error);
        });

      return {
        ...state,
        nextShapes: newShapes,
        openRotationMenus: [...state.openRotationMenus.slice(1), false],
        shapeOptionBounds: [...state.shapeOptionBounds.slice(1), null],
        newShapeAnimationStates: [...state.newShapeAnimationStates.slice(1), 'none'],
      };
    }
  }

  return state;
}
