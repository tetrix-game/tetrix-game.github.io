import { createContext, useContext } from 'react';

export interface SoundEffectsControlContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

export const SoundEffectsControlContext = createContext<SoundEffectsControlContextType | null>(null);

export const useSoundEffectsControl = () => {
  const context = useContext(SoundEffectsControlContext);
  if (!context) {
    throw new Error('useSoundEffectsControl must be used within a SoundEffectsControlContext.Provider');
  }
  return context;
};