import { useMemo, useCallback } from 'react';
import SettingsOverlay from '../SettingsOverlay';
import BackgroundMusic from '../BackgroundMusic';
import ScoreDisplay from '../ScoreDisplay';
import { useMusicControl } from './MusicControlContext';
import { SoundEffectsControlContext } from './SoundEffectsControlContext';
import { useSoundEffects } from '../SoundEffectsContext';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useGameNavigation } from '../../hooks/useGameNavigation';
import './Header.css';

interface HeaderProps {
  onShowTutorial: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowTutorial }) => {
  // Use the main sound effects context
  const { volume, setVolume, isEnabled, setEnabled } = useSoundEffects();
  // We don't need music control here anymore as BackgroundMusic handles it internally via context
  // But we need to call useMusicControl to ensure we are inside the provider (though we are)
  useMusicControl();
  
  const { gameMode } = useTetrixStateContext();
  const { navigateToHub } = useGameNavigation();

  const toggleSoundEffectsEnabled = useCallback(() => {
    // Toggle and let context handle persistence
    setEnabled(!isEnabled);
  }, [isEnabled, setEnabled]);

  const soundEffectsContextValue = useMemo(() => ({
    volume,
    setVolume,
    isEnabled,
    toggleEnabled: toggleSoundEffectsEnabled
  }), [volume, setVolume, isEnabled, toggleSoundEffectsEnabled]);
  
  return (
    <SoundEffectsControlContext.Provider value={soundEffectsContextValue}>
      <div className="header">
        <BackgroundMusic />
        {(gameMode === 'infinite' || gameMode === 'daily') ? (
          <button 
            className="back-button" 
            onClick={navigateToHub}
            title="Back to Main Menu"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        ) : (
          <div />
        )}
        <div className="header-center">
          <ScoreDisplay />
        </div>
        <SettingsOverlay onShowTutorial={onShowTutorial} />
      </div>
    </SoundEffectsControlContext.Provider>
  );
};

export default Header;