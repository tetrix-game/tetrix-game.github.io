import './ShapeContainer.css';
import type { Shape } from '../../utils/types';
import ShapeOption from '../ShapeOption';
import PurchaseMenu from '../PurchaseMenu';
import { useTetrixStateContext, useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useEffect } from 'react';

const containerWrapperCss = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

type ShapeContainerProps = {
  shape: Shape;
  shapeIndex: number;
  isVirtual?: boolean;
};

const ShapeContainer = ({ shape, shapeIndex, isVirtual = false }: ShapeContainerProps) => {
  const { openRotationMenus, removingShapeIndex, shapesSliding } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const isRotationMenuOpen = openRotationMenus[shapeIndex] || false;
  const isRemoving = removingShapeIndex === shapeIndex;
  const isSliding = shapesSliding && shapeIndex > (removingShapeIndex || -1);

  console.log(`ShapeContainer ${shapeIndex}: removing=${isRemoving}, sliding=${isSliding}, removingIndex=${removingShapeIndex}, virtual=${isVirtual}`);

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
      className={`shape-container ${isRemoving ? 'removing' : ''} ${isSliding ? 'sliding-up' : ''} ${isVirtual ? 'virtual' : ''}`}
      style={containerWrapperCss}
    >
      <ShapeOption shape={shape} shapeIndex={shapeIndex} />
      <PurchaseMenu
        shapeIndex={shapeIndex}
        isRotationMenuOpen={isRotationMenuOpen}
      />
    </div>
  );
};

export default ShapeContainer;