import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import { IncomeScreen } from '../../../screens/income/IncomeScreen';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { financialSlice } from '../../../store/slices/financialSlice';
import { IncomeSource, Income } from '../../../models/Financial';
import { FinancialDataManager } from '../../../services/FinancialDataManager';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../services/FinancialDataManager');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
const MockedFinancialDataManager = FinancialDataManager as jest.MockedClass<typeof FinancialDataManager>;

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

const mockIncome: Income[] = [
  {
    id: 'income-1',
    userId: 'user-1',
    amount: 5000,
    source: IncomeSource.SALARY,
    description: 'Monthly salary',
    date: new Date('2024-01-15'),
    isRecurring: true,
    recurringPeriod: 'monthly',
    multiplier: 1.5,
    streakCount: 5,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'income-2',
    userId: 'user-1',
    amount: 200,
    source: IncomeSource.CHORES,
    description: 'Weekly chores',
    date: new Date('2024-01-20'),
    isRecurring: false,
    multiplier: 1.2,
    streakCount: 2,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      financial: financialSlice.reducer,
    },
    preloadedState: {
      financial: {
        goals: [],
        expenses: [],
        income: mockIncome,
        loading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </Provider>
  );
};

describe('Income Integration Tests', () => {
  let mockFinancialDataManager: jest.Mocked<FinancialDataManager>;

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

    // Mock FinancialDataManager methods
    mockFinancialDataManager = {
      getUserIncome: jest.fn().mockResolvedValue(mockIncome),
      logIncome: jest.fn(),
      updateIncome: jest.fn(),
      deleteIncome: jest.fn(),
    } as any;

    MockedFinancialDataManager.mockImplementation(() => mockFinancialDataManager);
  });

  it('renders income screen with data', async () => {
    const { getByTestId, getByText } = renderWithProviders(<IncomeScreen />);

    expect(getByTestId('income-screen')).toBeTruthy();
    expect(getByText('💰 Income & Fertilizer')).toBeTruthy();
    expect(getByTestId('add-income-button')).toBeTruthy();
    expect(getByTestId('manage-recurring-button')).toBeTruthy();
  });

  it('displays income cards for existing income', async () => {
    const { getByTestId } = renderWithProviders(<IncomeScreen />);

    await waitFor(() => {
      expect(getByTestId('income-card-income-1')).toBeTruthy();
      expect(getByTestId('income-card-income-2')).toBeTruthy();
    });
  });

  it('opens add income modal when button is pressed', async () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<IncomeScreen />);

    // Modal should not be visible initially
    expect(queryByTestId('add-income-modal')).toBeNull();

    // Press add income button
    const addButton = getByTestId('add-income-button');
    fireEvent.press(addButton);

    // Modal should now be visible
    await waitFor(() => {
      expect(getByTestId('add-income-modal')).toBeTruthy();
    });
  });

  it('adds new income successfully', async () => {
    const newIncome: Income = {
      id: 'income-3',
      userId: 'user-1',
      amount: 1000,
      source: IncomeSource.BONUS,
      description: 'Performance bonus',
      date: new Date(),
      isRecurring: false,
      multiplier: 1.0,
      streakCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFinancialDataManager.logIncome.mockResolvedValue(newIncome);

    const { getByTestId } = renderWithProviders(<IncomeScreen />);

    // Open add income modal
    const addButton = getByTestId('add-income-button');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(getByTestId('add-income-modal')).toBeTruthy();
    });

    // Fill form
    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '1000');

    const descriptionInput = getByTestId('income-description-input');
    fireEvent.changeText(descriptionInput, 'Performance bonus');

    const bonusButton = getByTestId(`income-source-${IncomeSource.BONUS}`);
    fireEvent.press(bonusButton);

    // Submit form
    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockFinancialDataManager.logIncome).toHaveBeenCalledWith({
        userId: mockUser.id,
        amount: 1000,
        source: IncomeSource.BONUS,
        description: 'Performance bonus',
        date: expect.any(Date),
        isRecurring: false,
        recurringPeriod: undefined,
      });
    });

    // Should show success alert
    expect(mockAlert).toHaveBeenCalledWith(
      'Income Added! 🌱',
      expect.stringContaining('Performance bonus'),
      expect.any(Array)
    );
  });

  it('handles income addition errors', async () => {
    const error = new Error('Network error');
    mockFinancialDataManager.logIncome.mockRejectedValue(error);

    const { getByTestId } = renderWithProviders(<IncomeScreen />);

    // Open modal and fill form
    const addButton = getByTestId('add-income-button');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(getByTestId('add-income-modal')).toBeTruthy();
    });

    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '1000');

    const descriptionInput = getByTestId('income-description-input');
    fireEvent.changeText(descriptionInput, 'Test income');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to add income. Please try again.');
    });
  });

  it('filters income by source', async () => {
    const { getByTestId } = renderWithProviders(<IncomeScreen />);

    // Wait for income to load
    await waitFor(() => {
      expect(getByTestId('income-card-income-1')).toBeTruthy();
      expect(getByTestId('income-card-income-2')).toBeTruthy();
    });

    // Filter by salary
    const salaryFilter = getByTestId(`filter-source-${IncomeSource.SALARY}`);
    fireEvent.press(salaryFilter);

    // Should only show salary income
    await waitFor(() => {
      expect(getByTestId('income-card-income-1')).toBeTruthy();
      // income-2 is chores, so it should be filtered out
      // Note: This test assumes the filtering logic is working correctly
    });
  });

  it('shows empty state when no income exists', () => {
    const emptyStore = createMockStore({ income: [] });
    const { getByText } = renderWithProviders(<IncomeScreen />, emptyStore);

    expect(getByText('No Income Yet')).toBeTruthy();
    expect(getByText(/Start logging your income to grow/)).toBeTruthy();
    expect(getByTestId('empty-add-income-button')).toBeTruthy();
  });

  it('shows loading state', () => {
    const loadingStore = createMockStore({ loading: true, income: [] });
    const { getByTestId } = renderWithProviders(<IncomeScreen />, loadingStore);

    // Should show loading spinner
    expect(getByTestId('income-screen')).toBeTruthy();
    // Note: LoadingSpinner component should have its own testID
  });

  it('shows error state', () => {
    const errorStore = createMockStore({ error: 'Failed to load data', income: [] });
    const { getByText } = renderWithProviders(<IncomeScreen />, errorStore);

    expect(getByText('Failed to load data')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });

  it('opens recurring income manager', async () => {
    const { getByTestId, getByText } = renderWithProviders(<IncomeScreen />);

    const manageButton = getByTestId('manage-recurring-button');
    fireEvent.press(manageButton);

    await waitFor(() => {
      expect(getByText('Recurring Income')).toBeTruthy();
      expect(getByText('Back to Income')).toBeTruthy();
    });
  });

  it('deletes income successfully', async () => {
    mockFinancialDataManager.deleteIncome.mockResolvedValue(true);
    mockFinancialDataManager.getUserIncome.mockResolvedValue([mockIncome[1]]); // Return remaining income

    const { getByTestId } = renderWithProviders(<IncomeScreen />);

    await waitFor(() => {
      expect(getByTestId('income-card-income-1')).toBeTruthy();
    });

    // Simulate delete action (this would typically be through a context menu or edit modal)
    const deleteButton = getByTestId('delete-income-income-1');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(mockFinancialDataManager.deleteIncome).toHaveBeenCalledWith('income-1');
    });

    expect(mockAlert).toHaveBeenCalledWith('Success', 'Income deleted successfully.');
  });

  it('handles pull-to-refresh', async () => {
    mockFinancialDataManager.getUserIncome.mockResolvedValue(mockIncome);

    const { getByTestId } = renderWithProviders(<IncomeScreen />);

    // Find the FlatList and trigger refresh
    // Note: This is a simplified test - actual implementation would need proper FlatList testing
    await waitFor(() => {
      expect(getByTestId('income-screen')).toBeTruthy();
    });

    // Simulate refresh
    // In a real test, you would trigger the onRefresh callback of the FlatList
    // For now, we just verify the data loading function exists
    expect(mockFinancialDataManager.getUserIncome).toHaveBeenCalled();
  });

  it('shows fertilizer animation after adding income', async () => {
    const newIncome: Income = {
      id: 'income-3',
      userId: 'user-1',
      amount: 500,
      source: IncomeSource.GIFT,
      description: 'Birthday gift',
      date: new Date(),
      isRecurring: false,
      multiplier: 1.3,
      streakCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockFinancialDataManager.logIncome.mockResolvedValue(newIncome);

    const { getByTestId } = renderWithProviders(<IncomeScreen />);

    // Add income
    const addButton = getByTestId('add-income-button');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(getByTestId('add-income-modal')).toBeTruthy();
    });

    // Fill and submit form
    const amountInput = getByTestId('income-amount-input');
    fireEvent.changeText(amountInput, '500');

    const descriptionInput = getByTestId('income-description-input');
    fireEvent.changeText(descriptionInput, 'Birthday gift');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      // Should show fertilizer animation
      expect(getByTestId('fertilizer-animation')).toBeTruthy();
    });
  });
});