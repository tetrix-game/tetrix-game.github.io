import { createContext, useContext } from 'react';

export interface Shared_SoundEffectsControlContextType {
  volume: number;
  setVolume: (volume: number) => void;
  isEnabled: boolean;
  toggleEnabled: () => void;
}

export const Shared_SoundEffectsControlContext = createContext<
  Shared_SoundEffectsControlContextType | null
>(null);

export const useSoundEffectsControl = (): Shared_SoundEffectsControlContextType => {
  const context = useContext(Shared_SoundEffectsControlContext);
  if (!context) {
    throw new Error(
      'useSoundEffectsControl must be used within a'
      + ' Shared_SoundEffectsControlContext.Provider',
    );
  }
  return context;
};
