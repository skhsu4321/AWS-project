import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {Text} from 'react-native';
import {configureStore} from '@reduxjs/toolkit';
import {ThemeProvider, useTheme} from '../ThemeContext';
import authSlice from '../../store/slices/authSlice';
import {UserMode, Currency} from '../../models/User';

// Test component that uses the theme
const TestComponent: React.FC = () => {
  const {theme, colorScheme} = useTheme();
  return (
    <Text testID="theme-test">
      {`Mode: ${colorScheme}, Primary: ${theme.colors.primary}`}
    </Text>
  );
};

describe('ThemeContext', () => {
  it('provides adult theme by default', () => {
    const store = configureStore({
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

    const {getByTestId} = render(
      <Provider store={store}>
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      </Provider>
    );

    const themeText = getByTestId('theme-test');
    expect(themeText.props.children).toContain('Mode: adult');
  });

  it('provides child theme when user mode is child', () => {
    const store = configureStore({
      reducer: {
        auth: authSlice,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: {
            id: 'test-user',
            email: 'test@example.com',
            profile: {
              displayName: 'Test Child',
              age: 8,
              mode: UserMode.CHILD,
              currency: Currency.HKD,
              timezone: 'Asia/Hong_Kong',
              preferences: {
                theme: 'auto' as const,
                notifications: true,
                language: 'en',
                soundEnabled: true,
                hapticFeedback: true,
              },
            },
            createdAt: new Date(),
            lastLoginAt: new Date(),
            isEmailVerified: true,
            isActive: true,
          },
          loading: false,
          error: null,
          isInitialized: true,
        },
      },
    });

    const {getByTestId} = render(
      <Provider store={store}>
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      </Provider>
    );

    const themeText = getByTestId('theme-test');
    expect(themeText.props.children).toContain('Mode: child');
  });

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    console.error = originalError;
  });
});