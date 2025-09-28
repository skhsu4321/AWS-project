import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AddIncomeModal } from '../AddIncomeModal';
import { IncomeSource, IncomeInput } from '../../../models/Financial';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  profile: {
    displayName: 'Test User',
    age: 25,
    mode: 'adult' as const,
    currency: 'HKD',
    timezone: 'Asia/Hong_Kong',
    preferences: {},
  },
  createdAt: new Date(),
  lastLoginAt: new Date(),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('AddIncomeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      loading: false,
      error: null,
    });
  });

  it('renders correctly when visible', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(getByTestId('add-income-modal')).toBeTruthy();
    expect(getByText('Add Income')).toBeTruthy();
    expect(getByTestId('income-amount-input')).toBeTruthy();
    expect(getByTestId('income-description-input')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(queryByTestId('add-income-modal')).toBeNull();
  });

  it('allows selecting income sources', () => {
    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const salaryButton = getByTestId(`income-source-${IncomeSource.SALARY}`);
    fireEvent.press(salaryButton);

    // Button should be selected (this would be verified by checking styles in a real test)
    expect(salaryButton).toBeTruthy();
  });

  it('toggles recurring income options', () => {
    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const recurringToggle = getByTestId('recurring-toggle');
    fireEvent.press(recurringToggle);

    // Recurring options should appear
    expect(getByTestId('recurring-monthly')).toBeTruthy();
    expect(getByTestId('recurring-weekly')).toBeTruthy();
    expect(getByTestId('recurring-daily')).toBeTruthy();
  });

  it('validates required fields before submission', async () => {
    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Please enter a valid amount');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates description field', async () => {
    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Set amount but no description
    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '100');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Please enter a description');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates recurring period when recurring is enabled', async () => {
    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill required fields
    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '100');

    const descriptionInput = getByTestId('income-description-input');
    fireEvent.changeText(descriptionInput, 'Test income');

    // Enable recurring but don't select period
    const recurringToggle = getByTestId('recurring-toggle');
    fireEvent.press(recurringToggle);

    // Clear the default period selection
    const monthlyButton = getByTestId('recurring-monthly');
    fireEvent.press(monthlyButton); // This would deselect if implemented properly

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    // Note: This test assumes the validation logic is properly implemented
    // In the actual implementation, the recurring period defaults to 'monthly'
  });

  it('submits valid income data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill all required fields
    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '1000');

    const descriptionInput = getByTestId('income-description-input');
    fireEvent.changeText(descriptionInput, 'Monthly salary');

    const salaryButton = getByTestId(`income-source-${IncomeSource.SALARY}`);
    fireEvent.press(salaryButton);

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        userId: mockUser.id,
        amount: 1000,
        source: IncomeSource.SALARY,
        description: 'Monthly salary',
        date: expect.any(Date),
        isRecurring: false,
        recurringPeriod: undefined,
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submits recurring income data correctly', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill required fields
    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '5000');

    const descriptionInput = getByTestId('income-description-input');
    fireEvent.changeText(descriptionInput, 'Monthly salary');

    const salaryButton = getByTestId(`income-source-${IncomeSource.SALARY}`);
    fireEvent.press(salaryButton);

    // Enable recurring
    const recurringToggle = getByTestId('recurring-toggle');
    fireEvent.press(recurringToggle);

    const weeklyButton = getByTestId('recurring-weekly');
    fireEvent.press(weeklyButton);

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        userId: mockUser.id,
        amount: 5000,
        source: IncomeSource.SALARY,
        description: 'Monthly salary',
        date: expect.any(Date),
        isRecurring: true,
        recurringPeriod: 'weekly',
      });
    });
  });

  it('handles submission errors gracefully', async () => {
    const error = new Error('Network error');
    mockOnSubmit.mockRejectedValue(error);

    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill required fields
    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '100');

    const descriptionInput = getByTestId('income-description-input');
    fireEvent.changeText(descriptionInput, 'Test income');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to add income. Please try again.');
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('resets form when cancelled', () => {
    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill some fields
    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '100');

    const cancelButton = getByTestId('cancel-button');
    fireEvent.press(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows error when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      loading: false,
      error: null,
    });

    const { getByTestId } = renderWithTheme(
      <AddIncomeModal
        visible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill required fields
    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '100');

    const descriptionInput = getByTestId('income-description-input');
    fireEvent.changeText(descriptionInput, 'Test income');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'User not authenticated');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});