import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMusicControl } from '../Header/MusicControlContext';
import { useSoundEffectsControl } from '../Header/SoundEffectsControlContext';
import { useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { clearAllSavedData, clearAllDataAndReload } from '../../utils/persistenceUtils';
import './MenuDropdown.css';

const MenuDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isMuted, toggleMute } = useMusicControl();
  const { isMuted: isSoundEffectsMuted, toggleMute: toggleSoundEffectsMute } = useSoundEffectsControl();
  const dispatch = useTetrixDispatchContext();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const toggleDebugMenu = () => {
    setIsDebugOpen(!isDebugOpen);
  };

  // New game function - clears game data but preserves settings
  const handleNewGame = async () => {
    try {
      await clearAllSavedData();
      dispatch({ type: 'RESET_GAME' });
      // Refresh the page to fully reset game state
      globalThis.location.reload();
    } catch (error) {
      console.error('Failed to reset game:', error);
      // Still reset the game state even if clearing storage fails
      dispatch({ type: 'RESET_GAME' });
    }
  };

  // Clear all data including settings - nuclear option
  const handleClearAllData = () => {
    const confirmed = globalThis.confirm(
      '⚠️ WARNING: This will delete ALL data including your settings, clear the cache, and reload the app from the server.\n\n' +
      'This is only needed if the app is in a bad state.\n\n' +
      'Are you sure you want to continue?'
    );

    if (confirmed) {
      clearAllDataAndReload().catch((error: Error) => {
        console.error('Failed to clear all data:', error);
        alert('Failed to clear data completely. Reloading anyway...');
        globalThis.location.reload();
      });
    }
  };

  // Test notification function for debugging - opens prompt for custom points amount
  const testNotification = (e: React.MouseEvent) => {
    const input = globalThis.prompt('Enter amount of points to inject (try 100, 1000, or 999999):', '100');

    // Check if user cancelled the prompt
    if (input === null) {
      return;
    }

    // Parse and validate the input
    const amount = Number.parseInt(input.trim(), 10);
    if (Number.isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    // Capture the click position for gem emission
    const clickPosition = { x: e.clientX, y: e.clientY };

    // Dispatch ADD_SCORE action to update the score
    // This will trigger the gem shower animation automatically
    dispatch({
      type: 'ADD_SCORE',
      value: {
        scoreData: {
          rowsCleared: 0,
          columnsCleared: 0,
          pointsEarned: amount
        },
        mousePosition: clickPosition
      }
    });
  };

  // Handle clicking on the overlay background (not the content)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay (not its children)
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <div className="menu-dropdown" ref={dropdownRef}>
      <button
        ref={buttonRef}
        className="hamburger-button"
        onClick={toggleDropdown}
        title="Menu"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <div className="hamburger-lines">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {isOpen && createPortal(
        <div
          className="dropdown-overlay"
          onClick={handleOverlayClick}
        >
          <div className="dropdown-content">
            <div className="menu-item">
              <label className="toggle-switch" title={isMuted ? 'Turn on music' : 'Turn off music'}>
                <input
                  type="checkbox"
                  checked={!isMuted}
                  onChange={toggleMute}
                  className="toggle-input"
                  aria-label={isMuted ? 'Turn on background music' : 'Turn off background music'}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="menu-label">Music</span>
            </div>

            <div className="menu-item">
              <label className="toggle-switch" title={isSoundEffectsMuted ? 'Turn on sound effects' : 'Turn off sound effects'}>
                <input
                  type="checkbox"
                  checked={!isSoundEffectsMuted}
                  onChange={toggleSoundEffectsMute}
                  className="toggle-input"
                  aria-label={isSoundEffectsMuted ? 'Turn on sound effects' : 'Turn off sound effects'}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="menu-label">Sound Effects</span>
            </div>

            <div className="menu-item">
              <button
                className="menu-action-button"
                onClick={handleNewGame}
                title="Reset the game and clear all saved data (preserves settings)"
              >
                New Game
              </button>
            </div>

            <div className="menu-item debug-submenu">
              <button
                className="debug-toggle"
                onClick={toggleDebugMenu}
                aria-expanded={isDebugOpen}
              >
                <span className="menu-label">Debug</span>
                <span className={`debug-arrow ${isDebugOpen ? 'open' : ''}`}>▶</span>
              </button>
            </div>

            {isDebugOpen && (
              <div className="debug-submenu-content">
                <div className="menu-item submenu-item">
                  <button
                    className="debug-action-button"
                    onClick={testNotification}
                    title="Inject points to test the gem shower system! Try 100, 1000, or 999999 points."
                  >
                    Inject Points
                  </button>
                </div>
                <div className="menu-item submenu-item">
                  <button
                    className="debug-action-button danger"
                    onClick={handleClearAllData}
                    title="⚠️ Nuclear option: Clear ALL data including settings and reload fresh from server"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MenuDropdown;