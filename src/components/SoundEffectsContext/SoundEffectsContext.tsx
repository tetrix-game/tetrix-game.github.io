import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadSoundEffectsSettings, saveSoundEffectsSettings } from '../../utils/persistenceUtils';

export type SoundEffect =
  | 'click_into_place'
  | 'game_over'
  | 'pickup_shape'
  | 'clear_combo_1'
  | 'clear_combo_2'
  | 'clear_combo_3'
  | 'clear_combo_4'
  | 'clear_combo_5';

// Module-level state for non-React code (like reducers) to use
let modulePlaySound: ((soundEffect: SoundEffect, startTime?: number) => void) | null = null;

// Export function that non-React code can import and use
export function playSound(soundEffect: SoundEffect, startTime?: number): void {
  if (modulePlaySound) {
    modulePlaySound(soundEffect, startTime);
  } else {
    console.warn('SoundEffectsProvider not initialized yet');
  }
}

interface SoundEffectsContextValue {
  playSound: (soundEffect: SoundEffect, startTime?: number) => void;
  setMuted: (muted: boolean) => void;
  isMuted: boolean;
}

const SoundEffectsContext = createContext<SoundEffectsContextValue | undefined>(undefined);

export const SoundEffectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMutedState] = useState(false);
  const audioElementsRef = useRef<Map<SoundEffect, HTMLAudioElement>>(new Map());
  const hasUserInteractedRef = useRef(false);

  // Initialize user interaction detection
  useEffect(() => {
    const handleUserInteraction = () => {
      hasUserInteractedRef.current = true;
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Preload audio files
  useEffect(() => {
    const soundFiles: Record<SoundEffect, string> = {
      click_into_place: '/sound/soundEffects/click_into_place.mp3',
      game_over: '/sound/soundEffects/game_over.mp3',
      pickup_shape: '/sound/soundEffects/pickup_shape.mp3',
      clear_combo_1: '/sound/soundEffects/clear-combo-1.mp3',
      clear_combo_2: '/sound/soundEffects/clear-combo-2.mp3',
      clear_combo_3: '/sound/soundEffects/clear-combo-3.mp3',
      clear_combo_4: '/sound/soundEffects/clear-combo-4.mp3',
      clear_combo_5: '/sound/soundEffects/clear-combo-5.mp3',
    };

    for (const [soundName, filePath] of Object.entries(soundFiles)) {
      const audio = new Audio(filePath);
      audio.preload = 'auto';
      audio.volume = 0.2; // Quieter volume for sound effects
      audioElementsRef.current.set(soundName as SoundEffect, audio);
    }
  }, []);

  // Load mute state from DB on mount
  useEffect(() => {
    const loadMuteState = async () => {
      try {
        const muted = await loadSoundEffectsSettings();
        setIsMutedState(muted);
      } catch {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem('tetrix-soundeffects-muted');
          setIsMutedState(saved ? JSON.parse(saved) : false);
        } catch {
          setIsMutedState(false);
        }
      }
    };

    loadMuteState();
  }, []);

  const playSound = useCallback((soundEffect: SoundEffect, scheduleTime?: number) => {
    // Don't play if user hasn't interacted yet
    if (!hasUserInteractedRef.current) {
      return;
    }

    // Don't play if muted (synchronous state check - no async!)
    if (isMuted) {
      return;
    }

    const play = () => {
      const audio = audioElementsRef.current.get(soundEffect);
      if (audio) {
        // Always start from beginning
        audio.currentTime = 0;

        audio.play().catch(error => {
          console.log(`Sound effect '${soundEffect}' play was prevented:`, error);
        });
      } else {
        console.warn(`Sound effect '${soundEffect}' not found`);
      }
    };

    if (scheduleTime !== undefined) {
      const now = performance.now();
      const delay = scheduleTime - now;
      if (delay > 0) {
        setTimeout(play, delay);
      } else {
        play();
      }
    } else {
      play();
    }
  }, [isMuted]);

  // Register this playSound function at module level
  // so reducer and other non-React code can benefit from fast playback
  useEffect(() => {
    modulePlaySound = playSound;
    return () => {
      modulePlaySound = null;
    };
  }, [playSound]);

  const setMuted = useCallback((muted: boolean) => {
    // Update React state immediately (synchronous)
    setIsMutedState(muted);

    // Save to DB in background (async, non-blocking)
    saveSoundEffectsSettings(muted).catch(error => {
      console.error('Failed to save sound effects mute state:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-soundeffects-muted', JSON.stringify(muted));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    });
  }, []);

  const value: SoundEffectsContextValue = {
    playSound,
    setMuted,
    isMuted,
  };

  return (
    <SoundEffectsContext.Provider value={value}>
      {children}
    </SoundEffectsContext.Provider>
  );
};

export const useSoundEffects = (): SoundEffectsContextValue => {
  const context = useContext(SoundEffectsContext);
  if (!context) {
    throw new Error('useSoundEffects must be used within a SoundEffectsProvider');
  }
  return context;
};
