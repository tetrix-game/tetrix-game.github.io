import './ShapeContainer.css';
import type { Shape } from '../../utils/types';
import ShapeOption from '../ShapeOption';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useEffect } from 'react';

type ShapeContainerProps = {
  shape: Shape;
  shapeIndex: number;
  isVirtual?: boolean;
};

const ShapeContainer = ({ shape, shapeIndex, isVirtual = false }: ShapeContainerProps) => {
  const { removingShapeIndex } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const isRemoving = removingShapeIndex === shapeIndex;

  const containerWrapperCss = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: 'fit-content',
  };

  // Handle animation completion
  useEffect(() => {
    if (isRemoving) {
      const timer = setTimeout(() => {
        dispatch({ type: 'COMPLETE_SHAPE_REMOVAL' });
      }, 400); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isRemoving, dispatch]);

  return (
    <div
      className={`shape-container ${isRemoving ? 'removing' : ''} ${isVirtual ? 'virtual' : ''}`}
      style={containerWrapperCss}
    >
      <ShapeOption shape={shape} shapeIndex={shapeIndex} />
    </div>
  );
};

export default ShapeContainer;