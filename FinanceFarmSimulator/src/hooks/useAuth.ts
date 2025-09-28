import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  initializeAuth,
  loginUser,
  registerUser,
  socialLogin,
  logoutUser,
  updateProfile,
  changePassword,
  resetPassword,
  verifyEmail,
  clearError,
} from '../store/slices/authSlice';
import { LoginCredentials, RegisterCredentials, SocialLoginProvider, UserProfile } from '../models/User';
import { authService } from '../services/AuthService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);

  // Initialize auth on first load
  useEffect(() => {
    if (!authState.isInitialized) {
      dispatch(initializeAuth() as any);
    }
  }, [dispatch, authState.isInitialized]);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      // This will be handled by the auth state change listener in the service
      // The service will update the Redux store accordingly
    });

    return unsubscribe;
  }, []);

  const login = async (credentials: LoginCredentials) => {
    return dispatch(loginUser(credentials) as any);
  };

  const register = async (credentials: RegisterCredentials) => {
    return dispatch(registerUser(credentials) as any);
  };

  const loginWithSocial = async (provider: SocialLoginProvider) => {
    return dispatch(socialLogin(provider) as any);
  };

  const logout = async () => {
    return dispatch(logoutUser() as any);
  };

  const updateUserProfile = async (userId: string, profile: Partial<UserProfile>) => {
    return dispatch(updateProfile({ userId, profile }) as any);
  };

  const changeUserPassword = async (currentPassword: string, newPassword: string) => {
    return dispatch(changePassword({ currentPassword, newPassword }) as any);
  };

  const sendPasswordReset = async (email: string) => {
    return dispatch(resetPassword(email) as any);
  };

  const sendEmailVerification = async () => {
    return dispatch(verifyEmail() as any);
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
    isInitialized: authState.isInitialized,

    // Actions
    login,
    register,
    loginWithSocial,
    logout,
    updateUserProfile,
    changeUserPassword,
    sendPasswordReset,
    sendEmailVerification,
    clearAuthError,

    // Computed properties
    isAdult: authState.user?.profile.mode === 'adult',
    isChild: authState.user?.profile.mode === 'child',
    hasParentAccount: !!authState.user?.profile.parentAccountId,
    isEmailVerified: authState.user?.isEmailVerified ?? false,
  };
};