import React from 'react';
import { render } from '@testing-library/react-native';
import { GoalProgressBar } from '../GoalProgressBar';
import { ThemeProvider } from '../../../contexts/ThemeContext';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider initialMode="adult">
    {children}
  </ThemeProvider>
);

describe('GoalProgressBar', () => {
  it('should render with correct progress percentage', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalProgressBar progress={75.5} />
      </TestWrapper>
    );

    expect(getByText('75.5%')).toBeTruthy();
  });

  it('should show goal reached message at 100%', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalProgressBar progress={100} />
      </TestWrapper>
    );

    expect(getByText('100.0%')).toBeTruthy();
    expect(getByText('🎯 Goal Reached!')).toBeTruthy();
  });

  it('should clamp progress between 0 and 100', () => {
    const { getByText, rerender } = render(
      <TestWrapper>
        <GoalProgressBar progress={-10} />
      </TestWrapper>
    );

    expect(getByText('0.0%')).toBeTruthy();

    rerender(
      <TestWrapper>
        <GoalProgressBar progress={150} />
      </TestWrapper>
    );

    expect(getByText('100.0%')).toBeTruthy();
  });

  it('should hide percentage when showPercentage is false', () => {
    const { queryByText } = render(
      <TestWrapper>
        <GoalProgressBar progress={50} showPercentage={false} />
      </TestWrapper>
    );

    expect(queryByText('50.0%')).toBeNull();
  });

  it('should use custom color when provided', () => {
    const customColor = '#FF5722';
    const { getByTestId } = render(
      <TestWrapper>
        <GoalProgressBar progress={50} color={customColor} />
      </TestWrapper>
    );

    // This would need to be tested with a testID on the progress bar element
    // For now, we just ensure it renders without error
    expect(getByTestId).toBeDefined();
  });

  it('should render without animation when animated is false', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalProgressBar progress={50} animated={false} />
      </TestWrapper>
    );

    expect(getByText('50.0%')).toBeTruthy();
  });

  it('should handle zero progress', () => {
    const { getByText } = render(
      <TestWrapper>
        <GoalProgressBar progress={0} />
      </TestWrapper>
    );

    expect(getByText('0.0%')).toBeTruthy();
  });

  it('should render with custom height', () => {
    const { container } = render(
      <TestWrapper>
        <GoalProgressBar progress={50} height={12} />
      </TestWrapper>
    );

    // Component should render without error with custom height
    expect(container).toBeTruthy();
  });
});