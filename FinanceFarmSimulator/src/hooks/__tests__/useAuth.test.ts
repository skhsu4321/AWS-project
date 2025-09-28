import { renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../useAuth';
import { authSlice } from '../../store/slices/authSlice';
import { UserMode, Currency } from '../../models/User';
import React from 'react';

// Mock the AuthService
jest.mock('../../services/AuthService', () => ({
  authService: {
    onAuthStateChange: jest.fn(() => jest.fn()),
  },
}));

describe('useAuth', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    profile: {
      displayName: 'Test User',
      age: 25,
      mode: UserMode.ADULT,
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
  };

  it('should return initial auth state', () => {
    const store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isInitialized).toBe(false);
  });

  it('should return authenticated state when user is logged in', () => {
    const store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
    });

    // Set authenticated state
    store.dispatch(authSlice.actions.setUser(mockUser));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdult).toBe(true);
    expect(result.current.isChild).toBe(false);
    expect(result.current.hasParentAccount).toBe(false);
    expect(result.current.isEmailVerified).toBe(true);
  });

  it('should return child user properties correctly', () => {
    const mockChildUser = {
      ...mockUser,
      id: 'child-user-id',
      profile: {
        ...mockUser.profile,
        mode: UserMode.CHILD,
        age: 10,
        parentAccountId: 'parent-id',
      },
    };

    const store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
    });

    store.dispatch(authSlice.actions.setUser(mockChildUser));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAdult).toBe(false);
    expect(result.current.isChild).toBe(true);
    expect(result.current.hasParentAccount).toBe(true);
  });
});