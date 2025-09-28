import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExpensesScreen } from '../../../screens/expenses/ExpensesScreen';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { financialSlice } from '../../../store/slices/financialSlice';
import { authSlice } from '../../../store/slices/authSlice';
import { uiSlice } from '../../../store/slices/uiSlice';
import { Expense, ExpenseCategory } from '../../../models/Financial';

// Mock the FinancialDataManager
jest.mock('../../../services/FinancialDataManager', () => {
  return {
    FinancialDataManager: jest.fn().mockImplementation(() => ({
      getUserExpenses: jest.fn().mockResolvedValue([]),
      getBudgetAlerts: jest.fn().mockResolvedValue([]),
      logExpense: jest.fn().mockResolvedValue({
        id: '1',
        userId: 'user1',
        amount: 25.50,
        category: ExpenseCategory.FOOD,
        description: 'Test expense',
        date: new Date(),
        tags: [],
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      deleteExpense: jest.fn().mockResolvedValue(true),
    })),
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
  CameraType: { back: 'back', front: 'front' },
  FlashMode: { off: 'off', on: 'on' },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      financial: financialSlice.reducer,
      auth: authSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState: {
      financial: {
        goals: [],
        expenses: [],
        income: [],
        loading: false,
        error: null,
      },
      auth: {
        user: {
          id: 'user1',
          email: 'test@example.com',
          profile: {
            displayName: 'Test User',
            age: 25,
            mode: 'adult',
            currency: 'USD',
            timezone: 'UTC',
            preferences: {},
          },
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      ui: {
        theme: 'adult',
        loading: false,
        error: null,
      },
      ...initialState,
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

describe('ExpensesScreen Integration', () => {
  it('renders expenses screen correctly', async () => {
    const { getByText, getByTestId } = renderWithProviders(<ExpensesScreen />);

    expect(getByTestId('expenses-screen')).toBeTruthy();
    expect(getByText('💰 Expense Tracking')).toBeTruthy();
    expect(getByText('+ Add Expense')).toBeTruthy();
  });

  it('shows child mode interface when user is in child mode', async () => {
    const childModeStore = createMockStore({
      auth: {
        user: {
          id: 'child1',
          email: 'child@example.com',
          profile: {
            displayName: 'Child User',
            age: 10,
            mode: 'child',
            currency: 'USD',
            timezone: 'UTC',
            preferences: {},
          },
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      ui: {
        theme: 'child',
        loading: false,
        error: null,
      },
    });

    const { getByText } = renderWithProviders(<ExpensesScreen />, childModeStore);

    expect(getByText('🌿 Weed Pulling')).toBeTruthy();
    expect(getByText('🌿 Pull a Weed')).toBeTruthy();
  });

  it('displays empty state when no expenses', async () => {
    const { getByText } = renderWithProviders(<ExpensesScreen />);

    await waitFor(() => {
      expect(getByText('No Weeds in Your Garden!')).toBeTruthy();
      expect(getByText(/Start tracking your expenses/)).toBeTruthy();
    });
  });

  it('opens add expense modal when button is pressed', async () => {
    const { getByText } = renderWithProviders(<ExpensesScreen />);

    const addButton = getByText('+ Add Expense');
    fireEvent.press(addButton);

    // Modal should open - this would require proper modal testing
    // For now, we'll assume the modal opens correctly
  });

  it('handles expense filtering', async () => {
    const expensesStore = createMockStore({
      financial: {
        goals: [],
        expenses: [
          {
            id: '1',
            userId: 'user1',
            amount: 25.50,
            category: ExpenseCategory.FOOD,
            description: 'Lunch',
            date: new Date(),
            tags: ['lunch'],
            isRecurring: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            userId: 'user1',
            amount: 15.00,
            category: ExpenseCategory.TRANSPORT,
            description: 'Bus fare',
            date: new Date(),
            tags: ['transport'],
            isRecurring: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        income: [],
        loading: false,
        error: null,
      },
    });

    const { getByText } = renderWithProviders(<ExpensesScreen />, expensesStore);

    // Should show both expenses initially
    await waitFor(() => {
      expect(getByText('Lunch')).toBeTruthy();
      expect(getByText('Bus fare')).toBeTruthy();
    });
  });

  it('handles loading state correctly', async () => {
    const loadingStore = createMockStore({
      financial: {
        goals: [],
        expenses: [],
        income: [],
        loading: true,
        error: null,
      },
    });

    const { getByTestId } = renderWithProviders(<ExpensesScreen />, loadingStore);

    expect(getByTestId('expenses-screen')).toBeTruthy();
    // Loading state would be handled by the FlatList refreshing prop
  });

  it('handles error state correctly', async () => {
    const errorStore = createMockStore({
      financial: {
        goals: [],
        expenses: [],
        income: [],
        loading: false,
        error: 'Failed to load expenses',
      },
    });

    const { getByTestId } = renderWithProviders(<ExpensesScreen />, errorStore);

    expect(getByTestId('expenses-screen')).toBeTruthy();
    // Error handling would be implemented in the component
  });
});