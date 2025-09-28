import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptionService from './EncryptionService';

export interface SecureStorageConfig {
  encryptionEnabled: boolean;
  keyPrefix: string;
  tokenExpiration: number; // in milliseconds
}

export interface StoredToken {
  value: string;
  expiresAt: number;
  type: 'access' | 'refresh' | 'session';
}

export interface UserCredentials {
  userId: string;
  email: string;
  hashedPassword?: string;
  biometricEnabled: boolean;
  lastLoginAt: number;
}

export class SecureStorageService {
  private static instance: SecureStorageService;
  private encryptionService: EncryptionService;
  private config: SecureStorageConfig;

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
    this.config = {
      encryptionEnabled: true,
      keyPrefix: 'secure_',
      tokenExpiration: 24 * 60 * 60 * 1000, // 24 hours
    };
  }

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Store authentication token securely
   */
  public async storeToken(
    key: string,
    token: string,
    type: 'access' | 'refresh' | 'session' = 'access',
    customExpiration?: number
  ): Promise<void> {
    try {
      const expiresAt = Date.now() + (customExpiration || this.config.tokenExpiration);
      const tokenData: StoredToken = {
        value: token,
        expiresAt,
        type,
      };

      const serializedData = JSON.stringify(tokenData);
      const storageKey = this.getSecureKey(key);

      if (this.config.encryptionEnabled) {
        const encryptedData = await this.encryptionService.encryptData(serializedData);
        await AsyncStorage.setItem(storageKey, JSON.stringify(encryptedData));
      } else {
        await AsyncStorage.setItem(storageKey, serializedData);
      }
    } catch (error) {
      throw new Error(`Failed to store token: ${error}`);
    }
  }

  /**
   * Retrieve authentication token
   */
  public async getToken(key: string): Promise<string | null> {
    try {
      const storageKey = this.getSecureKey(key);
      const storedData = await AsyncStorage.getItem(storageKey);

      if (!storedData) {
        return null;
      }

      let tokenData: StoredToken;

      if (this.config.encryptionEnabled) {
        const encryptedData = JSON.parse(storedData);
        const decryptedData = await this.encryptionService.decryptData(encryptedData);
        tokenData = JSON.parse(decryptedData);
      } else {
        tokenData = JSON.parse(storedData);
      }

      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        await this.removeToken(key);
        return null;
      }

      return tokenData.value;
    } catch (error) {
      console.error(`Failed to retrieve token: ${error}`);
      return null;
    }
  }

  /**
   * Remove authentication token
   */
  public async removeToken(key: string): Promise<void> {
    try {
      const storageKey = this.getSecureKey(key);
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      throw new Error(`Failed to remove token: ${error}`);
    }
  }

  /**
   * Store user credentials securely
   */
  public async storeCredentials(credentials: UserCredentials): Promise<void> {
    try {
      const serializedData = JSON.stringify(credentials);
      const storageKey = this.getSecureKey('user_credentials');

      if (this.config.encryptionEnabled) {
        const encryptedData = await this.encryptionService.encryptData(serializedData);
        await AsyncStorage.setItem(storageKey, JSON.stringify(encryptedData));
      } else {
        await AsyncStorage.setItem(storageKey, serializedData);
      }
    } catch (error) {
      throw new Error(`Failed to store credentials: ${error}`);
    }
  }

  /**
   * Retrieve user credentials
   */
  public async getCredentials(): Promise<UserCredentials | null> {
    try {
      const storageKey = this.getSecureKey('user_credentials');
      const storedData = await AsyncStorage.getItem(storageKey);

      if (!storedData) {
        return null;
      }

      if (this.config.encryptionEnabled) {
        const encryptedData = JSON.parse(storedData);
        const decryptedData = await this.encryptionService.decryptData(encryptedData);
        return JSON.parse(decryptedData);
      } else {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error(`Failed to retrieve credentials: ${error}`);
      return null;
    }
  }

  /**
   * Clear all stored credentials and tokens
   */
  public async clearAllSecureData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith(this.config.keyPrefix));
      await AsyncStorage.multiRemove(secureKeys);
    } catch (error) {
      throw new Error(`Failed to clear secure data: ${error}`);
    }
  }

  /**
   * Check if token exists and is valid
   */
  public async isTokenValid(key: string): Promise<boolean> {
    const token = await this.getToken(key);
    return token !== null;
  }

  /**
   * Refresh token if it's close to expiration
   */
  public async refreshTokenIfNeeded(
    key: string,
    refreshCallback: () => Promise<string>
  ): Promise<string | null> {
    try {
      const storageKey = this.getSecureKey(key);
      const storedData = await AsyncStorage.getItem(storageKey);

      if (!storedData) {
        return null;
      }

      let tokenData: StoredToken;

      if (this.config.encryptionEnabled) {
        const encryptedData = JSON.parse(storedData);
        const decryptedData = await this.encryptionService.decryptData(encryptedData);
        tokenData = JSON.parse(decryptedData);
      } else {
        tokenData = JSON.parse(storedData);
      }

      // Refresh if token expires within 1 hour
      const oneHour = 60 * 60 * 1000;
      if (Date.now() + oneHour > tokenData.expiresAt) {
        const newToken = await refreshCallback();
        await this.storeToken(key, newToken, tokenData.type);
        return newToken;
      }

      return tokenData.value;
    } catch (error) {
      console.error(`Failed to refresh token: ${error}`);
      return null;
    }
  }

  /**
   * Store sensitive financial data
   */
  public async storeFinancialData(key: string, data: any): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      const storageKey = this.getSecureKey(`financial_${key}`);

      if (this.config.encryptionEnabled) {
        const encryptedData = await this.encryptionService.encryptData(serializedData);
        await AsyncStorage.setItem(storageKey, JSON.stringify(encryptedData));
      } else {
        await AsyncStorage.setItem(storageKey, serializedData);
      }
    } catch (error) {
      throw new Error(`Failed to store financial data: ${error}`);
    }
  }

  /**
   * Retrieve sensitive financial data
   */
  public async getFinancialData(key: string): Promise<any | null> {
    try {
      const storageKey = this.getSecureKey(`financial_${key}`);
      const storedData = await AsyncStorage.getItem(storageKey);

      if (!storedData) {
        return null;
      }

      if (this.config.encryptionEnabled) {
        const encryptedData = JSON.parse(storedData);
        const decryptedData = await this.encryptionService.decryptData(encryptedData);
        return JSON.parse(decryptedData);
      } else {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error(`Failed to retrieve financial data: ${error}`);
      return null;
    }
  }

  /**
   * Generate secure storage key with prefix
   */
  private getSecureKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Update storage configuration
   */
  public updateConfig(newConfig: Partial<SecureStorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<{
    totalKeys: number;
    secureKeys: number;
    estimatedSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith(this.config.keyPrefix));
      
      // Estimate size (simplified)
      let estimatedSize = 0;
      for (const key of secureKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          estimatedSize += data.length;
        }
      }

      return {
        totalKeys: keys.length,
        secureKeys: secureKeys.length,
        estimatedSize,
      };
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error}`);
    }
  }
}

export default SecureStorageService;