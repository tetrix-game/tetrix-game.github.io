/**
 * Game State Reducer - Handles game modes, levels, modifiers, and turning modes
 * Actions: SET_LEVEL, OPEN_MAP, CLOSE_MAP, UNLOCK_MAP, UNLOCK_MODIFIER, LOAD_MODIFIERS,
 *          TRIGGER_BACKGROUND_MUSIC, ACTIVATE/DEACTIVATE_TURNING_MODE, ACTIVATE/DEACTIVATE_DOUBLE_TURN_MODE,
 *          LOAD_GAME_STATE, RESET_GAME
 */

import type { TetrixReducerState, TetrixAction, TileData } from '../types';
import { saveModifiers } from '../utils/persistenceUtils';

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
    startTime: null,
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
      };
    }

    case "RESET_GAME": {
      return {
        ...initialGameState,
      };
    }

    default:
      return state;
  }
}
