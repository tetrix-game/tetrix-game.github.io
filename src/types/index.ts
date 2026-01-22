/**
 * Types - Unified export for all type definitions
 * 
 * Organized by domain:
 * - Core: Basic building blocks (Block, Tile, Shape, Location)
 * - Drag: Drag and drop state management
 * - Animation: Animation states and bounds
 * - Scoring: Score calculation types
 * - Persistence: Save/load data structures
 * - Modifiers: Game modifier system
 * - Game State: Reducer state and actions
 */

// Core types
export type {
  Shape,
  QueuedShape,
  QueueItem,
  Location,
  ColorName,
  Block,
  Tile,
  TileData,
  TilesSet,
} from './core';

export {
  tilesToArray,
} from './core';

// Drag types
export type {
  DragPhase,
} from './drag';

// Scoring types
export type {
  ScoreData,
} from './scoring';

// Persistence types
export type {
  SavedGameState,
  SerializedQueueItem,
  GameSettingsPersistenceData,
  ModifiersPersistenceData,
  LoadResult,
} from './persistence';

// Theme types
export type {
  ThemeName,
  BlockTheme,
} from './theme';
export { THEMES, BLOCK_THEMES } from './theme';

// Game state types
export type {
  GameMode,
  TetrixReducerState,
  TetrixAction,
  TetrixDispatch,
} from './gameState';
