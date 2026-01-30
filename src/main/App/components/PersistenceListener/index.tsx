import { useEffect, useRef } from 'react';

import { safeBatchSave, saveModifiers, saveTheme, saveBlockTheme, clearGameBoard } from '../../Shared/persistence';
import { useTetrixStateContext } from '../../Shared/TetrixContext';
import { tilesToArray } from '../../types/core';
import { updateSettings } from '../../utils/persistenceAdapter';

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
export const PersistenceListener = (): null => {
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
    unlockedSlots,

    currentTheme,
    blockTheme,
    showBlockIcons,
    totalLinesCleared,
    shapesUsed,
    hasPlacedFirstShape,
    buttonSizeMultiplier,
    grandpaMode,
  } = state;

  // Track previous values to avoid unnecessary saves if we want to optimize further,
  // but React's dependency array handles most of this.
  const prevGameModeRef = useRef(gameMode);

  // Effect for Game State (Score, Tiles, Shapes, Stats, Queue)
  useEffect(() => {
    const prevGameMode = prevGameModeRef.current;
    prevGameModeRef.current = gameMode;

    // If transitioning TO hub mode from a game mode, clear the persisted game board
    // This ensures "Back to Menu" after game over clears the old board state
    if (gameMode === 'hub' && prevGameMode !== 'hub') {
      clearGameBoard().catch(() => {
        // Silently handle clear failure
      });
      return;
    }

    // Don't save game state while in hub mode
    if (gameMode === 'hub') return;

    // Save game state
    // NOTE: We intentionally do NOT persist isGameOver.
    // Game over is a derived state that should be recalculated on load
    // to prevent false game overs from stale/corrupted data.
    // Save the FULL queue including purchasable slots - they are first-class queue items
    safeBatchSave({
      score,
      tiles: tilesToArray(tiles),
      nextQueue: nextShapes, // Save the full queue structure
      savedShape,
      stats,
      totalLinesCleared,
      shapesUsed,
      hasPlacedFirstShape,
      queueMode,
      queueHiddenShapes,
      queueSize,
      queueColorProbabilities,
      unlockedSlots,
      // isGameOver is intentionally NOT persisted - see LOAD_GAME_STATE for recalculation
    }).catch(() => {
      // Silently handle save failure
    });
  }, [
    gameMode,
    gameState,
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
    unlockedSlots,
  ]);

  // Effect for Modifiers
  useEffect(() => {
    saveModifiers(unlockedModifiers).catch(() => {
      // Silently handle save failure
    });
  }, [unlockedModifiers]);

  // Effect for Settings (Button Size, Show Block Icons, Grandpa Mode)
  useEffect(() => {
    updateSettings({
      buttonSizeMultiplier,
      showBlockIcons,
      grandpaMode,
    }).catch(() => {
      // Silently handle save failure
    });
  }, [buttonSizeMultiplier, showBlockIcons, grandpaMode]);

  // Effect for Theme
  useEffect(() => {
    saveTheme(currentTheme).catch(() => {
      // Silently handle save failure
    });
  }, [currentTheme]);

  // Effect for Block Theme
  useEffect(() => {
    saveBlockTheme(blockTheme).catch(() => {
      // Silently handle save failure
    });
  }, [blockTheme]);

  // Render nothing
  return null;
};
