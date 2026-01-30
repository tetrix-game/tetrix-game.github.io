import { useContext } from 'react';

import type { TetrixDispatch } from '../../types/gameState';
import { Shared_TetrixDispatchContext } from '../Shared_TetrixDispatchContext';

export function Shared_useTetrixDispatchContext(): TetrixDispatch {
  const context = useContext(Shared_TetrixDispatchContext);
  if (!context) {
    throw new Error('Shared_useTetrixDispatchContext must be used within a Shared_TetrixProvider');
  }
  return context;
}
