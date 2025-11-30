import { useReducer, useEffect, useState } from 'react';
import { initialState, tetrixReducer } from './TetrixReducer';
import { TetrixStateContext, TetrixDispatchContext } from './TetrixContext';
import { loadCompleteGameState, loadModifiers, loadTheme } from '../../utils/persistenceUtils';
import { loadViewGameState, loadSettings } from '../../utils/persistenceAdapter';
import { ThemeName } from '../../types';

export default function TetrixProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tetrixReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved game state on startup
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [gameData, unlockedModifiers, savedTheme, infiniteViewState, settings] = await Promise.all([
          loadCompleteGameState().catch(err => {
            console.error('Error loading game state:', err);
            return null;
          }),
          loadModifiers().catch(err => {
            console.error('Error loading modifiers:', err);
            return new Set<number>();
          }),
          loadTheme().catch(err => {
            console.error('Error loading theme:', err);
            return null;
          }),
          loadViewGameState('infinite').catch(err => {
            console.error('Error loading infinite view state:', err);
            return null;
          }),
          loadSettings().catch(err => {
            console.error('Error loading settings:', err);
            return null;
          })
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

        // Restore last game mode if available
        if (settings?.lastGameMode && settings.lastGameMode !== 'hub') {
          dispatch({
            type: 'SET_GAME_MODE',
            value: { mode: settings.lastGameMode }
          });
        }

        // Restore map unlock status
        if (settings?.isMapUnlocked) {
          dispatch({
            type: 'UNLOCK_MAP'
          });
        }

        // Restore button size multiplier
        if (settings?.buttonSizeMultiplier !== undefined) {
          dispatch({
            type: 'SET_BUTTON_SIZE_MULTIPLIER',
            value: { multiplier: settings.buttonSizeMultiplier }
          });
        }

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
        // Always complete initialization, even if loading fails
        dispatch({ type: 'INITIALIZATION_COMPLETE' });
        setIsInitialized(true);
      }
    };

    loadSavedData();
  }, []);

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'rgb(25, 25, 25)',
        color: 'rgb(200, 200, 200)',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <TetrixStateContext.Provider value={state}>
      <TetrixDispatchContext.Provider value={dispatch}>
        {children}
      </TetrixDispatchContext.Provider>
    </TetrixStateContext.Provider>
  )
}
