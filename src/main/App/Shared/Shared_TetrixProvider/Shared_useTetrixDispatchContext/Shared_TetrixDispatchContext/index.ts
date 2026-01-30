import { createContext } from 'react';

import type { TetrixDispatch } from '../../../../types/gameState';

export const Shared_TetrixDispatchContext = createContext<TetrixDispatch | null>(null);
