import { useState, useMemo, useCallback } from 'react';
import MenuDropdown from '../MenuDropdown';
import LocationButton from '../LocationButton';
import BackgroundMusic from '../BackgroundMusic';
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
        </div>
        <div className="tetrix_header_middle">
          <h1>TETRIX</h1>
        </div>
        <div className="tetrix_header_end">
          <LocationButton />
        </div>
      </div>
    </MusicControlContext.Provider>
  );
};

export default Header;