import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMusicControl } from '../Header/MusicControlContext';
import './MenuDropdown.css';

const MenuDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isMuted, toggleMute } = useMusicControl();

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

  // Test notification function for debugging
  const testNotification = () => {
    // Dispatch a custom event that the ScoreNotification component can listen to
    const event = new CustomEvent('tetrix-test-notification', {
      detail: { message: '+10 TEST points!' }
    });
    document.dispatchEvent(event);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the button
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return;
      }
      
      // Don't close if clicking inside the dropdown
      const dropdownElement = document.querySelector('.dropdown-overlay');
      if (dropdownElement && dropdownElement.contains(target)) {
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
                    title="Test score notification animation"
                  >
                    Test Notification
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