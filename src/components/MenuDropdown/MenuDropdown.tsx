import React, { useState, useRef, useEffect } from 'react';
import { useMusicControl } from '../Header/MusicControlContext';
import './MenuDropdown.css';

const MenuDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isMuted, toggleMute } = useMusicControl();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      {isOpen && (
        <div className="dropdown-overlay">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuDropdown;