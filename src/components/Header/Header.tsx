import { useState, useMemo, useCallback } from 'react';
import MenuDropdown from '../MenuDropdown';
import LocationButton from '../LocationButton';
import BackgroundMusic from '../BackgroundMusic';
import ScoreDisplay from '../ScoreDisplay';
import GameControls from '../GameControls';
import { MusicControlContext } from './MusicControlContext';
import './Header.css';

const Header = () => {
  const [isMuted, setIsMuted] = useState(() => {
    // Load mute preference from localStorage on initialization
    try {
      const saved = localStorage.getItem('tetrix-music-muted');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    // Save mute preference to localStorage
    try {
      localStorage.setItem('tetrix-music-muted', JSON.stringify(newMutedState));
    } catch (error) {
      console.error('Failed to save music mute preference:', error);
    }
  }, [isMuted]);

  const contextValue = useMemo(() => ({ isMuted, toggleMute }), [isMuted, toggleMute]);

  return (
    <MusicControlContext.Provider value={contextValue}>
      <div className="tetrix_header">
        <BackgroundMusic isMuted={isMuted} />
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