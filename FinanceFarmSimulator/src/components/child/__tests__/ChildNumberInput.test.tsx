import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {store} from '../../../store/store';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {ChildNumberInput} from '../ChildNumberInput';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('ChildNumberInput', () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    mockOnChangeText.mockClear();
  });

  it('renders correctly with basic props', () => {
    const {getByDisplayValue} = render(
      <TestWrapper>
        <ChildNumberInput value="10" onChangeText={mockOnChangeText} />
      </TestWrapper>
    );

    expect(getByDisplayValue('10')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const {getByDisplayValue} = render(
      <TestWrapper>
        <ChildNumberInput value="10" onChangeText={mockOnChangeText} />
      </TestWrapper>
    );

    const input = getByDisplayValue('10');
    fireEvent.changeText(input, '15');
    expect(mockOnChangeText).toHaveBeenCalledWith('15');
  });

  it('filters non-numeric input', () => {
    const {getByDisplayValue} = render(
      <TestWrapper>
        <ChildNumberInput value="10" onChangeText={mockOnChangeText} />
      </TestWrapper>
    );

    const input = getByDisplayValue('10');
    fireEvent.changeText(input, 'abc123');
    expect(mockOnChangeText).toHaveBeenCalledWith('123');
  });

  it('respects max value constraint', () => {
    const {getByDisplayValue} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="10" 
          onChangeText={mockOnChangeText} 
          maxValue={50}
        />
      </TestWrapper>
    );

    const input = getByDisplayValue('10');
    fireEvent.changeText(input, '100');
    // Should not call onChangeText because 100 > maxValue (50)
    expect(mockOnChangeText).not.toHaveBeenCalledWith('100');
  });

  it('respects min value constraint', () => {
    const {getByDisplayValue} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="10" 
          onChangeText={mockOnChangeText} 
          minValue={5}
        />
      </TestWrapper>
    );

    const input = getByDisplayValue('10');
    fireEvent.changeText(input, '2');
    // Should not call onChangeText because 2 < minValue (5)
    expect(mockOnChangeText).not.toHaveBeenCalledWith('2');
  });

  it('shows increment buttons in child mode', () => {
    // Mock child mode by setting up store state
    const {getByLabelText} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="10" 
          onChangeText={mockOnChangeText} 
          showIncrementButtons={true}
        />
      </TestWrapper>
    );

    expect(getByLabelText('Increase amount')).toBeTruthy();
    expect(getByLabelText('Decrease amount')).toBeTruthy();
  });

  it('increments value when plus button pressed', () => {
    const {getByLabelText} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="10" 
          onChangeText={mockOnChangeText} 
          showIncrementButtons={true}
          incrementStep={5}
        />
      </TestWrapper>
    );

    const incrementButton = getByLabelText('Increase amount');
    fireEvent.press(incrementButton);
    expect(mockOnChangeText).toHaveBeenCalledWith('15');
  });

  it('decrements value when minus button pressed', () => {
    const {getByLabelText} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="10" 
          onChangeText={mockOnChangeText} 
          showIncrementButtons={true}
          incrementStep={3}
        />
      </TestWrapper>
    );

    const decrementButton = getByLabelText('Decrease amount');
    fireEvent.press(decrementButton);
    expect(mockOnChangeText).toHaveBeenCalledWith('7');
  });

  it('does not decrement below min value', () => {
    const {getByLabelText} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="5" 
          onChangeText={mockOnChangeText} 
          showIncrementButtons={true}
          minValue={5}
        />
      </TestWrapper>
    );

    const decrementButton = getByLabelText('Decrease amount');
    fireEvent.press(decrementButton);
    expect(mockOnChangeText).not.toHaveBeenCalled();
  });

  it('does not increment above max value', () => {
    const {getByLabelText} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="50" 
          onChangeText={mockOnChangeText} 
          showIncrementButtons={true}
          maxValue={50}
        />
      </TestWrapper>
    );

    const incrementButton = getByLabelText('Increase amount');
    fireEvent.press(incrementButton);
    expect(mockOnChangeText).not.toHaveBeenCalled();
  });

  it('displays currency correctly', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="10" 
          onChangeText={mockOnChangeText} 
          currency="USD"
        />
      </TestWrapper>
    );

    expect(getByText('USD')).toBeTruthy();
  });

  it('shows label when provided', () => {
    const {getByText} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="10" 
          onChangeText={mockOnChangeText} 
          label="Amount to save"
        />
      </TestWrapper>
    );

    expect(getByText('Amount to save')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const {getByDisplayValue} = render(
      <TestWrapper>
        <ChildNumberInput 
          value="10" 
          onChangeText={mockOnChangeText} 
          disabled={true}
        />
      </TestWrapper>
    );

    const input = getByDisplayValue('10');
    expect(input.props.editable).toBe(false);
  });

  it('prevents multiple decimal points', () => {
    const {getByDisplayValue} = render(
      <TestWrapper>
        <ChildNumberInput value="10.5" onChangeText={mockOnChangeText} />
      </TestWrapper>
    );

    const input = getByDisplayValue('10.5');
    fireEvent.changeText(input, '10.5.5');
    // Should not call onChangeText with invalid decimal format
    expect(mockOnChangeText).not.toHaveBeenCalledWith('10.5.5');
  });
});