import './ShapeSelector.css';
import ShapeOption from '../ShapeOption'
import ShapeProducerViewport from '../ShapeProducerViewport';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useEffect, useMemo } from 'react';
import { generateRandomShape } from '../../utils/shapeUtils';

const ShapeSelector = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const { nextShapes, removingShapeIndex, shapeRemovalAnimationState, queueMode } = useTetrixStateContext();

  // Create initial shapes - start with 3 shapes (can be changed via debug menu)
  const initialShapes = useMemo(() => {
    const shapes = [];
    const initialShapeCount = 3; // Default starting number of shapes
    for (let i = 0; i < initialShapeCount; i++) {
      shapes.push(generateRandomShape());
    }
    return shapes;
  }, []);

  // Initialize shapes when needed
  // - On mount if no shapes exist and in infinite mode
  // - When switching to infinite mode with no shapes
  useEffect(() => {
    if (nextShapes.length === 0 && queueMode === 'infinite') {
      dispatch({ type: 'SET_AVAILABLE_SHAPES', value: { shapes: initialShapes } });
    }
  }, [dispatch, initialShapes, nextShapes.length, queueMode]);

  // Display all shapes (including 4th during slide-in animation)
  // The container will clip overflow, and the 4th shape slides in when another is removed
  const displayedShapes = nextShapes;

  const isLandscape = window.innerWidth >= window.innerHeight;

  // ShapeSelector sizing:
  // - Displays exactly 3 shapes in a row (portrait) or column (landscape)
  // - Each shape uses --game-controls-button-size from parent (passed via CSS variable)
  // - Explicit sizing: 3 * button size (width in portrait, height in landscape)

  return (
    <div className="shape-selector">
      <ShapeProducerViewport isLandscape={isLandscape}>
        {displayedShapes.length > 0 ? (
          displayedShapes.map((queuedShape, index) => {
            const isRemoving = removingShapeIndex === index && shapeRemovalAnimationState === 'removing';
            // Use the unique ID from the QueuedShape as the React key
            // This ensures proper animation when shapes slide in the queue
            return (
              <div
                key={queuedShape.id}
                className={`shape-selector-shape-wrapper${isRemoving ? ' removing' : ''}`}
                data-landscape={isLandscape ? '1' : '0'}
              >
                <ShapeOption
                  shape={queuedShape.shape}
                  shapeIndex={index}
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
  )
}

export default ShapeSelector;
