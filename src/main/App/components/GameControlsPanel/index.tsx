import React from 'react';

import { Shared_useTetrixStateContext, Shared_useGameSizing } from '../../Shared';
import { PurchasesContainer } from '../PurchasesContainer';
import { ShapeQueue } from '../ShapeQueue';
import './GameControlsPanel.css';

const GameControlsPanel: React.FC = () => {
  const { buttonSizeMultiplier } = Shared_useTetrixStateContext();
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

export { GameControlsPanel };
