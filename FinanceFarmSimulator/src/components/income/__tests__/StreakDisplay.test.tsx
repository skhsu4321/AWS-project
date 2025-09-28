import React from 'react';
import { render } from '@testing-library/react-native';
import { StreakDisplay } from '../StreakDisplay';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('StreakDisplay', () => {
  it('renders correctly with zero streak', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <StreakDisplay currentStreak={0} />
    );

    expect(getByTestId('streak-display')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
    expect(getByText('Start Your Streak!')).toBeTruthy();
    expect(getByText('1.0x')).toBeTruthy(); // Current multiplier
    expect(getByText('1.1x')).toBeTruthy(); // Next multiplier
  });

  it('renders correctly with active streak', () => {
    const { getByText } = renderWithTheme(
      <StreakDisplay currentStreak={5} highestStreak={10} />
    );

    expect(getByText('5')).toBeTruthy();
    expect(getByText('Building Momentum')).toBeTruthy();
    expect(getByText('1.5x')).toBeTruthy(); // Current multiplier for 5-day streak
    expect(getByText('10')).toBeTruthy(); // Highest streak
  });

  it('renders correctly with high streak', () => {
    const { getByText } = renderWithTheme(
      <StreakDisplay currentStreak={15} highestStreak={20} />
    );

    expect(getByText('15')).toBeTruthy();
    expect(getByText('Streak Master')).toBeTruthy();
    expect(getByText('2.0x')).toBeTruthy(); // Max multiplier reached
  });

  it('renders correctly at maximum multiplier', () => {
    const { getByText, queryByText } = renderWithTheme(
      <StreakDisplay currentStreak={20} highestStreak={25} />
    );

    expect(getByText('20')).toBeTruthy();
    expect(getByText('Legendary Streak!')).toBeTruthy();
    expect(getByText('2.0x')).toBeTruthy();
    
    // Should not show next multiplier arrow when at max
    expect(queryByText('→')).toBeNull();
  });

  it('shows appropriate encouragement messages', () => {
    // Zero streak
    const { getByText: getByTextZero } = renderWithTheme(
      <StreakDisplay currentStreak={0} />
    );
    expect(getByTextZero(/Log your income daily to build streaks/)).toBeTruthy();

    // Low streak
    const { getByText: getByTextLow } = renderWithTheme(
      <StreakDisplay currentStreak={3} />
    );
    expect(getByTextLow(/Keep it up! Each day of logging increases/)).toBeTruthy();

    // Good streak
    const { getByText: getByTextGood } = renderWithTheme(
      <StreakDisplay currentStreak={10} />
    );
    expect(getByTextGood(/Amazing streak! You're earning great multiplier/)).toBeTruthy();

    // Max multiplier
    const { getByText: getByTextMax } = renderWithTheme(
      <StreakDisplay currentStreak={20} />
    );
    expect(getByTextMax(/Maximum multiplier achieved/)).toBeTruthy();
  });

  it('calculates progress to next milestone correctly', () => {
    const { getByText } = renderWithTheme(
      <StreakDisplay currentStreak={3} />
    );

    // Should show progress to next 5-day milestone
    expect(getByText('2 days to next milestone')).toBeTruthy();
  });

  it('shows correct streak emojis for different levels', () => {
    // Test different streak levels and their corresponding emojis
    const testCases = [
      { streak: 0, expectedTitle: 'Start Your Streak!' },
      { streak: 2, expectedTitle: 'Getting Started' },
      { streak: 5, expectedTitle: 'Building Momentum' },
      { streak: 10, expectedTitle: 'On Fire!' },
      { streak: 20, expectedTitle: 'Streak Master' },
      { streak: 35, expectedTitle: 'Legendary Streak!' },
    ];

    testCases.forEach(({ streak, expectedTitle }) => {
      const { getByText } = renderWithTheme(
        <StreakDisplay currentStreak={streak} />
      );
      expect(getByText(expectedTitle)).toBeTruthy();
    });
  });

  it('handles custom next milestone', () => {
    const { getByText } = renderWithTheme(
      <StreakDisplay currentStreak={7} nextMilestone={10} />
    );

    expect(getByText('3 days to next milestone')).toBeTruthy();
  });

  it('displays stats correctly', () => {
    const { getByText } = renderWithTheme(
      <StreakDisplay currentStreak={8} highestStreak={15} />
    );

    // Check stats row
    expect(getByText('8')).toBeTruthy(); // Current streak
    expect(getByText('15')).toBeTruthy(); // Best ever
    expect(getByText('1.8x')).toBeTruthy(); // Current multiplier
    
    // Check labels
    expect(getByText('Current')).toBeTruthy();
    expect(getByText('Best Ever')).toBeTruthy();
    expect(getByText('Multiplier')).toBeTruthy();
  });

  it('applies correct test ID', () => {
    const { getByTestId } = renderWithTheme(
      <StreakDisplay currentStreak={5} testID="custom-streak-display" />
    );

    expect(getByTestId('custom-streak-display')).toBeTruthy();
  });
});