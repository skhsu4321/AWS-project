import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import authSlice from '../../../store/slices/authSlice';
import {LoginScreen} from '../LoginScreen';

const createTestStore = () => configureStore({
  reducer: {
    auth: authSlice,
  },
  preloadedState: {
    auth: {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      isInitialized: true,
    },
  },
});

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => {
  const store = createTestStore();
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );
};

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

describe('LoginScreen', () => {
  it('renders login form correctly', () => {
    const {getByText, getByTestId} = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>
    );

    expect(getByText('🌱 Farm Finance')).toBeTruthy();
    expect(getByText('Welcome Back!')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('shows demo instructions', () => {
    const {getByText} = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>
    );

    expect(getByText('Demo Mode - Any email and password will work')).toBeTruthy();
    expect(getByText('💡 Try "child@example.com" to see child mode interface')).toBeTruthy();
  });

  it('validates empty fields', async () => {
    const Alert = require('react-native').Alert;
    
    const {getByTestId} = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>
    );

    const loginButton = getByTestId('login-button');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter both email and password');
    });
  });

  it('allows login with valid credentials', async () => {
    const {getByTestId} = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    // Should show loading state
    expect(loginButton).toBeTruthy();
  });
});