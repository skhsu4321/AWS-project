export const colors = {
  // Adult Mode Colors - Professional and clean
  adult: {
    primary: '#2E7D32', // Forest green
    primaryLight: '#4CAF50',
    primaryDark: '#1B5E20',
    secondary: '#FF8F00', // Amber
    secondaryLight: '#FFC107',
    secondaryDark: '#E65100',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceVariant: '#E8F5E8',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onBackground: '#1C1B1F',
    onSurface: '#1C1B1F',
    outline: '#79747E',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  
  // Child Mode Colors - Bright and playful
  child: {
    primary: '#4CAF50', // Bright green
    primaryLight: '#81C784',
    primaryDark: '#388E3C',
    secondary: '#FF9800', // Orange
    secondaryLight: '#FFB74D',
    secondaryDark: '#F57C00',
    background: '#FFF8E1', // Warm cream
    surface: '#FFFFFF',
    surfaceVariant: '#E8F5E8',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onBackground: '#3E2723',
    onSurface: '#3E2723',
    outline: '#8D6E63',
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    info: '#42A5F5',
  },
  
  // Common colors used in both modes
  common: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

export type ColorScheme = 'adult' | 'child';
export type ThemeColors = typeof colors.adult;