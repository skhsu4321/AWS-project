import { AuthService } from '../../services/AuthService';
import { EncryptionService } from '../../services/EncryptionService';
import { SecureStorageService } from '../../services/SecureStorageService';
import { generateSecureTestData } from '../../utils/testHelpers';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
}));

describe('Authentication Security Tests', () => {
  let authService: AuthService;
  let encryptionService: EncryptionService;
  let secureStorageService: SecureStorageService;

  beforeEach(() => {
    authService = new AuthService();
    encryptionService = new EncryptionService();
    secureStorageService = new SecureStorageService();
  });

  describe('Password Security', () => {
    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'abc123',
        '12345678',
        'qwerty',
      ];

      for (const password of weakPasswords) {
        await expect(
          authService.register('test@example.com', password, {
            displayName: 'Test User',
            age: 25,
            mode: 'adult',
            currency: 'HKD',
            timezone: 'Asia/Hong_Kong',
            preferences: { theme: 'light', notifications: true, language: 'en' },
          })
        ).rejects.toThrow(/password.*strong/i);
      }
    });

    it('should accept strong passwords', async () => {
      const strongPasswords = [
        'MyStr0ngP@ssw0rd!',
        'C0mpl3x#P@ssw0rd',
        'S3cur3$P@ssw0rd123',
      ];

      for (const password of strongPasswords) {
        await expect(
          authService.register(`test${Date.now()}@example.com`, password, {
            displayName: 'Test User',
            age: 25,
            mode: 'adult',
            currency: 'HKD',
            timezone: 'Asia/Hong_Kong',
            preferences: { theme: 'light', notifications: true, language: 'en' },
          })
        ).resolves.toBeDefined();
      }
    });

    it('should hash passwords before storage', async () => {
      const password = 'MyStr0ngP@ssw0rd!';
      const user = await authService.register('test@example.com', password, {
        displayName: 'Test User',
        age: 25,
        mode: 'adult',
        currency: 'HKD',
        timezone: 'Asia/Hong_Kong',
        preferences: { theme: 'light', notifications: true, language: 'en' },
      });

      // Password should never be stored in plain text
      const storedData = await secureStorageService.getItem(`user_${user.id}`);
      expect(storedData).not.toContain(password);
    });
  });

  describe('Session Management', () => {
    it('should generate secure session tokens', async () => {
      const user = await authService.register('test@example.com', 'MyStr0ngP@ssw0rd!', {
        displayName: 'Test User',
        age: 25,
        mode: 'adult',
        currency: 'HKD',
        timezone: 'Asia/Hong_Kong',
        preferences: { theme: 'light', notifications: true, language: 'en' },
      });

      const token = await authService.getSessionToken();
      
      // Token should be long and random
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(32);
      expect(token).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
    });

    it('should expire sessions after timeout', async () => {
      await authService.register('test@example.com', 'MyStr0ngP@ssw0rd!', {
        displayName: 'Test User',
        age: 25,
        mode: 'adult',
        currency: 'HKD',
        timezone: 'Asia/Hong_Kong',
        preferences: { theme: 'light', notifications: true, language: 'en' },
      });

      const initialToken = await authService.getSessionToken();
      
      // Mock time passage
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later
      
      const expiredToken = await authService.getSessionToken();
      expect(expiredToken).not.toBe(initialToken);
    });

    it('should invalidate sessions on logout', async () => {
      await authService.register('test@example.com', 'MyStr0ngP@ssw0rd!', {
        displayName: 'Test User',
        age: 25,
        mode: 'adult',
        currency: 'HKD',
        timezone: 'Asia/Hong_Kong',
        preferences: { theme: 'light', notifications: true, language: 'en' },
      });

      const tokenBeforeLogout = await authService.getSessionToken();
      await authService.logout();
      
      const tokenAfterLogout = await authService.getSessionToken();
      expect(tokenAfterLogout).toBeNull();
    });

    it('should prevent session fixation attacks', async () => {
      // Attempt to set a predetermined session token
      const maliciousToken = 'malicious-token-123';
      
      await expect(
        authService.setSessionToken(maliciousToken)
      ).rejects.toThrow(/invalid.*token/i);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize email inputs', async () => {
      const maliciousEmails = [
        'test@example.com<script>alert("xss")</script>',
        'test@example.com"; DROP TABLE users; --',
        'test@example.com\x00admin@example.com',
      ];

      for (const email of maliciousEmails) {
        await expect(
          authService.register(email, 'MyStr0ngP@ssw0rd!', {
            displayName: 'Test User',
            age: 25,
            mode: 'adult',
            currency: 'HKD',
            timezone: 'Asia/Hong_Kong',
            preferences: { theme: 'light', notifications: true, language: 'en' },
          })
        ).rejects.toThrow(/invalid.*email/i);
      }
    });

    it('should validate user profile data', async () => {
      const maliciousProfile = {
        displayName: '<script>alert("xss")</script>',
        age: -1,
        mode: 'invalid' as any,
        currency: 'INVALID',
        timezone: '../../../etc/passwd',
        preferences: {
          theme: 'dark"; DROP TABLE users; --' as any,
          notifications: 'true' as any, // Should be boolean
          language: 'en<script>',
        },
      };

      await expect(
        authService.register('test@example.com', 'MyStr0ngP@ssw0rd!', maliciousProfile)
      ).rejects.toThrow(/invalid.*profile/i);
    });

    it('should prevent SQL injection in authentication', async () => {
      const sqlInjectionAttempts = [
        "admin'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'/**/UNION/**/SELECT/**/password/**/FROM/**/users--",
      ];

      for (const maliciousInput of sqlInjectionAttempts) {
        await expect(
          authService.login(maliciousInput, 'password')
        ).rejects.toThrow();
      }
    });
  });

  describe('Data Encryption', () => {
    it('should encrypt sensitive user data', async () => {
      const sensitiveData = {
        financialGoals: [{ amount: 10000, description: 'Secret goal' }],
        personalInfo: { income: 50000, expenses: 30000 },
      };

      const encrypted = await encryptionService.encrypt(JSON.stringify(sensitiveData));
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toContain('Secret goal');
      expect(encrypted).not.toContain('50000');
      expect(encrypted.length).toBeGreaterThan(sensitiveData.toString().length);
    });

    it('should decrypt data correctly', async () => {
      const originalData = 'Sensitive financial information';
      
      const encrypted = await encryptionService.encrypt(originalData);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(originalData);
    });

    it('should use different encryption keys for different users', async () => {
      const data = 'Same data for different users';
      
      const user1Key = await encryptionService.generateUserKey('user1');
      const user2Key = await encryptionService.generateUserKey('user2');
      
      const encrypted1 = await encryptionService.encryptWithKey(data, user1Key);
      const encrypted2 = await encryptionService.encryptWithKey(data, user2Key);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should fail gracefully with tampered encrypted data', async () => {
      const originalData = 'Important financial data';
      const encrypted = await encryptionService.encrypt(originalData);
      
      // Tamper with encrypted data
      const tamperedData = encrypted.slice(0, -10) + 'tampered123';
      
      await expect(
        encryptionService.decrypt(tamperedData)
      ).rejects.toThrow(/decryption.*failed/i);
    });
  });

  describe('Secure Storage', () => {
    it('should store data securely', async () => {
      const secureData = generateSecureTestData();
      
      await secureStorageService.setItem('test-key', JSON.stringify(secureData));
      const retrieved = await secureStorageService.getItem('test-key');
      
      expect(JSON.parse(retrieved)).toEqual(secureData);
    });

    it('should prevent unauthorized access to stored data', async () => {
      await secureStorageService.setItem('user1-data', 'user1-secret');
      
      // Attempt to access with different user context
      const unauthorizedAccess = await secureStorageService.getItemForUser('user1-data', 'user2');
      expect(unauthorizedAccess).toBeNull();
    });

    it('should clear sensitive data on logout', async () => {
      await secureStorageService.setItem('session-data', 'sensitive-session-info');
      await secureStorageService.setItem('user-preferences', 'user-settings');
      
      await secureStorageService.clearSensitiveData();
      
      const sessionData = await secureStorageService.getItem('session-data');
      const userPrefs = await secureStorageService.getItem('user-preferences');
      
      expect(sessionData).toBeNull();
      expect(userPrefs).toBeDefined(); // Non-sensitive data should remain
    });
  });

  describe('Brute Force Protection', () => {
    it('should implement rate limiting for login attempts', async () => {
      const email = 'test@example.com';
      const wrongPassword = 'wrongpassword';
      
      // First few attempts should be allowed
      for (let i = 0; i < 3; i++) {
        await expect(
          authService.login(email, wrongPassword)
        ).rejects.toThrow(/invalid.*credentials/i);
      }
      
      // Further attempts should be rate limited
      await expect(
        authService.login(email, wrongPassword)
      ).rejects.toThrow(/too.*many.*attempts/i);
    });

    it('should implement progressive delays for failed attempts', async () => {
      const email = 'test@example.com';
      const wrongPassword = 'wrongpassword';
      
      const attemptTimes: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        try {
          await authService.login(email, wrongPassword);
        } catch (error) {
          // Expected to fail
        }
        const endTime = Date.now();
        attemptTimes.push(endTime - startTime);
      }
      
      // Later attempts should take longer due to progressive delays
      expect(attemptTimes[4]).toBeGreaterThan(attemptTimes[0]);
    });

    it('should reset rate limiting after successful login', async () => {
      const email = 'test@example.com';
      const correctPassword = 'MyStr0ngP@ssw0rd!';
      
      // Register user first
      await authService.register(email, correctPassword, {
        displayName: 'Test User',
        age: 25,
        mode: 'adult',
        currency: 'HKD',
        timezone: 'Asia/Hong_Kong',
        preferences: { theme: 'light', notifications: true, language: 'en' },
      });
      
      // Make failed attempts
      for (let i = 0; i < 3; i++) {
        try {
          await authService.login(email, 'wrongpassword');
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Successful login should reset the counter
      await authService.login(email, correctPassword);
      
      // Should be able to make new attempts without rate limiting
      try {
        await authService.login(email, 'wrongpassword');
      } catch (error) {
        expect(error.message).not.toMatch(/too.*many.*attempts/i);
      }
    });
  });

  describe('Child Account Security', () => {
    it('should require parental verification for child accounts', async () => {
      const childProfile = {
        displayName: 'Child User',
        age: 8,
        mode: 'child' as const,
        currency: 'HKD',
        timezone: 'Asia/Hong_Kong',
        parentAccountId: 'parent-123',
        preferences: { theme: 'light', notifications: true, language: 'en' },
      };

      const childUser = await authService.register('child@example.com', 'ChildP@ssw0rd!', childProfile);
      
      // Child account should be pending verification
      expect(childUser.profile.verified).toBe(false);
      expect(childUser.profile.parentAccountId).toBe('parent-123');
    });

    it('should prevent child accounts from accessing adult features', async () => {
      const childUser = {
        id: 'child-123',
        profile: { mode: 'child', age: 8, parentAccountId: 'parent-123' },
      };

      await expect(
        authService.authorizeAdultFeature(childUser as any, 'financial-reports')
      ).rejects.toThrow(/unauthorized.*adult.*feature/i);
    });

    it('should require parental approval for sensitive actions', async () => {
      const childUser = {
        id: 'child-123',
        profile: { mode: 'child', age: 8, parentAccountId: 'parent-123' },
      };

      const sensitiveAction = {
        type: 'create-goal',
        amount: 1000,
        description: 'Expensive toy',
      };

      const result = await authService.requestParentalApproval(childUser as any, sensitiveAction);
      
      expect(result.requiresApproval).toBe(true);
      expect(result.approvalId).toBeDefined();
    });
  });

  describe('Security Headers and CSRF Protection', () => {
    it('should include security headers in API requests', async () => {
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await authService.login('test@example.com', 'password');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': expect.any(String),
          }),
        })
      );
    });

    it('should validate CSRF tokens', async () => {
      const invalidToken = 'invalid-csrf-token';
      
      await expect(
        authService.makeAuthenticatedRequest('/api/user/profile', {
          method: 'POST',
          headers: { 'X-CSRF-Token': invalidToken },
        })
      ).rejects.toThrow(/invalid.*csrf.*token/i);
    });
  });

  describe('Data Privacy and GDPR Compliance', () => {
    it('should allow users to export their data', async () => {
      const user = await authService.register('test@example.com', 'MyStr0ngP@ssw0rd!', {
        displayName: 'Test User',
        age: 25,
        mode: 'adult',
        currency: 'HKD',
        timezone: 'Asia/Hong_Kong',
        preferences: { theme: 'light', notifications: true, language: 'en' },
      });

      const exportedData = await authService.exportUserData(user.id);
      
      expect(exportedData).toBeDefined();
      expect(exportedData.user).toEqual(expect.objectContaining({
        email: 'test@example.com',
        profile: expect.any(Object),
      }));
      expect(exportedData.financialData).toBeDefined();
      expect(exportedData.farmData).toBeDefined();
    });

    it('should allow users to delete their accounts', async () => {
      const user = await authService.register('test@example.com', 'MyStr0ngP@ssw0rd!', {
        displayName: 'Test User',
        age: 25,
        mode: 'adult',
        currency: 'HKD',
        timezone: 'Asia/Hong_Kong',
        preferences: { theme: 'light', notifications: true, language: 'en' },
      });

      await authService.deleteUserAccount(user.id);
      
      // User should no longer exist
      const deletedUser = await authService.getUserById(user.id);
      expect(deletedUser).toBeNull();
      
      // All associated data should be deleted
      const userData = await secureStorageService.getItem(`user_${user.id}`);
      expect(userData).toBeNull();
    });

    it('should anonymize data when required', async () => {
      const user = await authService.register('test@example.com', 'MyStr0ngP@ssw0rd!', {
        displayName: 'Test User',
        age: 25,
        mode: 'adult',
        currency: 'HKD',
        timezone: 'Asia/Hong_Kong',
        preferences: { theme: 'light', notifications: true, language: 'en' },
      });

      const anonymizedData = await authService.anonymizeUserData(user.id);
      
      expect(anonymizedData.email).not.toBe('test@example.com');
      expect(anonymizedData.profile.displayName).not.toBe('Test User');
      expect(anonymizedData.id).toBe(user.id); // ID should remain for data integrity
    });
  });
});