import React from 'react';
import ShapeSelector from '../ShapeSelector';
import PurchasesContainer from '../PurchasesContainer';
import { useGameSizing } from '../../hooks/useGameSizing';
import './GameControlsPanel.css';

const GameControlsPanel: React.FC = () => {
  const { gameControlsLength, gameControlsWidth } = useGameSizing();
  const isLandscape = window.innerWidth >= window.innerHeight;

  // gameControlsLength controls the longer dimension (matches grid exactly)
  // gameControlsWidth controls the shorter dimension
  const style = isLandscape
    ? { height: `${gameControlsLength}px`, width: `${gameControlsWidth}px` }
    : { width: `${gameControlsLength}px`, height: `${gameControlsWidth}px` };

  return (
    <div className="game-controls-panel" style={style}>
      <ShapeSelector />
      <PurchasesContainer />
    </div>
  );
};

export default GameControlsPanel;