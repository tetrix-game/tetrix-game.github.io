import { useMemo, useCallback } from 'react';

import { Shared_useMusicControl, Shared_useSoundEffects, Shared_useTetrixStateContext } from '../../Shared';
import { AudioUnlockIndicator } from '../AudioUnlockIndicator';
import { BackgroundMusic } from '../BackgroundMusic';
import { ScoreDisplay } from '../ScoreDisplay';
import { SettingsOverlay } from '../SettingsOverlay';

import { SoundEffectsControlContext } from './SoundEffectsControlContext';
import './Header.css';

const Header: React.FC = () => {
  // Use the main sound effects context
  const { volume, setVolume, isEnabled, setEnabled } = Shared_useSoundEffects();
  // Get music control for the audio unlock indicator
  const { isWaitingForInteraction } = Shared_useMusicControl();

  const { gameMode } = Shared_useTetrixStateContext();

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
