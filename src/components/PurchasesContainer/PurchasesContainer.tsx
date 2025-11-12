import './PurchasesContainer.css';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';
import { useGameSizing } from '../../hooks/useGameSizing';

const PurchasesContainer = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const state = useTetrixStateContext();
  const { gameControlsWidth } = useGameSizing();

  const handleBuyTurnClockwise = () => {
    if (state.isTurningModeActive && state.turningDirection === 'cw') {
      // If already in clockwise mode, deactivate it
      dispatch({ type: 'DEACTIVATE_TURNING_MODE' });
      return;
    }

    if (state.isTurningModeActive && state.turningDirection === 'ccw') {
      // Switch from counter-clockwise to clockwise (no cost)
      dispatch({ type: 'ACTIVATE_TURNING_MODE', value: { direction: 'cw' } });
      return;
    }

    if (state.score >= 1 && state.gameState === 'playing' && !state.isTurningModeActive) {
      // Deduct 1 point and activate clockwise turning mode
      dispatch({
        type: 'ADD_SCORE',
        value: {
          scoreData: {
            rowsCleared: 0,
            columnsCleared: 0,
            pointsEarned: -1
          }
        }
      });
      dispatch({ type: 'ACTIVATE_TURNING_MODE', value: { direction: 'cw' } });
    }
  };

  const handleBuyTurnCounterClockwise = () => {
    if (state.isTurningModeActive && state.turningDirection === 'ccw') {
      // If already in counter-clockwise mode, deactivate it
      dispatch({ type: 'DEACTIVATE_TURNING_MODE' });
      return;
    }

    if (state.isTurningModeActive && state.turningDirection === 'cw') {
      // Switch from clockwise to counter-clockwise (no cost)
      dispatch({ type: 'ACTIVATE_TURNING_MODE', value: { direction: 'ccw' } });
      return;
    }

    if (state.score >= 1 && state.gameState === 'playing' && !state.isTurningModeActive) {
      // Deduct 1 point and activate counter-clockwise turning mode
      dispatch({
        type: 'ADD_SCORE',
        value: {
          scoreData: {
            rowsCleared: 0,
            columnsCleared: 0,
            pointsEarned: -1
          }
        }
      });
      dispatch({ type: 'ACTIVATE_TURNING_MODE', value: { direction: 'ccw' } });
    }
  };

  const handleBuyDoubleTurn = () => {
    if (state.isDoubleTurnModeActive) {
      // If already in double turn mode, deactivate it
      dispatch({ type: 'DEACTIVATE_DOUBLE_TURN_MODE' });
      return;
    }

    if (state.score >= 2 && state.gameState === 'playing') {
      // Deduct 2 points and activate double turn mode
      dispatch({
        type: 'ADD_SCORE',
        value: {
          scoreData: {
            rowsCleared: 0,
            columnsCleared: 0,
            pointsEarned: -2
          }
        }
      });
      dispatch({ type: 'ACTIVATE_DOUBLE_TURN_MODE' });
    }
  };

  const isClockwiseDisabled = (state.score < 1 && !state.isTurningModeActive) || state.gameState !== 'playing';
  const isCounterClockwiseDisabled = (state.score < 1 && !state.isTurningModeActive) || state.gameState !== 'playing';
  const isDoubleTurnDisabled = (state.score < 2 && !state.isDoubleTurnModeActive) || state.gameState !== 'playing';
  const isClockwiseActive = state.isTurningModeActive && state.turningDirection === 'cw';
  const isCounterClockwiseActive = state.isTurningModeActive && state.turningDirection === 'ccw';
  const isDoubleTurnActive = state.isDoubleTurnModeActive;

  // Calculate button sizing based on available space
  // In landscape: 3 buttons stacked vertically with gaps
  // In portrait: 3 buttons side-by-side with gaps
  const containerPadding = 12;
  const buttonGap = 12;
  const totalGaps = buttonGap * 2; // 2 gaps between 3 buttons
  const totalPadding = containerPadding * 2;
  const availableSpace = gameControlsWidth - totalGaps - totalPadding;
  const buttonSize = availableSpace / 3;

  return (
    <div
      className="purchases-container"
      style={{
        '--button-size': `${buttonSize}px`,
      } as React.CSSProperties}
    >
      <button
        className={`purchases-container-button purchases-container-button-clockwise ${isClockwiseActive ? 'active' : ''}`}
        onClick={handleBuyTurnClockwise}
        disabled={isClockwiseDisabled}
        title={isClockwiseDisabled ? 'Need 1 point to buy clockwise turn' : 'Buy clockwise turn (1 point)'}
      >
        <div className="purchases-container-icon">
          ↻
        </div>
        <div className="purchases-container-cost">-1</div>
      </button>

      <button
        className={`purchases-container-button purchases-container-button-double-turn ${isDoubleTurnActive ? 'active' : ''}`}
        onClick={handleBuyDoubleTurn}
        disabled={isDoubleTurnDisabled}
        title={isDoubleTurnDisabled ? 'Need 2 points to buy double turn' : 'Buy double turn (2 points)'}
      >
        <div className="purchases-container-icon">
          ↻↻
        </div>
        <div className="purchases-container-cost">-2</div>
      </button>

      <button
        className={`purchases-container-button purchases-container-button-counter-clockwise ${isCounterClockwiseActive ? 'active' : ''}`}
        onClick={handleBuyTurnCounterClockwise}
        disabled={isCounterClockwiseDisabled}
        title={isCounterClockwiseDisabled ? 'Need 1 point to buy counter-clockwise turn' : 'Buy counter-clockwise turn (1 point)'}
      >
        <div className="purchases-container-icon">
          ↺
        </div>
        <div className="purchases-container-cost">-1</div>
      </button>
    </div>
  );
};

export default PurchasesContainer;