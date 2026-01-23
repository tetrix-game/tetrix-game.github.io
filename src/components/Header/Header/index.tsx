import { useMemo, useCallback } from 'react';

import { AudioUnlockIndicator } from '../../AudioUnlockIndicator/AudioUnlockIndicator';
import { BackgroundMusic } from '../../BackgroundMusic/BackgroundMusic';
import { ScoreDisplay } from '../../ScoreDisplay/ScoreDisplay';
import { SettingsOverlay } from '../../SettingsOverlay/SettingsOverlay';
import { useSoundEffects } from '../../SoundEffectsContext/SoundEffectsContext';
import { useTetrixStateContext } from '../../Tetrix/TetrixContext';
import { useMusicControl } from '../MusicControlContext';
import { SoundEffectsControlContext } from '../SoundEffectsControlContext';
import './Header.css';

const Header: React.FC = () => {
  // Use the main sound effects context
  const { volume, setVolume, isEnabled, setEnabled } = useSoundEffects();
  // Get music control for the audio unlock indicator
  const { isWaitingForInteraction } = useMusicControl();

  const { gameMode } = useTetrixStateContext();

  const toggleSoundEffectsEnabled = useCallback(() => {
    // Toggle and let context handle persistence
    setEnabled(!isEnabled);
  }, [isEnabled, setEnabled]);

  const soundEffectsContextValue = useMemo(() => ({
    volume,
    setVolume,
    isEnabled,
    toggleEnabled: toggleSoundEffectsEnabled,
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
        <div />
        <div className="header-center">
          <ScoreDisplay />
        </div>
        <SettingsOverlay />
      </div>
    </SoundEffectsControlContext.Provider>
  );
};

export { Header };
