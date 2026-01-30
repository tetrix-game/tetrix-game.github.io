import { useContext } from 'react';

import { Shared_TetrixDispatchContext } from './Shared_TetrixDispatchContext';
import type { TetrixDispatch } from '../../types/gameState';

export function Shared_useTetrixDispatchContext(): TetrixDispatch {
  const context = useContext(Shared_TetrixDispatchContext);
  if (!context) {
    throw new Error('Shared_useTetrixDispatchContext must be used within a Shared_TetrixProvider');
  }
  return context;
}
