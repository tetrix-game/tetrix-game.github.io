/**
 * Persistence Utilities - Convenience Layer
 * 
 * Provides easy-to-use functions for common persistence operations.
 * Backward compatible with existing code but uses the new CRUD pattern underneath.
 * 
 * Usage patterns:
 * 
 * 1. Game state operations (requires gameMode context):
 *    - saveGameForMode(gameMode, { score, tiles, nextShapes, ... })
 *    - loadGameForMode(gameMode)
 *    - clearGameForMode(gameMode)
 * 
 * 2. Settings operations (global):
 *    - saveMusicSettings(isMuted, volume, isEnabled)
 *    - loadMusicSettings()
 *    - saveTheme(themeName)
 * 
 * 3. Stats operations (global):
 *    - saveStats(stats)
 *    - loadStats()
 * 
 * 4. Batch operations:
 *    - safeBatchSave(gameMode, { score, tiles, shapes, stats })
 */

import {
  saveViewGameState,
  loadViewGameState,
  clearViewGameState,
  hasViewGameState,
  updateViewGameState,
  saveSettings,
  loadSettings,
  updateSettings,
  saveMusicSettings,
  saveSoundEffectsSettings,
  saveDebugSettings,
  saveTheme,
  saveModifiers,
  loadModifiers,
  clearAllGameData,
  clearAllDataAndReload,
  initializePersistence,
  getSavedGameModes,
} from './persistenceAdapter';

import type {
  GameModeContext,
  ViewGameState,
  Shape,
  TileData,
} from '../types';
import type { StatsPersistenceData } from '../types/stats';

// Re-export the main functions
export {
  // View-specific game state
  saveViewGameState,
  loadViewGameState,
  clearViewGameState,
  hasViewGameState,
  updateViewGameState,
  
  // Settings
  saveSettings,
  loadSettings,
  updateSettings,
  saveMusicSettings,
  saveSoundEffectsSettings,
  saveDebugSettings,
  saveTheme,
  
  // Stats are now mode-specific (part of ViewGameState)
  // Use saveViewGameState/loadViewGameState or saveGameForMode/loadGameForMode
  
  // Modifiers
  saveModifiers,
  loadModifiers,
  
  // Cleanup
  clearAllGameData,
  clearAllDataAndReload,
  
  // Initialization
  initializePersistence,
  
  // Utilities
  getSavedGameModes,
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Convenience function: Save complete game state for a mode
 */
export async function saveGameForMode(
  gameMode: GameModeContext,
  data: {
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
  }
): Promise<void> {
  // Tiles are already in TileData format
  const tilesData = data.tiles;
  
  const viewState: ViewGameState = {
    score: data.score,
    tiles: tilesData,
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
    lastUpdated: Date.now(),
  };
  
  await saveViewGameState(gameMode, viewState);
}

/**
 * Convenience function: Load game and convert tiles back to Tile[] format
 */
export async function loadGameForMode(
  gameMode: GameModeContext
): Promise<{
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
} | null> {
  const state = await loadViewGameState(gameMode);
  
  if (!state) {
    return null;
  }
  
  // Return TileData directly
  return {
    score: state.score,
    tiles: state.tiles,  // TileData[] with position property
    nextShapes: state.nextShapes,
    savedShape: state.savedShape,
    totalLinesCleared: state.totalLinesCleared,
    shapesUsed: state.shapesUsed,
    hasPlacedFirstShape: state.hasPlacedFirstShape,
    stats: state.stats,
    queueMode: state.queueMode,
    queueColorProbabilities: state.queueColorProbabilities,
    queueHiddenShapes: state.queueHiddenShapes,
    queueSize: state.queueSize,
  };
}

/**
 * Convenience function: Batch save game data and stats
 */
export async function safeBatchSave(
  gameMode: GameModeContext,
  data: {
    score?: number;
    tiles?: import('../types').TileData[]; // New format: TileData array with position property
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
  }
): Promise<void> {
  const promises: Promise<void>[] = [];
  
  // Save game state if any game data provided (including stats and queue config)
  if (
    data.score !== undefined ||
    data.tiles !== undefined ||
    data.nextShapes !== undefined ||
    data.savedShape !== undefined ||
    data.totalLinesCleared !== undefined ||
    data.shapesUsed !== undefined ||
    data.hasPlacedFirstShape !== undefined ||
    data.stats !== undefined ||
    data.queueMode !== undefined ||
    data.queueColorProbabilities !== undefined ||
    data.queueHiddenShapes !== undefined ||
    data.queueSize !== undefined
  ) {
    // Load current state to avoid overwriting fields
    const current = await loadViewGameState(gameMode);
    
    if (current) {
      // Update existing state
      const updates: Partial<ViewGameState> = {};
      
      if (data.score !== undefined) updates.score = data.score;
      if (data.totalLinesCleared !== undefined) updates.totalLinesCleared = data.totalLinesCleared;
      if (data.shapesUsed !== undefined) updates.shapesUsed = data.shapesUsed;
      if (data.hasPlacedFirstShape !== undefined) updates.hasPlacedFirstShape = data.hasPlacedFirstShape;
      if (data.nextShapes !== undefined) updates.nextShapes = data.nextShapes;
      if (data.savedShape !== undefined) updates.savedShape = data.savedShape;
      if (data.stats !== undefined) updates.stats = data.stats;
      if (data.queueMode !== undefined) updates.queueMode = data.queueMode;
      if (data.queueColorProbabilities !== undefined) updates.queueColorProbabilities = data.queueColorProbabilities;
      if (data.queueHiddenShapes !== undefined) updates.queueHiddenShapes = data.queueHiddenShapes;
      if (data.queueSize !== undefined) updates.queueSize = data.queueSize;
      
      if (data.tiles !== undefined) {
        // Tiles are already in the new TileData format with position property
        updates.tiles = data.tiles;
      }
      
      promises.push(
        updateViewGameState(gameMode, updates).catch(error => {
          console.warn('Failed to update game state:', error.message);
        })
      );
    } else {
      // Create new state
      promises.push(
        saveGameForMode(gameMode, {
          score: data.score ?? 0,
          tiles: data.tiles ?? [],
          nextShapes: data.nextShapes ?? [],
          savedShape: data.savedShape ?? null,
          totalLinesCleared: data.totalLinesCleared,
          shapesUsed: data.shapesUsed,
          hasPlacedFirstShape: data.hasPlacedFirstShape,
          stats: data.stats,
        }).catch(error => {
          console.warn('Failed to save game state:', error.message);
        })
      );
    }
  }
  
  // Wait for all saves to complete
  await Promise.all(promises);
}

/**
 * Convenience function: Load music settings with defaults
 */
export async function loadMusicSettings(): Promise<{
  isMuted: boolean;
  volume: number;
  isEnabled: boolean;
}> {
  const settings = await loadSettings();
  return {
    isMuted: settings?.music?.isMuted ?? false,
    volume: settings?.music?.volume ?? 100,
    isEnabled: settings?.music?.isEnabled ?? true,
  };
}

/**
 * Convenience function: Load sound effects settings with defaults
 */
export async function loadSoundEffectsSettings(): Promise<{
  isMuted: boolean;
  volume: number;
  isEnabled: boolean;
}> {
  const settings = await loadSettings();
  return {
    isMuted: settings?.soundEffects?.isMuted ?? false,
    volume: settings?.soundEffects?.volume ?? 100,
    isEnabled: settings?.soundEffects?.isEnabled ?? true,
  };
}

/**
 * Convenience function: Load debug unlock status
 */
export async function loadDebugSettings(): Promise<boolean> {
  const settings = await loadSettings();
  return settings?.debugUnlocked ?? false;
}

/**
 * Convenience function: Load theme preference
 */
export async function loadTheme(): Promise<string | null> {
  const settings = await loadSettings();
  return settings?.theme ?? null;
}

/**
 * Convenience function: Check if any game data exists for any mode
 */
export async function hasSavedGameData(): Promise<boolean> {
  const saved = await getSavedGameModes();
  return saved.length > 0;
}

/**
 * Convenience function: Get the primary active game mode with saved data
 * Returns 'infinite' if multiple modes have data
 */
export async function getPrimaryGameMode(): Promise<GameModeContext | null> {
  const saved = await getSavedGameModes();
  
  if (saved.length === 0) {
    return null;
  }
  
  // Prefer infinite mode if it exists
  if (saved.includes('infinite')) {
    return 'infinite';
  }
  
  // Otherwise return the first one
  return saved[0];
}

/**
 * Initialize the database
 * @deprecated Use initializePersistence() instead
 */
export async function initializeDatabase(): Promise<void> {
  await initializePersistence();
}

/**
 * Clear all saved data (game data only, preserves settings)
 * @deprecated Use clearAllGameData() instead for clarity
 */
export async function clearAllSavedData(): Promise<void> {
  await clearAllGameData();
}
