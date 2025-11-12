import { useState, useMemo, useCallback, useEffect } from 'react';
import MenuDropdown from '../MenuDropdown';
import LocationButton from '../LocationButton';
import BackgroundMusic from '../BackgroundMusic';
import ScoreDisplay from '../ScoreDisplay';
import ModifiersOverlay from '../ModifiersOverlay';
import { MusicControlContext } from './MusicControlContext';
import { SoundEffectsControlContext } from './SoundEffectsControlContext';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import { loadMusicSettings, saveMusicSettings, loadSoundEffectsSettings, saveSoundEffectsSettings } from '../../utils/persistenceUtils';
import './Header.css';

const Header = () => {
  const { currentLevel } = useTetrixStateContext();
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSoundEffectsMuted, setIsSoundEffectsMuted] = useState(false);
  const [isModifiersOpen, setIsModifiersOpen] = useState(false);

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

  // Load sound effects settings from IndexedDB on mount
  useEffect(() => {
    const loadSFXSettings = async () => {
      try {
        const savedMuted = await loadSoundEffectsSettings();
        setIsSoundEffectsMuted(savedMuted);
      } catch (error) {
        console.error('Failed to load sound effects settings:', error);
        // Fallback to localStorage for backward compatibility
        try {
          const saved = localStorage.getItem('tetrix-soundeffects-muted');
          setIsSoundEffectsMuted(saved ? JSON.parse(saved) : false);
        } catch {
          setIsSoundEffectsMuted(false);
        }
      }
    };

    loadSFXSettings();
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
    const newMutedState = !isSoundEffectsMuted;
    setIsSoundEffectsMuted(newMutedState);

    // Save to IndexedDB (primary storage)
    saveSoundEffectsSettings(newMutedState).catch((error: Error) => {
      console.error('Failed to save sound effects settings to IndexedDB:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('tetrix-soundeffects-muted', JSON.stringify(newMutedState));
      } catch (localError) {
        console.error('Failed to save sound effects mute preference to localStorage:', localError);
      }
    });
  }, [isSoundEffectsMuted]);

  const handleModifiersClick = useCallback(() => {
    setIsModifiersOpen(true);
  }, []);

  const handleModifiersClose = useCallback(() => {
    setIsModifiersOpen(false);
  }, []);

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
          <ScoreDisplay />
          <LocationButton />
          <button
            className="header-title-button"
            onClick={handleModifiersClick}
            aria-label="Open game modifiers"
            type="button"
          >
            TETRIX{currentLevel !== 0 && ` (${currentLevel})`}
          </button>
        </div>
        <ModifiersOverlay
          isOpen={isModifiersOpen}
          onClose={handleModifiersClose}
        />
      </SoundEffectsControlContext.Provider>
    </MusicControlContext.Provider>
  );
};

export default Header;