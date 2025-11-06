import { useState, useMemo, useCallback } from 'react';
import MenuDropdown from '../MenuDropdown';
import LocationButton from '../LocationButton';
import BackgroundMusic from '../BackgroundMusic';
import ScoreDisplay from '../ScoreDisplay';
import GameControls from '../GameControls';
import { MusicControlContext } from './MusicControlContext';
import './Header.css';

const Header = () => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
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