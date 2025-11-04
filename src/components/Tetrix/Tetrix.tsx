import './Tetrix.css';
import Grid from '../Grid';
import ShapeSelector from '../ShapeSelector';
import DraggingShape from '../DraggingShape';
import { useTetrixStateContext, useTetrixDispatchContext } from './TetrixContext';
import { useEffect, useRef } from 'react';

const Tetrix = () => {
  const { placementAnimationState } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();
  const settlingTimeoutRef = useRef<number | null>(null);

  // Handle settling phase timeout (200ms for CSS grow animation)
  useEffect(() => {
    if (placementAnimationState === 'settling') {
      console.log('[Tetrix] Starting 200ms settling phase');
      const SETTLING_DURATION = 200;

      settlingTimeoutRef.current = window.setTimeout(() => {
        console.log('[Tetrix] Settling complete → resetting animation state');
        dispatch({ type: 'FINISH_SETTLING_ANIMATION' });
      }, SETTLING_DURATION);

      return () => {
        if (settlingTimeoutRef.current !== null) {
          clearTimeout(settlingTimeoutRef.current);
        }
      };
    }
  }, [placementAnimationState, dispatch]);

  return (
    <div className="tetrix">
      <Grid />
      <ShapeSelector />
      <DraggingShape />
    </div>
  )
}

export default Tetrix;