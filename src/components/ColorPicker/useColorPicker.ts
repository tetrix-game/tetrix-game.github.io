import { useColorPickerStore, useColorPickerDispatch, ColorPickerState, ColorOverrides } from './ColorPickerContext';
import { ColorName } from '../../types';

export const useColorPicker = <Selected>(selector: (state: ColorPickerState) => Selected) => {
  const selected = useColorPickerStore(selector);
  const dispatch = useColorPickerDispatch();

  const setColorOverride = (color: ColorName, property: keyof ColorOverrides, value: string) => {
    dispatch({ type: 'SET_OVERRIDE', color, property, value });
  };

  const resetColorOverrides = () => {
    dispatch({ type: 'RESET_ALL' });
  };

  const resetColorOverride = (color: ColorName) => {
    dispatch({ type: 'RESET_ONE', color });
  };

  return {
    ...selected,
    setColorOverride,
    resetColorOverrides,
    resetColorOverride
  };
};
