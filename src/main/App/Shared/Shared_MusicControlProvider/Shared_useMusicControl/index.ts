import { useContext } from 'react';

import { Shared_MusicControlContext } from '../Shared_MusicControlContext';
import type { Shared_MusicControlContextType } from '../types';

export const Shared_useMusicControl = (): Shared_MusicControlContextType => {
  const context = useContext(Shared_MusicControlContext);
  if (!context) {
    throw new Error('Shared_useMusicControl must be used within a Shared_MusicControlProvider');
  }
  return context;
};
