import {adultTheme, childTheme, createTheme} from '../theme';
import {colors} from '../colors';

describe('Theme System', () => {
  it('creates adult theme correctly', () => {
    const theme = createTheme('adult');
    
    expect(theme.mode).toBe('adult');
    expect(theme.colors).toEqual(colors.adult);
    expect(theme.typography).toBeDefined();
    expect(theme.spacing).toBeDefined();
    expect(theme.dimensions).toBeDefined();
  });

  it('creates child theme correctly', () => {
    const theme = createTheme('child');
    
    expect(theme.mode).toBe('child');
    expect(theme.colors).toEqual(colors.child);
    expect(theme.typography).toBeDefined();
    expect(theme.spacing).toBeDefined();
    expect(theme.dimensions).toBeDefined();
  });

  it('has different colors for adult and child modes', () => {
    expect(adultTheme.colors.primary).not.toBe(childTheme.colors.primary);
    expect(adultTheme.colors.background).not.toBe(childTheme.colors.background);
  });

  it('has larger typography for child mode', () => {
    expect(childTheme.typography.h1.fontSize).toBeGreaterThan(adultTheme.typography.h1.fontSize);
    expect(childTheme.typography.body1.fontSize).toBeGreaterThan(adultTheme.typography.body1.fontSize);
  });

  it('has larger spacing for child mode', () => {
    expect(childTheme.spacing.component.buttonPadding.horizontal)
      .toBeGreaterThan(adultTheme.spacing.component.buttonPadding.horizontal);
    expect(childTheme.dimensions.component.touchTargetSize)
      .toBeGreaterThan(adultTheme.dimensions.component.touchTargetSize);
  });
});