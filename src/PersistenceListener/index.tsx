import { useEffect, useRef } from 'react';

import { useAuth } from '../AuthProvider/AuthContext';
import { safeBatchSave, saveTheme, saveBlockTheme } from '../persistence';
import { persistenceAdapter } from '../persistenceAdapter';
import { useTetrixStateContext } from '../TetrixProvider';
import { types } from '../types';

const { updateSettings, saveModifiers, clearGameBoard } = persistenceAdapter;
const { tilesToArray } = types;

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
  const { isAuthenticated } = useAuth();
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
        // Silent error - user in menu anyway
      });
      return;
    }

    // Don't save game state while in hub mode
    if (gameMode === 'hub') {
      return;
    }

    // Skip game state persistence when authenticated - server handles it via API calls
    if (isAuthenticated) {
      return;
    }

    // Save game state (local play only)
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
      // Silent error - will retry on next state change
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
    isAuthenticated,
  ]);

  // Effect for Modifiers
  useEffect(() => {
    saveModifiers(unlockedModifiers).catch(() => {
      // Silent error - will retry on next change
    });
  }, [unlockedModifiers]);

  // Effect for Settings (Button Size, Show Block Icons, Grandpa Mode)
  useEffect(() => {
    updateSettings({
      buttonSizeMultiplier,
      showBlockIcons,
      grandpaMode,
    }).catch(() => {
      // Silent error - will retry on next change
    });
  }, [buttonSizeMultiplier, showBlockIcons, grandpaMode]);

  // Effect for Theme
  useEffect(() => {
    saveTheme(currentTheme).catch(() => {
      // Silent error - will retry on next change
    });
  }, [currentTheme]);

  // Effect for Block Theme
  useEffect(() => {
    saveBlockTheme(blockTheme).catch(() => {
      // Silent error - will retry on next change
    });
  }, [blockTheme]);

  // Render nothing
  return null;
};
