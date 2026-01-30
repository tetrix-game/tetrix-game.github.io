import { createContext } from 'react';

import type { TetrixReducerState } from '../../../../types/gameState';

export const Shared_TetrixStateContext = createContext<TetrixReducerState | null>(null);
