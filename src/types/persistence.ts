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
  tiles: (Tile | TileData)[]; // Support both old (Tile with location/block) and new (TileData with position) formats
  nextShapes: Shape[];
  savedShape: Shape | null;
  // Tile background color (optional for backward compatibility)
  tileBackgroundColor?: string;
  // Queue configuration (optional for backward compatibility)
  queueMode?: import('./shapeQueue').QueueMode;
  queueColorProbabilities?: import('./shapeQueue').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
};

// View-specific game state (separate data per game mode)
export type ViewGameState = {
  score: number;
  tiles: TileData[]; // Array of TileData objects with position property
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
  tiles: TileData[]; // Array of TileData objects with position property
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
  buttonSizeMultiplier?: number; // UI scaling: 0.5 to 1.5, default 1.0
  lastUpdated: number;
};

export type ModifiersPersistenceData = {
  unlockedModifiers: number[]; // Array of prime IDs for JSON serialization
  lastUpdated: number;
};

export type StatsPersistenceData = import('./stats').StatsPersistenceData;

// Daily challenge completion record
export type DailyChallengeRecord = {
  date: string; // YYYY-MM-DD format
  score: number;
  stars: number; // 0-3 stars
  matchedTiles: number;
  totalTiles: number;
  missedTiles: number;
  completedAt: number; // Timestamp
};

// Daily challenge history and streak tracking
export type DailyChallengeHistory = {
  records: DailyChallengeRecord[]; // Sorted by date (oldest to newest)
  currentStreak: number; // Consecutive days played
  longestStreak: number; // Best streak ever
  lastPlayedDate: string | null; // YYYY-MM-DD of last completed challenge
  lastUpdated: number;
};

// RESTRICTION: You cannot ignore the difference between "Empty" and "Broken"
export type LoadResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not_found' }      // Valid: New user
  | { status: 'error'; error: Error }; // Critical: Do not overwrite!
