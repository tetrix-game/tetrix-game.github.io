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
  Location,
  ColorName,
  Block,
  Tile,
  TileData,
  TilesSet,
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
  GamePersistenceData,
  ScorePersistenceData,
  TilesPersistenceData,
  ShapesPersistenceData,
  MusicPersistenceData,
  SoundEffectsPersistenceData,
  GameSettingsPersistenceData,
  ModifiersPersistenceData,
} from './persistence';

// Modifier types
export type {
  GameModifier,
  ModifierUnlockState,
} from './modifiers';

// Game state types
export type {
  GameState,
  TetrixReducerState,
  TetrixAction,
  TetrixDispatch,
} from './gameState';
