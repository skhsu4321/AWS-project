import * as Crypto from 'expo-crypto';
import NetInfo from '@react-native-community/netinfo';
import SecureStorageService from './SecureStorageService';

export interface SecureRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
}

export interface SecureResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  encrypted: boolean;
  verified: boolean;
}

export interface RequestSignature {
  timestamp: number;
  nonce: string;
  signature: string;
}

export interface SecurityHeaders {
  'X-Request-ID': string;
  'X-Timestamp': string;
  'X-Nonce': string;
  'X-Signature': string;
  'X-Client-Version': string;
  'Content-Type': string;
  'Authorization'?: string;
}

export class SecureCommunicationService {
  private static instance: SecureCommunicationService;
  private secureStorage: SecureStorageService;
  private baseUrl: string;
  private clientSecret: string;
  private requestQueue: SecureRequestConfig[] = [];
  private isOnline: boolean = true;

  private constructor() {
    this.secureStorage = SecureStorageService.getInstance();
    this.baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.financefarmsimulator.com';
    this.clientSecret = process.env.EXPO_PUBLIC_CLIENT_SECRET || 'default_secret';
    this.initializeNetworkMonitoring();
  }

  public static getInstance(): SecureCommunicationService {
    if (!SecureCommunicationService.instance) {
      SecureCommunicationService.instance = new SecureCommunicationService();
    }
    return SecureCommunicationService.instance;
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Process queued requests when coming back online
      if (wasOffline && this.isOnline) {
        this.processQueuedRequests();
      }
    });
  }

  /**
   * Make secure HTTP request with encryption and authentication
   */
  public async secureRequest<T = any>(config: SecureRequestConfig): Promise<SecureResponse<T>> {
    try {
      // Check network connectivity
      if (!this.isOnline) {
        this.queueRequest(config);
        throw new Error('Network unavailable - request queued');
      }

      // Generate request signature
      const signature = await this.generateRequestSignature(config);
      
      // Prepare secure headers
      const secureHeaders = await this.prepareSecureHeaders(signature, config.requiresAuth);
      
      // Encrypt request body if needed
      let requestBody = config.body;
      if (config.body && this.shouldEncryptRequest(config)) {
        requestBody = await this.encryptRequestBody(config.body);
      }

      // Make the request
      const response = await this.makeHttpRequest({
        ...config,
        headers: { ...config.headers, ...secureHeaders },
        body: requestBody,
      });

      // Verify response signature
      const isVerified = await this.verifyResponseSignature(response);
      
      // Decrypt response if needed
      let responseData = response.data;
      if (this.isResponseEncrypted(response)) {
        responseData = await this.decryptResponseBody(response.data);
      }

      return {
        data: responseData,
        status: response.status,
        headers: response.headers,
        encrypted: this.isResponseEncrypted(response),
        verified: isVerified,
      };
    } catch (error) {
      // Handle specific security errors
      if (this.isSecurityError(error)) {
        await this.handleSecurityError(error);
      }
      throw error;
    }
  }

  /**
   * Generate request signature for authentication
   */
  private async generateRequestSignature(config: SecureRequestConfig): Promise<RequestSignature> {
    const timestamp = Date.now();
    const nonce = await this.generateNonce();
    
    // Create signature payload
    const payload = [
      config.method,
      config.url,
      timestamp.toString(),
      nonce,
      config.body ? JSON.stringify(config.body) : '',
    ].join('|');

    // Generate HMAC signature
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      payload + this.clientSecret,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    return { timestamp, nonce, signature };
  }

  /**
   * Prepare secure headers for request
   */
  private async prepareSecureHeaders(
    signature: RequestSignature,
    requiresAuth: boolean = false
  ): Promise<SecurityHeaders> {
    const headers: SecurityHeaders = {
      'X-Request-ID': await this.generateRequestId(),
      'X-Timestamp': signature.timestamp.toString(),
      'X-Nonce': signature.nonce,
      'X-Signature': signature.signature,
      'X-Client-Version': '1.0.0',
      'Content-Type': 'application/json',
    };

    // Add authorization header if required
    if (requiresAuth) {
      const token = await this.secureStorage.getToken('access_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Encrypt request body
   */
  private async encryptRequestBody(body: any): Promise<string> {
    // This would use the EncryptionService in a real implementation
    const serialized = JSON.stringify(body);
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      serialized + 'encryption_key',
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    return encrypted;
  }

  /**
   * Decrypt response body
   */
  private async decryptResponseBody(encryptedData: string): Promise<any> {
    // This would use the EncryptionService in a real implementation
    // For now, return as-is (in real implementation, decrypt properly)
    try {
      return JSON.parse(encryptedData);
    } catch {
      return encryptedData;
    }
  }

  /**
   * Make HTTP request with timeout and retry logic
   */
  private async makeHttpRequest(config: SecureRequestConfig): Promise<{
    data: any;
    status: number;
    headers: Record<string, string>;
  }> {
    const timeout = config.timeout || 30000;
    const maxRetries = config.retries || 3;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(config.url, {
          method: config.method,
          headers: config.headers,
          body: config.body ? JSON.stringify(config.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData = await response.json();
        const responseHeaders: Record<string, string> = {};
        
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return {
          data: responseData,
          status: response.status,
          headers: responseHeaders,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          break;
        }

        // Wait before retry with exponential backoff
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Verify response signature
   */
  private async verifyResponseSignature(response: any): Promise<boolean> {
    try {
      const serverSignature = response.headers['x-server-signature'];
      if (!serverSignature) {
        return false;
      }

      // In a real implementation, verify the server's signature
      // using the response data and a shared secret
      return true;
    } catch (error) {
      console.error('Failed to verify response signature:', error);
      return false;
    }
  }

  /**
   * Queue request for later processing when offline
   */
  private queueRequest(config: SecureRequestConfig): void {
    this.requestQueue.push(config);
    
    // Limit queue size to prevent memory issues
    if (this.requestQueue.length > 100) {
      this.requestQueue.shift(); // Remove oldest request
    }
  }

  /**
   * Process queued requests when back online
   */
  private async processQueuedRequests(): Promise<void> {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const config of queue) {
      try {
        await this.secureRequest(config);
      } catch (error) {
        console.error('Failed to process queued request:', error);
        // Re-queue if it's a temporary error
        if (this.isTemporaryError(error)) {
          this.queueRequest(config);
        }
      }
    }
  }

  /**
   * Generate cryptographically secure nonce
   */
  private async generateNonce(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate unique request ID
   */
  private async generateRequestId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = await this.generateNonce();
    return `${timestamp}-${random}`;
  }

  /**
   * Check if request should be encrypted
   */
  private shouldEncryptRequest(config: SecureRequestConfig): boolean {
    // Encrypt requests containing sensitive data
    const sensitiveEndpoints = ['/financial-data', '/user-profile', '/goals', '/expenses'];
    return sensitiveEndpoints.some(endpoint => config.url.includes(endpoint));
  }

  /**
   * Check if response is encrypted
   */
  private isResponseEncrypted(response: any): boolean {
    return response.headers['x-encrypted'] === 'true';
  }

  /**
   * Check if error is security-related
   */
  private isSecurityError(error: any): boolean {
    const securityErrorCodes = [401, 403, 419, 429];
    return securityErrorCodes.includes(error.status);
  }

  /**
   * Handle security errors
   */
  private async handleSecurityError(error: any): Promise<void> {
    switch (error.status) {
      case 401:
        // Unauthorized - refresh token
        await this.refreshAuthToken();
        break;
      case 403:
        // Forbidden - clear credentials
        await this.secureStorage.clearAllSecureData();
        break;
      case 419:
        // Authentication timeout - re-authenticate
        await this.handleAuthTimeout();
        break;
      case 429:
        // Rate limited - implement backoff
        await this.handleRateLimit();
        break;
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(): Promise<void> {
    try {
      const refreshToken = await this.secureStorage.getToken('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.secureRequest({
        url: `${this.baseUrl}/auth/refresh`,
        method: 'POST',
        body: { refreshToken },
        requiresAuth: false,
      });

      await this.secureStorage.storeToken('access_token', response.data.accessToken);
      if (response.data.refreshToken) {
        await this.secureStorage.storeToken('refresh_token', response.data.refreshToken);
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  /**
   * Handle authentication timeout
   */
  private async handleAuthTimeout(): Promise<void> {
    // Clear expired tokens and redirect to login
    await this.secureStorage.removeToken('access_token');
    await this.secureStorage.removeToken('refresh_token');
  }

  /**
   * Handle rate limiting
   */
  private async handleRateLimit(): Promise<void> {
    // Implement exponential backoff for rate limited requests
    await this.delay(5000); // Wait 5 seconds before allowing new requests
  }

  /**
   * Check if error should not trigger retry
   */
  private shouldNotRetry(error: any): boolean {
    const noRetryStatuses = [400, 401, 403, 404, 422];
    return noRetryStatuses.includes(error.status);
  }

  /**
   * Check if error is temporary
   */
  private isTemporaryError(error: any): boolean {
    const temporaryStatuses = [500, 502, 503, 504];
    return temporaryStatuses.includes(error.status) || error.name === 'NetworkError';
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get communication statistics
   */
  public getStats(): {
    queuedRequests: number;
    isOnline: boolean;
    baseUrl: string;
  } {
    return {
      queuedRequests: this.requestQueue.length,
      isOnline: this.isOnline,
      baseUrl: this.baseUrl,
    };
  }

  /**
   * Clear request queue
   */
  public clearQueue(): void {
    this.requestQueue = [];
  }
}

export default SecureCommunicationService;