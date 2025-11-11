import React from 'react';
import ShapeSelector from '../ShapeSelector';
import PurchasesContainer from '../PurchasesContainer';
import { useGameSizing } from '../../hooks/useGameSizing';
import './GameControlsPanel.css';

const GameControlsPanel: React.FC = () => {
  const { gameControlsLength, gameControlsWidth } = useGameSizing();
  const isLandscape = window.innerWidth >= window.innerHeight;

  return (
    <div
      className="game-controls-panel"
      style={{
        '--controls-height': isLandscape ? `${gameControlsLength}px` : `${gameControlsWidth}px`,
        '--controls-width': isLandscape ? `${gameControlsWidth}px` : `${gameControlsLength}px`,
      } as React.CSSProperties}
    >
      <ShapeSelector />
      <PurchasesContainer />
    </div>
  );
};

export default GameControlsPanel;