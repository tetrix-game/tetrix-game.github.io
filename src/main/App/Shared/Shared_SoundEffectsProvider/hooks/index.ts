import { useContext } from 'react';

import { Shared_SoundEffectsContext } from '../contexts';
import type { Shared_SoundEffectsContextValue } from '../types';

export const Shared_useSoundEffects = (): Shared_SoundEffectsContextValue => {
  const context = useContext(Shared_SoundEffectsContext);
  if (!context) {
    throw new Error('Shared_useSoundEffects must be used within a Shared_SoundEffectsProvider');
  }
  return context;
};
