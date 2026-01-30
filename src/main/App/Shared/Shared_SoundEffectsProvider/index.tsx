import React, { useState, useEffect, useCallback, useRef } from 'react';

import { loadSoundEffectsSettings, saveSoundEffectsSettings } from '../persistence';

import { SOUND_VOLUME_MULTIPLIERS, BASE_SOUND_EFFECTS_VOLUME, registerPlaySound, unregisterPlaySound } from './constants/';
import { Shared_SoundEffectsContext } from './contexts/';
import type { SoundEffect, Shared_SoundEffectsContextValue } from './types/';

export const Shared_SoundEffectsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }): JSX.Element => {
  const [volume, setVolumeState] = useState(100);
  const [isEnabled, setIsEnabledState] = useState(true);
  const audioBuffersRef = useRef<Map<SoundEffect, AudioBuffer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasUserInteractedRef = useRef(false);

  // Initialize AudioContext and load sounds
  useEffect((): void => {
    const initAudio = async (): Promise<void> => {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
        } catch {
        }
      }
    };

    initAudio();
  }, []);

  // Initialize user interaction detection
  useEffect((): (() => void) => {
    const handleUserInteraction = (): void => {
      hasUserInteractedRef.current = true;

      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return (): void => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Handle page visibility changes (app backgrounded/foregrounded)
  useEffect((): (() => void) => {
    const handleVisibilityChange = (): void => {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      if (document.hidden) {
        // App is going to background - suspend audio context
        if (ctx.state === 'running') {
          ctx.suspend();
        }
      } else {
        // App is coming to foreground - resume if user has interacted
        if (hasUserInteractedRef.current && ctx.state === 'suspended') {
          ctx.resume();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return (): void => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load volume and enabled state from DB on mount
  useEffect((): void => {
    const loadSettings = async (): Promise<void> => {
      try {
        const settings = await loadSoundEffectsSettings();

        // Validate volume is a finite number, default to 100 if invalid
        const isValidVolume = Number.isFinite(settings.volume)
          && settings.volume >= 0
          && settings.volume <= 100;
        const validVolume = isValidVolume ? settings.volume : 100;

        setVolumeState(validVolume);
        setIsEnabledState(settings.isEnabled);
      } catch {
        setIsEnabledState(true);
        setVolumeState(100);
      }
    };

    loadSettings();
  }, []);

  const playHeartbeat = useCallback((startTime: number): void => {
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

  const playSound = useCallback((soundEffect: SoundEffect, scheduleTime?: number): void => {
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

      // Apply per-sound volume normalization
      const soundMultiplier = SOUND_VOLUME_MULTIPLIERS[soundEffect] ?? 1.0;
      const gainNode = ctx.createGain();
      const calculatedGain = (volume / 100) * BASE_SOUND_EFFECTS_VOLUME * soundMultiplier;
      // Ensure gain is a valid finite number between 0 and 1
      const finalGain = Number.isFinite(calculatedGain)
        ? Math.max(0, Math.min(1, calculatedGain))
        : 0;
      gainNode.gain.value = finalGain;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = performance.now();
      const delay = (scheduleTime ?? now) - now;
      const startTime = ctx.currentTime + Math.max(0, delay / 1000);

      source.start(startTime);
    }
  }, [isEnabled, volume, playHeartbeat]);

  // Register this playSound function at module level
  // so reducer and other non-React code can benefit from fast playback
  useEffect((): (() => void) => {
    registerPlaySound(playSound);
    return (): void => {
      unregisterPlaySound();
    };
  }, [playSound]);

  const setVolume = useCallback((newVolume: number): void => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    // Update React state immediately (synchronous)
    setVolumeState(clampedVolume);

    // Save to DB in background (async, non-blocking)
    saveSoundEffectsSettings(!isEnabled, clampedVolume, isEnabled).catch((_error): void => {
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-soundeffects-volume', JSON.stringify(clampedVolume));
      } catch {
      }
    });
  }, [isEnabled]);

  const setEnabled = useCallback((enabled: boolean): void => {
    // Update React state immediately (synchronous)
    setIsEnabledState(enabled);

    // Save to DB in background (async, non-blocking)
    saveSoundEffectsSettings(!enabled, volume, enabled).catch((_error): void => {
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-soundeffects-muted', JSON.stringify(!enabled));
      } catch {
      }
    });
  }, [volume]);

  const value: Shared_SoundEffectsContextValue = {
    playSound,
    setVolume,
    setEnabled,
    volume,
    isEnabled,
  };

  return (
    <Shared_SoundEffectsContext.Provider value={value}>
      {children}
    </Shared_SoundEffectsContext.Provider>
  );
};
