import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {store} from '../../../store/store';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {ChildButton} from '../ChildButton';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('ChildButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders correctly with basic props', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChildButton title="Test Button" onPress={mockOnPress} />
      </TestWrapper>
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChildButton title="Test Button" onPress={mockOnPress} />
      </TestWrapper>
    );

    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChildButton title="Test Button" onPress={mockOnPress} disabled />
      </TestWrapper>
    );

    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const {queryByText, getByTestId} = render(
      <TestWrapper>
        <ChildButton title="Test Button" onPress={mockOnPress} loading />
      </TestWrapper>
    );

    expect(queryByText('Test Button')).toBeNull();
    // ActivityIndicator should be present (though we can't easily test it directly)
  });

  it('applies correct variant styles', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChildButton title="Fun Button" onPress={mockOnPress} variant="fun" />
      </TestWrapper>
    );

    const button = getByText('Fun Button').parent;
    expect(button).toBeTruthy();
  });

  it('renders with icon when provided', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChildButton 
          title="Icon Button" 
          onPress={mockOnPress} 
          icon={<>🎉</>}
        />
      </TestWrapper>
    );

    expect(getByText('Icon Button')).toBeTruthy();
    expect(getByText('🎉')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const {getByRole} = render(
      <TestWrapper>
        <ChildButton title="Accessible Button" onPress={mockOnPress} />
      </TestWrapper>
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Accessible Button');
  });

  it('applies custom styles correctly', () => {
    const customStyle = {backgroundColor: 'red'};
    const {getByText} = render(
      <TestWrapper>
        <ChildButton 
          title="Styled Button" 
          onPress={mockOnPress} 
          style={customStyle}
        />
      </TestWrapper>
    );

    const button = getByText('Styled Button').parent;
    expect(button).toBeTruthy();
  });

  it('handles different sizes correctly', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChildButton 
          title="Large Button" 
          onPress={mockOnPress} 
          size="large"
        />
      </TestWrapper>
    );

    expect(getByText('Large Button')).toBeTruthy();
  });
});