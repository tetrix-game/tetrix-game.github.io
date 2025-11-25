import { useCallback } from 'react';
import { useTetrixDispatchContext, useTetrixStateContext } from '../components/Tetrix/TetrixContext';
import { useMusicControl } from '../components/Header/MusicControlContext';
import { GameMode } from '../types/gameState';

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

  const navigateToMode = useCallback((mode: GameMode) => {
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
