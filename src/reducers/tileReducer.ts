/**
 * Tile Reducer - Handles grid/tile manipulation and placement
 * Actions: COMPLETE_PLACEMENT (tile updates), DEBUG_* actions
 */

import type { TetrixReducerState, TetrixAction, Tile } from '../types';
import { getShapeGridPositions, detectSuperComboPattern, generateSuperShape, generateRandomShapeWithProbabilities } from '../utils/shapes';
// safeBatchSave removed - persistence handled by PersistenceListener
import { cleanupExpiredAnimations } from '../utils/clearingAnimationUtils';
import { updateStats, incrementNoTurnStreak } from '../utils/statsUtils';
import { checkGameOver } from '../utils/gameOverUtils';
import { makeTileKey } from '../utils/gridConstants';
import { performLineClearing } from '../utils/lineClearingOrchestrator';

// Re-export for backward compatibility
export { makeTileKey, parseTileKey } from '../utils/gridConstants';

export function tileReducer(state: TetrixReducerState, action: TetrixAction): TetrixReducerState {
  switch (action.type) {
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

      // Update tiles with the placed shape (working with plain Tile objects)
      const newTiles = new Map(state.tiles);
      for (const pos of shapePositions) {
        if (pos.block.isFilled) {
          const position = makeTileKey(pos.location.row, pos.location.column);
          const existingTile = newTiles.get(position);
          if (existingTile) {
            // Update existing tile's block immutably
            newTiles.set(position, {
              ...existingTile,
              block: { isFilled: true, color: pos.block.color }
            });
          } else {
            // Create new tile if it doesn't exist
            const newTile: Tile = {
              position,
              backgroundColor: 'grey', // default background
              block: { isFilled: true, color: pos.block.color },
              activeAnimations: []
            };
            newTiles.set(position, newTile);
          }
        }
      }

      // Perform line clearing with orchestrator (handles animations, sounds, scoring)
      const lineClearResult = performLineClearing(newTiles);

      const newScore = state.score + lineClearResult.pointsEarned;
      const newTotalLinesCleared = state.totalLinesCleared +
        lineClearResult.clearedRowIndices.length +
        lineClearResult.clearedColumnIndices.length;

      // Update stats (only for infinite mode)
      let newStats = state.stats;
      if (state.gameMode === 'infinite') {
        // Convert indices back to full row/column objects for stats
        const clearedRows = lineClearResult.clearedRowIndices.map(index => ({
          index,
          color: 'grey' as const // Color doesn't matter for stats
        }));
        const clearedColumns = lineClearResult.clearedColumnIndices.map(index => ({
          index,
          color: 'grey' as const
        }));

        newStats = updateStats(state.stats, clearedRows, clearedColumns);
        // Increment no-turn streak (since shape was placed without rotating)
        newStats = incrementNoTurnStreak(newStats);
      }

      // Persistence is now handled by PersistenceListener
      // No side effects in reducer!

      // Emit gems for GemShower animation
      // Start the removal animation but keep the shape in the array until animation completes
      const removedIndex = state.dragState.selectedShapeIndex;

      // Check if super combo pattern exists after this placement
      const hasSuperComboPattern = detectSuperComboPattern(lineClearResult.tiles);

      // Add a new shape immediately to create the 4th shape during removal animation
      const updatedNextShapes = [...state.nextShapes];
      const updatedHiddenShapes = [...state.queueHiddenShapes];

      // Only add shapes if: infinite mode OR (finite mode AND shapes remain in hidden queue)
      const shouldAddShape = state.queueMode === 'infinite' || updatedHiddenShapes.length > 0;

      if (shouldAddShape) {
        let newShape;

        // In finite mode, pull from hidden shapes if available
        if (state.queueMode === 'finite' && updatedHiddenShapes.length > 0) {
          newShape = updatedHiddenShapes.shift()!; // Take first shape from queue
        } else if (hasSuperComboPattern) {
          // Generate super shape if pattern detected
          newShape = generateSuperShape();
        } else {
          // Generate shape using color probabilities (infinite mode only)
          newShape = generateRandomShapeWithProbabilities(state.queueColorProbabilities);
        }

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

      // Check for game over
      // Infinite mode: Check if any shapes can be placed
      // Finite mode: Game over when queue is completely empty (no visible shapes and no hidden shapes)
      let isGameOver = false;
      if (state.gameMode === 'infinite') {
        isGameOver = checkGameOver(lineClearResult.tiles, updatedNextShapes, newScore, newOpenRotationMenus);
      } else if (state.queueMode === 'finite') {
        // In finite mode, game over when both visible and hidden shapes are depleted
        isGameOver = updatedNextShapes.length === 0 && updatedHiddenShapes.length === 0;
      }

      const newState = {
        ...state,
        gameState: isGameOver ? 'gameover' : state.gameState,
        tiles: lineClearResult.tiles,
        score: newScore,
        totalLinesCleared: newTotalLinesCleared,
        stats: newStats,
        nextShapes: updatedNextShapes,
        queueHiddenShapes: updatedHiddenShapes, // Update hidden shapes queue
        shapesUsed: state.shapesUsed, // Don't increment until shape is fully removed
        openRotationMenus: newOpenRotationMenus,
        newShapeAnimationStates: newAnimationStates,
        shapeOptionBounds: new Array(updatedNextShapes.length).fill(null),
        mouseGridLocation: null,
        dragState: {
          phase: 'none' as const,
          selectedShape: null,
          selectedShapeIndex: null,
          sourceId: null,
          isValidPlacement: false,
          hoveredBlockPositions: [],
          invalidBlockPositions: [],
          sourcePosition: null,
          targetPosition: null,
          placementLocation: null,
          placementStartPosition: null,
          startTime: null,
          dragOffsets: null,
        },
        hasPlacedFirstShape: true, // Mark that first shape has been placed
        // Start the removal animation
        removingShapeIndex: removedIndex,
        shapeRemovalAnimationState: 'removing' as const,
      };

      return newState;
    }

    case "CLEANUP_ANIMATIONS": {
      const cleanedTiles = cleanupExpiredAnimations(state.tiles);

      // Only update state if tiles actually changed
      if (cleanedTiles === state.tiles) {
        return state;
      }

      return {
        ...state,
        tiles: cleanedTiles,
      };
    }

    case "DEBUG_FILL_ROW": {
      const { row, excludeColumn, color } = action.value;
      const newTiles = new Map(state.tiles);

      for (let column = 1; column <= 10; column++) {
        if (column !== excludeColumn) {
          const position = makeTileKey(row, column);
          const existingTile = newTiles.get(position);
          if (existingTile) {
            newTiles.set(position, {
              ...existingTile,
              block: { isFilled: true, color }
            });
          } else {
            const tile: Tile = {
              position,
              backgroundColor: 'grey',
              block: { isFilled: true, color },
              activeAnimations: []
            };
            newTiles.set(position, tile);
          }
        }
      }

      // Persistence handled by listener

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
          const position = makeTileKey(row, column);
          const existingTile = newTiles.get(position);
          if (existingTile) {
            newTiles.set(position, {
              ...existingTile,
              block: { isFilled: true, color }
            });
          } else {
            const tile: Tile = {
              position,
              backgroundColor: 'grey',
              block: { isFilled: true, color },
              activeAnimations: []
            };
            newTiles.set(position, tile);
          }
        }
      }

      // Persistence handled by listener

      return {
        ...state,
        tiles: newTiles,
      };
    }

    case "DEBUG_REMOVE_BLOCK": {
      const { location } = action.value;
      const newTiles = new Map(state.tiles);
      const position = makeTileKey(location.row, location.column);
      const currentTile = newTiles.get(position);

      if (currentTile) {
        newTiles.set(position, {
          ...currentTile,
          block: { isFilled: false, color: 'grey' }
        });
      }

      // Persistence handled by listener

      return {
        ...state,
        tiles: newTiles,
      };
    }

    case "DEBUG_ADD_BLOCK": {
      const { location, color } = action.value;
      const newTiles = new Map(state.tiles);
      const position = makeTileKey(location.row, location.column);
      const existingTile = newTiles.get(position);

      if (existingTile) {
        newTiles.set(position, {
          ...existingTile,
          block: { isFilled: true, color }
        });
      } else {
        const tile: Tile = {
          position,
          backgroundColor: 'grey',
          block: { isFilled: true, color },
          activeAnimations: []
        };
        newTiles.set(position, tile);
      }

      // Persistence handled by listener

      return {
        ...state,
        tiles: newTiles,
      };
    }

    case "DEBUG_CLEAR_ALL": {
      const newTiles = new Map<string, Tile>();

      for (let row = 1; row <= 10; row++) {
        for (let column = 1; column <= 10; column++) {
          const position = makeTileKey(row, column);
          const tile: Tile = {
            position,
            backgroundColor: 'grey',
            block: { isFilled: false, color: 'grey' },
            activeAnimations: []
          };
          newTiles.set(position, tile);
        }
      }

      // Persistence handled by listener

      return {
        ...state,
        tiles: newTiles,
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
          const position = makeTileKey(row, column);

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
          const existingTile = newTiles.get(position);
          if ((isInPatternRows || isInPatternCols) && !isOnDiagonal) {
            if (existingTile) {
              newTiles.set(position, {
                ...existingTile,
                block: { isFilled: true, color: 'blue' }
              });
            } else {
              const tile: Tile = {
                position,
                backgroundColor: 'grey',
                block: { isFilled: true, color: 'blue' },
                activeAnimations: []
              };
              newTiles.set(position, tile);
            }
          } else if (isOnDiagonal && existingTile) {
            // Empty if on diagonal
            newTiles.set(position, {
              ...existingTile,
              block: { isFilled: false, color: 'grey' }
            });
          }
          // Keep all other tiles as-is
        }
      }

      // Persistence handled by listener

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
        // Persistence handled by listener

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

      // Persistence handled by listener

      return {
        ...state,
        nextShapes: newShapes,
        openRotationMenus: [...state.openRotationMenus.slice(1), false],
        shapeOptionBounds: [...state.shapeOptionBounds.slice(1), null],
        newShapeAnimationStates: [...state.newShapeAnimationStates.slice(1), 'none'],
      };
    }

    default:
      return state;
  }
}
