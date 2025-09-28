import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Security utilities for authentication and data protection
 */

/**
 * Generate a secure random token
 */
export const generateSecureToken = async (length: number = 32): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate a unique ID for database records (synchronous)
 */
export const generateId = (): string => {
  // Generate a simple UUID-like string using timestamp and random values
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
};

/**
 * Hash a password or sensitive string using SHA-256
 */
export const hashString = async (input: string): Promise<string> => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return digest;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} => {
  const errors: string[] = [];
  let score = 0;

  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  // Contains uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Contains lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Contains number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Contains special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Length bonus
  if (password.length >= 12) {
    score += 1;
  }

  return {
    isValid: errors.length === 0 && score >= 4,
    errors,
    score: Math.min(score, 5), // Max score of 5
  };
};

/**
 * Sanitize user input to prevent injection attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could be used for injection
    .substring(0, 1000); // Limit length
};

/**
 * Validate email format with additional security checks
 */
export const validateEmail = (email: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Check for suspicious patterns
  if (email.includes('..')) {
    errors.push('Email contains invalid consecutive dots');
  }

  if (email.length > 254) {
    errors.push('Email is too long');
  }

  if (email.split('@')[0].length > 64) {
    errors.push('Email local part is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Secure storage wrapper for sensitive data
 */
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'finance_farm_secure_key';

  /**
   * Store sensitive data securely
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      // In a production app, you would use a proper encryption library
      // For now, we'll use base64 encoding as a basic obfuscation
      const encodedValue = Buffer.from(value).toString('base64');
      await AsyncStorage.setItem(`secure_${key}`, encodedValue);
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw new Error('Failed to store secure data');
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const encodedValue = await AsyncStorage.getItem(`secure_${key}`);
      if (!encodedValue) return null;
      
      return Buffer.from(encodedValue, 'base64').toString();
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('Error removing secure data:', error);
      throw new Error('Failed to remove secure data');
    }
  }

  /**
   * Clear all secure data
   */
  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith('secure_'));
      await AsyncStorage.multiRemove(secureKeys);
    } catch (error) {
      console.error('Error clearing secure data:', error);
      throw new Error('Failed to clear secure data');
    }
  }
}

/**
 * Rate limiting for authentication attempts
 */
export class RateLimiter {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Check if an action is rate limited
   */
  static isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attemptData = this.attempts.get(identifier);

    if (!attemptData) {
      return false;
    }

    // Reset if lockout period has passed
    if (now - attemptData.lastAttempt > this.LOCKOUT_DURATION) {
      this.attempts.delete(identifier);
      return false;
    }

    return attemptData.count >= this.MAX_ATTEMPTS;
  }

  /**
   * Record a failed attempt
   */
  static recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const attemptData = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };

    // Reset count if enough time has passed
    if (now - attemptData.lastAttempt > this.LOCKOUT_DURATION) {
      attemptData.count = 0;
    }

    attemptData.count += 1;
    attemptData.lastAttempt = now;
    this.attempts.set(identifier, attemptData);
  }

  /**
   * Clear attempts for successful authentication
   */
  static clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining lockout time in milliseconds
   */
  static getRemainingLockoutTime(identifier: string): number {
    const attemptData = this.attempts.get(identifier);
    if (!attemptData || attemptData.count < this.MAX_ATTEMPTS) {
      return 0;
    }

    const elapsed = Date.now() - attemptData.lastAttempt;
    return Math.max(0, this.LOCKOUT_DURATION - elapsed);
  }
}

/**
 * Session management utilities
 */
export class SessionManager {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour

  /**
   * Check if a session is valid
   */
  static isSessionValid(sessionData: any): boolean {
    if (!sessionData || !sessionData.expiresAt) {
      return false;
    }

    const expiresAt = new Date(sessionData.expiresAt);
    return expiresAt > new Date();
  }

  /**
   * Check if a session needs refresh
   */
  static needsRefresh(sessionData: any): boolean {
    if (!sessionData || !sessionData.expiresAt) {
      return true;
    }

    const expiresAt = new Date(sessionData.expiresAt);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    return timeUntilExpiry < this.REFRESH_THRESHOLD;
  }

  /**
   * Generate session expiry time
   */
  static generateExpiryTime(): Date {
    return new Date(Date.now() + this.SESSION_TIMEOUT);
  }
}

/**
 * Input validation for child accounts
 */
export const validateChildAccountData = (data: {
  age: number;
  parentAccountId?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.age < 6) {
    errors.push('Child must be at least 6 years old to use the app');
  }

  if (data.age > 17) {
    errors.push('Users 18 and older should use adult mode');
  }

  if (data.age < 13 && !data.parentAccountId) {
    errors.push('Children under 13 must have a linked parent account');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};