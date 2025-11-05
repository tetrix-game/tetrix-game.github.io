import { createContext, useContext } from 'react';

export interface MusicControlContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

export const MusicControlContext = createContext<MusicControlContextType | null>(null);

export const useMusicControl = () => {
  const context = useContext(MusicControlContext);
  if (!context) {
    throw new Error('useMusicControl must be used within a MusicControlContext.Provider');
  }
  return context;
};
