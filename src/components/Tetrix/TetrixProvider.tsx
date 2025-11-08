import { useReducer, useEffect } from "react";
import { initialState, tetrixReducer } from "./TetrixReducer";
import { TetrixStateContext, TetrixDispatchContext } from "./TetrixContext";
import { loadCompleteGameState, loadModifiers } from "../../utils/persistenceUtils";

export default function TetrixProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tetrixReducer, initialState);

  // Load saved game state on startup
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        console.log('TetrixProvider: Attempting to load saved game state...');
        const [gameData, unlockedModifiers] = await Promise.all([
          loadCompleteGameState(),
          loadModifiers()
        ]);

        // Load modifiers first
        dispatch({
          type: 'LOAD_MODIFIERS',
          value: { unlockedModifiers }
        });

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
      }
    };

    loadSavedData();
  }, []);

  return (
    <TetrixStateContext.Provider value={state}>
      <TetrixDispatchContext.Provider value={dispatch}>
        {children}
      </TetrixDispatchContext.Provider>
    </TetrixStateContext.Provider>
  )
}
