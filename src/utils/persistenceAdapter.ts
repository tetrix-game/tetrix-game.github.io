/**
 * Persistence Adapter
 *
 * Provides high-level persistence functions for game state and settings.
 * Uses the CRUD pattern for IndexedDB operations.
 */

import * as crud from './indexedDBCrud';
import {
  type SavedGameState,
  type GameSettingsPersistenceData,
  type ModifiersPersistenceData,
  type LoadResult,
} from '../types';
import { STORES } from './indexedDBCrud';
import { generateChecksumManifest, verifyChecksumManifest, type ChecksumManifest } from './checksumUtils';

// Toggle this to enable/disable persistence logging
const DEBUG_PERSISTENCE_CHECKSUMS = false;

// ============================================================================
// GAME STATE
// ============================================================================

/**
 * Save complete game state
 */
export async function saveGameState(state: SavedGameState): Promise<void> {
  // Generate the Shadow Manifest (Merkle Tree)
  const manifest = generateChecksumManifest(state);

  // Atomic-like write: Save Data AND Manifest
  await crud.batchWrite([
    { storeName: STORES.GAME_STATE, key: 'current', data: state },
    { storeName: STORES.CHECKSUMS, key: 'game_manifest', data: manifest }
  ]);

  if (DEBUG_PERSISTENCE_CHECKSUMS) {
    console.log(`[Persistence] Saved game state with Root Hash: ${manifest.root.hash}`);
  }
}

/**
 * Load complete game state
 */
export async function loadGameState(): Promise<LoadResult<SavedGameState>> {
  try {
    // Load Data and Manifest in parallel using a single transaction for consistency
    const [state, manifest] = await crud.batchRead([
      { storeName: STORES.GAME_STATE, key: 'current' },
      { storeName: STORES.CHECKSUMS, key: 'game_manifest' }
    ]) as [GameState | null, ChecksumManifest | null];

    if (state) {
      // Helper to sanitize numeric values (handles NaN, Infinity, non-numbers)
      const sanitizeNumber = (val: unknown, fallback: number = 0): number => {
        if (typeof val === 'number' && Number.isFinite(val)) {
          return val;
        }
        return fallback;
      };

      // Sanitize state to ensure all required fields exist (handles partial/corrupted data)
      const sanitizedState: SavedGameState = {
        score: sanitizeNumber(state.score, 0),
        tiles: Array.isArray(state.tiles) ? state.tiles : [],
        nextShapes: Array.isArray(state.nextShapes) ? state.nextShapes : [],
        savedShape: state.savedShape ?? null,
        totalLinesCleared: sanitizeNumber(state.totalLinesCleared, 0),
        shapesUsed: sanitizeNumber(state.shapesUsed, 0),
        hasPlacedFirstShape: typeof state.hasPlacedFirstShape === 'boolean' ? state.hasPlacedFirstShape : false,
        stats: state.stats ?? (await import('../types/stats')).INITIAL_STATS_PERSISTENCE,
        queueMode: state.queueMode,
        queueColorProbabilities: state.queueColorProbabilities,
        queueHiddenShapes: state.queueHiddenShapes,
        queueSize: state.queueSize,
        isGameOver: typeof state.isGameOver === 'boolean' ? state.isGameOver : false,
        lastUpdated: sanitizeNumber(state.lastUpdated, Date.now()),
      };

      // Perform Strict Merkle Tree Verification
      if (manifest) {
        const result = verifyChecksumManifest(sanitizedState, manifest);

        if (!result.isValid) {
          console.error('%c[Persistence] CRITICAL DATA CORRUPTION!', 'color: red; font-weight: bold; font-size: 14px;');
          console.error(`%cRoot Hash Mismatch! Expected: ${manifest.root.hash}`, 'color: red;');
          console.group('%cCorruption Triage Report', 'color: orange;');
          result.mismatches.forEach(mismatch => {
            console.error(`❌ Validation Failed at Node: ${mismatch}`);
          });
          console.groupEnd();

          // We DO NOT fix it. We report it.
          // The app will still load the data (to prevent crash), but the console is screaming.
        } else if (DEBUG_PERSISTENCE_CHECKSUMS) {
          console.log(`%c[Persistence] Integrity Verified. Root: ${manifest.root.hash}`, 'color: green;');
        }
      } else {
        console.warn('[Persistence] No checksum manifest found. This might be a legacy save.');
      }

      return { status: 'success', data: sanitizedState };
    }

    if (DEBUG_PERSISTENCE_CHECKSUMS) {
      console.warn('[Persistence] No saved state found');
    }
    return { status: 'not_found' };
  } catch (error) {
    console.error('Failed to load game state:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Clear game state (board + score), but preserve stats
 */
export async function clearGameBoard(): Promise<void> {
  const currentResult = await loadGameState();

  if (currentResult.status === 'success') {
    const current = currentResult.data;

    // Reset board and score, but keep stats
    const resetState: SavedGameState = {
      ...current,
      score: 0,
      tiles: [],
      nextShapes: [],
      savedShape: null,
      totalLinesCleared: 0,
      shapesUsed: 0,
      hasPlacedFirstShape: false,
      isGameOver: false,
      lastUpdated: Date.now(),
      // stats: preserved from current
    };

    await saveGameState(resetState);
  }

  if (DEBUG_PERSISTENCE_CHECKSUMS) {
    console.log('[Persistence] Cleared game board (stats preserved)');
  }
}

/**
 * Update partial game state (only specified fields)
 */
export async function updateGameState(updates: Partial<SavedGameState>): Promise<void> {
  const current = await crud.read<SavedGameState>(STORES.GAME_STATE, 'current');

  if (!current) {
    throw new Error('Cannot update non-existent game state');
  }

  const updated: SavedGameState = {
    ...current,
    ...updates,
    lastUpdated: Date.now(),
  };

  // Use the main save function to ensure checksums are updated correctly
  await saveGameState(updated);
}

/**
 * Check if game state exists
 */
export async function hasGameState(): Promise<boolean> {
  const state = await crud.read<SavedGameState>(STORES.GAME_STATE, 'current');
  return !!state;
}

// ============================================================================
// SETTINGS (Global)
// ============================================================================

/**
 * Save game settings
 */
export async function saveSettings(settings: GameSettingsPersistenceData): Promise<void> {
  await crud.write(STORES.SETTINGS, 'current', settings);
}

/**
 * Load game settings
 */
export async function loadSettings(): Promise<LoadResult<GameSettingsPersistenceData>> {
  try {
    const settings = await crud.read<GameSettingsPersistenceData>(STORES.SETTINGS, 'current');
    if (settings) {
      return { status: 'success', data: settings };
    }
    return { status: 'not_found' };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Update partial settings
 */
export async function updateSettings(
  updates: Partial<GameSettingsPersistenceData>
): Promise<void> {
  const currentResult = await loadSettings();
  const current = currentResult.status === 'success' ? currentResult.data : null;

  const updated: GameSettingsPersistenceData = {
    music: current?.music || { isMuted: false, volume: 100, isEnabled: true, lastUpdated: Date.now() },
    soundEffects: current?.soundEffects || { isMuted: false, volume: 100, isEnabled: true, lastUpdated: Date.now() },
    ...current,
    ...updates,
    lastUpdated: Date.now(),
  };

  await saveSettings(updated);
}

/**
 * Save music settings specifically
 */
export async function saveMusicSettings(
  isMuted: boolean,
  volume: number = 100,
  isEnabled: boolean = true
): Promise<void> {
  await updateSettings({
    music: {
      isMuted,
      volume,
      isEnabled,
      lastUpdated: Date.now(),
    },
  });
}

/**
 * Load music settings
 */
export async function loadMusicSettings(): Promise<LoadResult<{ isMuted: boolean; volume: number; isEnabled: boolean }>> {
  const result = await loadSettings();
  if (result.status === 'success') {
    return { status: 'success', data: result.data.music };
  }
  return result.status === 'not_found'
    ? { status: 'not_found' }
    : { status: 'error', error: result.error };
}

/**
 * Save sound effects settings specifically
 */
export async function saveSoundEffectsSettings(
  isMuted: boolean,
  volume: number = 100,
  isEnabled: boolean = true
): Promise<void> {
  await updateSettings({
    soundEffects: {
      isMuted,
      volume,
      isEnabled,
      lastUpdated: Date.now(),
    },
  });
}

/**
 * Load sound effects settings
 */
export async function loadSoundEffectsSettings(): Promise<LoadResult<{ isMuted: boolean; volume: number; isEnabled: boolean }>> {
  const result = await loadSettings();
  if (result.status === 'success') {
    return { status: 'success', data: result.data.soundEffects };
  }
  return result.status === 'not_found'
    ? { status: 'not_found' }
    : { status: 'error', error: result.error };
}

/**
 * Save debug unlock status
 */
export async function saveDebugSettings(unlocked: boolean): Promise<void> {
  await updateSettings({ debugUnlocked: unlocked });
}

/**
 * Load debug settings
 */
export async function loadDebugSettings(): Promise<LoadResult<boolean>> {
  const result = await loadSettings();
  if (result.status === 'success') {
    return { status: 'success', data: result.data.debugUnlocked || false };
  }
  return result.status === 'not_found'
    ? { status: 'not_found' }
    : { status: 'error', error: result.error };
}

/**
 * Save theme preference
 */
export async function saveTheme(theme: string): Promise<void> {
  await updateSettings({ theme });
}

/**
 * Load theme
 */
export async function loadTheme(): Promise<LoadResult<string>> {
  const result = await loadSettings();
  if (result.status === 'success' && result.data.theme) {
    return { status: 'success', data: result.data.theme };
  }
  return { status: 'not_found' };
}

/**
 * Save block theme preference
 */
export async function saveBlockTheme(blockTheme: string): Promise<void> {
  await updateSettings({ blockTheme });
}

/**
 * Load block theme
 */
export async function loadBlockTheme(): Promise<LoadResult<string>> {
  const result = await loadSettings();
  if (result.status === 'success' && result.data.blockTheme) {
    return { status: 'success', data: result.data.blockTheme };
  }
  return { status: 'not_found' };
}

// ============================================================================
// MODIFIERS (cross-game)
// ============================================================================

/**
 * Save unlocked modifiers
 */
export async function saveModifiers(unlockedModifiers: Set<number>): Promise<void> {
  const data: ModifiersPersistenceData = {
    unlockedModifiers: Array.from(unlockedModifiers),
    lastUpdated: Date.now(),
  };
  await crud.write(STORES.MODIFIERS, 'current', data);
}

/**
 * Load unlocked modifiers
 */
export async function loadModifiers(): Promise<LoadResult<Set<number>>> {
  try {
    const data = await crud.read<ModifiersPersistenceData>(STORES.MODIFIERS, 'current');
    if (data?.unlockedModifiers) {
      return { status: 'success', data: new Set(data.unlockedModifiers) };
    }
    return { status: 'not_found' };
  } catch (error) {
    console.error('Failed to load modifiers:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clear all game data (preserves settings)
 */
export async function clearAllGameData(): Promise<void> {
  await Promise.all([
    crud.clear(STORES.GAME_STATE),
    crud.clear(STORES.MODIFIERS),
    crud.clear(STORES.CHECKSUMS),
  ]);
}

/**
 * Clear ALL data including settings
 */
export async function clearAllDataAndReload(): Promise<void> {
  try {
    // Clear all stores
    await Promise.all(
      Object.values(STORES).map(store => crud.clear(store))
    );

    // Clear localStorage backup
    localStorage.clear();

    // Clear caches
    if ('caches' in globalThis) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }
  } catch (error) {
    console.error('Error clearing data:', error);
  }

  // Force reload
  globalThis.location.reload();
}

/**
 * Initialize persistence system on app startup
 */
export async function initializePersistence(): Promise<void> {
  await crud.initDB();
}

// ============================================================================
// CALL TO ACTION TIMESTAMPS
// ============================================================================

/**
 * Save call-to-action timestamp
 */
export async function saveCallToActionTimestamp(callKey: string, timestamp: number): Promise<void> {
  const key = `cta-${callKey}`;
  await crud.write(STORES.SETTINGS, key, timestamp);
}

/**
 * Load call-to-action timestamp
 */
export async function loadCallToActionTimestamp(callKey: string): Promise<LoadResult<number>> {
  const key = `cta-${callKey}`;
  try {
    const timestamp = await crud.read<number>(STORES.SETTINGS, key);
    if (timestamp !== null && typeof timestamp === 'number') {
      return { status: 'success', data: timestamp };
    }
    return { status: 'not_found' };
  } catch (error) {
    console.error('Failed to load call-to-action timestamp:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}
