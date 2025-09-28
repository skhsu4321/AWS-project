import { configureStore } from '@reduxjs/toolkit';
import { authSlice, initializeAuth, loginUser, registerUser, logoutUser, updateProfile } from '../authSlice';
import { UserMode, Currency } from '../../../models/User';

// Mock the AuthService
jest.mock('../../../services/AuthService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateUserProfile: jest.fn(),
  },
}));

interface RootState {
  auth: ReturnType<typeof authSlice.reducer>;
}

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore<RootState>>;

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
    isEmailVerified: false,
    isActive: true,
  };

  beforeEach(() => {
    store = configureStore<RootState>({
      reducer: {
        auth: authSlice.reducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        isInitialized: false,
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle setLoading', () => {
      store.dispatch(authSlice.actions.setLoading(true));
      expect(store.getState().auth.loading).toBe(true);
    });

    it('should handle setError', () => {
      const errorMessage = 'Test error';
      store.dispatch(authSlice.actions.setError(errorMessage));
      expect(store.getState().auth.error).toBe(errorMessage);
    });

    it('should handle clearError', () => {
      store.dispatch(authSlice.actions.setError('Test error'));
      store.dispatch(authSlice.actions.clearError());
      expect(store.getState().auth.error).toBeNull();
    });

    it('should handle setUser', () => {
      store.dispatch(authSlice.actions.setUser(mockUser));
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle setUser with null', () => {
      store.dispatch(authSlice.actions.setUser(null));
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('initializeAuth', () => {
    it('should handle successful initialization', async () => {
      const { authService } = require('../../../services/AuthService');
      authService.getCurrentUser.mockResolvedValue(mockUser);

      await store.dispatch(initializeAuth());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle initialization with no user', async () => {
      const { authService } = require('../../../services/AuthService');
      authService.getCurrentUser.mockResolvedValue(null);

      await store.dispatch(initializeAuth());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle initialization error', async () => {
      const { authService } = require('../../../services/AuthService');
      const errorMessage = 'Initialization failed';
      authService.getCurrentUser.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(initializeAuth());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('loginUser', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should handle successful login', async () => {
      const { authService } = require('../../../services/AuthService');
      authService.login.mockResolvedValue(mockUser);

      await store.dispatch(loginUser(loginCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it('should handle login error', async () => {
      const { authService } = require('../../../services/AuthService');
      const errorMessage = 'Invalid credentials';
      authService.login.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(loginUser(loginCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe(errorMessage);
    });

    it('should set loading state during login', () => {
      const { authService } = require('../../../services/AuthService');
      authService.login.mockImplementation(() => new Promise(() => {})); // Never resolves

      store.dispatch(loginUser(loginCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('registerUser', () => {
    const registerCredentials = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      profile: mockUser.profile,
    };

    it('should handle successful registration', async () => {
      const { authService } = require('../../../services/AuthService');
      authService.register.mockResolvedValue(mockUser);

      await store.dispatch(registerUser(registerCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it('should handle registration error', async () => {
      const { authService } = require('../../../services/AuthService');
      const errorMessage = 'Email already exists';
      authService.register.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(registerUser(registerCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('logoutUser', () => {
    it('should handle successful logout', async () => {
      // First set a user
      store.dispatch(authSlice.actions.setUser(mockUser));

      const { authService } = require('../../../services/AuthService');
      authService.logout.mockResolvedValue(undefined);

      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should handle logout error', async () => {
      const { authService } = require('../../../services/AuthService');
      const errorMessage = 'Logout failed';
      authService.logout.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('updateProfile', () => {
    const profileUpdate = {
      displayName: 'Updated Name',
    };

    it('should handle successful profile update', async () => {
      const { authService } = require('../../../services/AuthService');
      const updatedUser = { ...mockUser, profile: { ...mockUser.profile, displayName: 'Updated Name' } };
      
      authService.updateUserProfile.mockResolvedValue(undefined);
      authService.getCurrentUser.mockResolvedValue(updatedUser);

      await store.dispatch(updateProfile({ userId: 'test-user-id', profile: profileUpdate }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(updatedUser);
      expect(state.error).toBeNull();
    });

    it('should handle profile update error', async () => {
      const { authService } = require('../../../services/AuthService');
      const errorMessage = 'Profile update failed';
      authService.updateUserProfile.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(updateProfile({ userId: 'test-user-id', profile: profileUpdate }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('loading states', () => {
    it('should set loading to true when async actions are pending', () => {
      const { authService } = require('../../../services/AuthService');
      
      // Mock to return a promise that never resolves to keep it in pending state
      authService.login.mockImplementation(() => new Promise(() => {}));

      store.dispatch(loginUser({ email: 'test@example.com', password: 'password123' }));

      expect(store.getState().auth.loading).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should preserve existing state when errors occur', async () => {
      // Set initial user
      store.dispatch(authSlice.actions.setUser(mockUser));

      const { authService } = require('../../../services/AuthService');
      authService.updateUserProfile.mockRejectedValue(new Error('Update failed'));

      await store.dispatch(updateProfile({ userId: 'test-user-id', profile: { displayName: 'New Name' } }));

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser); // Should preserve original user
      expect(state.error).toBe('Update failed');
    });
  });
});