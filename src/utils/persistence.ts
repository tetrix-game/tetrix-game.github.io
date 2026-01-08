/**
 * Persistence Utilities - Convenience Layer
 *
 * Provides easy-to-use functions for common persistence operations.
 */

import {
  saveGameState as saveGameStateAdapter,
  loadGameState as loadGameStateAdapter,
  updateGameState as updateGameStateAdapter,
  clearGameBoard,
  hasGameState,
  saveSettings,
  loadSettings as loadSettingsAdapter,
  updateSettings,
  saveMusicSettings as saveMusicSettingsAdapter,
  loadMusicSettings as loadMusicSettingsAdapter,
  saveSoundEffectsSettings as saveSoundEffectsSettingsAdapter,
  loadSoundEffectsSettings as loadSoundEffectsSettingsAdapter,
  saveDebugSettings as saveDebugSettingsAdapter,
  loadDebugSettings as loadDebugSettingsAdapter,
  saveTheme as saveThemeAdapter,
  loadTheme as loadThemeAdapter,
  saveBlockTheme as saveBlockThemeAdapter,
  loadBlockTheme as loadBlockThemeAdapter,
  saveModifiers,
  loadModifiers,
  clearAllGameData,
  clearAllDataAndReload,
  initializePersistence,
  saveCallToActionTimestamp,
  loadCallToActionTimestamp,
} from './persistenceAdapter';

import type {
  SavedGameState,
  Shape,
  TileData,
  LoadResult,
} from '../types';
import type { StatsPersistenceData } from '../types/stats';

// Re-export the main functions
export {
  // Game state
  hasGameState,
  clearGameBoard,

  // Settings
  saveSettings,
  updateSettings,

  // Modifiers
  saveModifiers,
  loadModifiers,

  // Cleanup
  clearAllGameData,
  clearAllDataAndReload,

  // Initialization
  initializePersistence,

  // Call to Action
  saveCallToActionTimestamp,
  loadCallToActionTimestamp,
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Save complete game state
 */
export async function saveGameState(data: {
  score: number;
  tiles: TileData[];
  nextShapes: Shape[];
  savedShape: Shape | null;
  totalLinesCleared?: number;
  shapesUsed?: number;
  hasPlacedFirstShape?: boolean;
  stats?: StatsPersistenceData;
  queueMode?: import('../types/shapeQueue').QueueMode;
  queueColorProbabilities?: import('../types/shapeQueue').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
  isGameOver?: boolean;
}): Promise<void> {
  const gameState: SavedGameState = {
    score: data.score,
    tiles: data.tiles,
    nextShapes: data.nextShapes,
    savedShape: data.savedShape,
    totalLinesCleared: data.totalLinesCleared ?? 0,
    shapesUsed: data.shapesUsed ?? 0,
    hasPlacedFirstShape: data.hasPlacedFirstShape ?? false,
    stats: data.stats ?? (await import('../types/stats')).INITIAL_STATS_PERSISTENCE,
    queueMode: data.queueMode,
    queueColorProbabilities: data.queueColorProbabilities,
    queueHiddenShapes: data.queueHiddenShapes,
    queueSize: data.queueSize,
    isGameOver: data.isGameOver,
    lastUpdated: Date.now(),
  };

  await saveGameStateAdapter(gameState);
}

/**
 * Load game state
 */
export async function loadGameState(): Promise<{
  score: number;
  tiles: TileData[];
  nextShapes: Shape[];
  savedShape: Shape | null;
  totalLinesCleared: number;
  shapesUsed: number;
  hasPlacedFirstShape: boolean;
  stats: StatsPersistenceData;
  queueMode?: import('../types/shapeQueue').QueueMode;
  queueColorProbabilities?: import('../types/shapeQueue').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
  isGameOver?: boolean;
} | null> {
  const result = await loadGameStateAdapter();

  if (result.status !== 'success') {
    return null;
  }

  return result.data;
}

/**
 * Batch save game data and stats
 */
export async function safeBatchSave(data: {
  score?: number;
  tiles?: TileData[];
  nextShapes?: Shape[];
  savedShape?: Shape | null;
  stats?: StatsPersistenceData;
  totalLinesCleared?: number;
  shapesUsed?: number;
  hasPlacedFirstShape?: boolean;
  queueMode?: import('../types/shapeQueue').QueueMode;
  queueColorProbabilities?: import('../types/shapeQueue').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
  isGameOver?: boolean;
}): Promise<void> {
  try {
    await updateGameStateAdapter(data);
  } catch (error) {
    // If no state exists yet, create it
    await saveGameState({
      score: data.score ?? 0,
      tiles: data.tiles ?? [],
      nextShapes: data.nextShapes ?? [],
      savedShape: data.savedShape ?? null,
      totalLinesCleared: data.totalLinesCleared,
      shapesUsed: data.shapesUsed,
      hasPlacedFirstShape: data.hasPlacedFirstShape,
      stats: data.stats,
      queueMode: data.queueMode,
      queueColorProbabilities: data.queueColorProbabilities,
      queueHiddenShapes: data.queueHiddenShapes,
      queueSize: data.queueSize,
      isGameOver: data.isGameOver,
    });
  }
}

/**
 * Load music settings with defaults
 */
export async function loadMusicSettings(): Promise<{
  isMuted: boolean;
  volume: number;
  isEnabled: boolean;
}> {
  const result = await loadMusicSettingsAdapter();

  if (result.status === 'success') {
    return result.data;
  }

  return {
    isMuted: false,
    volume: 100,
    isEnabled: true,
  };
}

/**
 * Save music settings
 */
export async function saveMusicSettings(
  isMuted: boolean,
  volume: number = 100,
  isEnabled: boolean = true
): Promise<void> {
  await saveMusicSettingsAdapter(isMuted, volume, isEnabled);
}

/**
 * Load sound effects settings with defaults
 */
export async function loadSoundEffectsSettings(): Promise<{
  isMuted: boolean;
  volume: number;
  isEnabled: boolean;
}> {
  const result = await loadSoundEffectsSettingsAdapter();

  if (result.status === 'success') {
    return result.data;
  }

  return {
    isMuted: false,
    volume: 100,
    isEnabled: true,
  };
}

/**
 * Save sound effects settings
 */
export async function saveSoundEffectsSettings(
  isMuted: boolean,
  volume: number = 100,
  isEnabled: boolean = true
): Promise<void> {
  await saveSoundEffectsSettingsAdapter(isMuted, volume, isEnabled);
}

/**
 * Load debug unlock status
 */
export async function loadDebugSettings(): Promise<boolean> {
  const result = await loadDebugSettingsAdapter();
  return result.status === 'success' ? result.data : false;
}

/**
 * Save debug settings
 */
export async function saveDebugSettings(unlocked: boolean): Promise<void> {
  await saveDebugSettingsAdapter(unlocked);
}

/**
 * Load theme preference
 */
export async function loadTheme(): Promise<string | null> {
  const result = await loadThemeAdapter();
  return result.status === 'success' ? result.data : null;
}

/**
 * Save theme
 */
export async function saveTheme(theme: string): Promise<void> {
  await saveThemeAdapter(theme);
}

/**
 * Load block theme preference
 */
export async function loadBlockTheme(): Promise<string | null> {
  const result = await loadBlockThemeAdapter();
  return result.status === 'success' ? result.data : null;
}

/**
 * Save block theme
 */
export async function saveBlockTheme(blockTheme: string): Promise<void> {
  await saveBlockThemeAdapter(blockTheme);
}

/**
 * Check if any game data exists
 */
export async function hasSavedGameData(): Promise<boolean> {
  return await hasGameState();
}

/**
 * Load settings
 */
export async function loadSettingsData(): Promise<LoadResult<import('../types').GameSettingsPersistenceData>> {
  return await loadSettingsAdapter();
}
