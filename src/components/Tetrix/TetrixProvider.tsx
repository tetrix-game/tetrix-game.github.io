import { useReducer, useEffect } from "react";
import { initialState, tetrixReducer } from "./TetrixReducer";
import { TetrixStateContext, TetrixDispatchContext } from "./TetrixContext";
import { loadGameState } from "../../utils/persistenceUtils";

export default function TetrixProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tetrixReducer, initialState);

  // Load saved game state on startup
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const gameData = await loadGameState();
        if (gameData) {
          dispatch({
            type: 'LOAD_GAME_STATE',
            value: { gameData },
          });
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
