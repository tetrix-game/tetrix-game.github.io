import { useReducer, useEffect, useState } from 'react';
import { initialState, tetrixReducer } from './TetrixReducer';
import { TetrixStateContext, TetrixDispatchContext } from './TetrixContext';
import { loadCompleteGameState, loadModifiers, loadStats, loadTheme } from '../../utils/persistenceUtils';
import { ThemeName } from '../../types';

export default function TetrixProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tetrixReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved game state on startup
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        console.log('TetrixProvider: Attempting to load saved game state...');
        const [gameData, unlockedModifiers, stats, savedTheme] = await Promise.all([
          loadCompleteGameState(),
          loadModifiers(),
          loadStats(),
          loadTheme()
        ]);

        // Load theme first
        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'block-blast')) {
          dispatch({
            type: 'SET_THEME',
            value: { theme: savedTheme as ThemeName }
          });
        }

        // Load modifiers
        dispatch({
          type: 'LOAD_MODIFIERS',
          value: { unlockedModifiers }
        });

        // Load stats
        if (stats) {
          dispatch({
            type: 'LOAD_STATS',
            value: { stats }
          });
        }

        // Only load if we have valid tile data (100 tiles for 10x10 grid)
        if (gameData?.tiles.length === 100) {
          console.log('TetrixProvider: Found valid saved game state, restoring...', {
            score: gameData.score,
            tilesCount: gameData.tiles.length,
            shapesCount: gameData.nextShapes.length,
            hasSavedShape: !!gameData.savedShape
          });
          dispatch({
            type: 'LOAD_GAME_STATE',
            value: { gameData },
          });
        } else {
          console.log('TetrixProvider: No valid saved game state found (tiles count:', gameData?.tiles?.length ?? 'undefined', ')');
        }
      } catch (error) {
        console.error('Failed to load saved game state:', error);
      } finally {
        dispatch({ type: 'INITIALIZATION_COMPLETE' });
        setIsInitialized(true);
      }
    };

    loadSavedData();
  }, []);

  if (!isInitialized) {
    return null; // Or a loading spinner if desired
  }

  return (
    <TetrixStateContext.Provider value={state}>
      <TetrixDispatchContext.Provider value={dispatch}>
        {children}
      </TetrixDispatchContext.Provider>
    </TetrixStateContext.Provider>
  )
}
