import React from 'react';
import { GameModifier } from '../../utils/types';
import './ModifierCard.css';

interface ModifierCardProps {
  modifier: GameModifier;
  onToggle?: (modifier: GameModifier) => void;
  showUnlockHint?: boolean;
}

const ModifierCard: React.FC<ModifierCardProps> = ({ 
  modifier, 
  onToggle, 
  showUnlockHint = true 
}) => {
  const getPrimeColor = (primeId: number) => {
    // Color coding based on prime number ranges
    if (primeId === 2) return '#ffffff'; // White for the first prime
    if (primeId <= 5) return '#4a9eff'; // Blue for small primes (3, 5)
    if (primeId <= 13) return '#a855f7'; // Purple for medium primes (7, 11, 13)
    if (primeId <= 23) return '#f59e0b'; // Orange for larger primes (17, 19, 23)
    return '#ef4444'; // Red for very large primes
  };

  const handleCardClick = () => {
    if (modifier.unlocked && onToggle) {
      onToggle(modifier);
    }
  };

  const getCardClassName = () => {
    const baseClass = 'modifier-card';
    if (!modifier.unlocked) return `${baseClass} locked`;
    if (modifier.active) return `${baseClass} active`;
    return `${baseClass} inactive`;
  };

  const getStatusText = () => {
    if (!modifier.unlocked) return '🔒 Locked';
    return modifier.active ? '✓ Active' : '○ Inactive';
  };

  const getStatusClassName = () => {
    if (!modifier.unlocked) return 'status-indicator locked';
    return `status-indicator ${modifier.active ? 'active' : 'inactive'}`;
  };

  const getAriaLabel = () => {
    if (modifier.unlocked) {
      return `${modifier.name}: ${modifier.description}. Currently ${modifier.active ? 'active' : 'inactive'}.`;
    }
    return `${modifier.name}: Locked. Reach level ${modifier.primeId} to unlock.`;
  };

  const getDescriptionText = () => {
    if (modifier.unlocked) {
      return modifier.description;
    }
    if (showUnlockHint) {
      return `Reach level ${modifier.primeId} to unlock this modifier.`;
    }
    return 'This modifier is locked.';
  };

  return (
    <div 
      className={getCardClassName()}
      style={{ '--prime-color': getPrimeColor(modifier.primeId) } as React.CSSProperties}
    >
      {modifier.unlocked && onToggle ? (
        <button
          className="modifier-card-button"
          onClick={handleCardClick}
          aria-label={getAriaLabel()}
        >
          <div className="modifier-header">
            <h3 className="modifier-name">{modifier.name}</h3>
            <span className="modifier-prime-id">#{modifier.primeId}</span>
          </div>
          
          <p className="modifier-description">{getDescriptionText()}</p>
          
          <div className="modifier-status">
            <span className={getStatusClassName()}>{getStatusText()}</span>
          </div>
        </button>
      ) : (
        <div className="modifier-card-content">
          <div className="modifier-header">
            <h3 className="modifier-name">
              {modifier.unlocked ? modifier.name : `??? Modifier`}
            </h3>
            <span className="modifier-prime-id">#{modifier.primeId}</span>
          </div>
          
          <p className="modifier-description">{getDescriptionText()}</p>
          
          <div className="modifier-status">
            <span className={getStatusClassName()}>{getStatusText()}</span>
          </div>
        </div>
      )}
      
      {!modifier.unlocked && (
        <div className="unlock-overlay">
          <div className="unlock-icon">🔒</div>
        </div>
      )}
    </div>
  );
};

export default ModifierCard;