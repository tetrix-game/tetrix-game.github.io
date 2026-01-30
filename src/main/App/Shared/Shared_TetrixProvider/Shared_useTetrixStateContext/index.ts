import { useContext } from 'react';

import type { TetrixReducerState } from '../../types/gameState';
import { Shared_TetrixStateContext } from './Shared_TetrixStateContext';

export function Shared_useTetrixStateContext(): TetrixReducerState {
  const context = useContext(Shared_TetrixStateContext);
  if (!context) {
    throw new Error('Shared_useTetrixStateContext must be used within a Shared_TetrixProvider');
  }
  return context;
}
