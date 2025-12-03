import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadMusicSettings, saveMusicSettings } from '../../utils/persistenceUtils';

export interface MusicControlContextType {
  volume: number;
  setVolume: (volume: number) => void;
  isEnabled: boolean;
  toggleEnabled: () => void;
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
  const [volume, setVolumeState] = useState(100);
  const [isEnabled, setIsEnabled] = useState(true);
  const [shouldPlayMusic, setShouldPlayMusic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load music settings from IndexedDB on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsResult = await loadMusicSettings();
        
        if (settingsResult.status === 'success') {
          setVolumeState(settingsResult.data.volume);
          setIsEnabled(settingsResult.data.isEnabled);
        } else {
          // Not found or error - try fallback
          if (settingsResult.status === 'error') {
            console.error('Failed to load music settings:', settingsResult.error);
          }
          
          // Fallback to localStorage for backward compatibility
          try {
            const saved = localStorage.getItem('tetrix-music-muted');
            const wasMuted = saved ? JSON.parse(saved) : false;
            setIsEnabled(!wasMuted);
            setVolumeState(100);
          } catch {
            setIsEnabled(true);
            setVolumeState(100);
          }
        }
      } catch (error) {
        console.error('Unexpected error loading music settings:', error);
        setIsEnabled(true);
        setVolumeState(100);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);

    // Save to IndexedDB (primary storage)
    saveMusicSettings(!isEnabled, clampedVolume, isEnabled).catch((error: Error) => {
      console.error('Failed to save music volume to IndexedDB:', error);
    });
  }, [isEnabled]);

  const toggleEnabled = useCallback(() => {
    const newEnabledState = !isEnabled;
    setIsEnabled(newEnabledState);

    // If enabling, we should try to play music
    if (newEnabledState) {
      setShouldPlayMusic(true);
    }

    // Save to IndexedDB (primary storage)
    saveMusicSettings(!newEnabledState, volume, newEnabledState).catch((error: Error) => {
      console.error('Failed to save music enabled state to IndexedDB:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-music-muted', JSON.stringify(!newEnabledState));
      } catch (localError) {
        console.error('Failed to save music mute preference to localStorage:', localError);
      }
    });
  }, [isEnabled, volume]);

  const triggerAutoplay = useCallback(() => {
    setShouldPlayMusic(true);
  }, []);

  const value = {
    volume: isLoading ? 100 : volume,
    setVolume,
    isEnabled: !isLoading && isEnabled,
    toggleEnabled,
    shouldPlayMusic,
    triggerAutoplay
  };

  return (
    <MusicControlContext.Provider value={value}>
      {children}
    </MusicControlContext.Provider>
  );
};
