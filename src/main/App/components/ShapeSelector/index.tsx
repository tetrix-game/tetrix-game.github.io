import './ShapeSelector.css';
import { useEffect, useMemo } from 'react';

import { useTetrixDispatchContext, useTetrixStateContext } from '../../Shared/TetrixContext';
import type { QueueItem, PurchasableSlot } from '../../types/core';
import { generateRandomShape } from '../../utils/shapes/shapeGeneration';
import { PurchasableSlotOption } from '../PurchasableSlotOption';
import { ShapeOption } from '../ShapeOption';
import { ShapeProducerViewport } from '../ShapeProducerViewport';

const ShapeSelector = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const {
    nextShapes,
    removingShapeIndex,
    shapeRemovalAnimationState,
    queueMode,
    unlockedSlots,
  } = useTetrixStateContext();

  // Create initial queue - shapes + purchasable slots based on which slots are unlocked
  const initialQueue = useMemo(() => {
    const queue: QueueItem[] = [];
    let idCounter = 0;
    const slotCosts: Record<number, number> = { 2: 5000, 3: 15000, 4: 50000 };

    // Build queue in order (slots 1, 2, 3, 4)
    for (let slotNumber = 1; slotNumber <= 4; slotNumber++) {
      if (unlockedSlots.has(slotNumber)) {
        // Slot is unlocked - add a shape
        queue.push({
          id: idCounter++,
          shape: generateRandomShape(),
          type: 'shape',
        });
      } else {
        // Slot is locked - add a purchasable slot
        queue.push({
          id: idCounter++,
          type: 'purchasable-slot',
          cost: slotCosts[slotNumber],
          slotNumber,
        });
      }
    }

    return queue;
  }, [unlockedSlots]);

  // Initialize queue when needed
  // - On mount if no items exist and in infinite mode
  // - When switching to infinite mode with no items
  useEffect(() => {
    if (nextShapes.length === 0 && queueMode === 'infinite') {
      dispatch({ type: 'INITIALIZE_QUEUE', value: { items: initialQueue } });
    }
  }, [dispatch, initialQueue, nextShapes.length, queueMode]);

  // Display all items (including 5th during slide-in animation)
  // The container will clip overflow, and the 5th item slides in when another is removed
  const displayedItems = nextShapes;

  const isLandscape = window.innerWidth >= window.innerHeight;

  // ShapeSelector sizing:
  // - Displays exactly 4 items in a row (portrait) or column (landscape)
  // - Each item uses --game-controls-button-size from parent (passed via CSS variable)
  // - Explicit sizing: 4 * button size (width in portrait, height in landscape)

  return (
    <div className="shape-selector">
      <ShapeProducerViewport isLandscape={isLandscape}>
        {displayedItems.length > 0 ? (
          displayedItems.map((queueItem, index) => {
            const isRemoving = removingShapeIndex === index && shapeRemovalAnimationState === 'removing';
            // Use the unique ID from the QueueItem as the React key
            // This ensures proper animation when items slide in the queue

            if (queueItem.type === 'shape') {
              return (
                <div
                  key={queueItem.id}
                  className={`shape-selector-shape-wrapper${isRemoving ? ' removing' : ''}`}
                  data-landscape={isLandscape ? '1' : '0'}
                >
                  <ShapeOption
                    shape={queueItem.shape}
                    shapeIndex={index}
                  />
                </div>
              );
            }
            // Purchasable slot
            const slot = queueItem as PurchasableSlot;
            return (
              <div
                key={queueItem.id}
                className={`shape-selector-shape-wrapper${isRemoving ? ' removing' : ''}`}
                data-landscape={isLandscape ? '1' : '0'}
              >
                <PurchasableSlotOption
                  cost={slot.cost}
                  slotNumber={slot.slotNumber}
                  slotIndex={index}
                />
              </div>
            );
          })
        ) : (
          // Show placeholder when queue is empty
          <div
            className="shape-selector-shape-wrapper shape-selector-empty-placeholder"
            data-landscape={isLandscape ? '1' : '0'}
          >
            <div className="empty-queue-message">
              Queue Empty
            </div>
          </div>
        )}
      </ShapeProducerViewport>
    </div>
  );
};

export { ShapeSelector };
