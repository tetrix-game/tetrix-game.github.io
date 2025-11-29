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
  Tile,
  ColorName,
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
    tiles: Tile[] | Array<{ key: string; data: { isFilled: boolean; color: string } }>;
    nextShapes: Shape[];
    savedShape: Shape | null;
    totalLinesCleared?: number;
    shapesUsed?: number;
    hasPlacedFirstShape?: boolean;
    stats?: StatsPersistenceData;
  }
): Promise<void> {
  // Convert tiles to serialized format if needed
  let tilesData: Array<{ key: string; data: { isFilled: boolean; color: string } }>;
  
  if (data.tiles.length > 0 && 'location' in data.tiles[0]) {
    // It's Tile[] format - convert to serialized
    tilesData = (data.tiles as Tile[]).map(tile => ({
      key: `R${tile.location.row}C${tile.location.column}`,
      data: { isFilled: tile.block.isFilled, color: tile.block.color },
    }));
  } else {
    // Already serialized
    tilesData = data.tiles as Array<{ key: string; data: { isFilled: boolean; color: string } }>;
  }
  
  const viewState: ViewGameState = {
    score: data.score,
    tiles: tilesData.map(tile => ({
      key: tile.key,
      data: { isFilled: tile.data.isFilled, color: tile.data.color as ColorName },
    })),
    nextShapes: data.nextShapes,
    savedShape: data.savedShape,
    totalLinesCleared: data.totalLinesCleared ?? 0,
    shapesUsed: data.shapesUsed ?? 0,
    hasPlacedFirstShape: data.hasPlacedFirstShape ?? false,
    stats: data.stats ?? (await import('../types/stats')).INITIAL_STATS_PERSISTENCE,
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
  tiles: Tile[];
  nextShapes: Shape[];
  savedShape: Shape | null;
  totalLinesCleared: number;
  shapesUsed: number;
  hasPlacedFirstShape: boolean;
  stats: StatsPersistenceData;
} | null> {
  const state = await loadViewGameState(gameMode);
  
  if (!state) {
    return null;
  }
  
  // Convert serialized tiles back to Tile[] format
  const tiles: Tile[] = state.tiles.map(item => {
    const match = item.key.match(/R(\d+)C(\d+)/);
    if (!match) {
      throw new Error(`Invalid tile key: ${item.key}`);
    }
    const row = parseInt(match[1], 10);
    const column = parseInt(match[2], 10);
    
    return {
      id: `(row: ${row}, column: ${column})`,
      location: { row, column },
      block: {
        isFilled: item.data.isFilled,
        color: item.data.color as import('../types/core').ColorName,
      },
    };
  });
  
  return {
    score: state.score,
    tiles,
    nextShapes: state.nextShapes,
    savedShape: state.savedShape,
    totalLinesCleared: state.totalLinesCleared,
    shapesUsed: state.shapesUsed,
    hasPlacedFirstShape: state.hasPlacedFirstShape,
    stats: state.stats,
  };
}

/**
 * Convenience function: Batch save game data and stats
 */
export async function safeBatchSave(
  gameMode: GameModeContext,
  data: {
    score?: number;
    tiles?: Tile[] | Array<{ key: string; data: { isFilled: boolean; color: string } }>;
    nextShapes?: Shape[];
    savedShape?: Shape | null;
    stats?: StatsPersistenceData;
    totalLinesCleared?: number;
    shapesUsed?: number;
    hasPlacedFirstShape?: boolean;
  }
): Promise<void> {
  const promises: Promise<void>[] = [];
  
  // Save game state if any game data provided (including stats)
  if (
    data.score !== undefined ||
    data.tiles !== undefined ||
    data.nextShapes !== undefined ||
    data.savedShape !== undefined ||
    data.totalLinesCleared !== undefined ||
    data.shapesUsed !== undefined ||
    data.hasPlacedFirstShape !== undefined ||
    data.stats !== undefined
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
      
      if (data.tiles !== undefined) {
        // Convert tiles if needed
        if (data.tiles.length > 0 && 'location' in data.tiles[0]) {
          updates.tiles = (data.tiles as Tile[]).map(tile => ({
            key: `R${tile.location.row}C${tile.location.column}`,
            data: { isFilled: tile.block.isFilled, color: tile.block.color },
          }));
        } else {
          const serializedTiles = data.tiles as Array<{ key: string; data: { isFilled: boolean; color: string } }>;
          updates.tiles = serializedTiles.map(tile => ({
            key: tile.key,
            data: { isFilled: tile.data.isFilled, color: tile.data.color as ColorName },
          }));
        }
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
