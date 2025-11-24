import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadSoundEffectsSettings, saveSoundEffectsSettings } from '../../utils/persistenceUtils';

export type SoundEffect =
  | 'click_into_place'
  | 'game_over'
  | 'pickup_shape'
  | 'invalid_placement'
  | 'clear_combo_1'
  | 'clear_combo_2'
  | 'clear_combo_3'
  | 'clear_combo_4'
  | 'heartbeat';

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
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
  volume: number;
  isEnabled: boolean;
}

const SoundEffectsContext = createContext<SoundEffectsContextValue | undefined>(undefined);

export const SoundEffectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [volume, setVolumeState] = useState(100);
  const [isEnabled, setIsEnabledState] = useState(true);
  const audioBuffersRef = useRef<Map<SoundEffect, AudioBuffer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasUserInteractedRef = useRef(false);

  // Initialize AudioContext and load sounds
  useEffect(() => {
    const initAudio = async () => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Only include file-based sound effects here
      const soundFiles: Partial<Record<SoundEffect, string>> = {
        click_into_place: '/sound/soundEffects/click_into_place.mp3',
        game_over: '/sound/soundEffects/game_over.mp3',
        pickup_shape: '/sound/soundEffects/pickup_shape.mp3',
        invalid_placement: '/sound/soundEffects/Invalid_Placement.mp3',
        clear_combo_1: '/sound/soundEffects/clear-combo-1.mp3',
        clear_combo_2: '/sound/soundEffects/clear-combo-2.mp3',
        clear_combo_3: '/sound/soundEffects/clear-combo-3.mp3',
        clear_combo_4: '/sound/soundEffects/clear-combo-4.mp3',
      };

      for (const [soundName, filePath] of Object.entries(soundFiles)) {
        try {
          const response = await fetch(filePath);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          audioBuffersRef.current.set(soundName as SoundEffect, audioBuffer);
          console.log(`Loaded sound: ${soundName}`);
        } catch (error) {
          console.error(`Failed to load sound ${soundName}:`, error);
        }
      }
    };

    initAudio();
  }, []);

  // Initialize user interaction detection
  useEffect(() => {
    const handleUserInteraction = () => {
      hasUserInteractedRef.current = true;

      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

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

  // Load volume and enabled state from DB on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await loadSoundEffectsSettings();
        setVolumeState(settings.volume);
        setIsEnabledState(settings.isEnabled);
      } catch {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem('tetrix-soundeffects-muted');
          const wasMuted = saved ? JSON.parse(saved) : false;
          setIsEnabledState(!wasMuted);
          setVolumeState(100);
        } catch {
          setIsEnabledState(true);
          setVolumeState(100);
        }
      }
    };

    loadSettings();
  }, []);

  const playHeartbeat = useCallback((startTime: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Create "Lub" (first beat)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(60, startTime);
    osc1.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);

    gain1.gain.setValueAtTime(0, startTime);
    gain1.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    osc1.start(startTime);
    osc1.stop(startTime + 0.25);

    // Create "Dub" (second beat)
    const t2 = startTime + 0.25;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(60, t2);
    osc2.frequency.exponentialRampToValueAtTime(40, t2 + 0.1);

    gain2.gain.setValueAtTime(0, t2);
    gain2.gain.linearRampToValueAtTime(0.25, t2 + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.2);

    osc2.start(t2);
    osc2.stop(t2 + 0.25);
  }, []);

  const playSound = useCallback((soundEffect: SoundEffect, scheduleTime?: number) => {
    // Don't play if user hasn't interacted yet
    if (!hasUserInteractedRef.current) {
      return;
    }

    // Don't play if disabled or volume is 0 (synchronous state check - no async!)
    if (!isEnabled || volume === 0) {
      return;
    }

    // Handle synthesized sounds
    if (soundEffect === 'heartbeat') {
      const ctx = audioContextRef.current;
      if (ctx) {
        const now = performance.now();
        const delay = (scheduleTime ?? now) - now;
        const ctxStartTime = ctx.currentTime + Math.max(0, delay / 1000);
        playHeartbeat(ctxStartTime);
      }
      return;
    }

    const ctx = audioContextRef.current;
    const buffer = audioBuffersRef.current.get(soundEffect);

    if (ctx && buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = (volume / 100) * 0.2; // Scale to 0-0.2 range

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = performance.now();
      const delay = (scheduleTime ?? now) - now;
      const startTime = ctx.currentTime + Math.max(0, delay / 1000);

      source.start(startTime);
      console.log(`Playing sound: ${soundEffect} at ${startTime}`);
    } else {
      console.warn(`Sound effect '${soundEffect}' not found or context not ready`);
    }
  }, [isEnabled, volume, playHeartbeat]);

  // Register this playSound function at module level
  // so reducer and other non-React code can benefit from fast playback
  useEffect(() => {
    modulePlaySound = playSound;
    return () => {
      modulePlaySound = null;
    };
  }, [playSound]);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    // Update React state immediately (synchronous)
    setVolumeState(clampedVolume);

    // Save to DB in background (async, non-blocking)
    saveSoundEffectsSettings(!isEnabled, clampedVolume, isEnabled).catch(error => {
      console.error('Failed to save sound effects volume:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-soundeffects-volume', JSON.stringify(clampedVolume));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    });
  }, [isEnabled]);

  const setEnabled = useCallback((enabled: boolean) => {
    // Update React state immediately (synchronous)
    setIsEnabledState(enabled);

    // Save to DB in background (async, non-blocking)
    saveSoundEffectsSettings(!enabled, volume, enabled).catch(error => {
      console.error('Failed to save sound effects enabled state:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-soundeffects-muted', JSON.stringify(!enabled));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    });
  }, [volume]);

  const value: SoundEffectsContextValue = {
    playSound,
    setVolume,
    setEnabled,
    volume,
    isEnabled,
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
