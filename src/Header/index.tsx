import { Person as PersonIcon, Leaderboard as LeaderboardIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api/client';
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
import { useTetrixStateContext, useTetrixDispatchContext } from '../TetrixProvider';
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
  // New game loading state
  const [isResetting, setIsResetting] = useState(false);

  const { gameMode } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const handleNewGame = useCallback(async () => {
    if (!isAuthenticated || isResetting) return;

    try {
      setIsResetting(true);
      // Call backend to reset game state (preserves statistics)
      await api.resetGame();
      // Reload game state from backend to get fresh state
      const gameState = await api.getGameState();
      // Update frontend state with loaded data
      dispatch({ type: 'LOAD_GAME_STATE', value: { gameData: gameState, stats: gameState.stats } });
    } catch (error) {
      console.error('Failed to reset game:', error);
    } finally {
      setIsResetting(false);
    }
  }, [isAuthenticated, isResetting, dispatch]);

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
              <IconButton
                onClick={handleNewGame}
                size="small"
                aria-label="New Game"
                disabled={isResetting}
                sx={{ color: '#4fc3f7' }}
              >
                <RefreshIcon />
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
