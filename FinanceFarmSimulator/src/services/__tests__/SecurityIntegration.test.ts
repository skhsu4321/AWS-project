import EncryptionService from '../EncryptionService';
import SecureStorageService from '../SecureStorageService';
import DataAnonymizationService from '../DataAnonymizationService';
import SecureCommunicationService from '../SecureCommunicationService';
import PrivacyControlService from '../PrivacyControlService';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(32).fill(1)),
  digestStringAsync: jest.fn().mockResolvedValue('mocked_hash'),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    BASE64: 'base64',
    HEX: 'hex',
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

// Mock fetch for secure communication tests
global.fetch = jest.fn();

describe('Security Integration Tests', () => {
  let encryptionService: EncryptionService;
  let secureStorageService: SecureStorageService;
  let anonymizationService: DataAnonymizationService;
  let communicationService: SecureCommunicationService;
  let privacyService: PrivacyControlService;

  beforeEach(async () => {
    encryptionService = EncryptionService.getInstance();
    secureStorageService = SecureStorageService.getInstance();
    anonymizationService = DataAnonymizationService.getInstance();
    communicationService = SecureCommunicationService.getInstance();
    privacyService = PrivacyControlService.getInstance();

    // Initialize encryption service
    await encryptionService.initialize('test_password');
    
    jest.clearAllMocks();
  });

  describe('End-to-End Data Protection', () => {
    it('should encrypt, store, and retrieve financial data securely', async () => {
      const sensitiveData = {
        userId: 'user123',
        goalAmount: 5000,
        currentAmount: 2500,
        bankAccount: '1234567890',
        ssn: '123-45-6789',
      };

      // Store sensitive data
      await secureStorageService.storeFinancialData('user_goal', sensitiveData);

      // Retrieve and verify data
      const retrievedData = await secureStorageService.getFinancialData('user_goal');
      
      expect(retrievedData).toEqual(sensitiveData);
    });

    it('should anonymize data for analytics while preserving utility', async () => {
      const financialData = {
        userId: 'user123',
        goalId: 'goal456',
        amount: 1500,
        category: 'emergency_fund',
        date: '2024-01-15',
        type: 'savings_goal',
      };

      const anonymizedData = await anonymizationService.anonymizeFinancialData(financialData);

      // Verify anonymization
      expect(anonymizedData.userId).not.toBe(financialData.userId);
      expect(anonymizedData.goalId).not.toBe(financialData.goalId);
      expect(anonymizedData.amount).not.toBe(financialData.amount);
      expect(anonymizedData.date).not.toBe(financialData.date);
      
      // Verify structure preservation
      expect(anonymizedData).toHaveProperty('userId');
      expect(anonymizedData).toHaveProperty('goalId');
      expect(anonymizedData).toHaveProperty('amount');
      expect(anonymizedData).toHaveProperty('metadata');
    });

    it('should handle privacy settings and data export requests', async () => {
      const userId = 'user123';
      
      // Update privacy settings
      const privacySettings = {
        dataCollection: {
          analytics: false,
          crashReporting: true,
        },
        dataSharing: {
          anonymizedAnalytics: false,
        },
      };

      await privacyService.updatePrivacySettings(userId, privacySettings);

      // Request data export
      const exportRequest = await privacyService.requestDataExport(userId, {
        format: 'json',
        includeFinancialData: true,
        includeActivityLogs: false,
        includeAnalyticsData: false,
        anonymize: true,
      });

      expect(exportRequest.status).toBe('pending');
      expect(exportRequest.anonymize).toBe(true);
      expect(exportRequest.format).toBe('json');
    });
  });

  describe('Authentication and Authorization Flow', () => {
    it('should securely store and manage authentication tokens', async () => {
      const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      const refreshToken = 'refresh_token_value';

      // Store tokens
      await secureStorageService.storeToken('access_token', accessToken);
      await secureStorageService.storeToken('refresh_token', refreshToken, 'refresh');

      // Verify tokens are stored and retrievable
      const retrievedAccessToken = await secureStorageService.getToken('access_token');
      const retrievedRefreshToken = await secureStorageService.getToken('refresh_token');

      expect(retrievedAccessToken).toBe(accessToken);
      expect(retrievedRefreshToken).toBe(refreshToken);

      // Verify token validation
      const isAccessTokenValid = await secureStorageService.isTokenValid('access_token');
      expect(isAccessTokenValid).toBe(true);
    });

    it('should handle token expiration and refresh', async () => {
      const expiredToken = 'expired_token';
      
      // Store token with short expiration
      await secureStorageService.storeToken('access_token', expiredToken, 'access', 1000); // 1 second
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Token should be expired and return null
      const retrievedToken = await secureStorageService.getToken('access_token');
      expect(retrievedToken).toBeNull();
    });

    it('should clear all secure data on logout', async () => {
      // Store various secure data
      await secureStorageService.storeToken('access_token', 'token1');
      await secureStorageService.storeToken('refresh_token', 'token2');
      await secureStorageService.storeCredentials({
        userId: 'user123',
        email: 'test@example.com',
        biometricEnabled: false,
        lastLoginAt: Date.now(),
      });

      // Clear all secure data
      await secureStorageService.clearAllSecureData();

      // Verify data is cleared
      const accessToken = await secureStorageService.getToken('access_token');
      const refreshToken = await secureStorageService.getToken('refresh_token');
      const credentials = await secureStorageService.getCredentials();

      expect(accessToken).toBeNull();
      expect(refreshToken).toBeNull();
      expect(credentials).toBeNull();
    });
  });

  describe('Secure Communication', () => {
    it('should make authenticated requests with proper headers', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ success: true }),
        headers: new Map([['x-server-signature', 'valid_signature']]),
        status: 200,
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Store access token
      await secureStorageService.storeToken('access_token', 'valid_token');

      const response = await communicationService.secureRequest({
        url: 'https://api.example.com/financial-data',
        method: 'GET',
        requiresAuth: true,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/financial-data',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid_token',
            'X-Request-ID': expect.any(String),
            'X-Timestamp': expect.any(String),
            'X-Signature': expect.any(String),
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(response.verified).toBe(true);
    });

    it('should handle network errors and queue requests', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        communicationService.secureRequest({
          url: 'https://api.example.com/data',
          method: 'POST',
          body: { test: 'data' },
        })
      ).rejects.toThrow('Network unavailable - request queued');

      const stats = communicationService.getStats();
      expect(stats.queuedRequests).toBe(1);
    });

    it('should retry failed requests with exponential backoff', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({ success: true }),
          headers: new Map(),
          status: 200,
        });

      const response = await communicationService.secureRequest({
        url: 'https://api.example.com/data',
        method: 'GET',
        retries: 2,
      });

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(response.status).toBe(200);
    });
  });

  describe('Data Anonymization and Privacy', () => {
    it('should create aggregated analytics without personal information', async () => {
      const userDataSets = [
        {
          savingsGoals: [{ id: 'goal1' }, { id: 'goal2' }],
          expenses: [
            { category: 'food' },
            { category: 'transport' },
            { category: 'food' },
          ],
          incomes: [{ source: 'salary' }],
          activeDays: 25,
        },
        {
          savingsGoals: [{ id: 'goal3' }],
          expenses: [{ category: 'entertainment' }],
          incomes: [{ source: 'freelance' }, { source: 'bonus' }],
          activeDays: 15,
        },
      ];

      const analyticsData = await anonymizationService.createAnalyticsData(
        userDataSets,
        { start: new Date('2024-01-01'), end: new Date('2024-01-31') }
      );

      expect(analyticsData.aggregatedMetrics.avgSavingsGoals).toBe(2); // (2+1)/2 = 1.5 rounded
      expect(analyticsData.aggregatedMetrics.avgExpenseCategories).toBe(2); // (2+1)/2 = 1.5 rounded
      expect(analyticsData.aggregatedMetrics.engagementScore).toBe(20); // (25+15)/2
      expect(analyticsData.userSegment).toBe('regular_user');
      expect(analyticsData.timeframe.start).toBe('2024-01-01');
    });

    it('should sanitize data export by removing PII', async () => {
      const dataWithPII = {
        user: {
          email: 'user@example.com',
          fullName: 'John Doe',
          phone: '+1234567890',
        },
        financialData: {
          goals: [{ amount: 5000 }],
          expenses: [{ amount: 100 }],
        },
      };

      const sanitizedData = await anonymizationService.sanitizeDataExport(dataWithPII);

      expect(sanitizedData.user.email).not.toBe('user@example.com');
      expect(sanitizedData.user.fullName).not.toBe('John Doe');
      expect(sanitizedData.user.phone).not.toBe('+1234567890');
      expect(sanitizedData.financialData).toEqual(dataWithPII.financialData);
    });

    it('should consistently hash the same identifiers', async () => {
      const userId = 'user123';
      
      const data1 = await anonymizationService.anonymizeFinancialData({
        userId,
        amount: 1000,
        type: 'expense',
      });
      
      const data2 = await anonymizationService.anonymizeFinancialData({
        userId,
        amount: 2000,
        type: 'income',
      });

      // Same user ID should hash to same anonymous ID
      expect(data1.userId).toBe(data2.userId);
    });
  });

  describe('Privacy Controls and Consent Management', () => {
    it('should record and track consent changes', async () => {
      const userId = 'user123';
      
      // Record initial consent
      await privacyService.recordConsent(userId, 'analytics', true);
      await privacyService.recordConsent(userId, 'marketing', false);
      
      // Get consent history
      const consentHistory = await privacyService.getConsentHistory(userId);
      
      expect(consentHistory).toHaveLength(2);
      expect(consentHistory[0].consentType).toBe('marketing');
      expect(consentHistory[0].granted).toBe(false);
      expect(consentHistory[1].consentType).toBe('analytics');
      expect(consentHistory[1].granted).toBe(true);
    });

    it('should enforce privacy settings for data collection', async () => {
      const userId = 'user123';
      
      // Set privacy settings to disable analytics
      await privacyService.updatePrivacySettings(userId, {
        dataCollection: {
          analytics: false,
          crashReporting: true,
        },
      });
      
      // Check if analytics collection is allowed
      const analyticsAllowed = await privacyService.isDataCollectionAllowed(
        userId,
        'analytics'
      );
      const crashReportingAllowed = await privacyService.isDataCollectionAllowed(
        userId,
        'crashReporting'
      );
      
      expect(analyticsAllowed).toBe(false);
      expect(crashReportingAllowed).toBe(true);
    });

    it('should handle data deletion requests', async () => {
      const userId = 'user123';
      
      const deletionRequest = await privacyService.requestDataDeletion(userId, {
        deletionType: 'partial',
        dataTypes: ['analytics', 'activity_logs'],
      });
      
      expect(deletionRequest.status).toBe('pending');
      expect(deletionRequest.dataTypes).toEqual(['analytics', 'activity_logs']);
      expect(deletionRequest.verificationRequired).toBe(false);
    });
  });

  describe('Security Error Handling', () => {
    it('should handle encryption failures gracefully', async () => {
      // Mock encryption failure
      const crypto = require('expo-crypto');
      crypto.getRandomBytesAsync.mockRejectedValueOnce(new Error('Crypto unavailable'));
      
      await expect(
        encryptionService.encryptData('sensitive data')
      ).rejects.toThrow('Encryption failed');
    });

    it('should handle storage failures with appropriate errors', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));
      
      await expect(
        secureStorageService.storeToken('access_token', 'token')
      ).rejects.toThrow('Failed to store token');
    });

    it('should handle network security errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
        headers: new Map(),
        status: 401,
      });

      await expect(
        communicationService.secureRequest({
          url: 'https://api.example.com/secure-data',
          method: 'GET',
          requiresAuth: true,
        })
      ).rejects.toThrow();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clear sensitive data from memory', () => {
      encryptionService.clearKeys();
      anonymizationService.clearCache();
      communicationService.clearQueue();
      
      // Verify keys are cleared
      expect(() => encryptionService.encryptData('test')).rejects.toThrow(
        'Encryption service not initialized'
      );
    });

    it('should limit cache sizes to prevent memory leaks', async () => {
      // Generate many hash operations to test cache limits
      for (let i = 0; i < 1000; i++) {
        await anonymizationService.anonymizeFinancialData({
          userId: `user${i}`,
          amount: 100,
          type: 'test',
        });
      }
      
      const stats = anonymizationService.getStats();
      // Cache should be limited (exact limit depends on implementation)
      expect(stats.cacheSize).toBeLessThan(1000);
    });
  });
});