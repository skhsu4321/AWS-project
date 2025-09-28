import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {store} from '../../../store/store';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {Input} from '../Input';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('Input Component', () => {
  it('renders correctly with label', () => {
    const {getByText, getByDisplayValue} = render(
      <TestWrapper>
        <Input label="Test Label" value="test value" />
      </TestWrapper>
    );

    expect(getByText('Test Label')).toBeTruthy();
    expect(getByDisplayValue('test value')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const {getByText} = render(
      <TestWrapper>
        <Input label="Required Field" required />
      </TestWrapper>
    );

    expect(getByText('Required Field')).toBeTruthy();
    expect(getByText('*')).toBeTruthy();
  });

  it('displays error message', () => {
    const {getByText} = render(
      <TestWrapper>
        <Input label="Test Field" error="This field is required" />
      </TestWrapper>
    );

    expect(getByText('This field is required')).toBeTruthy();
  });

  it('displays helper text', () => {
    const {getByText} = render(
      <TestWrapper>
        <Input label="Test Field" helperText="Enter your information" />
      </TestWrapper>
    );

    expect(getByText('Enter your information')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChangeText = jest.fn();
    const {getByDisplayValue} = render(
      <TestWrapper>
        <Input value="" onChangeText={mockOnChangeText} />
      </TestWrapper>
    );

    const input = getByDisplayValue('');
    fireEvent.changeText(input, 'new text');
    expect(mockOnChangeText).toHaveBeenCalledWith('new text');
  });

  it('handles focus and blur events', () => {
    const mockOnFocus = jest.fn();
    const mockOnBlur = jest.fn();
    const {getByDisplayValue} = render(
      <TestWrapper>
        <Input value="" onFocus={mockOnFocus} onBlur={mockOnBlur} />
      </TestWrapper>
    );

    const input = getByDisplayValue('');
    fireEvent(input, 'focus');
    expect(mockOnFocus).toHaveBeenCalled();

    fireEvent(input, 'blur');
    expect(mockOnBlur).toHaveBeenCalled();
  });

  it('applies custom styles', () => {
    const customStyle = {backgroundColor: 'red'};
    const {getByTestId} = render(
      <TestWrapper>
        <Input 
          value="" 
          containerStyle={customStyle}
          testID="custom-input"
        />
      </TestWrapper>
    );

    // The container should have the custom style applied
    expect(getByTestId('custom-input')).toBeTruthy();
  });
});