import { useEffect } from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import { safeBatchSave, saveModifiers, saveTheme, saveBlockTheme } from '../../utils/persistence';
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
    gameState,
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
    blockTheme,
    showBlockIcons,
    totalLinesCleared,
    shapesUsed,
    hasPlacedFirstShape,
    buttonSizeMultiplier,
    grandpaMode
  } = state;

  // Track previous values to avoid unnecessary saves if we want to optimize further,
  // but React's dependency array handles most of this.

  // Effect for Game State (Score, Tiles, Shapes, Stats, Queue)
  useEffect(() => {
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
      queueColorProbabilities,
      isGameOver: gameState === 'gameover'
    }).catch(error => {
      console.error('Failed to save game state via listener:', error);
    });
  }, [
    gameMode,
    gameState,
    score,
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
    queueColorProbabilities
  ]);

  // Effect for Modifiers
  useEffect(() => {
    saveModifiers(unlockedModifiers).catch(error => {
      console.error('Failed to save modifiers via listener:', error);
    });
  }, [unlockedModifiers]);

  // Effect for Settings (Map Unlock, Game Mode, Button Size, Show Block Icons, Grandpa Mode)
  useEffect(() => {
    updateSettings({
      lastGameMode: gameMode,
      isMapUnlocked: isMapUnlocked,
      buttonSizeMultiplier: buttonSizeMultiplier,
      showBlockIcons: showBlockIcons,
      grandpaMode: grandpaMode
    }).catch(error => {
      console.error('Failed to save settings via listener:', error);
    });
  }, [gameMode, isMapUnlocked, buttonSizeMultiplier, showBlockIcons, grandpaMode]);

  // Effect for Theme
  useEffect(() => {
    saveTheme(currentTheme).catch(error => {
      console.error('Failed to save theme via listener:', error);
    });
  }, [currentTheme]);

  // Effect for Block Theme
  useEffect(() => {
    saveBlockTheme(blockTheme).catch(error => {
      console.error('Failed to save block theme via listener:', error);
    });
  }, [blockTheme]);

  // Render nothing
  return null;
};
