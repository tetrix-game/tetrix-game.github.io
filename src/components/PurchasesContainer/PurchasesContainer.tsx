import './PurchasesContainer.css';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';

const PurchasesContainer = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const state = useTetrixStateContext();

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

  const isClockwiseDisabled = (state.score < 1 && !state.isTurningModeActive) || state.gameState !== 'playing';
  const isCounterClockwiseDisabled = (state.score < 1 && !state.isTurningModeActive) || state.gameState !== 'playing';
  const isClockwiseActive = state.isTurningModeActive && state.turningDirection === 'cw';
  const isCounterClockwiseActive = state.isTurningModeActive && state.turningDirection === 'ccw';

  return (
    <div className="purchases-container">
      <button
        className={`buy-turn-button clockwise ${isClockwiseActive ? 'active' : ''}`}
        onClick={handleBuyTurnClockwise}
        disabled={isClockwiseDisabled}
        title={isClockwiseDisabled ? 'Need 1 point to buy clockwise turn' : 'Buy clockwise turn (1 point)'}
      >
        <div className="turn-icon">
          ↻
        </div>
        <div className="cost">1</div>
      </button>

      <button
        className={`buy-turn-button counter-clockwise ${isCounterClockwiseActive ? 'active' : ''}`}
        onClick={handleBuyTurnCounterClockwise}
        disabled={isCounterClockwiseDisabled}
        title={isCounterClockwiseDisabled ? 'Need 1 point to buy counter-clockwise turn' : 'Buy counter-clockwise turn (1 point)'}
      >
        <div className="turn-icon">
          ↺
        </div>
        <div className="cost">1</div>
      </button>
    </div>
  );
};

export default PurchasesContainer;