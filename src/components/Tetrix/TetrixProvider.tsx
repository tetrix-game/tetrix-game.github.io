import { useReducer, useEffect, useState } from 'react';
import { initialState, tetrixReducer } from './TetrixReducer';
import { TetrixStateContext, TetrixDispatchContext } from './TetrixContext';
import { loadCompleteGameState, loadModifiers, loadTheme } from '../../utils/persistenceUtils';
import { loadViewGameState } from '../../utils/persistenceAdapter';
import { ThemeName } from '../../types';

export default function TetrixProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tetrixReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved game state on startup
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [gameData, unlockedModifiers, savedTheme, infiniteViewState] = await Promise.all([
          loadCompleteGameState(),
          loadModifiers(),
          loadTheme(),
          loadViewGameState('infinite') // Load infinite mode stats if available
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

        // Only load if we have valid tile data (100 tiles for 10x10 grid)
        if (gameData?.tiles.length === 100) {
          dispatch({
            type: 'LOAD_GAME_STATE',
            value: { 
              gameData,
              stats: infiniteViewState?.stats // Include stats from infinite mode if available
            },
          });
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
