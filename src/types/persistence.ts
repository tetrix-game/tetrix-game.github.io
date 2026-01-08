/**
 * Persistence types - Data structures for saving/loading game state
 */

import type { Shape, TileData } from './core';

// Saved game state for persistence
export type SavedGameState = {
  score: number;
  tiles: TileData[];
  nextShapes: Shape[];
  savedShape: Shape | null;
  totalLinesCleared: number;
  shapesUsed: number;
  hasPlacedFirstShape: boolean;
  stats: import('./stats').StatsPersistenceData;
  queueMode?: import('./shapeQueue').QueueMode;
  queueColorProbabilities?: import('./shapeQueue').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
  isGameOver?: boolean;
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
  blockTheme?: string; // Block theme name
  showBlockIcons?: boolean; // Whether to show icons on blocks
  buttonSizeMultiplier?: number; // UI scaling: 0.5 to 1.5, default 1.0
  grandpaMode?: boolean; // Reduce Z and S shape frequency to 1/4 normal rate
  lastUpdated: number;
};

export type ModifiersPersistenceData = {
  unlockedModifiers: number[]; // Array of prime IDs for JSON serialization
  lastUpdated: number;
};

export type StatsPersistenceData = import('./stats').StatsPersistenceData;

// Load result type distinguishes between empty (new user) and error states
export type LoadResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not_found' }      // Valid: New user
  | { status: 'error'; error: Error }; // Critical: Do not overwrite!
