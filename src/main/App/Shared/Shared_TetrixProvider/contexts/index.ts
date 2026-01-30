import { createContext } from 'react';

import type { TetrixDispatch, TetrixReducerState } from '../../types/gameState';

export const Shared_TetrixStateContext = createContext<TetrixReducerState | null>(null);
export const Shared_TetrixDispatchContext = createContext<TetrixDispatch | null>(null);
