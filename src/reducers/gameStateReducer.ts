/**
 * Game State Reducer - Handles game modes, levels, modifiers, and turning modes
 * Actions: SET_LEVEL, OPEN_MAP, CLOSE_MAP, UNLOCK_MAP, UNLOCK_MODIFIER, LOAD_MODIFIERS,
 *          TRIGGER_BACKGROUND_MUSIC, ACTIVATE/DEACTIVATE_TURNING_MODE, ACTIVATE/DEACTIVATE_DOUBLE_TURN_MODE,
 *          LOAD_GAME_STATE, RESET_GAME
 */

import type { TetrixReducerState, TetrixAction, Tile } from '../types';
import { saveModifiers, safeBatchSave } from '../utils/persistence';
import { updateSettings } from '../utils/persistenceAdapter';
import { INITIAL_STATS_PERSISTENCE, INITIAL_GAME_STATS } from '../types/stats';
import { DEFAULT_COLOR_PROBABILITIES } from '../types/shapeQueue';
import { ColorName } from '../types/core';
import { updateStats } from '../utils/statsUtils';
import { GRID_ADDRESSES, makeTileKey } from '../utils/gridConstants';

// Helper function to create tiles Map using plain Tile objects
const makeTiles = () => {
  const tiles = new Map<string, Tile>();
  for (const key of GRID_ADDRESSES) {
    // Parse the key to determine row and column
    const match = key.match(/R(\d+)C(\d+)/);
    if (match) {
      const row = parseInt(match[1], 10);
      const col = parseInt(match[2], 10);
      // Create checkerboard pattern for tile backgrounds
      const isDark = (row + col) % 2 === 0;
      const tile: Tile = {
        position: key,
        backgroundColor: isDark ? 'grey' : 'grey', // Background color
        block: { isFilled: false, color: 'grey' }, // Block
        activeAnimations: [] // No animations initially
      };
      tiles.set(key, tile);
    }
  }
  return tiles;
};

export const initialGameState = {
  gameState: 'playing' as const,
  gameMode: 'hub' as const,
  currentLevel: 0,
  isMapUnlocked: false,
  mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  gemIconPosition: { x: 100, y: 50 },
  gridTileSize: null,
  gridBounds: null,
  tiles: makeTiles(),
  nextShapes: [],
  savedShape: null,
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
  removingShapeIndex: null,
  shapeRemovalAnimationState: 'none' as const,
  newShapeAnimationStates: [],
  shapeOptionBounds: [],
  score: 0,
  totalLinesCleared: 0,
  showCoinDisplay: false,
  queueMode: 'infinite' as const,
  queueColorProbabilities: DEFAULT_COLOR_PROBABILITIES,
  queueHiddenShapes: [],
  queueSize: -1,
  shapesUsed: 0,
  openRotationMenus: [],
  hasPlacedFirstShape: false,
  isTurningModeActive: false,
  turningDirection: null,
  isDoubleTurnModeActive: false,
  unlockedModifiers: new Set<number>(),
  hasLoadedPersistedState: false,
  clearingAnimations: [],
  stats: INITIAL_STATS_PERSISTENCE,
  isStatsOpen: false,
  isQueueOverlayOpen: false,
  insufficientFundsError: null,
  currentTheme: 'dark' as const,
};

export function gameStateReducer(state: TetrixReducerState, action: TetrixAction): TetrixReducerState {
  switch (action.type) {
    case "SET_LEVEL": {
      const { levelIndex } = action.value;
      return {
        ...state,
        currentLevel: levelIndex,
      };
    }

    case "SET_GAME_MODE": {
      const { mode } = action.value;

      // Save game mode to settings
      updateSettings({ lastGameMode: mode }).catch((error: Error) => {
        console.error('Failed to save game mode:', error);
      });

      return {
        ...state,
        gameMode: mode,
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
      // Save map unlock status to settings
      updateSettings({ isMapUnlocked: true }).catch((error: Error) => {
        console.error('Failed to save map unlock status:', error);
      });

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

    case "LOAD_STATS": {
      const { stats } = action.value;
      return {
        ...state,
        stats,
      };
    }

    case "TRIGGER_BACKGROUND_MUSIC": {
      // This action doesn't modify state, just triggers background music
      // The actual music trigger will be handled by the BackgroundMusic component
      return state;
    }

    case "ACTIVATE_TURNING_MODE": {
      const { direction } = action.value;

      // Check if user has enough score (2 points required)
      if (state.score < 2) {
        return {
          ...state,
          insufficientFundsError: Date.now(),
        };
      }

      return {
        ...state,
        isTurningModeActive: true,
        turningDirection: direction,
        isDoubleTurnModeActive: false,
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
      // Check if user has enough score (3 points required)
      if (state.score < 3) {
        return {
          ...state,
          insufficientFundsError: Date.now(),
        };
      }

      return {
        ...state,
        isDoubleTurnModeActive: true,
        isTurningModeActive: false,
        turningDirection: null,
      };
    }

    case "DEACTIVATE_DOUBLE_TURN_MODE": {
      return {
        ...state,
        isDoubleTurnModeActive: false,
      };
    }

    case "LOAD_GAME_STATE": {
      const { gameData } = action.value;
      // Convert tiles from persistence format to Map of Tile objects
      const tilesMap = new Map<string, Tile>();
      let hasFilledTiles = false;

      if (Array.isArray(gameData.tiles)) {
        gameData.tiles.forEach((tileData) => {
          // Old format: has location and block properties
          if ('location' in tileData && 'block' in tileData) {
            const position = makeTileKey(tileData.location.row, tileData.location.column);
            const tile: Tile = {
              position,
              backgroundColor: tileData.tileBackgroundColor || 'grey',
              block: { isFilled: tileData.block.isFilled, color: tileData.block.color },
              activeAnimations: []
            };
            if (tileData.block.isFilled) {
              hasFilledTiles = true;
            }
            tilesMap.set(position, tile);
          }
          // New format: TileData with position property
          else if ('position' in tileData) {
            const tile: Tile = {
              position: tileData.position,
              backgroundColor: tileData.backgroundColor || 'grey',
              block: { isFilled: tileData.isFilled, color: tileData.color },
              activeAnimations: tileData.activeAnimations || []
            };
            if (tileData.isFilled) {
              hasFilledTiles = true;
            }
            tilesMap.set(tile.position, tile);
          }
        });
      }

      // If we're loading a game with score or filled tiles, music should be playing
      const shouldPlayMusic = gameData.score > 0 || hasFilledTiles;

      return {
        ...state,
        score: gameData.score,
        tiles: tilesMap,
        nextShapes: gameData.nextShapes || state.nextShapes,
        savedShape: gameData.savedShape || state.savedShape,
        hasLoadedPersistedState: true,
        hasPlacedFirstShape: shouldPlayMusic || state.hasPlacedFirstShape,
        // Load stats if provided in action value (for infinite mode)
        stats: action.value.stats ? action.value.stats : state.stats,
        // Load queue configuration if available
        queueMode: gameData.queueMode ?? state.queueMode,
        queueColorProbabilities: gameData.queueColorProbabilities ?? state.queueColorProbabilities,
        queueHiddenShapes: gameData.queueHiddenShapes ?? state.queueHiddenShapes,
        queueSize: gameData.queueSize ?? state.queueSize,
      };
    }

    case "RESET_GAME": {
      return {
        ...initialGameState,
        gameMode: 'hub',
        // Preserve all-time and high score stats
        stats: {
          ...state.stats,
          current: JSON.parse(JSON.stringify(INITIAL_GAME_STATS)),
          // Reset current game streak tracking but preserve all-time best
          noTurnStreak: {
            current: 0,
            bestInGame: 0,
            allTimeBest: state.stats.noTurnStreak.allTimeBest,
          },
        },
        // Preserve modifiers
        unlockedModifiers: state.unlockedModifiers,
        // Preserve map unlock status
        isMapUnlocked: state.isMapUnlocked,
        // Ensure stats are closed on reset
        isStatsOpen: false,
      };
    }

    case "OPEN_STATS": {
      return {
        ...state,
        isStatsOpen: true,
      };
    }

    case "CLOSE_STATS": {
      return {
        ...state,
        isStatsOpen: false,
      };
    }

    case "INITIALIZATION_COMPLETE": {
      return {
        ...state,
        hasLoadedPersistedState: true,
      };
    }

    case "SET_THEME": {
      const { theme } = action.value;
      // Persist theme selection
      import('../utils/persistenceUtils').then(({ saveTheme }) => {
        saveTheme(theme).catch((error: Error) => {
          console.error('Failed to save theme:', error);
        });
      });
      return {
        ...state,
        currentTheme: theme,
      };
    }

    case "SET_QUEUE_MODE": {
      const { mode } = action.value;
      const newState = {
        ...state,
        queueMode: mode,
        // Clear hidden shapes when switching modes
        queueHiddenShapes: [],
        // Update queueSize for backward compatibility
        queueSize: mode === 'infinite' ? -1 : state.queueSize,
      };

      // Save queue configuration (only if not in hub mode)
      if (state.gameMode !== 'hub') {
        safeBatchSave(state.gameMode, {
          queueMode: mode,
          queueHiddenShapes: [],
          queueSize: mode === 'infinite' ? -1 : state.queueSize,
        }).catch((error: Error) => {
          console.error('Failed to save queue mode:', error);
        });
      }

      return newState;
    }

    case "UPDATE_COLOR_PROBABILITIES": {
      const { colorProbabilities } = action.value;

      // Save color probabilities (only if not in hub mode)
      if (state.gameMode !== 'hub') {
        safeBatchSave(state.gameMode, {
          queueColorProbabilities: colorProbabilities,
        }).catch((error: Error) => {
          console.error('Failed to save color probabilities:', error);
        });
      }

      return {
        ...state,
        queueColorProbabilities: colorProbabilities,
      };
    }

    case "POPULATE_FINITE_QUEUE": {
      const { shapes } = action.value;
      const newQueueSize = shapes.length + state.nextShapes.length;

      // Save queue state (only if not in hub mode)
      if (state.gameMode !== 'hub') {
        safeBatchSave(state.gameMode, {
          queueHiddenShapes: shapes,
          queueSize: newQueueSize,
        }).catch((error: Error) => {
          console.error('Failed to save queue state:', error);
        });
      }

      return {
        ...state,
        queueHiddenShapes: shapes,
        queueSize: newQueueSize,
      };
    }

    case "TOGGLE_QUEUE_OVERLAY": {
      return {
        ...state,
        isQueueOverlayOpen: !state.isQueueOverlayOpen,
      };
    }

    case "CLEANUP_ANIMATIONS": {
      // Import cleanup function at top of file if needed
      // For now, this is a placeholder - actual cleanup happens in tiles
      return state;
    }

    case "DEBUG_INCREMENT_STATS": {
      let newStats = JSON.parse(JSON.stringify(state.stats));
      const colors: ColorName[] = ['blue', 'green', 'red', 'yellow', 'purple', 'orange'];

      // Simulate every scenario for every color
      colors.forEach(color => {
        // 1. Single Row
        newStats = updateStats(newStats, [{ index: 1, color }], []);

        // 2. Double Row
        newStats = updateStats(newStats, [{ index: 1, color }, { index: 2, color }], []);

        // 3. Triple Row
        newStats = updateStats(newStats, [{ index: 1, color }, { index: 2, color }, { index: 3, color }], []);

        // 4. Quadruple Row
        newStats = updateStats(newStats, [{ index: 1, color }, { index: 2, color }, { index: 3, color }, { index: 4, color }], []);

        // 5. Single Column
        newStats = updateStats(newStats, [], [{ index: 1, color }]);

        // 6. Double Column
        newStats = updateStats(newStats, [], [{ index: 1, color }, { index: 2, color }]);

        // 7. Triple Column
        newStats = updateStats(newStats, [], [{ index: 1, color }, { index: 2, color }, { index: 3, color }]);

        // 8. Quadruple Column
        newStats = updateStats(newStats, [], [{ index: 1, color }, { index: 2, color }, { index: 3, color }, { index: 4, color }]);

        // 9. Double Row + Single Column
        newStats = updateStats(newStats, [{ index: 1, color }, { index: 2, color }], [{ index: 1, color }]);

        // 10. Triple Row + Single Column
        newStats = updateStats(newStats, [{ index: 1, color }, { index: 2, color }, { index: 3, color }], [{ index: 1, color }]);

        // 11. Triple Row + Double Column
        newStats = updateStats(newStats, [{ index: 1, color }, { index: 2, color }, { index: 3, color }], [{ index: 1, color }, { index: 2, color }]);

        // 12. Double Column + Single Row
        newStats = updateStats(newStats, [{ index: 1, color }], [{ index: 1, color }, { index: 2, color }]);

        // 13. Triple Column + Double Row
        newStats = updateStats(newStats, [{ index: 1, color }, { index: 2, color }], [{ index: 1, color }, { index: 2, color }, { index: 3, color }]);

        // 14. Triple Column + Single Row
        newStats = updateStats(newStats, [{ index: 1, color }], [{ index: 1, color }, { index: 2, color }, { index: 3, color }]);

        // 15. 1x1 Square
        newStats = updateStats(newStats, [{ index: 1, color }], [{ index: 1, color }]);

        // 16. 2x2 Square
        newStats = updateStats(newStats, [{ index: 1, color }, { index: 2, color }], [{ index: 1, color }, { index: 2, color }]);

        // 17. 4x4 Legendary
        newStats = updateStats(newStats,
          [{ index: 1, color }, { index: 2, color }, { index: 3, color }, { index: 4, color }],
          [{ index: 1, color }, { index: 2, color }, { index: 3, color }, { index: 4, color }]
        );
      });

      // Save stats (only for infinite mode)
      if (state.gameMode === 'infinite') {
        safeBatchSave(state.gameMode, { stats: newStats })
          .catch((error: Error) => {
            console.error('Failed to save stats after debug increment:', error);
          });
      }

      return {
        ...state,
        stats: newStats,
      };
    }

    default:
      return state;
  }
}
