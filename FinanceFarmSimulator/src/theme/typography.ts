import {TextStyle} from 'react-native';

export const typography = {
  // Adult Mode Typography - Clean and professional
  adult: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 36,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 32,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 20,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 28,
      letterSpacing: 0.15,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    button: {
      fontSize: 14,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 20,
      letterSpacing: 0.1,
      textTransform: 'uppercase' as TextStyle['textTransform'],
    },
  },
  
  // Child Mode Typography - Larger and more readable
  child: {
    h1: {
      fontSize: 36,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 44,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 32,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 40,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 28,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 36,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 24,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 32,
      letterSpacing: 0.15,
    },
    body1: {
      fontSize: 18,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 26,
      letterSpacing: 0.15,
    },
    body2: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 22,
      letterSpacing: 0.25,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 18,
      letterSpacing: 0.4,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 22,
      letterSpacing: 0.1,
      textTransform: 'uppercase' as TextStyle['textTransform'],
    },
  },
};

export type TypographyVariant = keyof typeof typography.adult;
export type ThemeTypography = typeof typography.adult;