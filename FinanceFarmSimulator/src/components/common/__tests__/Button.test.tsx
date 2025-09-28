import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {store} from '../../../store/store';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {Button} from '../Button';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('Button Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders correctly with title', () => {
    const {getByText} = render(
      <TestWrapper>
        <Button title="Test Button" onPress={mockOnPress} />
      </TestWrapper>
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const {getByRole} = render(
      <TestWrapper>
        <Button title="Test Button" onPress={mockOnPress} />
      </TestWrapper>
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const {getByRole} = render(
      <TestWrapper>
        <Button title="Test Button" onPress={mockOnPress} disabled />
      </TestWrapper>
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const {getByTestId, queryByText} = render(
      <TestWrapper>
        <Button title="Test Button" onPress={mockOnPress} loading testID="test-button" />
      </TestWrapper>
    );

    expect(queryByText('Test Button')).toBeNull();
    // Loading indicator should be present (ActivityIndicator)
    expect(getByTestId('test-button')).toBeTruthy();
  });

  it('applies correct accessibility properties', () => {
    const {getByRole} = render(
      <TestWrapper>
        <Button title="Test Button" onPress={mockOnPress} />
      </TestWrapper>
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Test Button');
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('renders different variants correctly', () => {
    const variants = ['primary', 'secondary', 'outline', 'text'] as const;
    
    variants.forEach(variant => {
      const {getByTestId} = render(
        <TestWrapper>
          <Button 
            title="Test Button" 
            onPress={mockOnPress} 
            variant={variant}
            testID={`button-${variant}`}
          />
        </TestWrapper>
      );

      expect(getByTestId(`button-${variant}`)).toBeTruthy();
    });
  });

  it('renders different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const {getByTestId} = render(
        <TestWrapper>
          <Button 
            title="Test Button" 
            onPress={mockOnPress} 
            size={size}
            testID={`button-${size}`}
          />
        </TestWrapper>
      );

      expect(getByTestId(`button-${size}`)).toBeTruthy();
    });
  });
});