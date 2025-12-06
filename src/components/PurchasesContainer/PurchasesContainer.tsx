import './PurchasesContainer.css';
import { useTetrixDispatchContext, useTetrixStateContext } from '../Tetrix/TetrixContext';

const PurchasesContainer = (): JSX.Element => {
  const dispatch = useTetrixDispatchContext();
  const {
    gameState,
    isTurningModeActive,
    turningDirection,
    isDoubleTurnModeActive,
    score
  } = useTetrixStateContext(state => ({
    gameState: state.gameState,
    isTurningModeActive: state.isTurningModeActive,
    turningDirection: state.turningDirection,
    isDoubleTurnModeActive: state.isDoubleTurnModeActive,
    score: state.score
  }));

  const handleBuyTurnClockwise = () => {
    if (gameState !== 'playing') return;

    if (isTurningModeActive && turningDirection === 'cw') {
      dispatch({ type: 'DEACTIVATE_TURNING_MODE' });
    } else {
      dispatch({ type: 'ACTIVATE_TURNING_MODE', value: { direction: 'cw' } });
    }
  };

  const handleBuyTurnCounterClockwise = () => {
    if (gameState !== 'playing') return;

    if (isTurningModeActive && turningDirection === 'ccw') {
      dispatch({ type: 'DEACTIVATE_TURNING_MODE' });
    } else {
      dispatch({ type: 'ACTIVATE_TURNING_MODE', value: { direction: 'ccw' } });
    }
  };

  const handleBuyDoubleTurn = () => {
    if (gameState !== 'playing') return;

    if (isDoubleTurnModeActive) {
      dispatch({ type: 'DEACTIVATE_DOUBLE_TURN_MODE' });
    } else {
      dispatch({ type: 'ACTIVATE_DOUBLE_TURN_MODE' });
    }
  };

  const isClockwiseDisabled = (score < 2 && !isTurningModeActive) || gameState !== 'playing';
  const isCounterClockwiseDisabled = (score < 2 && !isTurningModeActive) || gameState !== 'playing';
  const isDoubleTurnDisabled = (score < 3 && !isDoubleTurnModeActive) || gameState !== 'playing';
  const isClockwiseActive = isTurningModeActive && turningDirection === 'cw';
  const isCounterClockwiseActive = isTurningModeActive && turningDirection === 'ccw';
  const isDoubleTurnActive = isDoubleTurnModeActive;

  return (
    <div className="purchases-container">
      <button
        className={`purchases-container-button purchases-container-button-clockwise ${isClockwiseActive ? 'active' : ''} ${isClockwiseDisabled ? 'disabled' : ''}`}
        onClick={handleBuyTurnClockwise}
        title={isClockwiseDisabled ? 'Need 2 points to buy clockwise turn' : 'Buy clockwise turn (2 points)'}
      >
        <div className="purchases-container-icon">
          ↻
        </div>
        <div className="purchases-container-cost">-2</div>
      </button>

      <button
        className={`purchases-container-button purchases-container-button-double-turn ${isDoubleTurnActive ? 'active' : ''} ${isDoubleTurnDisabled ? 'disabled' : ''}`}
        onClick={handleBuyDoubleTurn}
        title={isDoubleTurnDisabled ? 'Need 3 points to buy double turn' : 'Buy double turn (3 points)'}
      >
        <div className="purchases-container-icon">
          ↻↻
        </div>
        <div className="purchases-container-cost">-3</div>
      </button>

      <button
        className={`purchases-container-button purchases-container-button-counter-clockwise ${isCounterClockwiseActive ? 'active' : ''} ${isCounterClockwiseDisabled ? 'disabled' : ''}`}
        onClick={handleBuyTurnCounterClockwise}
        title={isCounterClockwiseDisabled ? 'Need 2 points to buy counter-clockwise turn' : 'Buy counter-clockwise turn (2 points)'}
      >
        <div className="purchases-container-icon">
          ↺
        </div>
        <div className="purchases-container-cost">-2</div>
      </button>
    </div>
  );
};

export default PurchasesContainer;