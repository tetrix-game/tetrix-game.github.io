import { useContext } from 'react';

import type { TetrixDispatch, TetrixReducerState } from '../../types/gameState';

import { Shared_TetrixStateContext, Shared_TetrixDispatchContext } from '../contexts';

export function Shared_useTetrixStateContext(): TetrixReducerState {
  const context = useContext(Shared_TetrixStateContext);
  if (!context) {
    throw new Error('Shared_useTetrixStateContext must be used within a Shared_TetrixProvider');
  }
  return context;
}

export function Shared_useTetrixDispatchContext(): TetrixDispatch {
  const context = useContext(Shared_TetrixDispatchContext);
  if (!context) {
    throw new Error('Shared_useTetrixDispatchContext must be used within a Shared_TetrixProvider');
  }
  return context;
}
