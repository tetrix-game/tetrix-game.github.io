import { useTetrixDispatchContext } from '../Tetrix/TetrixContext';
import { useCallback } from 'react';
import { useGameSizing } from '../../hooks/useGameSizing';

const buttonGroupCss = {
  display: 'flex',
  flexDirection: 'row' as const,
  gap: '4px',
};

type PurchaseMenuProps = {
  shapeIndex: number;
  isRotationMenuOpen: boolean;
};

const PurchaseMenu = ({ shapeIndex, isRotationMenuOpen }: PurchaseMenuProps) => {
  const dispatch = useTetrixDispatchContext();
  const { buttonSize } = useGameSizing();

  const turnButtonCss = {
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${buttonSize * 0.35}px`,
    color: 'rgba(255, 255, 255, 0.8)',
    minWidth: `${buttonSize}px`,
    minHeight: `${buttonSize}px`,
    boxSizing: 'border-box' as const,
  };

  const dollarButtonCss = {
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${buttonSize * 0.47}px`,
    color: 'rgba(255, 255, 255, 0.8)',
    minWidth: `${buttonSize}px`,
    minHeight: `${buttonSize}px`,
    boxSizing: 'border-box' as const,
  };

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
      <div style={buttonGroupCss}>
        <button
          style={turnButtonCss}
          onClick={handleRotateCounterClockwise}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Rotate Counter-Clockwise"
        >
          ↺
        </button>

        <button
          style={turnButtonCss}
          onClick={handleRotateClockwise}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Rotate Clockwise"
        >
          ↻
        </button>
      </div>
    );
  }

  return (
    <button
      style={dollarButtonCss}
      onClick={handleSpendCoin}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      title="Spend 1 coin to unlock rotation"
    >
      💲
    </button>
  );
};

export default PurchaseMenu;