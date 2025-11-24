import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useMusicControl } from '../Header/MusicControlContext';
import { useSoundEffectsControl } from '../Header/SoundEffectsControlContext';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useDebugEditor } from '../DebugEditor';
import { THEMES, ThemeName } from '../../types';
import {
  clearAllSavedData,
  clearAllDataAndReload,
  loadDebugSettings,
  saveDebugSettings
} from '../../utils/persistenceUtils';
import './MenuDropdown.css';

interface MenuDropdownProps {
  onShowTutorial?: () => void;
}

// Theme selector component
const ThemeSelector: React.FC = () => {
  const { currentTheme } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();

  const handleThemeChange = (theme: ThemeName) => {
    dispatch({ type: 'SET_THEME', value: { theme } });
  };

  return (
    <div className="menu-item theme-selector">
      <span className="menu-label">Theme</span>
      <div className="theme-buttons">
        {Object.values(THEMES).map((theme) => (
          <button
            key={theme.name}
            className={`theme-button ${currentTheme === theme.name ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme.name)}
            title={theme.displayName}
          >
            {theme.displayName}
          </button>
        ))}
      </div>
    </div>
  );
};

const MenuDropdown: React.FC<MenuDropdownProps> = ({ onShowTutorial }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isMuted, toggleMute } = useMusicControl();
  const { isMuted: isSoundEffectsMuted, toggleMute: toggleSoundEffectsMute } = useSoundEffectsControl();
  const dispatch = useTetrixDispatchContext();
  const { openEditor } = useDebugEditor();
  const [debugUnlocked, setDebugUnlocked] = useState(false);
  const [debugClickCount, setDebugClickCount] = useState(0);

  useEffect(() => {
    loadDebugSettings().then(setDebugUnlocked);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDebugClickCount(0);
    }

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleHiddenDebugClick = (e: React.MouseEvent) => {
    const newCount = debugClickCount + 1;
    setDebugClickCount(newCount);

    if (newCount >= 20) {
      setDebugUnlocked(true);
      saveDebugSettings(true);

      // Trigger 20 gem shower
      dispatch({
        type: 'ADD_SCORE',
        value: {
          scoreData: {
            rowsCleared: 0,
            columnsCleared: 0,
            pointsEarned: 20
          },
          mousePosition: { x: e.clientX, y: e.clientY }
        }
      });
    }
  };

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
      // Ensure tutorial is shown again
      localStorage.removeItem('hasSeenTutorial');

      clearAllDataAndReload().catch((error: Error) => {
        console.error('Failed to clear all data:', error);
        alert('Failed to clear data completely. Reloading anyway...');
        globalThis.location.reload();
      });
    }
  };

  // Test notification function for debugging - injects 1000 points
  const testNotification = (e: React.MouseEvent) => {
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
          pointsEarned: 1000
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
            <div className="menu-qr-code">
              <p className="qr-label">Share this game</p>
              <div className="qr-code-wrapper">
                <QRCodeSVG
                  value="https://tetrix-game.github.io"
                  size={128}
                  bgColor="#023f80"
                  fgColor="#ffffff"
                />
              </div>
            </div>

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

            <ThemeSelector />

            {onShowTutorial && (
              <div className="menu-item">
                <button
                  className="menu-action-button"
                  onClick={() => {
                    onShowTutorial();
                    setIsOpen(false);
                  }}
                  title="Show the tutorial overlay"
                >
                  Tutorial
                </button>
              </div>
            )}

            <div className="menu-item">
              <button
                className="menu-action-button"
                onClick={handleNewGame}
                title="Reset the game and clear all saved data (preserves settings)"
              >
                New Game
              </button>
            </div>

            <div className="menu-item">
              <a
                className="menu-action-button menu-link-button"
                href="/strategy-guide.html"
                title="Read the Tetrix strategy guide"
              >
                Strategy Guide
              </a>
            </div>

            <div className="menu-item debug-submenu">
              {debugUnlocked ? (
                <button
                  className="debug-toggle"
                  onClick={toggleDebugMenu}
                  aria-expanded={isDebugOpen}
                >
                  <span className="menu-label">Debug</span>
                  <span className={`debug-arrow ${isDebugOpen ? 'open' : ''}`}>▶</span>
                </button>
              ) : (
                <button
                  className="debug-toggle hidden-debug-trigger"
                  onClick={handleHiddenDebugClick}
                  style={{ opacity: 0, cursor: 'default' }}
                  aria-hidden="true"
                >
                  <span className="menu-label">Debug</span>
                </button>
              )}
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
                    className="debug-action-button"
                    onClick={() => {
                      openEditor();
                      setIsOpen(false);
                    }}
                    title="Open the debug editor to manually edit the game grid"
                  >
                    Debug Editor
                  </button>
                </div>
                <div className="menu-item submenu-item">
                  <button
                    className="debug-action-button"
                    onClick={() => {
                      dispatch({ type: 'OPEN_MAP' });
                      setIsOpen(false);
                    }}
                    title="Open the Level Map overlay (dev only)"
                  >
                    Open Level Map
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