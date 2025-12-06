import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

interface SoundEffectsState {
  playSound: (soundEffect: SoundEffect, startTime?: number) => void;
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
  volume: number;
  isEnabled: boolean;
}

interface SoundEffectsStore {
  getState: () => SoundEffectsState;
  subscribe: (listener: () => void) => () => void;
}

const SoundEffectsContext = createContext<SoundEffectsStore | undefined>(undefined);

export const SoundEffectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioBuffersRef = useRef<Map<SoundEffect, AudioBuffer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasUserInteractedRef = useRef(false);
  
  // State ref to hold the current state
  const stateRef = useRef<SoundEffectsState>({
    volume: 100,
    isEnabled: true,
    playSound: () => {},
    setVolume: () => {},
    setEnabled: () => {}
  });
  
  const listenersRef = useRef(new Set<() => void>());

  const notifyListeners = useCallback(() => {
    listenersRef.current.forEach(listener => listener());
  }, []);

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

  // Handle page visibility changes (app backgrounded/foregrounded)
  useEffect(() => {
    const handleVisibilityChange = () => {
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

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  const playSoundImpl = useCallback((soundEffect: SoundEffect, scheduleTime?: number) => {
    // Don't play if user hasn't interacted yet
    if (!hasUserInteractedRef.current) {
      return;
    }

    const { isEnabled, volume } = stateRef.current;

    // Don't play if disabled or volume is 0
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
    } else {
      console.warn(`Sound effect '${soundEffect}' not found or context not ready`);
    }
  }, [playHeartbeat]);

  const setVolumeImpl = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    
    // Update state
    stateRef.current = { ...stateRef.current, volume: clampedVolume };
    notifyListeners();

    // Save to DB in background (async, non-blocking)
    const { isEnabled } = stateRef.current;
    saveSoundEffectsSettings(!isEnabled, clampedVolume, isEnabled).catch(error => {
      console.error('Failed to save sound effects volume:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-soundeffects-volume', JSON.stringify(clampedVolume));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    });
  }, [notifyListeners]);

  const setEnabledImpl = useCallback((enabled: boolean) => {
    // Update state
    stateRef.current = { ...stateRef.current, isEnabled: enabled };
    notifyListeners();

    // Save to DB in background (async, non-blocking)
    const { volume } = stateRef.current;
    saveSoundEffectsSettings(!enabled, volume, enabled).catch(error => {
      console.error('Failed to save sound effects enabled state:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-soundeffects-muted', JSON.stringify(!enabled));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    });
  }, [notifyListeners]);

  // Initialize state methods
  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      playSound: playSoundImpl,
      setVolume: setVolumeImpl,
      setEnabled: setEnabledImpl
    };
    notifyListeners();
  }, [playSoundImpl, setVolumeImpl, setEnabledImpl, notifyListeners]);

  // Load volume and enabled state from DB on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await loadSoundEffectsSettings();
        stateRef.current = {
          ...stateRef.current,
          volume: settings.volume,
          isEnabled: settings.isEnabled
        };
        notifyListeners();
      } catch (error) {
        console.error('Unexpected error loading sound effects settings:', error);
        stateRef.current = {
          ...stateRef.current,
          volume: 100,
          isEnabled: true
        };
        notifyListeners();
      }
    };

    loadSettings();
  }, [notifyListeners]);

  // Register this playSound function at module level
  useEffect(() => {
    modulePlaySound = playSoundImpl;
    return () => {
      modulePlaySound = null;
    };
  }, [playSoundImpl]);

  const store = useMemo(() => ({
    getState: () => stateRef.current,
    subscribe: (listener: () => void) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    }
  }), []);

  return (
    <SoundEffectsContext.Provider value={store}>
      {children}
    </SoundEffectsContext.Provider>
  );
};

export function useSoundEffects<Selected>(selector: (state: SoundEffectsState) => Selected): Selected {
  const store = useContext(SoundEffectsContext);
  if (!store) {
    throw new Error('useSoundEffects must be used within a SoundEffectsProvider');
  }
  
  if (typeof selector !== 'function') {
      throw new Error('useSoundEffects must be called with a selector function.');
  }

  const { subscribe, getState } = store;
  const [selectedSlice, setSelectedSlice] = useState(() => selector(getState()));

  useEffect(() => {
    const checkForUpdates = () => {
      const globalState = getState();
      const newSlice = selector(globalState);

      if (newSlice !== selectedSlice) {
        setSelectedSlice(newSlice);
      }
    };

    const unsubscribe = subscribe(checkForUpdates);
    // Check immediately
    checkForUpdates();
    
    return unsubscribe;
  }, [selector, getState, selectedSlice, subscribe]);

  return selectedSlice;
}

