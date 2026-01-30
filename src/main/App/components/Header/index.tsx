import { useMemo, useCallback } from 'react';

import { Shared_SoundEffectsControlContext } from '../../Shared/Shared_SoundEffectsControlContext';
import { Shared_useSoundEffects } from '../../Shared/Shared_SoundEffectsProvider/Shared_useSoundEffects';
import { Shared_useTetrixStateContext } from '../../Shared/Shared_TetrixProvider/Shared_useTetrixStateContext';
import { Shared_useMusicControl } from '../../Shared/Shared_useMusicControl';
import { AudioUnlockIndicator } from '../AudioUnlockIndicator';
import { BackgroundMusic } from '../BackgroundMusic';
import { ScoreDisplay } from '../ScoreDisplay';
import { SettingsOverlay } from '../SettingsOverlay';
import './Header.css';

export const Header: React.FC = () => {
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
    <Shared_SoundEffectsControlContext.Provider value={soundEffectsContextValue}>
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
    </Shared_SoundEffectsControlContext.Provider>
  );
};
