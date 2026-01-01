import { useMemo, useCallback } from 'react';
import SettingsOverlay from '../SettingsOverlay';
import BackgroundMusic from '../BackgroundMusic';
import ScoreDisplay from '../ScoreDisplay';
import AudioUnlockIndicator from '../AudioUnlockIndicator';
import { useMusicControl } from './MusicControlContext';
import { SoundEffectsControlContext } from './SoundEffectsControlContext';
import { useSoundEffects } from '../SoundEffectsContext';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useGameNavigation } from '../../hooks/useGameNavigation';
import './Header.css';

const Header: React.FC = () => {
  // Use the main sound effects context
  const { volume, setVolume, isEnabled, setEnabled } = useSoundEffects();
  // Get music control for the audio unlock indicator
  const { isWaitingForInteraction } = useMusicControl();

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
        {/* Show audio unlock indicator when browser policy blocks autoplay */}
        {isWaitingForInteraction && (gameMode === 'infinite' || gameMode === 'daily') && (
          <div className="audio-unlock-toast">
            <AudioUnlockIndicator />
          </div>
        )}
        {(gameMode === 'infinite' || gameMode === 'daily') ? (
          <button
            className="back-button"
            onClick={navigateToHub}
            title="Back to Main Menu"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div />
        )}
        <div className="header-center">
          <ScoreDisplay />
        </div>
        <SettingsOverlay />
      </div>
    </SoundEffectsControlContext.Provider>
  );
};

export default Header;