import {
  generateSecureToken,
  hashString,
  validatePasswordStrength,
  sanitizeInput,
  validateEmail,
  SecureStorage,
  RateLimiter,
  SessionManager,
  validateChildAccountData,
} from '../security';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    HEX: 'HEX',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('Security Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecureToken', () => {
    it('should generate a secure token of specified length', async () => {
      const { getRandomBytesAsync } = require('expo-crypto');
      getRandomBytesAsync.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));

      const token = await generateSecureToken(4);

      expect(getRandomBytesAsync).toHaveBeenCalledWith(4);
      expect(token).toBe('01020304');
    });

    it('should generate a token of default length when no length specified', async () => {
      const { getRandomBytesAsync } = require('expo-crypto');
      getRandomBytesAsync.mockResolvedValue(new Uint8Array(32));

      await generateSecureToken();

      expect(getRandomBytesAsync).toHaveBeenCalledWith(32);
    });
  });

  describe('hashString', () => {
    it('should hash a string using SHA-256', async () => {
      const { digestStringAsync } = require('expo-crypto');
      digestStringAsync.mockResolvedValue('hashed_string');

      const result = await hashString('test_input');

      expect(digestStringAsync).toHaveBeenCalledWith(
        'SHA256',
        'test_input',
        { encoding: 'HEX' }
      );
      expect(result).toBe('hashed_string');
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(3);
    });

    it('should reject a weak password', () => {
      const result = validatePasswordStrength('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(4);
    });

    it('should identify specific password weaknesses', () => {
      const result = validatePasswordStrength('password');

      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should give bonus points for longer passwords', () => {
      const shortResult = validatePasswordStrength('StrongP1!'); // 9 chars
      const longResult = validatePasswordStrength('VeryStrongPassword123!'); // 21 chars

      expect(longResult.score).toBeGreaterThanOrEqual(shortResult.score);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeInput('<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove quotes', () => {
      const result = sanitizeInput('test "quoted" text');
      expect(result).not.toContain('"');
    });

    it('should trim whitespace', () => {
      const result = sanitizeInput('  test  ');
      expect(result).toBe('test');
    });

    it('should limit length to 1000 characters', () => {
      const longString = 'a'.repeat(1500);
      const result = sanitizeInput(longString);
      expect(result.length).toBe(1000);
    });
  });

  describe('validateEmail', () => {
    it('should validate a correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid email formats', () => {
      const testCases = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
      ];

      testCases.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is too long');
    });

    it('should reject emails with long local parts', () => {
      const longLocalPart = 'a'.repeat(70) + '@example.com';
      const result = validateEmail(longLocalPart);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email local part is too long');
    });
  });

  describe('SecureStorage', () => {
    it('should store data securely', async () => {
      const mockSetItem = AsyncStorage.setItem as jest.Mock;
      mockSetItem.mockResolvedValue(undefined);

      await SecureStorage.setItem('test_key', 'test_value');

      expect(mockSetItem).toHaveBeenCalledWith(
        'secure_test_key',
        expect.any(String)
      );
    });

    it('should retrieve data securely', async () => {
      const mockGetItem = AsyncStorage.getItem as jest.Mock;
      const encodedValue = Buffer.from('test_value').toString('base64');
      mockGetItem.mockResolvedValue(encodedValue);

      const result = await SecureStorage.getItem('test_key');

      expect(mockGetItem).toHaveBeenCalledWith('secure_test_key');
      expect(result).toBe('test_value');
    });

    it('should return null for non-existent keys', async () => {
      const mockGetItem = AsyncStorage.getItem as jest.Mock;
      mockGetItem.mockResolvedValue(null);

      const result = await SecureStorage.getItem('non_existent_key');

      expect(result).toBeNull();
    });

    it('should remove data securely', async () => {
      const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;
      mockRemoveItem.mockResolvedValue(undefined);

      await SecureStorage.removeItem('test_key');

      expect(mockRemoveItem).toHaveBeenCalledWith('secure_test_key');
    });

    it('should clear all secure data', async () => {
      const mockGetAllKeys = AsyncStorage.getAllKeys as jest.Mock;
      const mockMultiRemove = AsyncStorage.multiRemove as jest.Mock;

      mockGetAllKeys.mockResolvedValue([
        'secure_key1',
        'secure_key2',
        'regular_key',
      ]);
      mockMultiRemove.mockResolvedValue(undefined);

      await SecureStorage.clear();

      expect(mockMultiRemove).toHaveBeenCalledWith(['secure_key1', 'secure_key2']);
    });
  });

  describe('RateLimiter', () => {
    beforeEach(() => {
      // Clear the static attempts map
      (RateLimiter as any).attempts.clear();
    });

    it('should not rate limit initially', () => {
      const isLimited = RateLimiter.isRateLimited('test_user');
      expect(isLimited).toBe(false);
    });

    it('should rate limit after max attempts', () => {
      const identifier = 'test_user';

      // Record max attempts
      for (let i = 0; i < 5; i++) {
        RateLimiter.recordFailedAttempt(identifier);
      }

      const isLimited = RateLimiter.isRateLimited(identifier);
      expect(isLimited).toBe(true);
    });

    it('should clear attempts after successful authentication', () => {
      const identifier = 'test_user';

      // Record some attempts
      RateLimiter.recordFailedAttempt(identifier);
      RateLimiter.recordFailedAttempt(identifier);

      // Clear attempts
      RateLimiter.clearAttempts(identifier);

      const isLimited = RateLimiter.isRateLimited(identifier);
      expect(isLimited).toBe(false);
    });

    it('should return remaining lockout time', () => {
      const identifier = 'test_user';

      // Record max attempts
      for (let i = 0; i < 5; i++) {
        RateLimiter.recordFailedAttempt(identifier);
      }

      const remainingTime = RateLimiter.getRemainingLockoutTime(identifier);
      expect(remainingTime).toBeGreaterThan(0);
    });

    it('should reset attempts after lockout period', () => {
      const identifier = 'test_user';

      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      let mockTime = Date.now();
      Date.now = jest.fn(() => mockTime);

      // Record max attempts
      for (let i = 0; i < 5; i++) {
        RateLimiter.recordFailedAttempt(identifier);
      }

      // Simulate lockout period passing
      mockTime += 16 * 60 * 1000; // 16 minutes

      const isLimited = RateLimiter.isRateLimited(identifier);
      expect(isLimited).toBe(false);

      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('SessionManager', () => {
    it('should validate a valid session', () => {
      const sessionData = {
        expiresAt: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      };

      const isValid = SessionManager.isSessionValid(sessionData);
      expect(isValid).toBe(true);
    });

    it('should invalidate an expired session', () => {
      const sessionData = {
        expiresAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      };

      const isValid = SessionManager.isSessionValid(sessionData);
      expect(isValid).toBe(false);
    });

    it('should indicate when session needs refresh', () => {
      const sessionData = {
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      };

      const needsRefresh = SessionManager.needsRefresh(sessionData);
      expect(needsRefresh).toBe(true);
    });

    it('should generate future expiry time', () => {
      const expiryTime = SessionManager.generateExpiryTime();
      expect(expiryTime.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('validateChildAccountData', () => {
    it('should validate valid child account data', () => {
      const data = {
        age: 10,
        parentAccountId: 'parent-123',
      };

      const result = validateChildAccountData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject children too young', () => {
      const data = {
        age: 4,
        parentAccountId: 'parent-123',
      };

      const result = validateChildAccountData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Child must be at least 6 years old to use the app');
    });

    it('should reject users too old for child mode', () => {
      const data = {
        age: 20,
        parentAccountId: 'parent-123',
      };

      const result = validateChildAccountData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Users 18 and older should use adult mode');
    });

    it('should require parent account for children under 13', () => {
      const data = {
        age: 10,
      };

      const result = validateChildAccountData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Children under 13 must have a linked parent account');
    });

    it('should allow children 13+ without parent account', () => {
      const data = {
        age: 15,
      };

      const result = validateChildAccountData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});