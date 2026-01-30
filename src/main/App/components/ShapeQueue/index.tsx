import './ShapeQueue.css';
import { useTetrixDispatchContext } from '../../Shared/Shared_TetrixProvider';
import { useTetrixStateContext } from '../../Shared/Shared_TetrixProvider';
import { QueueIndicator } from '../QueueIndicator';
import { QueueOverlay } from '../QueueOverlay';
import { ShapeSelector } from '../ShapeSelector';

export const ShapeQueue = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const {
    queueMode,
    queueHiddenShapes,
    isQueueOverlayOpen,
    nextShapes,
  } = useTetrixStateContext();

  // Handle queue indicator click
  const handleQueueIndicatorClick = (): void => {
    dispatch({ type: 'TOGGLE_QUEUE_OVERLAY' });
  };

  // Calculate hidden shape count for indicator
  // In finite mode, show the total remaining shapes (hidden + visible)
  const hiddenCount = queueMode === 'finite'
    ? queueHiddenShapes.length + nextShapes.length
    : queueHiddenShapes.length;

  return (
    <div className="shape-queue">
      <ShapeSelector />

      <QueueIndicator
        mode={queueMode}
        hiddenCount={hiddenCount}
        onClick={handleQueueIndicatorClick}
      />

      {isQueueOverlayOpen && (
        <QueueOverlay
          hiddenShapes={queueHiddenShapes}
          onClose={handleQueueIndicatorClick}
        />
      )}
    </div>
  );
};
