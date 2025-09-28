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
  accessibility: {
    fontSizeMultiplier: number;
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

export const createTheme = (
  mode: ColorScheme, 
  fontSizeMultiplier: number = 1.0,
  highContrast: boolean = false,
  reducedMotion: boolean = false
): Theme => {
  const baseMode = mode.includes('child') ? 'child' : 'adult';
  const colorScheme = highContrast 
    ? (baseMode === 'child' ? 'childHighContrast' : 'adultHighContrast')
    : mode;

  return {
    colors: {
      ...colors[colorScheme as keyof typeof colors],
      common: colors.common,
    },
    typography: applyFontSizeMultiplier(typography[baseMode], fontSizeMultiplier),
    spacing: baseMode === 'child' ? { ...spacing, component: spacing.child } : spacing,
    dimensions: baseMode === 'child' ? { ...dimensions, component: dimensions.child } : dimensions,
    mode,
    accessibility: {
      fontSizeMultiplier,
      highContrast,
      reducedMotion,
    },
  };
};

const applyFontSizeMultiplier = (baseTypography: ThemeTypography, multiplier: number): ThemeTypography => {
  const scaledTypography = {} as ThemeTypography;
  
  for (const [key, style] of Object.entries(baseTypography)) {
    scaledTypography[key as keyof ThemeTypography] = {
      ...style,
      fontSize: Math.round(style.fontSize * multiplier),
      lineHeight: Math.round(style.lineHeight * multiplier),
    };
  }
  
  return scaledTypography;
};

// Default themes
export const adultTheme = createTheme('adult');
export const childTheme = createTheme('child');
export const adultHighContrastTheme = createTheme('adult', 1.0, true);
export const childHighContrastTheme = createTheme('child', 1.0, true);

export type { ColorScheme, ThemeColors, ThemeTypography };