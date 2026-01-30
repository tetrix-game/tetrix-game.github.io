/**
 * ThemeProvider - Applies theme styles to the application via CSS custom properties
 */

import React from 'react';

import { colorUtils } from '../colorUtils';
import { useTetrixStateContext } from '../TetrixProvider';
import { themeUtils } from '../themeUtils';

const { BLOCK_COLOR_PALETTES, blockPaletteToCssVars } = colorUtils;
const { THEME_DEFINITIONS, themeToCssVars } = themeUtils;

type ThemeProviderProps = {
  children: React.ReactNode;
};

/**
 * Component that applies theme-specific CSS custom properties to its children
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { currentTheme } = useTetrixStateContext();

  // Get theme definitions
  const theme = THEME_DEFINITIONS[currentTheme];
  const blockColors = blockPaletteToCssVars(BLOCK_COLOR_PALETTES[currentTheme]);

  // Combine theme CSS variables with block color variables
  const themeStyle = {
    background: theme.background,
    color: theme.text,
    ...themeToCssVars(theme, currentTheme),
    ...blockColors,
  } as React.CSSProperties & Record<string, string>;

  return (
    <div className="App" style={themeStyle}>
      {children}
    </div>
  );
};
