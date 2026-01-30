import { useContext } from 'react';

import { MusicControlContext } from '../MusicControlProvider/MusicControlContext';
import type { MusicControlContextType } from '../MusicControlProvider/MusicControlContextType';

export const useMusicControl = (): MusicControlContextType => {
  const context = useContext(MusicControlContext);
  if (!context) {
    throw new Error('useMusicControl must be used within a MusicControlProvider');
  }
  return context;
};
