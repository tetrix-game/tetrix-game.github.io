import { createSubscriptionStore } from '../../utils/subscriptionStore';
import { ColorName } from '../../types';

export interface ColorOverrides {
  background: string;
  borderTop: string;
  borderLeft: string;
  borderBottom: string;
  borderRight: string;
}

export type ColorOverridesMap = Partial<Record<ColorName, Partial<ColorOverrides>>>;

export interface ColorPickerState {
  colorOverrides: ColorOverridesMap;
}

export type ColorPickerAction =
  | { type: 'SET_OVERRIDE'; color: ColorName; property: keyof ColorOverrides; value: string }
  | { type: 'RESET_ALL' }
  | { type: 'RESET_ONE'; color: ColorName };

const initialState: ColorPickerState = {
  colorOverrides: {}
};

const reducer = (state: ColorPickerState, action: ColorPickerAction): ColorPickerState => {
  switch (action.type) {
    case 'SET_OVERRIDE':
      return {
        ...state,
        colorOverrides: {
          ...state.colorOverrides,
          [action.color]: {
            ...state.colorOverrides[action.color],
            [action.property]: action.value
          }
        }
      };
    case 'RESET_ALL':
      return { ...state, colorOverrides: {} };
    case 'RESET_ONE': {
      const newOverrides = { ...state.colorOverrides };
      delete newOverrides[action.color];
      return { ...state, colorOverrides: newOverrides };
    }
    default:
      return state;
  }
};

export const {
  Provider: ColorPickerProvider,
  useStore: useColorPickerStore,
  useDispatch: useColorPickerDispatch,
  StoreContext: ColorPickerContext
} = createSubscriptionStore(reducer, initialState, 'ColorPicker');

