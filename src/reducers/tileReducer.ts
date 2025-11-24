/**
 * Tile Reducer - Handles grid/tile manipulation and placement
 * Actions: COMPLETE_PLACEMENT (tile updates), DEBUG_* actions
 */

import type { TetrixReducerState, TetrixAction, TileData } from '../types';
import { getShapeGridPositions, generateRandomShape, detectSuperComboPattern, generateSuperShape } from '../utils/shapes';
import { clearFullLines, isGridCompletelyEmpty } from '../utils/lineUtils';
import { calculateScore } from '../utils/scoringUtils';
import { safeBatchSave } from '../utils/persistenceUtils';
import { playSound } from '../components/SoundEffectsContext';
import { generateClearingAnimations, generateFullBoardClearAnimation, cleanupExpiredAnimations, AnimationConfig } from '../utils/clearingAnimationUtils';
import { updateStats } from '../utils/statsUtils';
import { checkGameOver } from '../utils/gameOverUtils';

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

const CLEARING_ANIMATION_CONFIG: AnimationConfig = {
  rows: {
    single: { duration: 500, waveDelay: 50, startDelay: 0 },
    double: { duration: 500, waveDelay: 50, startDelay: 500 },
    triple: { duration: 500, waveDelay: 50, startDelay: 1000 },
    quad: { duration: 3000, waveDelay: 50, startDelay: 1500, beatCount: 3 },
  },
  columns: {
    single: { duration: 500, waveDelay: 50, startDelay: 0 },
    double: { duration: 500, waveDelay: 50, startDelay: 500 },
    triple: { duration: 500, waveDelay: 50, startDelay: 1000 },
    quad: { duration: 3000, waveDelay: 50, startDelay: 1500, beatCount: 3 },
  },
  /**
   * Full board clear animation - triggers when clearing lines results in empty board
   * Awards 300 points bonus
   * Animation sequence: plays AFTER normal line animations, then all 10 columns, then all 10 rows
   */
  fullBoardClear: {
    columns: { duration: 800, waveDelay: 40, startDelay: 0 },
    rows: { duration: 800, waveDelay: 40, startDelay: 900 },
  },
};

// Helper function to play line clear sound effects
function playLineClearSounds(clearedRows: number[], clearedColumns: number[], baseStartTime: number) {
  const scheduleSound = (count: number, type: 'rows' | 'columns') => {
    if (count >= 1) playSound('clear_combo_1', baseStartTime + CLEARING_ANIMATION_CONFIG[type].single.startDelay);
    if (count >= 2) playSound('clear_combo_2', baseStartTime + CLEARING_ANIMATION_CONFIG[type].double.startDelay);
    if (count >= 3) playSound('clear_combo_3', baseStartTime + CLEARING_ANIMATION_CONFIG[type].triple.startDelay);
    if (count >= 4) {
      const quadStart = baseStartTime + CLEARING_ANIMATION_CONFIG[type].quad.startDelay;
      playSound('clear_combo_4', quadStart);

      // Schedule heartbeat sounds to match the 3 beats of the quad animation
      // The animation duration is 3000ms, we'll space the beats out
      const beatInterval = 800; // Space beats out
      playSound('heartbeat', quadStart + 100);
      playSound('heartbeat', quadStart + 100 + beatInterval);
      playSound('heartbeat', quadStart + 100 + (beatInterval * 2));
    }
  };

  scheduleSound(clearedRows.length, 'rows');
  scheduleSound(clearedColumns.length, 'columns');
}

// Helper function to calculate when normal line clear animations finish
// This determines when the full board clear animations should start
function calculateNormalAnimationEndTime(rowCount: number, columnCount: number): number {
  let maxEndTime = 0;

  // Check row animations
  if (rowCount >= 4) {
    const quadEnd = CLEARING_ANIMATION_CONFIG.rows.quad.startDelay + CLEARING_ANIMATION_CONFIG.rows.quad.duration;
    maxEndTime = Math.max(maxEndTime, quadEnd);
  } else if (rowCount >= 3) {
    const tripleEnd = CLEARING_ANIMATION_CONFIG.rows.triple.startDelay + CLEARING_ANIMATION_CONFIG.rows.triple.duration + 
                      (9 * CLEARING_ANIMATION_CONFIG.rows.triple.waveDelay); // Add wave delay for last tile
    maxEndTime = Math.max(maxEndTime, tripleEnd);
  } else if (rowCount >= 2) {
    const doubleEnd = CLEARING_ANIMATION_CONFIG.rows.double.startDelay + CLEARING_ANIMATION_CONFIG.rows.double.duration +
                      (9 * CLEARING_ANIMATION_CONFIG.rows.double.waveDelay);
    maxEndTime = Math.max(maxEndTime, doubleEnd);
  } else if (rowCount >= 1) {
    const singleEnd = CLEARING_ANIMATION_CONFIG.rows.single.startDelay + CLEARING_ANIMATION_CONFIG.rows.single.duration +
                      (9 * CLEARING_ANIMATION_CONFIG.rows.single.waveDelay);
    maxEndTime = Math.max(maxEndTime, singleEnd);
  }

  // Check column animations
  if (columnCount >= 4) {
    const quadEnd = CLEARING_ANIMATION_CONFIG.columns.quad.startDelay + CLEARING_ANIMATION_CONFIG.columns.quad.duration;
    maxEndTime = Math.max(maxEndTime, quadEnd);
  } else if (columnCount >= 3) {
    const tripleEnd = CLEARING_ANIMATION_CONFIG.columns.triple.startDelay + CLEARING_ANIMATION_CONFIG.columns.triple.duration +
                      (9 * CLEARING_ANIMATION_CONFIG.columns.triple.waveDelay);
    maxEndTime = Math.max(maxEndTime, tripleEnd);
  } else if (columnCount >= 2) {
    const doubleEnd = CLEARING_ANIMATION_CONFIG.columns.double.startDelay + CLEARING_ANIMATION_CONFIG.columns.double.duration +
                      (9 * CLEARING_ANIMATION_CONFIG.columns.double.waveDelay);
    maxEndTime = Math.max(maxEndTime, doubleEnd);
  } else if (columnCount >= 1) {
    const singleEnd = CLEARING_ANIMATION_CONFIG.columns.single.startDelay + CLEARING_ANIMATION_CONFIG.columns.single.duration +
                      (9 * CLEARING_ANIMATION_CONFIG.columns.single.waveDelay);
    maxEndTime = Math.max(maxEndTime, singleEnd);
  }

  return maxEndTime;
}

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

      const baseStartTime = performance.now();

      // Normal line clearing first
      const { tiles: clearedTiles, clearedRows, clearedColumns } = clearFullLines(newTiles);
      const clearedRowIndices = clearedRows.map(r => r.index);
      const clearedColumnIndices = clearedColumns.map(c => c.index);

      // Check if clearing resulted in an empty board (full board clear!)
      const isFullBoardClear = isGridCompletelyEmpty(clearedTiles);

      // Generate normal clearing animations
      let finalTiles = generateClearingAnimations(
        clearedTiles,
        clearedRows,
        clearedColumns,
        {
          ...CLEARING_ANIMATION_CONFIG,
          baseStartTime,
        }
      );

      // Play sound effects for line clearing
      playLineClearSounds(clearedRowIndices, clearedColumnIndices, baseStartTime);

      // Calculate score for lines cleared
      let scoreData = calculateScore(clearedRowIndices.length, clearedColumnIndices.length);

      // If full board clear, add bonus and additional animations
      if (isFullBoardClear) {
        // Calculate when normal animations finish
        const normalAnimationEndTime = calculateNormalAnimationEndTime(
          clearedRowIndices.length,
          clearedColumnIndices.length
        );

        // Add full board clear animations that play AFTER normal animations
        finalTiles = generateFullBoardClearAnimation(
          finalTiles,
          {
            ...CLEARING_ANIMATION_CONFIG,
            baseStartTime,
          },
          normalAnimationEndTime // Delay until normal animations finish
        );

        // Add 300 bonus points for full board clear
        scoreData = {
          ...scoreData,
          pointsEarned: scoreData.pointsEarned + 300,
        };

        // Play special sound for full board clear (after normal animations)
        const fullBoardSoundStart = baseStartTime + normalAnimationEndTime;
        playSound('clear_combo_4', fullBoardSoundStart);
        playSound('heartbeat', fullBoardSoundStart + 200);
        playSound('heartbeat', fullBoardSoundStart + 700);
        playSound('heartbeat', fullBoardSoundStart + 1200);
      }

      const newScore = state.score + scoreData.pointsEarned;
      const newTotalLinesCleared = state.totalLinesCleared + clearedRowIndices.length + clearedColumnIndices.length;

      // Update stats
      const newStats = updateStats(state.stats, clearedRows, clearedColumns);

      // Save game state to browser DB asynchronously (don't block UI)
      // Convert tiles to serializable format for persistence
      const tilesPersistenceData = Array.from(finalTiles.entries()).map(([key, data]) => ({ key, data }));
      if (scoreData.pointsEarned > 0 || Array.from(finalTiles.values()).some(tileData => tileData.isFilled)) {
        safeBatchSave(newScore, tilesPersistenceData, state.nextShapes, state.savedShape, newStats)
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

      // Check for game over
      // We check if ANY of the shapes (including the new one) can be placed
      // We pass the finalTiles which includes the newly placed shape
      // We also pass the score and rotation menu state to determine if rotations are possible
      const isGameOver = checkGameOver(finalTiles, updatedNextShapes, newScore, newOpenRotationMenus);

      const newState = {
        ...state,
        gameState: isGameOver ? 'gameover' : state.gameState,
        tiles: finalTiles,
        score: newScore,
        totalLinesCleared: newTotalLinesCleared,
        stats: newStats,
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

    default:
      return state;
  }
}
