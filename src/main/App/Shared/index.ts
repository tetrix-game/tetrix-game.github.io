/**
 * Shared Module - Central Re-export Point
 * All Shared modules must be imported from this file to satisfy architecture rules
 */

// ============================================================================
// CONTEXT PROVIDERS
// ============================================================================

// Music Control Provider
export { Shared_MusicControlProvider } from './Shared_MusicControlProvider';
export { Shared_useMusicControl } from './Shared_MusicControlProvider/Shared_useMusicControl';
export type { Shared_MusicControlContextType } from './Shared_MusicControlProvider/types';
export { Shared_MusicControlContext } from './Shared_MusicControlProvider/Shared_MusicControlContext';

// Sound Effects Provider
export { Shared_SoundEffectsProvider } from './Shared_SoundEffectsProvider';
export { Shared_useSoundEffects } from './Shared_SoundEffectsProvider/Shared_useSoundEffects';
export { Shared_playSound } from './Shared_SoundEffectsProvider/constants';
export type { Shared_SoundEffectsContextValue, SoundEffect } from './Shared_SoundEffectsProvider/types';
export { Shared_SoundEffectsContext } from './Shared_SoundEffectsProvider/Shared_SoundEffectsContext';

// Tetrix Provider
export { Shared_TetrixProvider } from './Shared_TetrixProvider';
export { Shared_useTetrixStateContext } from './Shared_TetrixProvider/Shared_useTetrixStateContext';
export { Shared_useTetrixDispatchContext } from './Shared_TetrixProvider/Shared_useTetrixDispatchContext';
export { Shared_TetrixStateContext } from './Shared_TetrixProvider/Shared_TetrixStateContext';
export { Shared_TetrixDispatchContext } from './Shared_TetrixProvider/Shared_TetrixDispatchContext';

// ============================================================================
// HOOKS
// ============================================================================

export { Shared_useGameSizing } from './Shared_useGameSizing';
export type { GameSizing } from './Shared_useGameSizing';

// ============================================================================
// CONSTANTS
// ============================================================================

// Animation Constants
export { ANIMATION_TIMING, Shared_animationConstants } from './animationConstants';

// Grid Constants
export {
  GRID_SIZE,
  GRID_GAP,
  GRID_ADDRESSES,
  makeTileKey,
  setGridSize,
  tilesMapToChallengeData,
  Shared_gridConstants,
} from './gridConstants';
export type { ChallengeBoardData } from './gridConstants';

// ============================================================================
// UTILITIES
// ============================================================================

// Persistence
export {
  // Game state
  clearGameBoard,
  loadGameState,
  safeBatchSave,

  // Modifiers
  saveModifiers,
  loadModifiers,

  // Settings
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

  // Call to Action
  saveCallToActionTimestamp,
  loadCallToActionTimestamp,

  // Cleanup
  clearAllDataAndReload,

  // Initialization
  initializePersistence,

  // Facade object
  Shared_persistence,
} from './persistence';

// Shape Geometry
export {
  getShapeBounds,
  getShapeGridPositions,
  getFilledBlocks,
  getShapeVisualOffset,
  mousePositionToGridLocation,
  Shared_shapeGeometry,
} from './shapeGeometry';

// ============================================================================
// REDUCER
// ============================================================================

export { tetrixReducer, initialState } from './Shared_tetrixReducer';
