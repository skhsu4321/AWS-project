import {Dimensions} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export const dimensions = {
  screen: {
    width: screenWidth,
    height: screenHeight,
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    small: 320,
    medium: 768,
    large: 1024,
  },
  
  // Component dimensions
  component: {
    buttonHeight: {
      small: 36,
      medium: 44,
      large: 52,
    },
    inputHeight: 48,
    tabBarHeight: 60,
    headerHeight: 56,
    cardMinHeight: 120,
    touchTargetSize: 44, // Minimum touch target size for accessibility
  },
  
  // Child mode adjustments - larger touch targets
  child: {
    buttonHeight: {
      small: 44,
      medium: 52,
      large: 60,
    },
    inputHeight: 56,
    tabBarHeight: 70,
    headerHeight: 64,
    cardMinHeight: 140,
    touchTargetSize: 56,
  },
  
  // Border radius
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xl: 16,
    round: 50,
  },
};

// Helper functions for responsive design
export const isSmallScreen = () => screenWidth < dimensions.breakpoints.medium;
export const isMediumScreen = () => 
  screenWidth >= dimensions.breakpoints.medium && screenWidth < dimensions.breakpoints.large;
export const isLargeScreen = () => screenWidth >= dimensions.breakpoints.large;

export const getResponsiveValue = <T>(
  small: T,
  medium?: T,
  large?: T,
): T => {
  if (isLargeScreen() && large !== undefined) return large;
  if (isMediumScreen() && medium !== undefined) return medium;
  return small;
};