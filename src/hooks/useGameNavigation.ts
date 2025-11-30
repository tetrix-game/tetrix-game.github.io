import { useCallback } from 'react';
import { useTetrixDispatchContext, useTetrixStateContext } from '../components/Tetrix/TetrixContext';
import { useMusicControl } from '../components/Header/MusicControlContext';
import { GameMode } from '../types/gameState';
import { loadGameForMode } from '../utils/persistence';

/**
 * Centralized navigation hook for game mode transitions.
 * Handles mode changes and music autoplay consistently across the app.
 * 
 * Usage:
 * ```tsx
 * const { navigateToMode, navigateToHub, currentMode } = useGameNavigation();
 * 
 * // Navigate to a specific mode (triggers music autoplay)
 * navigateToMode('infinite');
 * 
 * // Return to main menu hub
 * navigateToHub();
 * ```
 */
export const useGameNavigation = () => {
  const dispatch = useTetrixDispatchContext();
  const { gameMode } = useTetrixStateContext();
  const { triggerAutoplay } = useMusicControl();

  const navigateToMode = useCallback(async (mode: GameMode) => {
    // If switching to infinite mode, we need to ensure we load the correct state
    // or reset if no state exists. This prevents Daily Challenge state from leaking.
    if (mode === 'infinite') {
      try {
        const savedGame = await loadGameForMode('infinite');
        if (savedGame) {
          dispatch({
            type: 'LOAD_GAME_STATE',
            value: { gameData: savedGame }
          });
        } else {
          // If no saved game, reset to fresh state
          // We must reset BEFORE setting the mode to avoid saving dirty state
          dispatch({ type: 'RESET_GAME' });
        }
      } catch (error) {
        console.error('Failed to load infinite game state:', error);
        // Fallback to reset on error
        dispatch({ type: 'RESET_GAME' });
      }
    }

    dispatch({ type: 'SET_GAME_MODE', value: { mode } });

    // Trigger music autoplay when entering a game mode (not hub)
    if (mode !== 'hub') {
      triggerAutoplay();
    }
  }, [dispatch, triggerAutoplay]);

  const navigateToHub = useCallback(() => {
    dispatch({ type: 'SET_GAME_MODE', value: { mode: 'hub' } });
  }, [dispatch]);

  return {
    navigateToMode,
    navigateToHub,
    currentMode: gameMode,
  };
};
