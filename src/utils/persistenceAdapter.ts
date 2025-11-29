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
  type Shape,
  type Tile,
} from '../types';
import { STORES } from './indexedDBCrud';

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
  const store = getGameStateStore(gameMode);
  await crud.write(store, 'current', state);
  console.log(`Game state saved for ${gameMode} mode`);
}

/**
 * Load complete game state for a specific mode
 */
export async function loadViewGameState(
  gameMode: GameModeContext
): Promise<ViewGameState | null> {
  const store = getGameStateStore(gameMode);
  try {
    const state = await crud.read<ViewGameState>(store, 'current');
    if (state) {
      console.log(`Game state loaded for ${gameMode} mode`);
    }
    return state;
  } catch (error) {
    console.error(`Failed to load game state for ${gameMode}:`, error);
    return null;
  }
}

/**
 * Clear game state for a specific mode
 */
export async function clearViewGameState(gameMode: GameModeContext): Promise<void> {
  const store = getGameStateStore(gameMode);
  await crud.remove(store, 'current');
  console.log(`Game state cleared for ${gameMode} mode`);
}

/**
 * Check if game state exists for a specific mode
 */
export async function hasViewGameState(gameMode: GameModeContext): Promise<boolean> {
  const store = getGameStateStore(gameMode);
  return crud.exists(store, 'current');
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
  
  await crud.write(store, 'current', updated);
}

// ============================================================================
// SHARED SETTINGS (cross-mode)
// ============================================================================

/**
 * Save game settings (music, sound effects, theme, etc.)
 */
export async function saveSettings(settings: GameSettingsPersistenceData): Promise<void> {
  await crud.write(STORES.SETTINGS, 'current', {
    ...settings,
    lastUpdated: Date.now(),
  });
  console.log('Settings saved');
}

/**
 * Load game settings
 */
export async function loadSettings(): Promise<GameSettingsPersistenceData | null> {
  try {
    return await crud.read<GameSettingsPersistenceData>(STORES.SETTINGS, 'current');
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
}

/**
 * Update partial settings
 */
export async function updateSettings(
  updates: Partial<GameSettingsPersistenceData>
): Promise<void> {
  const current = await loadSettings();
  
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
  console.log('Modifiers saved:', data.unlockedModifiers);
}

/**
 * Load unlocked modifiers
 */
export async function loadModifiers(): Promise<Set<number>> {
  try {
    const data = await crud.read<ModifiersPersistenceData>(STORES.MODIFIERS, 'current');
    if (data?.unlockedModifiers) {
      return new Set(data.unlockedModifiers);
    }
  } catch (error) {
    console.error('Failed to load modifiers:', error);
  }
  return new Set();
}

// ============================================================================
// MIGRATION & CLEANUP
// ============================================================================

/**
 * Migrate legacy data to new view-separated format
 */
export async function migrateLegacyData(): Promise<void> {
  console.log('Checking for legacy data to migrate...');
  
  try {
    // Check if we have legacy data
    const legacyGameState = await crud.read<{
      score: number;
      tiles: Tile[];
      nextShapes: Shape[];
      savedShape: Shape | null;
    }>(STORES.LEGACY_GAME_STATE, 'current');
    
    if (!legacyGameState) {
      console.log('No legacy data found');
      return;
    }
    
    console.log('Found legacy data, migrating to infinite mode...');
    
    // Convert tiles from old array format to new TileData format
    const tilesData = legacyGameState.tiles.map(tile => ({
      position: `R${tile.location.row}C${tile.location.column}`,
      backgroundColor: tile.tileBackgroundColor,
      isFilled: tile.block.isFilled,
      color: tile.block.color,
      activeAnimations: [],
    }));
    
    // Create new view state
    const viewState: ViewGameState = {
      score: legacyGameState.score,
      tiles: tilesData,
      nextShapes: legacyGameState.nextShapes,
      savedShape: legacyGameState.savedShape,
      totalLinesCleared: 0,
      shapesUsed: 0,
      hasPlacedFirstShape: legacyGameState.nextShapes.length < 3, // Infer if started
      stats: (await import('../types/stats')).INITIAL_STATS_PERSISTENCE,
      lastUpdated: Date.now(),
    };
    
    // Save to infinite mode store
    await saveViewGameState('infinite', viewState);
    
    console.log('Legacy data migrated successfully');
  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
  }
}

/**
 * Clear all game data for all modes (preserves settings)
 */
export async function clearAllGameData(): Promise<void> {
  console.log('Clearing all game data...');
  
  // Clear all game state stores (stats are now part of each mode's state)
  await Promise.all([
    crud.clear(STORES.INFINITE_STATE),
    crud.clear(STORES.DAILY_STATE),
    crud.clear(STORES.TUTORIAL_STATE),
    crud.clear(STORES.MODIFIERS),
  ]);
  
  // Note: Stats are now per-mode in ViewGameState, not in a shared store
  // Each mode's stats will be reset when that mode's state is cleared
  
  console.log('All game data cleared (settings preserved)');
}

/**
 * Clear ALL data including settings
 */
export async function clearAllDataAndReload(): Promise<void> {
  console.log('Clearing all data and reloading...');
  
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
