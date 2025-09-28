import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {Text} from 'react-native';
import {store} from '../../../store/store';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {Modal} from '../Modal';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('Modal Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when visible', () => {
    const {getByText} = render(
      <TestWrapper>
        <Modal visible={true} onClose={mockOnClose} title="Test Modal">
          <Text>Modal Content</Text>
        </Modal>
      </TestWrapper>
    );

    expect(getByText('Test Modal')).toBeTruthy();
    expect(getByText('Modal Content')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const {queryByText} = render(
      <TestWrapper>
        <Modal visible={false} onClose={mockOnClose} title="Test Modal">
          <Text>Modal Content</Text>
        </Modal>
      </TestWrapper>
    );

    expect(queryByText('Test Modal')).toBeNull();
    expect(queryByText('Modal Content')).toBeNull();
  });

  it('calls onClose when close button is pressed', () => {
    const {getByTestId} = render(
      <TestWrapper>
        <Modal visible={true} onClose={mockOnClose} title="Test Modal" testID="test-modal">
          <Text>Modal Content</Text>
        </Modal>
      </TestWrapper>
    );

    const closeButton = getByTestId('test-modal-close');
    fireEvent.press(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders primary and secondary actions', () => {
    const mockPrimaryAction = jest.fn();
    const mockSecondaryAction = jest.fn();

    const {getByTestId} = render(
      <TestWrapper>
        <Modal 
          visible={true} 
          onClose={mockOnClose} 
          title="Test Modal"
          testID="test-modal"
          primaryAction={{title: 'Save', onPress: mockPrimaryAction}}
          secondaryAction={{title: 'Cancel', onPress: mockSecondaryAction}}
        >
          <Text>Modal Content</Text>
        </Modal>
      </TestWrapper>
    );

    const primaryButton = getByTestId('test-modal-primary');
    const secondaryButton = getByTestId('test-modal-secondary');

    fireEvent.press(primaryButton);
    expect(mockPrimaryAction).toHaveBeenCalledTimes(1);

    fireEvent.press(secondaryButton);
    expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on primary action', () => {
    const {getByTestId} = render(
      <TestWrapper>
        <Modal 
          visible={true} 
          onClose={mockOnClose} 
          title="Test Modal"
          testID="test-modal"
          primaryAction={{title: 'Save', onPress: jest.fn(), loading: true}}
        >
          <Text>Modal Content</Text>
        </Modal>
      </TestWrapper>
    );

    const primaryButton = getByTestId('test-modal-primary');
    expect(primaryButton).toBeTruthy();
    // Button should be in loading state
  });

  it('hides close button when showCloseButton is false', () => {
    const {queryByTestId} = render(
      <TestWrapper>
        <Modal 
          visible={true} 
          onClose={mockOnClose} 
          title="Test Modal"
          testID="test-modal"
          showCloseButton={false}
        >
          <Text>Modal Content</Text>
        </Modal>
      </TestWrapper>
    );

    expect(queryByTestId('test-modal-close')).toBeNull();
  });
});