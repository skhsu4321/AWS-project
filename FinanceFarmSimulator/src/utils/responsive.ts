import React from 'react';
import {Dimensions} from 'react-native';
import {dimensions, getResponsiveValue} from '../theme/dimensions';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export interface ResponsiveConfig<T> {
  small: T;
  medium?: T;
  large?: T;
}

export const responsive = {
  // Screen size helpers
  isSmallScreen: () => screenWidth < dimensions.breakpoints.medium,
  isMediumScreen: () => 
    screenWidth >= dimensions.breakpoints.medium && screenWidth < dimensions.breakpoints.large,
  isLargeScreen: () => screenWidth >= dimensions.breakpoints.large,
  
  // Get responsive value based on screen size
  getValue: getResponsiveValue,
  
  // Common responsive patterns
  padding: {
    horizontal: getResponsiveValue(16, 24, 32),
    vertical: getResponsiveValue(12, 16, 20),
  },
  
  fontSize: {
    small: getResponsiveValue(12, 13, 14),
    medium: getResponsiveValue(14, 16, 18),
    large: getResponsiveValue(16, 18, 20),
    xlarge: getResponsiveValue(20, 24, 28),
  },
  
  spacing: {
    xs: getResponsiveValue(4, 6, 8),
    sm: getResponsiveValue(8, 10, 12),
    md: getResponsiveValue(16, 20, 24),
    lg: getResponsiveValue(24, 28, 32),
    xl: getResponsiveValue(32, 40, 48),
  },
  
  // Grid system
  columns: getResponsiveValue(1, 2, 3),
  
  // Component sizing
  buttonHeight: getResponsiveValue(44, 48, 52),
  inputHeight: getResponsiveValue(48, 52, 56),
  cardPadding: getResponsiveValue(16, 20, 24),
};

// Hook for responsive values that update on orientation change
export const useResponsive = () => {
  const [screenData, setScreenData] = React.useState(Dimensions.get('window'));

  React.useEffect(() => {
    const onChange = (result: {window: any}) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  return {
    ...responsive,
    screenWidth: screenData.width,
    screenHeight: screenData.height,
  };
};

// Re-export for convenience
export {getResponsiveValue};