/**
 * Game State Reducer - Handles game modes, levels, modifiers, and turning modes
 * Actions: SET_LEVEL, OPEN_MAP, CLOSE_MAP, UNLOCK_MAP, UNLOCK_MODIFIER, LOAD_MODIFIERS,
 *          TRIGGER_BACKGROUND_MUSIC, ACTIVATE/DEACTIVATE_TURNING_MODE, ACTIVATE/DEACTIVATE_DOUBLE_TURN_MODE,
 *          LOAD_GAME_STATE, RESET_GAME
 */

import type { TetrixReducerState, TetrixAction, TileData } from '../types';
import { saveModifiers, safeBatchSave } from '../utils/persistenceUtils';
import { INITIAL_STATS_PERSISTENCE, INITIAL_GAME_STATS } from '../types/stats';
import { ColorName } from '../types/core';
import { updateStats } from '../utils/statsUtils';

// Helper function to create a tile key from location
function makeTileKey(row: number, column: number): string {
  return `R${row}C${column}`;
}

// Helper function to create tiles Set
const makeTiles = () => {
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

export const initialGameState = {
  gameState: 'playing' as const,
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

    case "LOAD_GAME_STATE": {
      const { gameData } = action.value;
      // Convert tiles from persistence format to Map
      const tilesMap = new Map<string, TileData>();
      if (Array.isArray(gameData.tiles)) {
        gameData.tiles.forEach((tile) => {
          tilesMap.set(
            makeTileKey(tile.location.row, tile.location.column),
            { isFilled: tile.block.isFilled, color: tile.block.color }
          );
        });
      }
      return {
        ...state,
        score: gameData.score,
        tiles: tilesMap,
        nextShapes: gameData.nextShapes || state.nextShapes,
        savedShape: gameData.savedShape || state.savedShape,
        hasLoadedPersistedState: true,
      };
    }

    case "RESET_GAME": {
      return {
        ...initialGameState,
        // Preserve all-time and high score stats
        stats: {
          ...state.stats,
          current: JSON.parse(JSON.stringify(INITIAL_GAME_STATS)),
        },
        // Preserve modifiers
        unlockedModifiers: state.unlockedModifiers,
        // Preserve map unlock status
        isMapUnlocked: state.isMapUnlocked,
      };
    }

    case "CLEANUP_ANIMATIONS": {
      // Import cleanup function at top of file if needed
      // For now, this is a placeholder - actual cleanup happens in tiles
      return state;
    }

    case "DEBUG_INCREMENT_STATS": {
      let newStats = JSON.parse(JSON.stringify(state.stats));
      const colors: ColorName[] = ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'cyan', 'magenta'];

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

      // Save stats
      safeBatchSave(undefined, undefined, undefined, undefined, newStats)
        .catch((error: Error) => {
          console.error('Failed to save stats after debug increment:', error);
        });

      return {
        ...state,
        stats: newStats,
      };
    }

    default:
      return state;
  }
}
