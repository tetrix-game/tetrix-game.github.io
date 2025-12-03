import { useReducer, useEffect, useState } from 'react';
import { initialState, tetrixReducer } from './TetrixReducer';
import { TetrixStateContext, TetrixDispatchContext } from './TetrixContext';
import { loadCompleteGameState, loadModifiers, loadTheme, initializeDatabase, clearAllDataAndReload } from '../../utils/persistenceUtils';
import { loadViewGameState, loadSettings } from '../../utils/persistenceAdapter';
import { ThemeName } from '../../types';

type InitializationState = 'BOOTING' | 'LOADING' | 'READY' | 'FAILURE';

export default function TetrixProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tetrixReducer, initialState);
  const [initState, setInitState] = useState<InitializationState>('BOOTING');

  // Load saved game state on startup
  useEffect(() => {
    const loadSavedData = async () => {
      setInitState('LOADING');
      try {
        // Ensure DB is healthy before trying to load anything
        await initializeDatabase();

        const [gameDataResult, unlockedModifiersResult, savedThemeResult, infiniteViewState, settings] = await Promise.all([
          loadCompleteGameState().catch(err => {
            console.error('Error loading game state:', err);
            return { status: 'error', error: err } as const;
          }),
          loadModifiers().catch(err => {
            console.error('Error loading modifiers:', err);
            return { status: 'error', error: err } as const;
          }),
          loadTheme().catch(err => {
            console.error('Error loading theme:', err);
            return { status: 'error', error: err } as const;
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
        if (savedThemeResult.status === 'success' && (savedThemeResult.data === 'dark' || savedThemeResult.data === 'light' || savedThemeResult.data === 'block-blast')) {
          dispatch({
            type: 'SET_THEME',
            value: { theme: savedThemeResult.data as ThemeName }
          });
        }

        // Load modifiers
        if (unlockedModifiersResult.status === 'success') {
          dispatch({
            type: 'LOAD_MODIFIERS',
            value: { unlockedModifiers: unlockedModifiersResult.data }
          });
        }

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
        if (gameDataResult.status === 'success' && gameDataResult.data.tiles.length === 100) {
          dispatch({
            type: 'LOAD_GAME_STATE',
            value: { 
              gameData: gameDataResult.data,
              stats: infiniteViewState?.stats // Include stats from infinite mode if available
            },
          });
        }
        
        // Signal that initialization is complete
        dispatch({ type: 'INITIALIZATION_COMPLETE' });
        setInitState('READY');
      } catch (error) {
        console.error('Failed to load saved game state:', error);
        setInitState('FAILURE');
      }
    };

    loadSavedData();
  }, []);

  if (initState === 'BOOTING' || initState === 'LOADING') {
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

  if (initState === 'FAILURE') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'rgb(25, 25, 25)',
        color: 'rgb(255, 100, 100)',
        fontSize: '18px',
        gap: '20px'
      }}>
        <div>Failed to load game data. The database may be corrupted.</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              borderRadius: '4px'
            }}
          >
            Retry
          </button>
          <button 
            onClick={() => clearAllDataAndReload()}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              background: 'rgba(255, 50, 50, 0.2)',
              border: '1px solid rgba(255, 50, 50, 0.4)',
              color: 'white',
              borderRadius: '4px'
            }}
          >
            Reset Data
          </button>
        </div>
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
