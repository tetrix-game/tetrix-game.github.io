import { useState, useMemo, useCallback, useEffect } from 'react';
import MenuDropdown from '../MenuDropdown';
import LocationButton from '../LocationButton';
import BackgroundMusic from '../BackgroundMusic';
import ScoreDisplay from '../ScoreDisplay';
import { MusicControlContext } from './MusicControlContext';
import { SoundEffectsControlContext } from './SoundEffectsControlContext';
import { useSoundEffects } from '../SoundEffectsContext';
import { loadMusicSettings, saveMusicSettings } from '../../utils/persistenceUtils';
import './Header.css';

const Header = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use the main sound effects context
  const { isMuted: isSoundEffectsMuted, setMuted: setSoundEffectsMuted } = useSoundEffects();

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

  const toggleSoundEffectsMute = useCallback(() => {
    // Toggle and let context handle persistence
    setSoundEffectsMuted(!isSoundEffectsMuted);
  }, [isSoundEffectsMuted, setSoundEffectsMuted]);

  const musicContextValue = useMemo(() => ({ isMuted, toggleMute }), [isMuted, toggleMute]);
  const soundEffectsContextValue = useMemo(() => ({
    isMuted: isSoundEffectsMuted,
    toggleMute: toggleSoundEffectsMute
  }), [isSoundEffectsMuted, toggleSoundEffectsMute]);

  return (
    <MusicControlContext.Provider value={musicContextValue}>
      <SoundEffectsControlContext.Provider value={soundEffectsContextValue}>
        <div className="header">
          <BackgroundMusic isMuted={isMuted || isLoading} />
          <MenuDropdown />
          <div className="header-center">
            <ScoreDisplay />
          </div>
          <LocationButton />
        </div>
      </SoundEffectsControlContext.Provider>
    </MusicControlContext.Provider>
  );
};

export default Header;