/**
 * Persistence Utilities - Convenience Layer
 *
 * Provides easy-to-use functions for common persistence operations.
 * Automatically uses the correct persistence adapter (API or IndexedDB) based on auth state.
 */

import { persistenceAdapter } from '../persistenceAdapter';
import { persistenceManager } from '../persistenceManager';
import type { Shape, TileData, QueueItem, SavedGameState, LoadResult, SerializedQueueItem, StatsPersistenceData } from '../types';

// Helper to get current adapter
const getAdapter = (): typeof persistenceAdapter => persistenceManager.getCurrentAdapter();

// Re-export functions that don't need game state (they use IndexedDB for now)
const {
  loadSettings: loadSettingsAdapter,
  saveMusicSettings: saveMusicSettingsAdapter,
  loadMusicSettings: loadMusicSettingsAdapter,
  saveSoundEffectsSettings: saveSoundEffectsSettingsAdapter,
  loadSoundEffectsSettings: loadSoundEffectsSettingsAdapter,
  saveDebugSettings: saveDebugSettingsAdapter,
  loadDebugSettings: loadDebugSettingsAdapter,
  saveTheme: saveThemeAdapter,
  loadTheme: loadThemeAdapter,
  saveBlockTheme: saveBlockThemeAdapter,
  saveCallToActionTimestamp,
  loadCallToActionTimestamp,
} = persistenceAdapter;

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Save complete game state
 */
export async function saveGameState(data: {
  score: number;
  tiles: TileData[];
  nextQueue: QueueItem[];
  savedShape: Shape | null;
  totalLinesCleared?: number;
  shapesUsed?: number;
  hasPlacedFirstShape?: boolean;
  stats?: StatsPersistenceData;
  queueMode?: import('../types').QueueMode;
  queueColorProbabilities?: import('../types').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
  unlockedSlots?: Set<number>;
}): Promise<void> {
  const serializedQueue: SerializedQueueItem[] = data.nextQueue.map((item) => {
    if (item.type === 'shape') {
      return { type: 'shape' as const, shape: item.shape };
    }
    return {
      type: 'purchasable-slot' as const,
      cost: item.cost,
      slotNumber: item.slotNumber,
    };
  });

  const { APP_VERSION } = await import('../version');

  const gameState: SavedGameState = {
    version: APP_VERSION,
    score: data.score,
    tiles: data.tiles,
    nextQueue: serializedQueue,
    savedShape: data.savedShape,
    totalLinesCleared: data.totalLinesCleared ?? 0,
    shapesUsed: data.shapesUsed ?? 0,
    hasPlacedFirstShape: data.hasPlacedFirstShape ?? false,
    stats: data.stats ?? (await import('../types')).INITIAL_STATS_PERSISTENCE,
    queueMode: data.queueMode,
    queueColorProbabilities: data.queueColorProbabilities,
    queueHiddenShapes: data.queueHiddenShapes,
    queueSize: data.queueSize,
    unlockedSlots: data.unlockedSlots ? Array.from(data.unlockedSlots) : undefined,
    lastUpdated: Date.now(),
  };

  await getAdapter().saveGameState(gameState);
}

/**
 * Load game state
 */
export async function loadGameState(): Promise<{
  version: string;
  score: number;
  tiles: TileData[];
  nextQueue: SerializedQueueItem[];
  savedShape: Shape | null;
  totalLinesCleared: number;
  shapesUsed: number;
  hasPlacedFirstShape: boolean;
  stats: StatsPersistenceData;
  queueMode?: import('../types').QueueMode;
  queueColorProbabilities?: import('../types').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
  unlockedSlots?: number[];
  lastUpdated: number;
} | null> {
  const result = await getAdapter().loadGameState();

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
  nextQueue?: QueueItem[];
  savedShape?: Shape | null;
  stats?: StatsPersistenceData;
  totalLinesCleared?: number;
  shapesUsed?: number;
  hasPlacedFirstShape?: boolean;
  queueMode?: import('../types').QueueMode;
  queueColorProbabilities?: import('../types').ColorProbability[];
  queueHiddenShapes?: Shape[];
  queueSize?: number;
  unlockedSlots?: Set<number>;
}): Promise<void> {
  const unlockedSlotsArray = data.unlockedSlots ? Array.from(data.unlockedSlots) : undefined;

  const serializedQueue: SerializedQueueItem[] | undefined = data.nextQueue?.map((item) => {
    if (item.type === 'shape') {
      return { type: 'shape' as const, shape: item.shape };
    }
    return {
      type: 'purchasable-slot' as const,
      cost: item.cost,
      slotNumber: item.slotNumber,
    };
  });

  const updateData: Partial<SavedGameState> = {
    score: data.score,
    tiles: data.tiles,
    nextQueue: serializedQueue,
    savedShape: data.savedShape,
    totalLinesCleared: data.totalLinesCleared,
    shapesUsed: data.shapesUsed,
    hasPlacedFirstShape: data.hasPlacedFirstShape,
    stats: data.stats,
    queueMode: data.queueMode,
    queueColorProbabilities: data.queueColorProbabilities,
    queueHiddenShapes: data.queueHiddenShapes,
    queueSize: data.queueSize,
    unlockedSlots: unlockedSlotsArray,
  };

  try {
    await getAdapter().updateGameState(updateData);
  } catch {
    await saveGameState({
      score: data.score ?? 0,
      tiles: data.tiles ?? [],
      nextQueue: data.nextQueue ?? [],
      savedShape: data.savedShape ?? null,
      totalLinesCleared: data.totalLinesCleared,
      shapesUsed: data.shapesUsed,
      hasPlacedFirstShape: data.hasPlacedFirstShape,
      stats: data.stats,
      queueMode: data.queueMode,
      queueColorProbabilities: data.queueColorProbabilities,
      queueHiddenShapes: data.queueHiddenShapes,
      queueSize: data.queueSize,
      unlockedSlots: data.unlockedSlots,
    });
  }
}

// Re-export passthrough functions
export async function loadMusicSettings(): Promise<{
  isMuted: boolean;
  volume: number;
  isEnabled: boolean;
}> {
  const result = await loadMusicSettingsAdapter();
  if (result.status === 'success') return result.data;
  return { isMuted: false, volume: 100, isEnabled: true };
}

export const saveMusicSettings = saveMusicSettingsAdapter;

export async function loadSoundEffectsSettings(): Promise<{
  isMuted: boolean;
  volume: number;
  isEnabled: boolean;
}> {
  const result = await loadSoundEffectsSettingsAdapter();
  if (result.status === 'success') return result.data;
  return { isMuted: false, volume: 100, isEnabled: true };
}

export const saveSoundEffectsSettings = saveSoundEffectsSettingsAdapter;

export async function loadDebugSettings(): Promise<boolean> {
  const result = await loadDebugSettingsAdapter();
  return result.status === 'success' ? result.data : false;
}

export const saveDebugSettings = saveDebugSettingsAdapter;

export async function loadTheme(): Promise<string | null> {
  const result = await loadThemeAdapter();
  return result.status === 'success' ? result.data : null;
}

export const saveTheme = saveThemeAdapter;
export const saveBlockTheme = saveBlockThemeAdapter;

export async function loadSettingsData(): Promise<
  LoadResult<import('../types').GameSettingsPersistenceData>
> {
  return await loadSettingsAdapter();
}

// Export adapter functions that use dynamic selection
export const clearGameBoard = async (): Promise<void> => await getAdapter().clearGameBoard();
export const saveModifiers = async (modifiers: Set<number>): Promise<void> => (
  await getAdapter().saveModifiers(modifiers)
);
export const loadModifiers = async (): Promise<LoadResult<Set<number>>> => (
  await getAdapter().loadModifiers()
);
export const clearAllDataAndReload = async (): Promise<void> => (
  await getAdapter().clearAllDataAndReload()
);
export const initializePersistence = async (): Promise<void> => (
  await getAdapter().initializePersistence()
);

/**
 * Facade object wrapping all persistence exports
 */
export const persistence = {
  clearGameBoard,
  loadGameState,
  safeBatchSave,
  saveModifiers,
  loadModifiers,
  loadMusicSettings,
  saveMusicSettings,
  loadSoundEffectsSettings,
  saveSoundEffectsSettings,
  loadDebugSettings,
  saveDebugSettings,
  loadTheme,
  saveTheme,
  saveBlockTheme,
  loadSettingsData,
  saveCallToActionTimestamp,
  loadCallToActionTimestamp,
  clearAllDataAndReload,
  initializePersistence,
};
