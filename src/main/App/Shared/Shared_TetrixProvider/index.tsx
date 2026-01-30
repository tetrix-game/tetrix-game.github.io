import { useReducer, useEffect, useState } from 'react';

import { Shared_theme } from '../../types/theme';
import {
  loadTheme,
  loadGameState,
  loadSettingsData,
} from '../Shared_persistence';
import { Shared_persistenceAdapter } from '../Shared_persistenceAdapter';
import { initialState, tetrixReducer } from '../Shared_reducers';
import { Shared_TetrixDispatchContext } from './Shared_TetrixDispatchContext/';
import { Shared_TetrixStateContext } from './Shared_TetrixStateContext/';

const { loadModifiers, initializePersistence, clearAllDataAndReload } = Shared_persistenceAdapter;
type ThemeName = Shared_theme['ThemeName'];
type BlockTheme = Shared_theme['BlockTheme'];

type InitializationState = 'BOOTING' | 'LOADING' | 'READY' | 'FAILURE';
export function Shared_TetrixProvider(
  { children }: { readonly children: React.ReactNode },
): JSX.Element {
  const [state, dispatch] = useReducer(tetrixReducer, initialState);
  const [initState, setInitState] = useState<InitializationState>('BOOTING');

  // Load saved game state on startup
  useEffect((): void => {
    const loadSavedData = async (): Promise<void> => {
      setInitState('LOADING');
      try {
        // Ensure DB is healthy before trying to load anything
        await initializePersistence();

        const [
          unlockedModifiersResult,
          savedThemeResult,
          gameStateData,
          settings,
        ] = await Promise.all([
          loadModifiers().catch((_err: Error) => {
            return { status: 'error', error: _err } as const;
          }),
          loadTheme().catch((_err: Error) => {
            return null;
          }),
          loadGameState().catch((_err: Error) => {
            return null;
          }),
          loadSettingsData().catch((_err: Error) => {
            return { status: 'error', error: _err } as const;
          }),
        ]);

        // Extract data from LoadResults
        const settingsData = settings?.status === 'success' ? settings.data : null;

        // Load theme first
        if (savedThemeResult && (savedThemeResult === 'dark' || savedThemeResult === 'light' || savedThemeResult === 'block-blast')) {
          dispatch({
            type: 'SET_THEME',
            value: { theme: savedThemeResult as ThemeName },
          });
        }

        // Load block theme
        if (settingsData?.blockTheme) {
          dispatch({
            type: 'SET_BLOCK_THEME',
            value: { theme: settingsData.blockTheme as BlockTheme },
          });
        }

        // Load show block icons setting
        if (settingsData?.showBlockIcons !== undefined) {
          dispatch({
            type: 'SET_SHOW_BLOCK_ICONS',
            value: { show: settingsData.showBlockIcons },
          });
        }

        // Load modifiers
        if (unlockedModifiersResult.status === 'success') {
          dispatch({
            type: 'LOAD_MODIFIERS',
            value: { unlockedModifiers: unlockedModifiersResult.data },
          });
        }

        // Restore button size multiplier
        if (settingsData?.buttonSizeMultiplier !== undefined) {
          dispatch({
            type: 'SET_BUTTON_SIZE_MULTIPLIER',
            value: { multiplier: settingsData.buttonSizeMultiplier },
          });
        }

        // Restore grandpa mode setting
        if (settingsData?.grandpaMode !== undefined) {
          dispatch({
            type: 'SET_GRANDPA_MODE',
            value: { enabled: settingsData.grandpaMode },
          });
        }

        // Load game state
        // IMPORTANT: Do NOT check for tiles.length === 100 - this causes data loss!
        // Valid saves may have different tile counts due to:
        // - Grid size changes
        // - Migration from older formats
        // - Corrupted but partially recoverable data
        //
        // Instead, check if there's any meaningful game progress to restore.
        // The persistence layer already handles sanitization and defaults.
        if (gameStateData) {
          // Check if there's actual progress to load
          // A valid save has either: filled tiles, score > 0, or shapes used
          const hasProgress = gameStateData.score > 0
            || gameStateData.hasPlacedFirstShape
            || gameStateData.shapesUsed > 0
            || gameStateData.tiles.some((t: { isFilled?: boolean }) => t.isFilled);

          // Always load if there's progress, regardless of tiles.length
          // Even an empty or partial save should be loaded if it has progress
          // This prevents losing user progress due to grid size mismatches
          if (hasProgress || gameStateData.tiles.length > 0) {
            dispatch({
              type: 'LOAD_GAME_STATE',
              value: {
                gameData: gameStateData,
                stats: gameStateData.stats,
              },
            });
          }
        }

        // Signal that initialization is complete
        dispatch({ type: 'INITIALIZATION_COMPLETE' });
        setInitState('READY');
      } catch {
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
        fontSize: '18px',
      }}
      >
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
        gap: '20px',
        padding: '20px',
        textAlign: 'center',
      }}
      >
        <div>Failed to load game data. The database may be corrupted.</div>
        <div style={{
          color: 'rgb(200, 200, 200)',
          fontSize: '14px',
          maxWidth: '500px',
        }}
        >
          Your long-term statistics will be preserved if you reset.
        </div>
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
              borderRadius: '4px',
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
              borderRadius: '4px',
            }}
            title="Clears all data but preserves your long-term statistics"
          >
            Reset Data (Keep Stats)
          </button>
        </div>
      </div>
    );
  }

  return (
    <Shared_TetrixStateContext.Provider value={state}>
      <Shared_TetrixDispatchContext.Provider value={dispatch}>
        {children}
      </Shared_TetrixDispatchContext.Provider>
    </Shared_TetrixStateContext.Provider>
  );
}
