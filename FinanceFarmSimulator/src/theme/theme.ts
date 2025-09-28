import { colors, ColorScheme, ThemeColors } from './colors';
import { typography, ThemeTypography } from './typography';
import { spacing } from './spacing';
import { dimensions } from './dimensions';

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: typeof spacing;
  dimensions: typeof dimensions;
  mode: ColorScheme;
}

export const createTheme = (mode: ColorScheme): Theme => ({
  colors: {
    ...colors[mode],
    common: colors.common,
  },
  typography: typography[mode],
  spacing: mode === 'child' ? { ...spacing, component: spacing.child } : spacing,
  dimensions: mode === 'child' ? { ...dimensions, component: dimensions.child } : dimensions,
  mode,
});

// Default themes
export const adultTheme = createTheme('adult');
export const childTheme = createTheme('child');

export type { ColorScheme, ThemeColors, ThemeTypography };