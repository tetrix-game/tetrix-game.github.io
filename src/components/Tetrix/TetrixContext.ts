import { createSubscriptionStore } from '../../utils/subscriptionStore';
import { TetrixAction, TetrixReducerState } from "../../utils/types";
import { initialState, tetrixReducer } from './TetrixReducer';

export const { 
  Provider: TetrixStoreProvider, 
  useStore: useTetrixStateContext, 
  useDispatch: useTetrixDispatchContext,
  StoreContext: TetrixStoreContext
} = createSubscriptionStore<TetrixReducerState, TetrixAction>(
  tetrixReducer,
  initialState,
  'TetrixState'
);
