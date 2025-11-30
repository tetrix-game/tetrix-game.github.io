import { useEffect } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import { safeBatchSave, saveModifiers, saveTheme } from '../../utils/persistence';
import { updateSettings } from '../../utils/persistenceAdapter';
import { tilesToArray } from '../../types';

/**
 * PersistenceListener
 * 
 * This component is responsible for listening to state changes and persisting them to IndexedDB.
 * It replaces the anti-pattern of triggering side effects (saves) directly inside reducers.
 * 
 * It follows the "Load Once, Save Often" pattern:
 * - Loading happens only on app initialization (in Main.tsx/TetrixProvider)
 * - Saving happens here whenever relevant state changes
 */
export const PersistenceListener = () => {
  const state = useTetrixStateContext();
  const {
    gameMode,
    score,
    tiles,
    nextShapes,
    savedShape,
    stats,
    queueMode,
    queueHiddenShapes,
    queueSize,
    queueColorProbabilities,
    unlockedModifiers,
    isMapUnlocked,
    currentTheme,
    hasLoadedPersistedState,
    totalLinesCleared,
    shapesUsed,
    hasPlacedFirstShape,
    buttonSizeMultiplier
  } = state;

  // Track previous values to avoid unnecessary saves if we want to optimize further,
  // but React's dependency array handles most of this.

  // Effect for Game State (Score, Tiles, Shapes, Stats, Queue)
  useEffect(() => {
    // Don't save if we haven't loaded yet (to avoid overwriting with empty state)
    if (!hasLoadedPersistedState) return;

    // Don't save game state in hub mode (except maybe settings/modifiers which are handled separately)
    if (gameMode === 'hub') return;

    // Save game state
    safeBatchSave(gameMode, {
      score,
      tiles: tilesToArray(tiles),
      nextShapes,
      savedShape,
      stats: gameMode === 'infinite' ? stats : undefined,
      totalLinesCleared,
      shapesUsed,
      hasPlacedFirstShape,
      queueMode,
      queueHiddenShapes,
      queueSize,
      queueColorProbabilities
    }).catch(error => {
      console.error('Failed to save game state via listener:', error);
    });

  }, [
    gameMode,
    score,
    tiles,
    nextShapes,
    savedShape,
    stats,
    totalLinesCleared,
    shapesUsed,
    hasPlacedFirstShape,
    queueMode,
    queueHiddenShapes,
    queueSize,
    queueColorProbabilities,
    hasLoadedPersistedState
  ]);

  // Effect for Modifiers
  useEffect(() => {
    if (!hasLoadedPersistedState) return;

    saveModifiers(unlockedModifiers).catch(error => {
      console.error('Failed to save modifiers via listener:', error);
    });
  }, [unlockedModifiers, hasLoadedPersistedState]);

  // Effect for Settings (Map Unlock, Game Mode, Button Size)
  useEffect(() => {
    if (!hasLoadedPersistedState) return;

    updateSettings({
      lastGameMode: gameMode,
      isMapUnlocked: isMapUnlocked,
      buttonSizeMultiplier: buttonSizeMultiplier
    }).catch(error => {
      console.error('Failed to save settings via listener:', error);
    });
  }, [gameMode, isMapUnlocked, buttonSizeMultiplier, hasLoadedPersistedState]);

  // Effect for Theme
  useEffect(() => {
    if (!hasLoadedPersistedState) return;

    saveTheme(currentTheme).catch(error => {
      console.error('Failed to save theme via listener:', error);
    });
  }, [currentTheme, hasLoadedPersistedState]);

  // Render nothing
  return null;
};
