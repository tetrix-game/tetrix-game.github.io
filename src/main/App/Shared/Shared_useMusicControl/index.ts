import { useContext } from 'react';

import { MusicControlContext } from '../../Shared_MusicControlProvider/MusicControlContext';
import type { MusicControlContextType } from '../../Shared_MusicControlProvider/MusicControlContextType';

export const Shared_useMusicControl = (): MusicControlContextType => {
  const context = useContext(MusicControlContext);
  if (!context) {
    throw new Error('Shared_useMusicControl must be used within a Shared_MusicControlProvider');
  }
  return context;
};
