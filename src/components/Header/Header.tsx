import { useState, useMemo, useCallback, useEffect } from 'react';
import MenuDropdown from '../MenuDropdown';
import LocationButton from '../LocationButton';
import BackgroundMusic from '../BackgroundMusic';
import ScoreDisplay from '../ScoreDisplay';
import GameControls from '../GameControls';
import { MusicControlContext } from './MusicControlContext';
import { loadMusicSettings, saveMusicSettings } from '../../utils/persistenceUtils';
import './Header.css';

const Header = () => {
  const [isMuted, setIsMuted] = useState(false);
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

  const contextValue = useMemo(() => ({ isMuted, toggleMute }), [isMuted, toggleMute]);

  return (
    <MusicControlContext.Provider value={contextValue}>
      <div className="tetrix_header">
        <BackgroundMusic isMuted={isMuted || isLoading} />
        <div className="tetrix_header_start">
          <MenuDropdown />
          <GameControls />
        </div>
        <div className="tetrix_header_middle">
          <h1>TETRIX</h1>
        </div>
        <div className="tetrix_header_end">
          <ScoreDisplay />
          <LocationButton />
        </div>
      </div>
    </MusicControlContext.Provider>
  );
};

export default Header;