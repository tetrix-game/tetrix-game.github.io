import { useContext } from 'react';

import type { Shared_SoundEffectsContextValue } from '../types';

import { Shared_SoundEffectsContext } from './Shared_SoundEffectsContext';

export const Shared_useSoundEffects = (): Shared_SoundEffectsContextValue => {
  const context = useContext(Shared_SoundEffectsContext);
  if (!context) {
    throw new Error('Shared_useSoundEffects must be used within a Shared_SoundEffectsProvider');
  }
  return context;
};
