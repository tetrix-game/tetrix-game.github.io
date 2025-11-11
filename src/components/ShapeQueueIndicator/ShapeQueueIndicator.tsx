import React from 'react';
import './ShapeQueueIndicator.css';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';

interface ShapeQueueIndicatorProps {
  direction: 'horizontal' | 'vertical';
}

const ShapeQueueIndicator: React.FC<ShapeQueueIndicatorProps> = ({ direction }) => {
  const { queueSize, shapesUsed } = useTetrixStateContext();

  const remainingShapes = queueSize === -1 ? -1 : queueSize - shapesUsed;
  const displayText = remainingShapes === -1 ? '∞' : remainingShapes.toString();

  return (
    <div className={`shape-queue-indicator shape-queue-indicator-${direction}`}>
      <div className="shape-queue-indicator-arrow">
        {direction === 'horizontal' ? '↑' : '←'}
      </div>
      <div className="shape-queue-indicator-count">
        {displayText}
      </div>
    </div>
  );
};

export default ShapeQueueIndicator;