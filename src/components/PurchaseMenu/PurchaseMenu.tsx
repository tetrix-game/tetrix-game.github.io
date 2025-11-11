import { useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useCallback } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';
import BlueGemIcon from '../BlueGemIcon';
import './PurchaseMenu.css';

type PurchaseMenuProps = {
  shapeIndex: number;
  isRotationMenuOpen: boolean;
};

const PurchaseMenu = ({ shapeIndex, isRotationMenuOpen }: PurchaseMenuProps) => {
  const dispatch = useTetrixDispatchContext();
  const { buttonSize } = useGameSizing();

  const handleRotateClockwise = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'ROTATE_SHAPE',
      value: { shapeIndex, clockwise: true }
    });
  }, [dispatch, shapeIndex]);

  const handleRotateCounterClockwise = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'ROTATE_SHAPE',
      value: { shapeIndex, clockwise: false }
    });
  }, [dispatch, shapeIndex]);

  const handleSpendCoin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'SPEND_COIN',
      value: {
        shapeIndex,
        mousePosition: { x: e.clientX, y: e.clientY }
      }
    });
  }, [dispatch, shapeIndex]);

  if (isRotationMenuOpen) {
    return (
      <div
        className="purchase-menu-button-group"
        style={{
          '--button-size': `${buttonSize}px`,
        } as React.CSSProperties}
      >
        <button
          className="purchase-menu-turn-button"
          onClick={handleRotateCounterClockwise}
          title="Rotate Counter-Clockwise"
        >
          ↺
        </button>

        <button
          className="purchase-menu-turn-button"
          onClick={handleRotateClockwise}
          title="Rotate Clockwise"
        >
          ↻
        </button>
      </div>
    );
  }

  return (
    <button
      className="purchase-menu-dollar-button"
      style={{
        '--button-size': `${buttonSize}px`,
      } as React.CSSProperties}
      onClick={handleSpendCoin}
      title="Spend 1 gem to unlock rotation"
    >
      <BlueGemIcon size={16} />
    </button>
  );
};

export default PurchaseMenu;