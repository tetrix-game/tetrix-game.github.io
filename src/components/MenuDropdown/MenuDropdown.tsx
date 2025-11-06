import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMusicControl } from '../Header/MusicControlContext';
import { useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import './MenuDropdown.css';

const MenuDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isMuted, toggleMute } = useMusicControl();
  const dispatch = useTetrixDispatchContext();

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      // Calculate button position when opening dropdown
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
    setIsOpen(!isOpen);
  };

  const toggleDebugMenu = () => {
    setIsDebugOpen(!isDebugOpen);
  };

  // Test notification function for debugging - opens prompt for custom currency amount
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

    console.log('💰 Injecting', amount, 'points - this will trigger the coin shower!');

    // Capture the click position for coin emission
    const clickPosition = { x: e.clientX, y: e.clientY };

    // Dispatch ADD_SCORE action to update the score
    // This will trigger the coin shower animation automatically
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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking on the button
      if (buttonRef.current?.contains(target)) {
        return;
      }

      // Don't close if clicking inside the dropdown
      const dropdownElement = document.querySelector('.dropdown-overlay');
      if (dropdownElement?.contains(target)) {
        return;
      }

      // Close if clicking outside
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

      {isOpen && buttonRect && createPortal(
        <div
          className="dropdown-overlay"
          style={{
            position: 'fixed',
            top: buttonRect.bottom + window.scrollY,
            left: buttonRect.left + window.scrollX,
            zIndex: 10000,
          }}
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
                    title="Inject points to test the new coin shower system! Try 100, 1000, or 999999 points."
                  >
                    Inject Points
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