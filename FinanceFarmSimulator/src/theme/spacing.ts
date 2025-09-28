export const spacing = {
  // Base spacing unit (4px)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Component-specific spacing
  component: {
    buttonPadding: {
      horizontal: 16,
      vertical: 12,
    },
    cardPadding: 16,
    screenPadding: 16,
    sectionSpacing: 24,
    itemSpacing: 8,
  },
  
  // Child mode adjustments - larger touch targets
  child: {
    buttonPadding: {
      horizontal: 20,
      vertical: 16,
    },
    cardPadding: 20,
    screenPadding: 20,
    sectionSpacing: 28,
    itemSpacing: 12,
  },
};

export type SpacingKey = keyof typeof spacing;