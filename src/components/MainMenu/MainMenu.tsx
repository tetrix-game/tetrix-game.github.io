import React from 'react';
import { useGameNavigation } from '../../hooks/useGameNavigation';
import { useDailyChallengeLoader } from '../../hooks/useDailyChallengeLoader';
import './MainMenu.css';

const MainMenu: React.FC = () => {
  const { navigateToMode } = useGameNavigation();
  const { loadDailyChallenge, isLoading, error } = useDailyChallengeLoader();

  const handleDailyClick = async () => {
    await loadDailyChallenge();
    // Navigation happens automatically via state change in reducer if successful
    // But wait, the reducer just sets the state, it doesn't change the mode?
    // Ah, START_DAILY_CHALLENGE sets gameMode: 'daily'.
    // So we don't need to call navigateToMode('daily') manually if the loader dispatches that action.
  };

  return (
    <div className="hub-menu-overlay">
      <div className="hub-menu-container">
        <h1 className="hub-menu-title">Tetrix</h1>

        <div className="hub-spokes-container">
          {/* Daily Challenge Spoke */}
          <button
            className="hub-spoke hub-spoke-daily"
            onClick={handleDailyClick}
            disabled={isLoading}
          >
            <div className="spoke-icon">{isLoading ? '⏳' : '🎯'}</div>
            <div className="spoke-title">Daily Challenge</div>
            <div className="spoke-description">
              {error ? 'No challenge today' : 'Complete today\'s puzzle'}
            </div>
          </button>


          {/* Infinite Play Spoke - Always visible */}
          <button
            className="hub-spoke hub-spoke-infinite"
            onClick={() => navigateToMode('infinite')}
          >
            <div className="spoke-icon">♾️</div>
            <div className="spoke-title">Infinite Play</div>
            <div className="spoke-description">Play endlessly</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
