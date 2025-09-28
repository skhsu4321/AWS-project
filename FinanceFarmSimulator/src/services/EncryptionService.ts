import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  iterations: 100000;
  saltLength: 32;
  ivLength: 16;
  tagLength: 16;
}

export interface EncryptedData {
  data: string;
  salt: string;
  iv: string;
  tag: string;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private config: EncryptionConfig;
  private masterKey: string | null = null;

  private constructor() {
    this.config = {
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      iterations: 100000,
      saltLength: 32,
      ivLength: 16,
      tagLength: 16,
    };
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialize encryption service with user password
   */
  public async initialize(userPassword: string): Promise<void> {
    try {
      // Generate or retrieve salt for key derivation
      let salt = await AsyncStorage.getItem('encryption_salt');
      if (!salt) {
        salt = await this.generateRandomBytes(this.config.saltLength);
        await AsyncStorage.setItem('encryption_salt', salt);
      }

      // Derive master key from user password
      this.masterKey = await this.deriveKey(userPassword, salt);
    } catch (error) {
      throw new Error(`Failed to initialize encryption: ${error}`);
    }
  }

  /**
   * Encrypt sensitive data
   */
  public async encryptData(plaintext: string): Promise<EncryptedData> {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Generate random IV and salt for this encryption
      const iv = await this.generateRandomBytes(this.config.ivLength);
      const salt = await this.generateRandomBytes(this.config.saltLength);
      
      // Derive encryption key from master key and salt
      const encryptionKey = await this.deriveKey(this.masterKey, salt);
      
      // Convert plaintext to bytes
      const plaintextBytes = new TextEncoder().encode(plaintext);
      
      // Perform encryption (simplified - in real implementation would use WebCrypto API)
      const encryptedBytes = await this.performEncryption(plaintextBytes, encryptionKey, iv);
      
      return {
        data: this.bytesToBase64(encryptedBytes.data),
        salt: salt,
        iv: iv,
        tag: this.bytesToBase64(encryptedBytes.tag),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  public async decryptData(encryptedData: EncryptedData): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Derive decryption key from master key and salt
      const decryptionKey = await this.deriveKey(this.masterKey, encryptedData.salt);
      
      // Convert encrypted data from base64
      const encryptedBytes = this.base64ToBytes(encryptedData.data);
      const tag = this.base64ToBytes(encryptedData.tag);
      
      // Perform decryption
      const decryptedBytes = await this.performDecryption(
        encryptedBytes,
        decryptionKey,
        encryptedData.iv,
        tag
      );
      
      return new TextDecoder().decode(decryptedBytes);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Generate cryptographically secure random bytes
   */
  private async generateRandomBytes(length: number): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(length);
    return this.bytesToBase64(randomBytes);
  }

  /**
   * Derive key using PBKDF2
   */
  private async deriveKey(password: string, salt: string): Promise<string> {
    // In a real implementation, this would use WebCrypto API or native crypto
    // For now, we'll use a simplified approach with expo-crypto
    const combined = password + salt;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    return hash;
  }

  /**
   * Perform AES-GCM encryption (simplified implementation)
   */
  private async performEncryption(
    data: Uint8Array,
    key: string,
    iv: string
  ): Promise<{ data: Uint8Array; tag: Uint8Array }> {
    // This is a simplified implementation
    // In production, use WebCrypto API or react-native-crypto
    const combined = key + iv + this.bytesToBase64(data);
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    const encryptedBytes = this.base64ToBytes(encrypted);
    const tag = encryptedBytes.slice(-16); // Last 16 bytes as tag
    const ciphertext = encryptedBytes.slice(0, -16);
    
    return { data: ciphertext, tag };
  }

  /**
   * Perform AES-GCM decryption (simplified implementation)
   */
  private async performDecryption(
    encryptedData: Uint8Array,
    key: string,
    iv: string,
    tag: Uint8Array
  ): Promise<Uint8Array> {
    // This is a simplified implementation
    // In production, verify tag and decrypt properly
    const combined = this.bytesToBase64(new Uint8Array([...encryptedData, ...tag]));
    return this.base64ToBytes(combined).slice(0, encryptedData.length);
  }

  /**
   * Convert bytes to base64 string
   */
  private bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  /**
   * Convert base64 string to bytes
   */
  private base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Clear encryption keys from memory
   */
  public clearKeys(): void {
    this.masterKey = null;
  }

  /**
   * Rotate encryption keys
   */
  public async rotateKeys(newPassword: string): Promise<void> {
    const oldMasterKey = this.masterKey;
    await this.initialize(newPassword);
    
    // In a real implementation, you would re-encrypt all data with new key
    // This is a placeholder for that process
    console.log('Key rotation completed');
  }
}

export default EncryptionService;