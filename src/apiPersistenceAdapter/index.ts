/**
 * API Persistence Adapter
 * Replaces IndexedDB with backend API calls for authenticated users
 */

import { api } from '../api/client';
import type { SavedGameState, GameSettingsPersistenceData, LoadResult } from '../types';

// ============================================================================
// GAME STATE
// ============================================================================

/**
 * Save complete game state to backend
 */
export async function saveGameState(state: SavedGameState): Promise<void> {
  try {
    await api.saveGameState(state);
  } catch (error) {
    // Log error for debugging but don't expose to console in production
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Failed to save game state to API:', error);
    }
    throw error;
  }
}

/**
 * Load complete game state from backend
 */
export async function loadGameState(): Promise<LoadResult<SavedGameState>> {
  try {
    const data = await api.getGameState();
    return { status: 'success', data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 404 means no game state found (new user)
    if (errorMessage.includes('404') || errorMessage.toLowerCase().includes('not found')) {
      return { status: 'not_found' };
    }

    // Log error for debugging but don't expose to console in production
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Failed to load game state from API:', error);
    }
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Update game state (partial update)
 */
export async function updateGameState(updates: Partial<SavedGameState>): Promise<void> {
  try {
    await api.saveGameState(updates);
  } catch (error) {
    // Log error for debugging but don't expose to console in production
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Failed to update game state:', error);
    }
    throw error;
  }
}

/**
 * Clear game board (reset game)
 */
export async function clearGameBoard(): Promise<void> {
  try {
    await api.resetGame();
  } catch (error) {
    // Log error for debugging but don't expose to console in production
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear game board:', error);
    }
    throw error;
  }
}

/**
 * Clear all data and reload
 */
export async function clearAllDataAndReload(): Promise<void> {
  try {
    await api.resetGame();
    window.location.reload();
  } catch (error) {
    // Log error for debugging but don't expose to console in production
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear all data:', error);
    }
    throw error;
  }
}

// ============================================================================
// SETTINGS (Placeholder - not yet implemented on backend)
// ============================================================================

export async function saveSettings(_settings: GameSettingsPersistenceData): Promise<void> {
  // TODO: Implement when backend settings endpoint is ready
  // Settings save not yet implemented on backend
}

export async function loadSettings(): Promise<LoadResult<GameSettingsPersistenceData>> {
  // TODO: Implement when backend settings endpoint is ready
  return { status: 'not_found' };
}

// ============================================================================
// MODIFIERS (Placeholder - not yet implemented on backend)
// ============================================================================

export async function saveModifiers(_unlockedModifiers: Set<number>): Promise<void> {
  // TODO: Implement when backend modifiers endpoint is ready
  // Modifiers save not yet implemented on backend
}

export async function loadModifiers(): Promise<LoadResult<Set<number>>> {
  // TODO: Implement when backend modifiers endpoint is ready
  return { status: 'not_found' };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize API persistence (no-op since API is always available)
 */
export async function initializePersistence(): Promise<void> {
  // API persistence initialized - no action needed
}

// ============================================================================
// ADDITIONAL SETTINGS (Placeholders - delegate to localStorage for now)
// ============================================================================

export async function updateSettings(
  _updates: Partial<GameSettingsPersistenceData>,
): Promise<void> {
  // TODO: Implement when backend settings endpoint is ready
}

export async function saveMusicSettings(
  _isMuted: boolean,
  _volume: number = 100,
  _isEnabled: boolean = true,
): Promise<void> {
  // Handled by localStorage for now
}

export async function loadMusicSettings(): Promise<LoadResult<{
  isMuted: boolean;
  volume: number;
  isEnabled: boolean;
}>> {
  return { status: 'not_found' };
}

export async function saveSoundEffectsSettings(
  _isMuted: boolean,
  _volume: number = 100,
  _isEnabled: boolean = true,
): Promise<void> {
  // Handled by localStorage for now
}

export async function loadSoundEffectsSettings(): Promise<LoadResult<{
  isMuted: boolean;
  volume: number;
  isEnabled: boolean;
}>> {
  return { status: 'not_found' };
}

export async function saveDebugSettings(_isEnabled: boolean): Promise<void> {
  // Handled by localStorage for now
}

export async function loadDebugSettings(): Promise<LoadResult<boolean>> {
  return { status: 'not_found' };
}

export async function saveTheme(_theme: string): Promise<void> {
  // Handled by localStorage for now
}

export async function loadTheme(): Promise<LoadResult<string>> {
  return { status: 'not_found' };
}

export async function saveBlockTheme(_theme: string): Promise<void> {
  // Handled by localStorage for now
}

export async function saveCallToActionTimestamp(
  _callKey: string,
  _timestamp: number,
): Promise<void> {
  // Handled by localStorage for now
}

export async function loadCallToActionTimestamp(
  _callKey: string,
): Promise<LoadResult<number>> {
  return { status: 'not_found' };
}
