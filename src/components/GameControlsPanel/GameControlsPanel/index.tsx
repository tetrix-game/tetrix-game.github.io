import React from 'react';
import { ShapeQueue } from '../../ShapeQueue';
import { PurchasesContainer } from '../../PurchasesContainer';
import { useGameSizing } from '../../../hooks/useGameSizing';
import { useTetrixStateContext } from '../../Tetrix/TetrixContext';
import './GameControlsPanel.css';

const GameControlsPanel: React.FC = () => {
  const { buttonSizeMultiplier } = useTetrixStateContext();
  const { gameControlsButtonSize } = useGameSizing(buttonSizeMultiplier);

  return (
    <div
      className="game-controls-panel"
      style={{
        '--game-controls-button-size': `${gameControlsButtonSize}px`,
      } as React.CSSProperties}
    >
      <ShapeQueue />
      <PurchasesContainer />
    </div>
  );
};

export { GameControlsPanel };