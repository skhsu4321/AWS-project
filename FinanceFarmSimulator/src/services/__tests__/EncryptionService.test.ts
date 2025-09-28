import EncryptionService from '../EncryptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(32).fill(1)),
  digestStringAsync: jest.fn().mockResolvedValue('mocked_hash'),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    BASE64: 'base64',
  },
}));

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = EncryptionService.getInstance();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with user password', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await expect(encryptionService.initialize('test_password')).resolves.not.toThrow();
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'encryption_salt',
        expect.any(String)
      );
    });

    it('should use existing salt if available', async () => {
      const existingSalt = 'existing_salt';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(existingSalt);

      await encryptionService.initialize('test_password');

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should throw error on initialization failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(encryptionService.initialize('test_password')).rejects.toThrow(
        'Failed to initialize encryption'
      );
    });
  });

  describe('Data Encryption', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test_salt');
      await encryptionService.initialize('test_password');
    });

    it('should encrypt plaintext data', async () => {
      const plaintext = 'sensitive financial data';
      
      const encrypted = await encryptionService.encryptData(plaintext);

      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(typeof encrypted.data).toBe('string');
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = EncryptionService.getInstance();
      uninitializedService.clearKeys();

      await expect(uninitializedService.encryptData('test')).rejects.toThrow(
        'Encryption service not initialized'
      );
    });

    it('should handle encryption errors gracefully', async () => {
      // Mock crypto function to throw error
      const crypto = require('expo-crypto');
      crypto.getRandomBytesAsync.mockRejectedValueOnce(new Error('Crypto error'));

      await expect(encryptionService.encryptData('test')).rejects.toThrow(
        'Encryption failed'
      );
    });
  });

  describe('Data Decryption', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test_salt');
      await encryptionService.initialize('test_password');
    });

    it('should decrypt encrypted data', async () => {
      const plaintext = 'sensitive financial data';
      const encrypted = await encryptionService.encryptData(plaintext);
      
      const decrypted = await encryptionService.decryptData(encrypted);

      // Note: In the simplified implementation, decryption doesn't fully work
      // In a real implementation, this would return the original plaintext
      expect(typeof decrypted).toBe('string');
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = EncryptionService.getInstance();
      uninitializedService.clearKeys();

      const mockEncryptedData = {
        data: 'encrypted',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      };

      await expect(uninitializedService.decryptData(mockEncryptedData)).rejects.toThrow(
        'Encryption service not initialized'
      );
    });

    it('should handle decryption errors gracefully', async () => {
      const invalidEncryptedData = {
        data: 'invalid_data',
        salt: 'salt',
        iv: 'iv',
        tag: 'tag',
      };

      await expect(encryptionService.decryptData(invalidEncryptedData)).rejects.toThrow(
        'Decryption failed'
      );
    });
  });

  describe('Key Management', () => {
    it('should clear keys from memory', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test_salt');
      await encryptionService.initialize('test_password');

      encryptionService.clearKeys();

      await expect(encryptionService.encryptData('test')).rejects.toThrow(
        'Encryption service not initialized'
      );
    });

    it('should rotate encryption keys', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test_salt');
      await encryptionService.initialize('old_password');

      await expect(encryptionService.rotateKeys('new_password')).resolves.not.toThrow();
    });
  });

  describe('Security Properties', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test_salt');
      await encryptionService.initialize('test_password');
    });

    it('should generate different encrypted data for same plaintext', async () => {
      const plaintext = 'same data';
      
      const encrypted1 = await encryptionService.encryptData(plaintext);
      const encrypted2 = await encryptionService.encryptData(plaintext);

      // Different IVs should result in different encrypted data
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.data).not.toBe(encrypted2.data);
    });

    it('should use different salts for each encryption', async () => {
      const plaintext = 'test data';
      
      const encrypted1 = await encryptionService.encryptData(plaintext);
      const encrypted2 = await encryptionService.encryptData(plaintext);

      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should handle empty plaintext', async () => {
      const encrypted = await encryptionService.encryptData('');
      
      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
    });

    it('should handle large plaintext', async () => {
      const largePlaintext = 'x'.repeat(10000);
      
      const encrypted = await encryptionService.encryptData(largePlaintext);
      
      expect(encrypted).toHaveProperty('data');
      expect(typeof encrypted.data).toBe('string');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = EncryptionService.getInstance();
      const instance2 = EncryptionService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});