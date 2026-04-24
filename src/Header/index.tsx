import { Person as PersonIcon, Leaderboard as LeaderboardIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AudioUnlockIndicator } from '../AudioUnlockIndicator';
import { useAuth } from '../AuthProvider/AuthContext';
import { BackgroundMusic } from '../BackgroundMusic';
import { BoardClearDisplay } from '../BoardClearDisplay';
import { LeaderboardOverlay } from '../LeaderboardOverlay';
import { LoginOverlay } from '../LoginOverlay';
import { ScoreDisplay } from '../ScoreDisplay';
import { SettingsOverlay } from '../SettingsOverlay';
import { SoundEffectsControlContext } from '../SoundEffectsControlContext';
import { useSoundEffects } from '../SoundEffectsProvider';
import { useTetrixStateContext } from '../TetrixProvider';
import { useMusicControl } from '../useMusicControl';
import './Header.css';

export const Header: React.FC = () => {
  // Use the main sound effects context
  const { volume, setVolume, isEnabled, setEnabled } = useSoundEffects();
  // Get music control for the audio unlock indicator
  const { isWaitingForInteraction } = useMusicControl();
  // Get authentication state
  const { isAuthenticated, user, logout } = useAuth();
  // Navigation
  const navigate = useNavigate();
  // Login overlay state
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  // Leaderboard overlay state
  const [showLeaderboardOverlay, setShowLeaderboardOverlay] = useState(false);

  const { gameMode } = useTetrixStateContext();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const toggleSoundEffectsEnabled = useCallback(() => {
    // Toggle and let context handle persistence
    setEnabled(!isEnabled);
  }, [isEnabled, setEnabled]);

  const soundEffectsContextValue = useMemo(
    () => ({
      volume,
      setVolume,
      isEnabled,
      toggleEnabled: toggleSoundEffectsEnabled,
    }),
    [volume, setVolume, isEnabled, toggleSoundEffectsEnabled],
  );

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
          <BoardClearDisplay />
          <ScoreDisplay />
        </div>
        <div className="header-right">
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-avatar">
                {user?.username?.charAt(0) || '?'}
              </div>
              <IconButton
                onClick={() => setShowLeaderboardOverlay(true)}
                size="small"
                aria-label="Leaderboard"
                sx={{ color: '#4fc3f7' }}
              >
                <LeaderboardIcon />
              </IconButton>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <IconButton
              onClick={() => setShowLoginOverlay(true)}
              size="small"
              aria-label="Login"
              sx={{ color: '#4fc3f7' }}
            >
              <PersonIcon />
            </IconButton>
          )}
          <SettingsOverlay />
        </div>

        <LoginOverlay isOpen={showLoginOverlay} onClose={() => setShowLoginOverlay(false)} />
        {isAuthenticated && (
          <LeaderboardOverlay
            isOpen={showLeaderboardOverlay}
            onClose={() => setShowLeaderboardOverlay(false)}
          />
        )}
      </div>
    </SoundEffectsControlContext.Provider>
  );
};
