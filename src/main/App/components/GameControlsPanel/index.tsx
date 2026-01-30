import React from 'react';

import { useTetrixStateContext } from '../../Shared/Shared_TetrixProvider';
import { Shared_useGameSizing } from '../../Shared/Shared_useGameSizing';
import { PurchasesContainer } from '../PurchasesContainer';
import { ShapeQueue } from '../ShapeQueue';
import './GameControlsPanel.css';

export const GameControlsPanel: React.FC = () => {
  const { buttonSizeMultiplier } = useTetrixStateContext();
  const { gameControlsButtonSize } = Shared_useGameSizing(buttonSizeMultiplier);

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
