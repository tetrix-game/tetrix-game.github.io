import React from 'react';
import { useGameNavigation } from '../../hooks/useGameNavigation';
import './MainMenu.css';

interface MainMenuProps {
  showTutorial: boolean;
  onSelectTutorial: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  showTutorial,
  onSelectTutorial,
}) => {
  const { navigateToMode } = useGameNavigation();

  return (
    <div className="hub-menu-overlay">
      <div className="hub-menu-container">
        <h1 className="hub-menu-title">Tetrix</h1>
        
        <div className="hub-spokes-container">
          {/* Tutorial Spoke - Only shown for first-time visitors */}
          {showTutorial && (
            <button
              className="hub-spoke hub-spoke-tutorial"
              onClick={onSelectTutorial}
            >
              <div className="spoke-icon">📚</div>
              <div className="spoke-title">Tutorial</div>
              <div className="spoke-description">Learn how to play</div>
            </button>
          )}

          {/* Daily Challenge Spoke - Always visible but disabled for now */}
          <button
            className="hub-spoke hub-spoke-daily"
            onClick={() => navigateToMode('daily')}
          >
            <div className="spoke-icon">🎯</div>
            <div className="spoke-title">Daily Challenge</div>
            <div className="spoke-description">Complete today's puzzle</div>
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
