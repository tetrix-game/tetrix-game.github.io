import { useReducer, useEffect, useState } from 'react';
import { initialState, tetrixReducer } from './TetrixReducer';
import { TetrixStateContext, TetrixDispatchContext } from './TetrixContext';
import {
  loadModifiers,
  loadTheme,
  initializePersistence,
  clearAllDataAndReload,
  loadViewGameState,
  loadSettings
} from '../../utils/persistence';
import { ThemeName, BlockTheme } from '../../types';

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
        await initializePersistence();

        const [unlockedModifiersResult, savedThemeResult, infiniteViewState, settings] = await Promise.all([
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

        // Extract data from LoadResults
        const infiniteStateData = infiniteViewState?.status === 'success' ? infiniteViewState.data : null;
        const settingsData = settings?.status === 'success' ? settings.data : null;

        // Load theme first
        if (savedThemeResult && (savedThemeResult === 'dark' || savedThemeResult === 'light' || savedThemeResult === 'block-blast')) {
          dispatch({
            type: 'SET_THEME',
            value: { theme: savedThemeResult as ThemeName }
          });
        }

        // Load block theme
        if (settingsData?.blockTheme) {
          dispatch({
            type: 'SET_BLOCK_THEME',
            value: { theme: settingsData.blockTheme as BlockTheme }
          });
        }

        // Load show block icons setting
        if (settingsData?.showBlockIcons !== undefined) {
          dispatch({
            type: 'SET_SHOW_BLOCK_ICONS',
            value: { show: settingsData.showBlockIcons }
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
        if (settingsData?.lastGameMode && settingsData.lastGameMode !== 'hub') {
          dispatch({
            type: 'SET_GAME_MODE',
            value: { mode: settingsData.lastGameMode }
          });
        }

        // Restore map unlock status
        if (settingsData?.isMapUnlocked) {
          dispatch({
            type: 'UNLOCK_MAP'
          });
        }

        // Restore button size multiplier
        if (settingsData?.buttonSizeMultiplier !== undefined) {
          dispatch({
            type: 'SET_BUTTON_SIZE_MULTIPLIER',
            value: { multiplier: settingsData.buttonSizeMultiplier }
          });
        }

        // Restore grandpa mode setting
        if (settingsData?.grandpaMode !== undefined) {
          dispatch({
            type: 'SET_GRANDPA_MODE',
            value: { enabled: settingsData.grandpaMode }
          });
        }

        // Load infinite view state
        // IMPORTANT: Do NOT check for tiles.length === 100 - this causes data loss!
        // Valid saves may have different tile counts due to:
        // - Grid size changes
        // - Migration from older formats
        // - Corrupted but partially recoverable data
        // 
        // Instead, check if there's any meaningful game progress to restore.
        // The persistence layer already handles sanitization and defaults.
        if (infiniteStateData) {
          // Check if there's actual progress to load
          // A valid save has either: filled tiles, score > 0, or shapes used
          const hasProgress =
            infiniteStateData.score > 0 ||
            infiniteStateData.hasPlacedFirstShape ||
            infiniteStateData.shapesUsed > 0 ||
            infiniteStateData.tiles.some(t => t.isFilled);

          // Always load if there's progress, regardless of tiles.length
          // Even an empty or partial save should be loaded if it has progress
          // This prevents losing user progress due to grid size mismatches
          if (hasProgress || infiniteStateData.tiles.length > 0) {
            dispatch({
              type: 'LOAD_GAME_STATE',
              value: {
                gameData: infiniteStateData,
                stats: infiniteStateData.stats
              },
            });
          }
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
