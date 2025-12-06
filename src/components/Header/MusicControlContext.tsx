import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { loadMusicSettings, saveMusicSettings } from '../../utils/persistenceUtils';

export interface MusicControlState {
  volume: number;
  isEnabled: boolean;
  shouldPlayMusic: boolean;
  isLoading: boolean;
  setVolume: (volume: number) => void;
  toggleEnabled: () => void;
  triggerAutoplay: () => void;
}

interface MusicControlStore {
  getState: () => MusicControlState;
  subscribe: (listener: () => void) => () => void;
}

export const MusicControlContext = createContext<MusicControlStore | null>(null);

export const MusicControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stateRef = useRef<MusicControlState>({
    volume: 100,
    isEnabled: true,
    shouldPlayMusic: false,
    isLoading: true,
    setVolume: () => {},
    toggleEnabled: () => {},
    triggerAutoplay: () => {}
  });
  
  const listenersRef = useRef(new Set<() => void>());

  const notifyListeners = useCallback(() => {
    listenersRef.current.forEach(listener => listener());
  }, []);

  // Load music settings from IndexedDB on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await loadMusicSettings();
        stateRef.current = {
          ...stateRef.current,
          volume: settings.volume,
          isEnabled: settings.isEnabled,
          isLoading: false
        };
        notifyListeners();
      } catch (error) {
        console.error('Unexpected error loading music settings:', error);
        stateRef.current = {
          ...stateRef.current,
          volume: 100,
          isEnabled: true,
          isLoading: false
        };
        notifyListeners();
      }
    };

    loadSettings();
  }, [notifyListeners]);

  const setVolumeImpl = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    
    stateRef.current = { ...stateRef.current, volume: clampedVolume };
    notifyListeners();

    const { isEnabled } = stateRef.current;
    // Save to IndexedDB (primary storage)
    saveMusicSettings(!isEnabled, clampedVolume, isEnabled).catch((error: Error) => {
      console.error('Failed to save music volume to IndexedDB:', error);
    });
  }, [notifyListeners]);

  const toggleEnabledImpl = useCallback(() => {
    const { isEnabled, volume } = stateRef.current;
    const newEnabledState = !isEnabled;
    
    let updates: Partial<MusicControlState> = { isEnabled: newEnabledState };

    // If enabling, we should try to play music
    if (newEnabledState) {
      updates.shouldPlayMusic = true;
    }

    stateRef.current = { ...stateRef.current, ...updates };
    notifyListeners();

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
  }, [notifyListeners]);

  const triggerAutoplayImpl = useCallback(() => {
    stateRef.current = { ...stateRef.current, shouldPlayMusic: true };
    notifyListeners();
  }, [notifyListeners]);

  // Initialize methods
  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      setVolume: setVolumeImpl,
      toggleEnabled: toggleEnabledImpl,
      triggerAutoplay: triggerAutoplayImpl
    };
    notifyListeners();
  }, [setVolumeImpl, toggleEnabledImpl, triggerAutoplayImpl, notifyListeners]);

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
    <MusicControlContext.Provider value={store}>
      {children}
    </MusicControlContext.Provider>
  );
};

export function useMusicControl<Selected>(selector?: (state: MusicControlState) => Selected): Selected {
  const store = useContext(MusicControlContext);
  if (!store) {
    throw new Error('useMusicControl must be used within a MusicControlContext.Provider');
  }
  
  // If no selector is provided, we default to returning the whole state for backward compatibility
  // BUT the user asked to throw error if no selector.
  // "If calls to the pseudo context consumption hooks DON'T pass a selector function, the selector function should throw an error"
  
  if (typeof selector !== 'function') {
      throw new Error('useMusicControl must be called with a selector function.');
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
    checkForUpdates();
    return unsubscribe;
  }, [selector, getState, selectedSlice, subscribe]);

  return selectedSlice;
}

