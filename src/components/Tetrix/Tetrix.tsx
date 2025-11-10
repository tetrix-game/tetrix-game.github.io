import './Tetrix.css';
import Grid from '../Grid';
import GameControlsPanel from '../GameControlsPanel';
import DraggingShape from '../DraggingShape';
import CoinShower from '../CoinShower';
import { useTetrixStateContext, useTetrixDispatchContext } from './TetrixContext';
import { useEffect } from 'react';

const Tetrix: React.FC = () => {
  const { selectedShape, gameState } = useTetrixStateContext();
  const dispatch = useTetrixDispatchContext();

  // Global pointerUp handler to catch drops outside the grid
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      // Only handle if a shape is selected and being dragged
      if (!selectedShape) return;

      // Let Grid's pointerUp handle clicks within the grid
      // Let GameControlsPanel handle clicks within the controls panel
      // This only handles pointerUp outside both areas
      const target = e.target as HTMLElement;
      const isInsideGrid = target.closest('.grid') !== null;
      const isInsideControlsPanel = target.closest('.game-controls-panel') !== null;

      if (!isInsideGrid && !isInsideControlsPanel) {
        dispatch({ type: 'RETURN_SHAPE_TO_SELECTOR' });
      }
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [selectedShape, dispatch]);

  // Only render when in playing state
  if (gameState !== 'playing') {
    return null;
  }

  return (
    <div className="tetrix">
      <Grid />
      <GameControlsPanel />
      <DraggingShape />
      <CoinShower />
    </div>
  )
}

export default Tetrix;