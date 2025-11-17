/**
 * Persistence types - Data structures for saving/loading game state
 */

import type { Shape, Tile, TileData } from './core';

// Game persistence data (legacy - for backward compatibility)
export type GamePersistenceData = {
  score: number;
  tiles: Tile[]; // Keep as array for backward compatibility
  nextShapes: Shape[];
  savedShape: Shape | null;
};

// Granular persistence types
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
  lastUpdated: number;
};

export type SoundEffectsPersistenceData = {
  isMuted: boolean;
  lastUpdated: number;
};

export type GameSettingsPersistenceData = {
  music: MusicPersistenceData;
  soundEffects: SoundEffectsPersistenceData;
  lastUpdated: number;
};

export type ModifiersPersistenceData = {
  unlockedModifiers: number[]; // Array of prime IDs for JSON serialization
  lastUpdated: number;
};
