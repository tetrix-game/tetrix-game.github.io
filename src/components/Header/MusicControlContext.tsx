import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadMusicSettings, saveMusicSettings } from '../../utils/persistenceUtils';

export interface MusicControlContextType {
  isMuted: boolean;
  toggleMute: () => void;
  shouldPlayMusic: boolean;
  triggerAutoplay: () => void;
}

export const MusicControlContext = createContext<MusicControlContextType | null>(null);

export const useMusicControl = () => {
  const context = useContext(MusicControlContext);
  if (!context) {
    throw new Error('useMusicControl must be used within a MusicControlContext.Provider');
  }
  return context;
};

export const MusicControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [shouldPlayMusic, setShouldPlayMusic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load music settings from IndexedDB on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMuted = await loadMusicSettings();
        setIsMuted(savedMuted);
      } catch (error) {
        console.error('Failed to load music settings:', error);
        // Fallback to localStorage for backward compatibility
        try {
          const saved = localStorage.getItem('tetrix-music-muted');
          setIsMuted(saved ? JSON.parse(saved) : false);
        } catch {
          setIsMuted(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // If unmuting, we should try to play music
    if (!newMutedState) {
      setShouldPlayMusic(true);
    }

    // Save to IndexedDB (primary storage)
    saveMusicSettings(newMutedState).catch((error: Error) => {
      console.error('Failed to save music settings to IndexedDB:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-music-muted', JSON.stringify(newMutedState));
      } catch (localError) {
        console.error('Failed to save music mute preference to localStorage:', localError);
      }
    });
  }, [isMuted]);

  const triggerAutoplay = useCallback(() => {
    setShouldPlayMusic(true);
  }, []);

  const value = {
    isMuted: isMuted || isLoading, // Treat as muted while loading
    toggleMute,
    shouldPlayMusic,
    triggerAutoplay
  };

  return (
    <MusicControlContext.Provider value={value}>
      {children}
    </MusicControlContext.Provider>
  );
};
