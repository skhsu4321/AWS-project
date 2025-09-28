import SecureStorageService from '../SecureStorageService';
import EncryptionService from '../EncryptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('../EncryptionService');

describe('SecureStorageService', () => {
  let secureStorageService: SecureStorageService;
  let mockEncryptionService: jest.Mocked<EncryptionService>;

  beforeEach(() => {
    secureStorageService = SecureStorageService.getInstance();
    mockEncryptionService = EncryptionService.getInstance() as jest.Mocked<EncryptionService>;
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should store token with encryption', async () => {
      const mockEncryptedData = {
        data: 'encrypted_token',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      };
      mockEncryptionService.encryptData.mockResolvedValue(mockEncryptedData);

      await secureStorageService.storeToken('access_token', 'test_token');

      expect(mockEncryptionService.encryptData).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'secure_access_token',
        JSON.stringify(mockEncryptedData)
      );
    });

    it('should retrieve valid token', async () => {
      const mockStoredData = JSON.stringify({
        data: 'encrypted_token',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      });
      const mockDecryptedData = JSON.stringify({
        value: 'test_token',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        type: 'access',
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockStoredData);
      mockEncryptionService.decryptData.mockResolvedValue(mockDecryptedData);

      const token = await secureStorageService.getToken('access_token');

      expect(token).toBe('test_token');
      expect(mockEncryptionService.decryptData).toHaveBeenCalled();
    });

    it('should return null for expired token', async () => {
      const mockStoredData = JSON.stringify({
        data: 'encrypted_token',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      });
      const mockDecryptedData = JSON.stringify({
        value: 'test_token',
        expiresAt: Date.now() - 3600000, // 1 hour ago (expired)
        type: 'access',
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockStoredData);
      mockEncryptionService.decryptData.mockResolvedValue(mockDecryptedData);

      const token = await secureStorageService.getToken('access_token');

      expect(token).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('secure_access_token');
    });

    it('should return null for non-existent token', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const token = await secureStorageService.getToken('non_existent_token');

      expect(token).toBeNull();
    });

    it('should handle token retrieval errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const token = await secureStorageService.getToken('access_token');

      expect(token).toBeNull();
    });

    it('should remove token', async () => {
      await secureStorageService.removeToken('access_token');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('secure_access_token');
    });

    it('should validate token existence', async () => {
      const mockStoredData = JSON.stringify({
        data: 'encrypted_token',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      });
      const mockDecryptedData = JSON.stringify({
        value: 'test_token',
        expiresAt: Date.now() + 3600000,
        type: 'access',
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockStoredData);
      mockEncryptionService.decryptData.mockResolvedValue(mockDecryptedData);

      const isValid = await secureStorageService.isTokenValid('access_token');

      expect(isValid).toBe(true);
    });
  });

  describe('Credentials Management', () => {
    it('should store user credentials securely', async () => {
      const credentials = {
        userId: 'user123',
        email: 'test@example.com',
        biometricEnabled: true,
        lastLoginAt: Date.now(),
      };

      const mockEncryptedData = {
        data: 'encrypted_credentials',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      };
      mockEncryptionService.encryptData.mockResolvedValue(mockEncryptedData);

      await secureStorageService.storeCredentials(credentials);

      expect(mockEncryptionService.encryptData).toHaveBeenCalledWith(
        JSON.stringify(credentials)
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'secure_user_credentials',
        JSON.stringify(mockEncryptedData)
      );
    });

    it('should retrieve user credentials', async () => {
      const credentials = {
        userId: 'user123',
        email: 'test@example.com',
        biometricEnabled: true,
        lastLoginAt: Date.now(),
      };

      const mockStoredData = JSON.stringify({
        data: 'encrypted_credentials',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockStoredData);
      mockEncryptionService.decryptData.mockResolvedValue(JSON.stringify(credentials));

      const retrievedCredentials = await secureStorageService.getCredentials();

      expect(retrievedCredentials).toEqual(credentials);
    });

    it('should return null for non-existent credentials', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const credentials = await secureStorageService.getCredentials();

      expect(credentials).toBeNull();
    });
  });

  describe('Financial Data Management', () => {
    it('should store financial data with encryption', async () => {
      const financialData = {
        goalId: 'goal123',
        amount: 1000,
        category: 'savings',
      };

      const mockEncryptedData = {
        data: 'encrypted_financial_data',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      };
      mockEncryptionService.encryptData.mockResolvedValue(mockEncryptedData);

      await secureStorageService.storeFinancialData('goal_data', financialData);

      expect(mockEncryptionService.encryptData).toHaveBeenCalledWith(
        JSON.stringify(financialData)
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'secure_financial_goal_data',
        JSON.stringify(mockEncryptedData)
      );
    });

    it('should retrieve financial data', async () => {
      const financialData = {
        goalId: 'goal123',
        amount: 1000,
        category: 'savings',
      };

      const mockStoredData = JSON.stringify({
        data: 'encrypted_financial_data',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockStoredData);
      mockEncryptionService.decryptData.mockResolvedValue(JSON.stringify(financialData));

      const retrievedData = await secureStorageService.getFinancialData('goal_data');

      expect(retrievedData).toEqual(financialData);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token when close to expiration', async () => {
      const mockStoredData = JSON.stringify({
        data: 'encrypted_token',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      });
      const mockDecryptedData = JSON.stringify({
        value: 'old_token',
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
        type: 'access',
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockStoredData);
      mockEncryptionService.decryptData.mockResolvedValue(mockDecryptedData);

      const refreshCallback = jest.fn().mockResolvedValue('new_token');
      const mockNewEncryptedData = {
        data: 'encrypted_new_token',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      };
      mockEncryptionService.encryptData.mockResolvedValue(mockNewEncryptedData);

      const token = await secureStorageService.refreshTokenIfNeeded(
        'access_token',
        refreshCallback
      );

      expect(refreshCallback).toHaveBeenCalled();
      expect(token).toBe('new_token');
    });

    it('should not refresh token when not close to expiration', async () => {
      const mockStoredData = JSON.stringify({
        data: 'encrypted_token',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      });
      const mockDecryptedData = JSON.stringify({
        value: 'current_token',
        expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
        type: 'access',
      });

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockStoredData);
      mockEncryptionService.decryptData.mockResolvedValue(mockDecryptedData);

      const refreshCallback = jest.fn();

      const token = await secureStorageService.refreshTokenIfNeeded(
        'access_token',
        refreshCallback
      );

      expect(refreshCallback).not.toHaveBeenCalled();
      expect(token).toBe('current_token');
    });
  });

  describe('Data Cleanup', () => {
    it('should clear all secure data', async () => {
      const allKeys = [
        'secure_access_token',
        'secure_refresh_token',
        'secure_user_credentials',
        'other_key',
      ];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(allKeys);

      await secureStorageService.clearAllSecureData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'secure_access_token',
        'secure_refresh_token',
        'secure_user_credentials',
      ]);
    });

    it('should get storage statistics', async () => {
      const allKeys = [
        'secure_access_token',
        'secure_refresh_token',
        'other_key',
      ];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(allKeys);
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('token_data_1')
        .mockResolvedValueOnce('token_data_2');

      const stats = await secureStorageService.getStorageStats();

      expect(stats.totalKeys).toBe(3);
      expect(stats.secureKeys).toBe(2);
      expect(stats.estimatedSize).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should update storage configuration', () => {
      const newConfig = {
        encryptionEnabled: false,
        tokenExpiration: 12 * 60 * 60 * 1000, // 12 hours
      };

      secureStorageService.updateConfig(newConfig);

      // Configuration update should not throw
      expect(() => secureStorageService.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors when storing tokens', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      await expect(
        secureStorageService.storeToken('access_token', 'test_token')
      ).rejects.toThrow('Failed to store token');
    });

    it('should handle encryption errors when storing credentials', async () => {
      mockEncryptionService.encryptData.mockRejectedValue(new Error('Encryption failed'));

      await expect(
        secureStorageService.storeCredentials({
          userId: 'user123',
          email: 'test@example.com',
          biometricEnabled: false,
          lastLoginAt: Date.now(),
        })
      ).rejects.toThrow('Failed to store credentials');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = SecureStorageService.getInstance();
      const instance2 = SecureStorageService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});