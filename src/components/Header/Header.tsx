import { useMemo, useCallback } from 'react';
import MenuDropdown from '../MenuDropdown';
import LocationButton from '../LocationButton';
import BackgroundMusic from '../BackgroundMusic';
import ScoreDisplay from '../ScoreDisplay';
import { useMusicControl } from './MusicControlContext';
import { SoundEffectsControlContext } from './SoundEffectsControlContext';
import { useSoundEffects } from '../SoundEffectsContext';
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
        <MenuDropdown onShowTutorial={onShowTutorial} />
        <div className="header-center">
          <ScoreDisplay />
        </div>
        <LocationButton />
      </div>
    </SoundEffectsControlContext.Provider>
  );
};

export default Header;