import React from 'react';

import { PurchasesContainer } from '../PurchasesContainer';
import { ShapeQueue } from '../ShapeQueue';
import { useTetrixStateContext } from '../TetrixProvider';
import { useGameSizing } from '../useGameSizing';
import './GameControlsPanel.css';

export const GameControlsPanel: React.FC = () => {
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
