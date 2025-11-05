import './ShapeOption.css';
import type { Shape } from '../../utils/types';
import BlockVisual from '../BlockVisual';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useCallback, useRef, useEffect } from 'react';

const shapeContainerCss = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 30px)',
  gridTemplateRows: 'repeat(3, 30px)',
  gap: '2px',
  padding: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  touchAction: 'none' as const, // Prevent browser touch gestures during drag
  boxSizing: 'border-box' as const, // Prevent border from adding width
};

type ShapeOptionProps = {
  shape: Shape;
  shapeIndex: number;
};

const ShapeOption = ({ shape, shapeIndex }: ShapeOptionProps) => {
  const dispatch = useTetrixDispatchContext();
  const { selectedShapeIndex } = useTetrixStateContext();
  const containerRef = useRef<HTMLDivElement>(null);

  // Register bounds when component mounts or updates
  useEffect(() => {
    if (containerRef.current) {
      const bounds = containerRef.current.getBoundingClientRect();
      dispatch({
        type: 'SET_SHAPE_OPTION_BOUNDS',
        value: {
          index: shapeIndex,
          bounds: {
            top: bounds.top,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height,
          },
        },
      });
    }
  }, [dispatch, shapeIndex]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); // Prevent default browser behaviors

    if (selectedShapeIndex === shapeIndex) {
      // Already selected shape - clicking again triggers return animation
      dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
    } else {
      // Start drag by selecting this shape with initial position
      dispatch({
        type: 'SELECT_SHAPE',
        value: {
          shape,
          shapeIndex,
          initialPosition: { x: e.clientX, y: e.clientY }
        }
      });
    }
    // Don't capture pointer - let it propagate to Grid for tracking
  }, [dispatch, shape, shapeIndex, selectedShapeIndex]);

  const isSelected = selectedShapeIndex === shapeIndex;

  return (
    <div
      ref={containerRef}
      style={{
        ...shapeContainerCss,
        border: isSelected ? '2px solid rgba(255, 255, 255, 0.5)' : '2px solid transparent',
      }}
      onPointerDown={handlePointerDown}
      onPointerEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      }}
    >
      {shape.map((row, rowIndex) => (
        row.map((block, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '3px',
              position: 'relative',
              opacity: isSelected ? 0.1 : 1, // 10% opacity when selected
            }}
          >
            <BlockVisual block={block} />
          </div>
        ))
      ))}
    </div>
  )
}

export default ShapeOption;