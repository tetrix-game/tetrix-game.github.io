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
  Location,
  ColorName,
  Block,
  Tile,
  TileData,
  TilesSet,
  TileAnimation,
} from './core';

export {
  tilesToArray,
  tilesFromArray,
  getTileLocation,
} from './core';

// Drag types
export type {
  DragPhase,
  DragState,
} from './drag';

// Animation types
export type {
  ShapeRemovalAnimationState,
  ShapeCreationAnimationState,
  ShapeOptionBounds,
} from './animation';

// Scoring types
export type {
  ScoreData,
} from './scoring';

// Persistence types
export type {
  SavedGameState,
  MusicPersistenceData,
  SoundEffectsPersistenceData,
  GameSettingsPersistenceData,
  ModifiersPersistenceData,
  LoadResult,
} from './persistence';

// Stats types
export type {
  StatCategory,
  ColorStat,
  StatValue,
  GameStats,
  StatsPersistenceData,
} from './stats';
export {
  INITIAL_GAME_STATS,
  INITIAL_STATS_PERSISTENCE,
} from './stats';

// Modifier types
export type {
  GameModifier,
  ModifierUnlockState,
} from './modifiers';

// Theme types
export type {
  ThemeName,
  Theme,
  BlockTheme,
} from './theme';
export { THEMES, BLOCK_THEMES } from './theme';

// Shape queue types
export type {
  QueueMode,
  ColorProbability,
  ShapeQueueConfig,
  ShapeQueueState,
} from './shapeQueue';
export { DEFAULT_COLOR_PROBABILITIES } from './shapeQueue';

// Game state types
export type {
  GameState,
  GameMode,
  TetrixReducerState,
  TetrixAction,
  TetrixDispatch,
} from './gameState';
