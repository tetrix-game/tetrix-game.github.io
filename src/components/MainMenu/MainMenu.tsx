import React from 'react';
import { useGameNavigation } from '../../hooks/useGameNavigation';
import './MainMenu.css';

const MainMenu: React.FC = () => {
  const { navigateToMode } = useGameNavigation();

  return (
    <div className="hub-menu-overlay">
      <div className="hub-menu-container">
        <h1 className="hub-menu-title">Tetrix</h1>
        
        <div className="hub-spokes-container">
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
