/**
 * Persistence types - Data structures for saving/loading game state
 */

import type { Shape, Tile, TileData } from './core';
import type { GameMode } from './gameState';

// Game mode context for data separation
export type GameModeContext = Exclude<GameMode, 'hub'>; // 'infinite' | 'daily' | 'tutorial'

// Game persistence data (legacy - for backward compatibility)
export type GamePersistenceData = {
  score: number;
  tiles: Tile[]; // Keep as array for backward compatibility
  nextShapes: Shape[];
  savedShape: Shape | null;
  // Queue configuration (optional for backward compatibility)
  queueMode?: import('./shapeQueue').QueueMode;
  queueColorProbabilities?: import('./shapeQueue').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
};

// View-specific game state (separate data per game mode)
export type ViewGameState = {
  score: number;
  tiles: Array<{ key: string; data: TileData }>; // Serialized from Map
  nextShapes: Shape[];
  savedShape: Shape | null;
  totalLinesCleared: number;
  shapesUsed: number;
  hasPlacedFirstShape: boolean;
  stats: import('./stats').StatsPersistenceData; // Mode-specific stats
  // Queue configuration
  queueMode?: import('./shapeQueue').QueueMode;
  queueColorProbabilities?: import('./shapeQueue').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
  lastUpdated: number;
};

// Granular persistence types (legacy - for migration)
export type ScorePersistenceData = {
  score: number;
  lastUpdated: number;
};

export type TilesPersistenceData = {
  tiles: Array<{ key: string; data: TileData }>; // Serialized from Map
  lastUpdated: number;
};

export type ShapesPersistenceData = {
  nextShapes: Shape[];
  savedShape: Shape | null;
  lastUpdated: number;
};

export type MusicPersistenceData = {
  isMuted: boolean;
  volume: number; // 0-100
  isEnabled: boolean; // separate from volume level
  lastUpdated: number;
};

export type SoundEffectsPersistenceData = {
  isMuted: boolean;
  volume: number; // 0-100
  isEnabled: boolean; // separate from volume level
  lastUpdated: number;
};

export type GameSettingsPersistenceData = {
  music: MusicPersistenceData;
  soundEffects: SoundEffectsPersistenceData;
  debugUnlocked?: boolean;
  theme?: string; // Theme name
  lastGameMode?: import('./gameState').GameMode; // Remember active game mode
  isMapUnlocked?: boolean; // Map unlock status
  lastUpdated: number;
};

export type ModifiersPersistenceData = {
  unlockedModifiers: number[]; // Array of prime IDs for JSON serialization
  lastUpdated: number;
};

export type StatsPersistenceData = import('./stats').StatsPersistenceData;
