import React from 'react';
import ShapeSelector from '../ShapeSelector';
import PurchasesContainer from '../PurchasesContainer';
import './GameControlsPanel.css';

const GameControlsPanel: React.FC = () => {
  return (
    <div className="game-controls-panel">
      <PurchasesContainer />
      <ShapeSelector />
    </div>
  );
};

export default GameControlsPanel;