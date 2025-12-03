/**
 * LEGACY PERSISTENCE UTILITIES
 * 
 * This file is maintained for backward compatibility.
 * Please use 'persistence.ts' or 'persistenceAdapter.ts' for new code.
 * 
 * All functions here delegate to the new view-aware persistence system,
 * defaulting to 'infinite' mode where a game mode is required.
 */

import {
  saveViewGameState,
  loadViewGameState,
  updateViewGameState,
  saveSettings,
  loadSettings,
  saveMusicSettings,
  loadMusicSettings,
  saveSoundEffectsSettings,
  loadSoundEffectsSettings,
  saveDebugSettings,
  loadDebugSettings,
  saveTheme,
  loadTheme,
  saveModifiers,
  loadModifiers,
  initializePersistence,
  clearAllGameData,
  clearAllDataAndReload,
  saveCallToActionTimestamp,
  loadCallToActionTimestamp,
  safeBatchSave as newSafeBatchSave,
} from './persistence';

import type {
  GamePersistenceData,
  TilesPersistenceData,
  ShapesPersistenceData,
  StatsPersistenceData,
  LoadResult,
} from './types';

// Re-export types
export * from './types';

// Re-export common functions
export {
  saveMusicSettings,
  loadMusicSettings,
  saveSoundEffectsSettings,
  loadSoundEffectsSettings,
  saveDebugSettings,
  loadDebugSettings,
  saveTheme,
  loadTheme,
  saveModifiers,
  loadModifiers,
  clearAllDataAndReload,
  saveCallToActionTimestamp,
  loadCallToActionTimestamp,
};

/**
 * @deprecated Use initializePersistence() instead
 */
export const initializeDatabase = initializePersistence;

/**
 * @deprecated Use clearAllGameData() instead
 */
export const clearAllSavedData = clearAllGameData;

/**
 * @deprecated Use saveViewGameState('infinite', ...) instead
 */
export async function saveGameState(gameData: GamePersistenceData): Promise<void> {
  // Convert legacy GamePersistenceData to ViewGameState
  // Note: This assumes 'infinite' mode
  await saveViewGameState('infinite', {
    score: gameData.score,
    tiles: gameData.tiles, // Assumes TileData[] format (which it should be in new code)
    nextShapes: gameData.nextShapes,
    savedShape: gameData.savedShape,
    totalLinesCleared: 0, // Missing in legacy
    shapesUsed: 0, // Missing in legacy
    hasPlacedFirstShape: true,
    stats: (await import('../types/stats')).INITIAL_STATS_PERSISTENCE,
    lastUpdated: Date.now(),
  });
}

/**
 * @deprecated Use loadViewGameState('infinite') instead
 */
export async function loadGameState(): Promise<LoadResult<GamePersistenceData>> {
  const result = await loadViewGameState('infinite');
  
  if (result.status === 'success') {
    return {
      status: 'success',
      data: {
        score: result.data.score,
        tiles: result.data.tiles,
        nextShapes: result.data.nextShapes,
        savedShape: result.data.savedShape,
      }
    };
  }
  
  return { status: result.status, error: result.error };
}

/**
 * @deprecated Use loadViewGameState('infinite') instead
 */
export async function loadCompleteGameState(): Promise<LoadResult<GamePersistenceData>> {
  return loadGameState();
}

/**
 * @deprecated Use safeBatchSave('infinite', { score }) instead
 */
export async function saveScore(score: number): Promise<void> {
  await updateViewGameState('infinite', { score });
}

/**
 * @deprecated Use safeBatchSave('infinite', { tiles }) instead
 */
export async function saveTiles(tiles: TilesPersistenceData['tiles']): Promise<void> {
  await updateViewGameState('infinite', { tiles });
}

/**
 * @deprecated Use safeBatchSave('infinite', { nextShapes, savedShape }) instead
 */
export async function saveShapes(
  nextShapes: ShapesPersistenceData['nextShapes'], 
  savedShape: ShapesPersistenceData['savedShape']
): Promise<void> {
  await updateViewGameState('infinite', { nextShapes, savedShape });
}

/**
 * @deprecated Use safeBatchSave('infinite', { stats }) instead
 */
export async function saveStats(stats: StatsPersistenceData): Promise<void> {
  await updateViewGameState('infinite', { stats });
}

/**
 * @deprecated Use loadViewGameState('infinite') instead
 */
export async function loadStats(): Promise<LoadResult<StatsPersistenceData>> {
  const result = await loadViewGameState('infinite');
  if (result.status === 'success') {
    return { status: 'success', data: result.data.stats };
  }
  return { status: result.status, error: result.error };
}

/**
 * @deprecated Use safeBatchSave('infinite', ...) instead
 */
export async function safeBatchSave(
  score?: number,
  tiles?: TilesPersistenceData['tiles'],
  nextShapes?: ShapesPersistenceData['nextShapes'],
  savedShape?: ShapesPersistenceData['savedShape'],
  stats?: StatsPersistenceData
): Promise<void> {
  await newSafeBatchSave('infinite', {
    score,
    tiles,
    nextShapes,
    savedShape,
    stats
  });
}

/**
 * @deprecated Use hasViewGameState('infinite') instead
 */
export async function hasSavedGameData(): Promise<boolean> {
  const result = await loadViewGameState('infinite');
  return result.status === 'success' && result.data.tiles.length > 0;
}
