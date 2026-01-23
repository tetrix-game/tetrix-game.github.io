import React from 'react';

import { useGameSizing } from '../../../hooks/useGameSizing';
import { PurchasesContainer } from '../../PurchasesContainer/PurchasesContainer';
import { ShapeQueue } from '../../ShapeQueue/ShapeQueue';
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
