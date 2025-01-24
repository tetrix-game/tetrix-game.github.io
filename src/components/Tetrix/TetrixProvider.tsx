import { useReducer } from "react";
import { initialState, tetrixReducer } from "./tetrixReducer";
import { TetrixStateContext, TetrixDispatchContext } from "./TetrixContext";

export default function TetrixProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tetrixReducer, initialState);
  return (
    <TetrixStateContext.Provider value={state}>
      <TetrixDispatchContext.Provider value={dispatch}>
        {children}
      </TetrixDispatchContext.Provider>
    </TetrixStateContext.Provider>
  )
}
