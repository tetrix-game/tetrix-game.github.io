import React, { createContext, useState, ReactNode } from 'react';
import { ColorName } from '../../types';

interface ColorOverrides {
  background: string;
  borderTop: string;
  borderLeft: string;
  borderBottom: string;
  borderRight: string;
}

type ColorOverridesMap = Partial<Record<ColorName, Partial<ColorOverrides>>>;

interface ColorPickerContextType {
  colorOverrides: ColorOverridesMap;
  setColorOverride: (color: ColorName, property: keyof ColorOverrides, value: string) => void;
  resetColorOverrides: () => void;
  resetColorOverride: (color: ColorName) => void;
}

export const ColorPickerContext = createContext<ColorPickerContextType | undefined>(undefined);

interface ColorPickerProviderProps {
  children: ReactNode;
}

export const ColorPickerProvider: React.FC<ColorPickerProviderProps> = ({ children }) => {
  const [colorOverrides, setColorOverrides] = useState<ColorOverridesMap>({});

  const setColorOverride = (color: ColorName, property: keyof ColorOverrides, value: string) => {
    setColorOverrides(prev => ({
      ...prev,
      [color]: {
        ...prev[color],
        [property]: value
      }
    }));
  };

  const resetColorOverrides = () => {
    setColorOverrides({});
  };

  const resetColorOverride = (color: ColorName) => {
    setColorOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[color];
      return newOverrides;
    });
  };

  return (
    <ColorPickerContext.Provider value={{ colorOverrides, setColorOverride, resetColorOverrides, resetColorOverride }}>
      {children}
    </ColorPickerContext.Provider>
  );
};
