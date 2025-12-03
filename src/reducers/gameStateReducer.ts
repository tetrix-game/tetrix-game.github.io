/**
 * Game State Reducer - Handles game modes, levels, modifiers, and turning modes
 * Actions: SET_LEVEL, OPEN_MAP, CLOSE_MAP, UNLOCK_MAP, UNLOCK_MODIFIER, LOAD_MODIFIERS,
 *          TRIGGER_BACKGROUND_MUSIC, ACTIVATE/DEACTIVATE_TURNING_MODE, ACTIVATE/DEACTIVATE_DOUBLE_TURN_MODE,
 *          LOAD_GAME_STATE, RESET_GAME
 */

import type { TetrixReducerState, TetrixAction, Tile } from '../types';
// Persistence imports removed - handled by PersistenceListener
import { INITIAL_STATS_PERSISTENCE, INITIAL_GAME_STATS } from '../types/stats';
import { DEFAULT_COLOR_PROBABILITIES } from '../types/shapeQueue';
import { ColorName } from '../types/core';
import { updateStats } from '../utils/statsUtils';
import { GRID_ADDRESSES, makeTileKey } from '../utils/gridConstants';
import { checkMapCompletion } from '../utils/mapCompletionUtils';
import { recordDailyChallengeCompletion } from '../utils/persistenceAdapter';
import { getTodayDateString } from '../utils/dailyStreakUtils';

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
  mapCompletionResult: null,
  targetTiles: null,
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
  buttonSizeMultiplier: 1.0,
  currentTheme: 'dark' as const,
  initialDailyState: null,
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

      // Persistence handled by listener

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
      // Persistence handled by listener

      return {
        ...state,
        isMapUnlocked: true,
      };
    }

    case "UNLOCK_MODIFIER": {
      const { primeId } = action.value;
      const newUnlockedModifiers = new Set(state.unlockedModifiers);
      newUnlockedModifiers.add(primeId);

      // Persistence handled by listener

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
        gameData.tiles.forEach((tileData: any) => {
          // Old format: has location and block properties
          if (tileData.location && tileData.block) {
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
          else if (tileData.position) {
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
        gameState: gameData.isGameOver ? 'gameover' : state.gameState,
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
      // Persistence handled by listener
      return {
        ...state,
        currentTheme: theme,
      };
    }

    case "SET_BUTTON_SIZE_MULTIPLIER": {
      const { multiplier } = action.value;
      // Clamp between 0.5 and 1.5
      const clampedMultiplier = Math.max(0.5, Math.min(1.5, multiplier));
      // Persistence handled by listener
      return {
        ...state,
        buttonSizeMultiplier: clampedMultiplier,
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

      // Persistence handled by listener

      return newState;
    }

    case "UPDATE_COLOR_PROBABILITIES": {
      const { colorProbabilities } = action.value;

      // Persistence handled by listener

      return {
        ...state,
        queueColorProbabilities: colorProbabilities,
      };
    }

    case "POPULATE_FINITE_QUEUE": {
      const { shapes } = action.value;
      const newQueueSize = shapes.length + state.nextShapes.length;

      // Persistence handled by listener

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

    case "START_DAILY_CHALLENGE": {
      const { tiles, shapes } = action.value;

      // Derive target tiles from the tiles Map - any tile with a non-grey background
      // In daily challenges, tiles with custom backgrounds are the ones that should be filled
      const targetTilesSet = new Set<string>();
      for (const [position, tile] of tiles.entries()) {
        // Tiles with non-grey backgrounds are targets in daily challenges
        if (tile.backgroundColor !== 'grey') {
          targetTilesSet.add(position);
        }
      }

      // Reset game state but keep stats/modifiers
      const newState = {
        ...initialGameState,
        gameMode: 'daily' as const,
        tiles: tiles, // Use the custom grid
        nextShapes: shapes.slice(0, 3), // First 3 shapes visible
        queueHiddenShapes: shapes.slice(3), // Rest in queue
        queueMode: 'finite' as const,
        queueSize: shapes.length,
        shapesUsed: 0,
        targetTiles: targetTilesSet, // Automatically derived from tiles with custom backgrounds
        mapCompletionResult: null, // Clear any previous completion result

        // Preserve persistent data
        stats: state.stats,
        unlockedModifiers: state.unlockedModifiers,
        isMapUnlocked: state.isMapUnlocked,
        currentTheme: state.currentTheme,

        // Ensure UI is ready
        hasLoadedPersistedState: true,
        hasPlacedFirstShape: true, // Start music immediately
        initialDailyState: { tiles, shapes },
      };

      return newState;
    }

    case "RESTART_DAILY_CHALLENGE": {
      if (!state.initialDailyState) {
        return state;
      }
      const { tiles, shapes } = state.initialDailyState;
      
      // Derive target tiles from the tiles Map
      const targetTilesSet = new Set<string>();
      for (const [position, tile] of tiles.entries()) {
        if (tile.backgroundColor !== 'grey') {
          targetTilesSet.add(position);
        }
      }

      return {
        ...initialGameState,
        gameMode: 'daily' as const,
        tiles: tiles, // Use the custom grid
        nextShapes: shapes.slice(0, 3), // First 3 shapes visible
        queueHiddenShapes: shapes.slice(3), // Rest in queue
        queueMode: 'finite' as const,
        queueSize: shapes.length,
        shapesUsed: 0,
        targetTiles: targetTilesSet,
        mapCompletionResult: null,

        // Preserve persistent data
        stats: state.stats,
        unlockedModifiers: state.unlockedModifiers,
        isMapUnlocked: state.isMapUnlocked,
        currentTheme: state.currentTheme,
        initialDailyState: state.initialDailyState, // Keep the initial state for future restarts

        // Ensure UI is ready
        hasLoadedPersistedState: true,
        hasPlacedFirstShape: true,
      };
    }

    case "CHECK_MAP_COMPLETION": {
      // Only check completion for finite modes (daily challenges)
      if (state.queueMode !== 'finite') {
        return state;
      }
      
      const result = checkMapCompletion(state.tiles, state.targetTiles || undefined);
      
      // If the map is complete, store the results and record in history
      if (result.isComplete && state.gameMode === 'daily') {
        // Record completion in daily challenge history (async, doesn't block state update)
        const today = getTodayDateString();
        recordDailyChallengeCompletion({
          date: today,
          score: state.score,
          stars: result.stars,
          matchedTiles: result.matchedTiles,
          totalTiles: result.totalTiles,
          missedTiles: result.missedTiles,
          completedAt: Date.now(),
        }).catch(error => {
          console.error('Failed to record daily challenge completion:', error);
        });

        return {
          ...state,
          mapCompletionResult: {
            stars: result.stars,
            matchedTiles: result.matchedTiles,
            totalTiles: result.totalTiles,
            missedTiles: result.missedTiles,
          },
          gameState: 'gameover', // Transition to game over state to show completion
        };
      }
      
      return state;
    }

    case "CLEAR_MAP_COMPLETION": {
      return {
        ...state,
        mapCompletionResult: null,
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
      // Persistence handled by listener

      return {
        ...state,
        stats: newStats,
      };
    }

    default:
      return state;
  }
}
