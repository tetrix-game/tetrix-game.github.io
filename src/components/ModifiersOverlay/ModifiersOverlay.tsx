import React from 'react';
import { GameModifier } from '../../utils/types';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import ModifierCard from '../ModifierCard';
import './ModifiersOverlay.css';

interface ModifiersOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModifiersOverlay: React.FC<ModifiersOverlayProps> = ({ isOpen, onClose }) => {
  const { currentLevel } = useTetrixStateContext();

  if (!isOpen) return null;

  // Check if a modifier is unlocked based on current level reaching its prime ID
  const isModifierUnlocked = (primeId: number) => {
    return currentLevel >= primeId;
  };

  // Comprehensive list of modifiers with prime IDs
  const allModifiers: GameModifier[] = [
    {
      id: 2,
      name: 'Speed Boost',
      description: 'Shapes fall 2x faster',
      primeId: 2,
      unlocked: isModifierUnlocked(2),
      active: false
    },
    {
      id: 3,
      name: 'Color Lock',
      description: 'All shapes are the same color',
      primeId: 3,
      unlocked: isModifierUnlocked(3),
      active: false
    },
    {
      id: 5,
      name: 'Gravity Shift',
      description: 'Shapes fall upward instead of down',
      primeId: 5,
      unlocked: isModifierUnlocked(5),
      active: false
    },
    {
      id: 7,
      name: 'Ghost Mode',
      description: 'Shapes can overlap for 3 seconds',
      primeId: 7,
      unlocked: isModifierUnlocked(7),
      active: false
    },
    {
      id: 11,
      name: 'Time Warp',
      description: 'Slow down time by 50%',
      primeId: 11,
      unlocked: isModifierUnlocked(11),
      active: currentLevel >= 11 // Example: activate if unlocked and level 11+
    },
    {
      id: 13,
      name: 'Matrix Mode',
      description: 'See through placed blocks',
      primeId: 13,
      unlocked: isModifierUnlocked(13),
      active: false
    },
    {
      id: 17,
      name: 'Double Drop',
      description: 'Drop two shapes simultaneously',
      primeId: 17,
      unlocked: isModifierUnlocked(17),
      active: false
    },
    {
      id: 19,
      name: 'Shape Shifter',
      description: 'Randomly change shape colors mid-fall',
      primeId: 19,
      unlocked: isModifierUnlocked(19),
      active: false
    },
    {
      id: 23,
      name: 'Quantum Blocks',
      description: 'Blocks have a chance to phase through others',
      primeId: 23,
      unlocked: isModifierUnlocked(23),
      active: false
    }
  ];

  const handleModifierToggle = (modifier: GameModifier) => {
    // TODO: Implement modifier toggle logic with reducer action
    console.log(`Toggling modifier: ${modifier.name} (${modifier.primeId})`);
  };

  const unlockedCount = allModifiers.filter(m => m.unlocked).length;
  const activeCount = allModifiers.filter(m => m.active).length;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="modifiers-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modifiers-title"
      tabIndex={-1}
    >
      <div className="modifiers-modal">
        <div className="modifiers-header">
          <h2 id="modifiers-title">Game Modifiers</h2>
          <button className="close-button" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        
        <div className="modifiers-content">
          <div className="modifiers-notice">
            <p>
              🎮 Game Modifiers ({unlockedCount} unlocked, {activeCount} active)
              <br />
              <small>Unlock modifiers by reaching levels that match prime numbers!</small>
            </p>
          </div>
          
          <div className="modifiers-grid">
            {allModifiers.map((modifier) => (
              <ModifierCard
                key={modifier.id}
                modifier={modifier}
                onToggle={handleModifierToggle}
                showUnlockHint={true}
              />
            ))}
          </div>
          
          <div className="modifiers-footer">
            <p>
              {currentLevel < 2 
                ? "Reach level 2 to unlock your first modifier!" 
                : `Current level: ${currentLevel}. Next modifier unlocks depend on reaching prime number levels.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifiersOverlay;