import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import {
  User,
  UserProfile,
  LoginCredentials,
  RegisterCredentials,
  SocialLoginProvider,
  AuthSession,
  validateUser,
  validateUserProfile,
  validateLoginCredentials,
  validateRegisterCredentials,
  UserMode,
} from '../models/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthServiceInterface {
  register(credentials: RegisterCredentials): Promise<User>;
  login(credentials: LoginCredentials): Promise<User>;
  socialLogin(provider: SocialLoginProvider): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  verifyEmail(): Promise<void>;
  linkChildAccount(parentId: string, childId: string): Promise<void>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

class AuthService implements AuthServiceInterface {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Register a new user with email and password
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      // Validate input
      const validatedCredentials = validateRegisterCredentials(credentials);
      
      // Check if child mode requires parent account
      if (validatedCredentials.profile.mode === UserMode.CHILD && !validatedCredentials.profile.parentAccountId) {
        throw new Error('Child accounts must be linked to a parent account');
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        validatedCredentials.email,
        validatedCredentials.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: validatedCredentials.profile.displayName,
      });

      // Create user document in Firestore
      const user: User = {
        id: firebaseUser.uid,
        email: validatedCredentials.email,
        profile: validatedCredentials.profile,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: false,
        isActive: true,
      };

      await setDoc(doc(firestore, 'users', firebaseUser.uid), {
        ...user,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Store session
      await this.storeSession(user, await firebaseUser.getIdToken());

      this.currentUser = user;
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Validate input
      const validatedCredentials = validateLoginCredentials(credentials);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        validatedCredentials.email,
        validatedCredentials.password
      );

      const firebaseUser = userCredential.user;

      // Get user document from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        profile: userData.profile,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: firebaseUser.emailVerified,
        isActive: userData.isActive ?? true,
      };

      // Update last login time
      await updateDoc(doc(firestore, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
      });

      // Store session
      await this.storeSession(user, await firebaseUser.getIdToken());

      this.currentUser = user;
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Social login (Google)
   */
  async socialLogin(provider: SocialLoginProvider): Promise<User> {
    try {
      if (provider !== 'google') {
        throw new Error('Only Google login is currently supported');
      }

      // Note: In a real implementation, you would use Google Sign-In SDK
      // For now, we'll throw an error indicating it needs platform-specific setup
      throw new Error('Social login requires platform-specific configuration. Please use email/password login for now.');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      await this.clearSession();
      this.currentUser = null;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        // Try to restore from stored session
        const storedSession = await this.getStoredSession();
        if (storedSession && storedSession.expiresAt > new Date()) {
          return storedSession.user;
        }
        return null;
      }

      if (this.currentUser && this.currentUser.id === firebaseUser.uid) {
        return this.currentUser;
      }

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        profile: userData.profile,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
        isEmailVerified: firebaseUser.emailVerified,
        isActive: userData.isActive ?? true,
      };

      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      const validatedProfile = validateUserProfile({ ...this.currentUser?.profile, ...profile });
      
      // Update Firestore document
      await updateDoc(doc(firestore, 'users', userId), {
        profile: validatedProfile,
      });

      // Update current user if it's the same user
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser.profile = validatedProfile;
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, newPassword);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send email verification
   */
  async verifyEmail(): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('No authenticated user found');
      }

      await sendEmailVerification(firebaseUser);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Link child account to parent account
   */
  async linkChildAccount(parentId: string, childId: string): Promise<void> {
    try {
      // Update child's profile with parent ID
      await updateDoc(doc(firestore, 'users', childId), {
        'profile.parentAccountId': parentId,
      });

      // Update current user if it's the child
      if (this.currentUser && this.currentUser.id === childId) {
        this.currentUser.profile.parentAccountId = parentId;
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        this.currentUser = null;
        callback(null);
      }
    });
  }

  /**
   * Store authentication session
   */
  private async storeSession(user: User, token: string): Promise<void> {
    try {
      const session: AuthSession = {
        user,
        token,
        refreshToken: token, // In a real app, you'd get the refresh token
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      };

      await AsyncStorage.setItem('auth_session', JSON.stringify({
        ...session,
        expiresAt: session.expiresAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  /**
   * Get stored authentication session
   */
  private async getStoredSession(): Promise<AuthSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem('auth_session');
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      return {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt),
      };
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  }

  /**
   * Clear stored authentication session
   */
  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): Error {
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return new Error('No account found with this email address');
        case 'auth/wrong-password':
          return new Error('Incorrect password');
        case 'auth/email-already-in-use':
          return new Error('An account with this email already exists');
        case 'auth/weak-password':
          return new Error('Password is too weak');
        case 'auth/invalid-email':
          return new Error('Invalid email address');
        case 'auth/user-disabled':
          return new Error('This account has been disabled');
        case 'auth/too-many-requests':
          return new Error('Too many failed attempts. Please try again later');
        case 'auth/network-request-failed':
          return new Error('Network error. Please check your connection');
        default:
          return new Error(error.message || 'Authentication failed');
      }
    }
    
    return error instanceof Error ? error : new Error('Authentication failed');
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;