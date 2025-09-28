import { render, RenderOptions } from '@testing-library/react-native';
import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from '../store';
import { ThemeProvider } from '../contexts/ThemeContext';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  profile: {
    displayName: 'Test User',
    age: 25,
    mode: 'adult' as const,
    currency: 'HKD',
    timezone: 'Asia/Hong_Kong',
    preferences: {
      theme: 'light' as const,
      notifications: true,
      language: 'en',
    },
  },
  createdAt: new Date('2024-01-01'),
  lastLoginAt: new Date(),
};

export const mockChildUser = {
  ...mockUser,
  id: 'test-child-id',
  email: 'child@example.com',
  profile: {
    ...mockUser.profile,
    displayName: 'Test Child',
    age: 8,
    mode: 'child' as const,
    parentAccountId: 'test-parent-id',
  },
};

export const mockSavingsGoal = {
  id: 'test-goal-id',
  userId: 'test-user-id',
  title: 'New Phone',
  description: 'Save for iPhone 15',
  targetAmount: 8000,
  currentAmount: 2000,
  deadline: new Date('2024-12-31'),
  category: 'electronics' as const,
  cropType: 'apple' as const,
  createdAt: new Date('2024-01-01'),
  status: 'active' as const,
};

export const mockExpense = {
  id: 'test-expense-id',
  userId: 'test-user-id',
  amount: 150,
  category: 'food' as const,
  description: 'Lunch at restaurant',
  date: new Date(),
  isRecurring: false,
  tags: ['restaurant', 'lunch'],
};

export const mockIncome = {
  id: 'test-income-id',
  userId: 'test-user-id',
  amount: 5000,
  source: 'salary' as const,
  description: 'Monthly salary',
  date: new Date(),
  isRecurring: true,
  multiplier: 1.2,
};

export const mockFarm = {
  id: 'test-farm-id',
  userId: 'test-user-id',
  layout: {
    width: 10,
    height: 10,
    plots: [],
  },
  crops: [],
  decorations: [],
  healthScore: 85,
  level: 3,
  experience: 1250,
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

export const waitForAnimationFrame = (): Promise<void> => {
  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
};

// Security testing utilities
export const generateSecureTestData = () => ({
  sensitiveData: 'encrypted-test-data',
  token: 'test-jwt-token',
  encryptedField: 'encrypted-value',
});

// Re-export everything from testing library
export * from '@testing-library/react-native';
export { customRender as render };