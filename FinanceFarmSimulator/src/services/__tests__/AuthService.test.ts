import { authService } from '../AuthService';
import { UserMode, Currency } from '../../models/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
  firestore: {},
}));

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
  GoogleAuthProvider: jest.fn(),
  signInWithCredential: jest.fn(),
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('AuthService', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    emailVerified: false,
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockUserProfile = {
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
  };

  const mockRegisterCredentials = {
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    profile: mockUserProfile,
  };

  const mockLoginCredentials = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new adult user', async () => {
      const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = require('firebase/auth');
      const { setDoc } = require('firebase/firestore');

      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      updateProfile.mockResolvedValue(undefined);
      sendEmailVerification.mockResolvedValue(undefined);
      setDoc.mockResolvedValue(undefined);

      const result = await authService.register(mockRegisterCredentials);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'Test User',
      });
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(setDoc).toHaveBeenCalled();
      expect(result.email).toBe('test@example.com');
      expect(result.profile.displayName).toBe('Test User');
    });

    it('should throw error for child user without parent account', async () => {
      const childCredentials = {
        ...mockRegisterCredentials,
        profile: {
          ...mockUserProfile,
          mode: UserMode.CHILD,
          age: 10,
        },
      };

      await expect(authService.register(childCredentials)).rejects.toThrow(
        'Child accounts must be linked to a parent account'
      );
    });

    it('should successfully register a child user with parent account', async () => {
      const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = require('firebase/auth');
      const { setDoc } = require('firebase/firestore');

      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      updateProfile.mockResolvedValue(undefined);
      sendEmailVerification.mockResolvedValue(undefined);
      setDoc.mockResolvedValue(undefined);

      const childCredentials = {
        ...mockRegisterCredentials,
        profile: {
          ...mockUserProfile,
          mode: UserMode.CHILD,
          age: 10,
          parentAccountId: 'parent-id',
        },
      };

      const result = await authService.register(childCredentials);

      expect(result.profile.mode).toBe(UserMode.CHILD);
      expect(result.profile.parentAccountId).toBe('parent-id');
    });

    it('should handle registration errors', async () => {
      const { createUserWithEmailAndPassword } = require('firebase/auth');

      createUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/email-already-in-use',
        message: 'Email already in use',
      });

      await expect(authService.register(mockRegisterCredentials)).rejects.toThrow(
        'An account with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      const { getDoc, updateDoc } = require('firebase/firestore');

      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          profile: mockUserProfile,
          createdAt: { toDate: () => new Date() },
          isActive: true,
        }),
      });
      updateDoc.mockResolvedValue(undefined);

      const result = await authService.login(mockLoginCredentials);

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result.email).toBe('test@example.com');
      expect(result.isEmailVerified).toBe(false);
    });

    it('should throw error if user profile not found', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      const { getDoc } = require('firebase/firestore');

      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(authService.login(mockLoginCredentials)).rejects.toThrow(
        'User profile not found'
      );
    });

    it('should handle login errors', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');

      signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/user-not-found',
        message: 'User not found',
      });

      await expect(authService.login(mockLoginCredentials)).rejects.toThrow(
        'No account found with this email address'
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      const { signOut } = require('firebase/auth');
      const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

      signOut.mockResolvedValue(undefined);
      mockRemoveItem.mockResolvedValue(undefined);

      await authService.logout();

      expect(signOut).toHaveBeenCalled();
      expect(mockRemoveItem).toHaveBeenCalledWith('auth_session');
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is authenticated', async () => {
      const { auth } = require('../../config/firebase');
      const mockGetItem = AsyncStorage.getItem as jest.Mock;

      auth.currentUser = null;
      mockGetItem.mockResolvedValue(null);

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return user from stored session if valid', async () => {
      const { auth } = require('../../config/firebase');
      const mockGetItem = AsyncStorage.getItem as jest.Mock;

      auth.currentUser = null;
      const futureDate = new Date(Date.now() + 3600000);
      mockGetItem.mockResolvedValue(JSON.stringify({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          profile: mockUserProfile,
        },
        expiresAt: futureDate.toISOString(),
      }));

      const result = await authService.getCurrentUser();

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('updateUserProfile', () => {
    it('should successfully update user profile', async () => {
      const { updateDoc } = require('firebase/firestore');

      updateDoc.mockResolvedValue(undefined);

      // Set current user first
      (authService as any).currentUser = {
        id: 'test-user-id',
        profile: mockUserProfile,
      };

      const profileUpdate = {
        displayName: 'Updated Name',
        age: 26,
        mode: mockUserProfile.mode,
        currency: mockUserProfile.currency,
        timezone: mockUserProfile.timezone,
        preferences: mockUserProfile.preferences,
      };

      await authService.updateUserProfile('test-user-id', profileUpdate);

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const { auth } = require('../../config/firebase');
      const { reauthenticateWithCredential, updatePassword, EmailAuthProvider } = require('firebase/auth');

      auth.currentUser = mockUser;
      EmailAuthProvider.credential.mockReturnValue('mock-credential');
      reauthenticateWithCredential.mockResolvedValue(undefined);
      updatePassword.mockResolvedValue(undefined);

      await authService.changePassword('oldPassword', 'newPassword');

      expect(reauthenticateWithCredential).toHaveBeenCalledWith(mockUser, 'mock-credential');
      expect(updatePassword).toHaveBeenCalledWith(mockUser, 'newPassword');
    });

    it('should throw error when no user is authenticated', async () => {
      const { auth } = require('../../config/firebase');

      auth.currentUser = null;

      await expect(authService.changePassword('oldPassword', 'newPassword')).rejects.toThrow(
        'No authenticated user found'
      );
    });
  });

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      const { sendPasswordResetEmail } = require('firebase/auth');

      sendPasswordResetEmail.mockResolvedValue(undefined);

      await authService.resetPassword('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'test@example.com');
    });
  });

  describe('verifyEmail', () => {
    it('should successfully send email verification', async () => {
      const { auth } = require('../../config/firebase');
      const { sendEmailVerification } = require('firebase/auth');

      auth.currentUser = mockUser;
      sendEmailVerification.mockResolvedValue(undefined);

      await authService.verifyEmail();

      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error when no user is authenticated', async () => {
      const { auth } = require('../../config/firebase');

      auth.currentUser = null;

      await expect(authService.verifyEmail()).rejects.toThrow(
        'No authenticated user found'
      );
    });
  });

  describe('linkChildAccount', () => {
    it('should successfully link child account to parent', async () => {
      const { updateDoc } = require('firebase/firestore');

      updateDoc.mockResolvedValue(undefined);

      await authService.linkChildAccount('parent-id', 'child-id');

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('socialLogin', () => {
    it('should throw error for unsupported provider', async () => {
      await expect(authService.socialLogin('apple' as any)).rejects.toThrow(
        'Only Google login is currently supported'
      );
    });

    it('should throw error indicating platform-specific setup needed', async () => {
      await expect(authService.socialLogin('google')).rejects.toThrow(
        'Social login requires platform-specific configuration'
      );
    });
  });

  describe('error handling', () => {
    it('should handle various Firebase auth error codes', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');

      const testCases = [
        { code: 'auth/wrong-password', expectedMessage: 'Incorrect password' },
        { code: 'auth/weak-password', expectedMessage: 'Password is too weak' },
        { code: 'auth/invalid-email', expectedMessage: 'Invalid email address' },
        { code: 'auth/user-disabled', expectedMessage: 'This account has been disabled' },
        { code: 'auth/too-many-requests', expectedMessage: 'Too many failed attempts. Please try again later' },
        { code: 'auth/network-request-failed', expectedMessage: 'Network error. Please check your connection' },
      ];

      for (const testCase of testCases) {
        signInWithEmailAndPassword.mockRejectedValue({
          code: testCase.code,
          message: 'Firebase error',
        });

        await expect(authService.login(mockLoginCredentials)).rejects.toThrow(
          testCase.expectedMessage
        );
      }
    });
  });
});