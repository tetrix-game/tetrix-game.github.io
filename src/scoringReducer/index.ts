/**
 * Scoring Reducer - Handles score, gem display, and gem spending
 * Actions: ADD_SCORE, SHOW_COIN_DISPLAY, HIDE_COIN_DISPLAY, SPEND_COIN
 */

import { persistence } from '../persistence';
import type { TetrixReducerState, TetrixAction } from '../types';

const { safeBatchSave } = persistence;

export function scoringReducer(
  state: TetrixReducerState,
  action: TetrixAction,
): TetrixReducerState {
  switch (action.type) {
    case 'ADD_SCORE': {
      const { scoreData, mousePosition: clickPosition } = action.value;
      const newScore = state.score + scoreData.pointsEarned;

      // Save updated score
      if (state.gameMode !== 'hub') {
        safeBatchSave({ score: newScore })
          .catch((_error: Error) => { });
      }

      return {
        ...state,
        score: newScore,
        mousePosition: clickPosition || state.mousePosition, // Update mouse position if provided
      };
    }

    case 'SHOW_COIN_DISPLAY': {
      return {
        ...state,
        showCoinDisplay: true,
      };
    }

    case 'HIDE_COIN_DISPLAY': {
      return {
        ...state,
        showCoinDisplay: false,
      };
    }

    case 'SPEND_COIN': {
      const { shapeIndex, mousePosition: clickPosition } = action.value;

      if (state.score <= 0) {
        return {
          ...state,
          insufficientFundsError: Date.now(),
        };
      }

      if (shapeIndex < 0 || shapeIndex >= state.nextShapes.length) {
        return state; // Can't spend if invalid index
      }

      const newScore = Math.max(0, state.score - 1);
      const newOpenRotationMenus = [...state.openRotationMenus];
      newOpenRotationMenus[shapeIndex] = true;

      // Save updated score
      if (state.gameMode !== 'hub') {
        safeBatchSave({ score: newScore })
          .catch((_error: Error) => { });
      }

      return {
        ...state,
        score: newScore,
        openRotationMenus: newOpenRotationMenus,
        mousePosition: clickPosition || state.mousePosition,
      };
    }

    case 'TRIGGER_GEM_ICON_PULSE': {
      return {
        ...state,
        gemIconPulseCount: state.gemIconPulseCount + 1,
      };
    }

    case 'TRIGGER_BOARD_CLEAR_ICON_PULSE': {
      return {
        ...state,
        boardClearIconPulseCount: state.boardClearIconPulseCount + 1,
      };
    }

    default:
      return state;
  }
}
