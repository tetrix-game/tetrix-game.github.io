import React, { useState, useEffect, useCallback, useRef } from 'react';

import { loadMusicSettings, saveMusicSettings } from '../Shared_persistence';

import { Shared_MusicControlContext } from './Shared_MusicControlContext/';

export const Shared_MusicControlProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }): JSX.Element => {
  const [volume, setVolumeState] = useState(100);
  const [isEnabled, setIsEnabled] = useState(true);
  const [shouldPlayMusic, setShouldPlayMusic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const hasUserInteractedRef = useRef(false);

  // Detect user interaction to unlock audio
  useEffect((): (() => void) => {
    const handleUserInteraction = (): void => {
      if (!hasUserInteractedRef.current) {
        hasUserInteractedRef.current = true;
        setIsAudioUnlocked(true);
      }
    };

    // Listen for any user interaction
    const events = ['click', 'touchstart', 'keydown', 'pointerdown'];
    events.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, { once: true, passive: true });
    });

    return (): void => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);

  // Load music settings from IndexedDB on mount
  useEffect((): void => {
    const loadSettings = async (): Promise<void> => {
      try {
        const settings = await loadMusicSettings();

        // Validate volume is a finite number, default to 100 if invalid
        const isValidVolume = Number.isFinite(settings.volume)
          && settings.volume >= 0
          && settings.volume <= 100;
        const validVolume = isValidVolume ? settings.volume : 100;

        setVolumeState(validVolume);
        setIsEnabled(settings.isEnabled);
      } catch {
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
    saveMusicSettings(!isEnabled, clampedVolume, isEnabled).catch((_error: Error) => {
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
    saveMusicSettings(!newEnabledState, volume, newEnabledState).catch((_error: Error) => {
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-music-muted', JSON.stringify(!newEnabledState));
      } catch {
        // Ignore localStorage errors (might be disabled or full)
      }
    });
  }, [isEnabled, volume]);

  const triggerAutoplay = useCallback(() => {
    setShouldPlayMusic(true);
  }, []);

  // Audio is "waiting" if music should play, is enabled, has volume, but audio isn't unlocked yet
  const isWaitingForInteraction = shouldPlayMusic && isEnabled && volume > 0 && !isAudioUnlocked;

  const value = {
    volume: isLoading ? 100 : volume,
    setVolume,
    isEnabled: !isLoading && isEnabled,
    toggleEnabled,
    shouldPlayMusic,
    triggerAutoplay,
    isAudioUnlocked,
    isWaitingForInteraction,
  };

  return (
    <Shared_MusicControlContext.Provider value={value}>
      {children}
    </Shared_MusicControlContext.Provider>
  );
};
