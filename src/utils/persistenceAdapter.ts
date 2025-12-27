/**
 * View-Aware Persistence Adapter
 * 
 * Provides high-level persistence functions that use the CRUD pattern
 * and automatically route data to the correct store based on game mode.
 * 
 * This layer sits between the CRUD utilities and the application,
 * translating game mode context into the appropriate store operations.
 */

import * as crud from './indexedDBCrud';
import {
  type GameModeContext,
  type ViewGameState,
  type GameSettingsPersistenceData,
  type ModifiersPersistenceData,
  type DailyChallengeHistory,
  type DailyChallengeRecord,
  type Shape,
  type LoadResult,
} from '../types';
import { STORES } from './indexedDBCrud';
import { createEmptyHistory, addCompletionRecord } from './dailyStreakUtils';
import { generateChecksumManifest, verifyChecksumManifest, type ChecksumManifest } from './checksumUtils';

// Toggle this to enable/disable granular persistence logging
const DEBUG_PERSISTENCE_CHECKSUMS = false;

/**
 * Get the store name for a specific game mode
 */
function getGameStateStore(gameMode: GameModeContext): crud.StoreName {
  switch (gameMode) {
    case 'infinite':
      return STORES.INFINITE_STATE;
    case 'daily':
      return STORES.DAILY_STATE;
    case 'tutorial':
      return STORES.TUTORIAL_STATE;
    default:
      throw new Error(`Unknown game mode: ${gameMode}`);
  }
}

// ============================================================================
// VIEW-SPECIFIC GAME STATE (per mode)
// ============================================================================


/**
 * Save complete game state for a specific mode
 */
export async function saveViewGameState(
  gameMode: GameModeContext,
  state: ViewGameState
): Promise<void> {
  // Generate the Shadow Manifest (Merkle Tree)
  const manifest = generateChecksumManifest(state);
  
  // Remove legacy checksum if present to keep data clean
  const stateToSave = { ...state };
  if ('checksum' in stateToSave) {
    delete (stateToSave as any).checksum;
  }

  const store = getGameStateStore(gameMode);
  
  // Atomic-like write: Save Data AND Manifest
  // Ideally this would be a single transaction, but our crud wrapper separates them.
  // We write data first, then manifest.
  
  await crud.batchWrite([
    { storeName: store, key: 'current', data: stateToSave },
    { storeName: STORES.CHECKSUMS, key: `${gameMode}_manifest`, data: manifest }
  ]);

  if (DEBUG_PERSISTENCE_CHECKSUMS) {
    console.log(`[Persistence] Saved ${gameMode} state with Root Hash: ${manifest.root.hash}`);
  }
}

/**
 * Load complete game state for a specific mode
 */
export async function loadViewGameState(
  gameMode: GameModeContext
): Promise<LoadResult<ViewGameState>> {
  const store = getGameStateStore(gameMode);
  try {
    // Load Data and Manifest in parallel using a single transaction for consistency
    const [state, manifest] = await crud.batchRead([
      { storeName: store, key: 'current' },
      { storeName: STORES.CHECKSUMS, key: `${gameMode}_manifest` }
    ]) as [ViewGameState | null, ChecksumManifest | null];

    if (state) {
      // Helper to sanitize numeric values (handles NaN, Infinity, non-numbers)
      const sanitizeNumber = (val: unknown, fallback: number = 0): number => {
        if (typeof val === 'number' && Number.isFinite(val)) {
          return val;
        }
        return fallback;
      };

      // Sanitize state to ensure all required fields exist (handles partial/corrupted data)
      const sanitizedState: ViewGameState = {
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
          console.error(`%c[Persistence] CRITICAL DATA CORRUPTION in ${gameMode}!`, 'color: red; font-weight: bold; font-size: 14px;');
          console.error(`%cRoot Hash Mismatch! Expected: ${manifest.root.hash}`, 'color: red;');
          console.group('%cCorruption Triage Report', 'color: orange;');
          result.mismatches.forEach(mismatch => {
            console.error(`❌ Validation Failed at Node: ${mismatch}`);
          });
          console.groupEnd();
          
          // We DO NOT fix it. We report it.
          // The app will still load the data (to prevent crash), but the console is screaming.
        } else if (DEBUG_PERSISTENCE_CHECKSUMS) {
          console.log(`%c[Persistence] Integrity Verified for ${gameMode}. Root: ${manifest.root.hash}`, 'color: green;');
        }
      } else {
        console.warn(`[Persistence] No checksum manifest found for ${gameMode}. This might be a legacy save.`);
      }

      return { status: 'success', data: sanitizedState };
    }
    
    if (DEBUG_PERSISTENCE_CHECKSUMS) {
      console.warn(`[Persistence] No saved state found for ${gameMode}`);
    }
    return { status: 'not_found' };
  } catch (error) {
    console.error(`Failed to load game state for ${gameMode}:`, error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Clear game state for a specific mode
 */
export async function clearViewGameState(gameMode: GameModeContext): Promise<void> {
  const store = getGameStateStore(gameMode);
  await crud.clear(store);
  
  // Also clear the checksum manifest
  await crud.remove(STORES.CHECKSUMS, `${gameMode}_manifest`);
  
  if (DEBUG_PERSISTENCE_CHECKSUMS) {
    console.log(`[Persistence] Cleared state for ${gameMode}`);
  }
}

/**
 * Save partial game state update (only specified fields)
 */
export async function updateViewGameState(
  gameMode: GameModeContext,
  updates: Partial<ViewGameState>
): Promise<void> {
  const store = getGameStateStore(gameMode);
  const current = await crud.read<ViewGameState>(store, 'current');

  if (!current) {
    throw new Error(`Cannot update non-existent game state for ${gameMode}`);
  }

  const updated: ViewGameState = {
    ...current,
    ...updates,
    lastUpdated: Date.now(),
  };

  // Use the main save function to ensure checksums are updated correctly
  await saveViewGameState(gameMode, updated);
}

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
 * Save debug unlock status
 */
export async function saveDebugSettings(unlocked: boolean): Promise<void> {
  await updateSettings({ debugUnlocked: unlocked });
}

/**
 * Save theme preference
 */
export async function saveTheme(theme: string): Promise<void> {
  await updateSettings({ theme });
}

/**
 * Save block theme preference
 */
export async function saveBlockTheme(blockTheme: string): Promise<void> {
  await updateSettings({ blockTheme });
}

// ============================================================================
// STATS ARE NOW MODE-SPECIFIC (stored in ViewGameState)
// ============================================================================
// Stats are saved/loaded as part of each mode's ViewGameState
// Use saveViewGameState() / loadViewGameState() to manage stats per mode

// ============================================================================
// SHARED MODIFIERS (cross-mode)
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
// DAILY CHALLENGE HISTORY & STREAKS
// ============================================================================

/**
 * Load daily challenge history
 */
export async function loadDailyHistory(): Promise<LoadResult<DailyChallengeHistory>> {
  try {
    const data = await crud.read<DailyChallengeHistory>(STORES.DAILY_HISTORY, 'current');
    if (data) {
      return { status: 'success', data };
    }
    return { status: 'not_found' };
  } catch (error) {
    console.error('Failed to load daily history:', error);
    return { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Save daily challenge history
 */
export async function saveDailyHistory(history: DailyChallengeHistory): Promise<void> {
  await crud.write(STORES.DAILY_HISTORY, 'current', history);
}

/**
 * Record a daily challenge completion
 */
export async function recordDailyChallengeCompletion(
  record: DailyChallengeRecord
): Promise<DailyChallengeHistory> {
  const historyResult = await loadDailyHistory();
  const currentHistory = historyResult.status === 'success' ? historyResult.data : createEmptyHistory();
  
  const updatedHistory = addCompletionRecord(currentHistory, record);
  await saveDailyHistory(updatedHistory);
  return updatedHistory;
}

// ============================================================================
// MIGRATION & CLEANUP
// ============================================================================

/**
 * Migrate legacy data to new view-separated format
 */
export async function migrateLegacyData(): Promise<void> {
  try {
    // 1. Check if we already have new data. If so, DO NOT migrate.
    // This prevents overwriting new game progress with old legacy data on reload.
    const hasNewData = await hasViewGameState('infinite');
    if (hasNewData) {
      return;
    }

    // Check if we have legacy data
    const legacyGameState = await crud.read<{
      score: number;
      tiles: any[]; // Use any[] to bypass strict type checks for legacy data
      nextShapes: Shape[];
      savedShape: Shape | null;
    }>(STORES.LEGACY_GAME_STATE, 'current');

    if (!legacyGameState) {
      return;
    }

    // Validate legacy data structure before processing
    if (!Array.isArray(legacyGameState.tiles)) {
      console.error('Legacy data corrupted: tiles is not an array');
      return;
    }

    // Convert tiles from old array format to new TileData format
    const tilesData = legacyGameState.tiles
      .filter((tile: any) => tile && tile.location && tile.block) // Filter out malformed tiles
      .map((tile: any) => ({
        position: `R${tile.location.row}C${tile.location.column}`,
        backgroundColor: tile.tileBackgroundColor || 'transparent',
        isFilled: !!tile.block.isFilled,
        color: tile.block.color || 'transparent',
        activeAnimations: [],
      }));

    // Create new view state
    const viewState: ViewGameState = {
      score: typeof legacyGameState.score === 'number' ? legacyGameState.score : 0,
      tiles: tilesData,
      nextShapes: Array.isArray(legacyGameState.nextShapes) ? legacyGameState.nextShapes : [],
      savedShape: legacyGameState.savedShape || null,
      totalLinesCleared: 0,
      shapesUsed: 0,
      hasPlacedFirstShape: Array.isArray(legacyGameState.nextShapes) && legacyGameState.nextShapes.length < 3, // Infer if started
      stats: (await import('../types/stats')).INITIAL_STATS_PERSISTENCE,
      lastUpdated: Date.now(),
      isGameOver: false,
    };

    // Save to infinite mode store
    await saveViewGameState('infinite', viewState);

    // We do NOT delete the legacy data here, just in case something goes wrong.
    // The 'hasNewData' check at the top protects us from re-migration.
  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
  }
}

/**
 * Clear all game data for all modes (preserves settings)
 */
export async function clearAllGameData(): Promise<void> {
  // Clear all game state stores (stats are now part of each mode's state)
  await Promise.all([
    crud.clear(STORES.INFINITE_STATE),
    crud.clear(STORES.DAILY_STATE),
    crud.clear(STORES.TUTORIAL_STATE),
    crud.clear(STORES.MODIFIERS),
  ]);

  // Note: Stats are now per-mode in ViewGameState, not in a shared store
  // Each mode's stats will be reset when that mode's state is cleared
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
  await migrateLegacyData();
}

/**
 * Check if a game mode has saved state
 */
export async function hasViewGameState(gameMode: GameModeContext): Promise<boolean> {
  const store = getGameStateStore(gameMode);
  const state = await crud.read<ViewGameState>(store, 'current');
  return !!state;
}

/**
 * Get all game modes that have saved state
 */
export async function getSavedGameModes(): Promise<GameModeContext[]> {
  const modes: GameModeContext[] = ['infinite', 'daily', 'tutorial'];
  const saved: GameModeContext[] = [];

  for (const mode of modes) {
    if (await hasViewGameState(mode)) {
      saved.push(mode);
    }
  }

  return saved;
}

// ============================================================================
// CALL TO ACTION TIMESTAMPS
// ============================================================================

/**
 * Save call-to-action timestamp
 */
export async function saveCallToActionTimestamp(callKey: string, timestamp: number): Promise<void> {
  // We store these in the settings store with a prefix
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
