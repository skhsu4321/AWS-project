import { manipulateAsync, SaveFormat, ImageResult } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CompressionOptions {
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: SaveFormat;
}

interface CachedImage {
  uri: string;
  originalUri: string;
  size: number;
  timestamp: number;
  compressionRatio: number;
}

export class ImageCompressionService {
  private static instance: ImageCompressionService;
  private readonly CACHE_DIR = `${FileSystem.documentDirectory}compressed_images/`;
  private readonly CACHE_KEY = 'image_compression_cache';
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days
  private cache: { [key: string]: CachedImage } = {};

  static getInstance(): ImageCompressionService {
    if (!ImageCompressionService.instance) {
      ImageCompressionService.instance = new ImageCompressionService();
    }
    return ImageCompressionService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      }

      // Load cache metadata
      const cacheData = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cacheData) {
        this.cache = JSON.parse(cacheData);
        await this.cleanExpiredImages();
      }
    } catch (error) {
      console.warn('Failed to initialize image compression service:', error);
    }
  }

  async compressReceiptImage(
    imageUri: string,
    options: CompressionOptions = { quality: 0.8, maxWidth: 1024, maxHeight: 1024 }
  ): Promise<string> {
    try {
      const cacheKey = this.generateCacheKey(imageUri, options);
      
      // Check if compressed version exists in cache
      const cached = this.cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
        const fileExists = await FileSystem.getInfoAsync(cached.uri);
        if (fileExists.exists) {
          return cached.uri;
        }
      }

      // Get original image info
      const originalInfo = await FileSystem.getInfoAsync(imageUri);
      if (!originalInfo.exists) {
        throw new Error('Original image does not exist');
      }

      // Compress the image
      const compressedResult = await this.performCompression(imageUri, options);
      
      // Save compressed image to cache directory
      const fileName = `${cacheKey}.${options.format || 'jpeg'}`;
      const cachedUri = `${this.CACHE_DIR}${fileName}`;
      
      await FileSystem.moveAsync({
        from: compressedResult.uri,
        to: cachedUri,
      });

      // Get compressed file size
      const compressedInfo = await FileSystem.getInfoAsync(cachedUri);
      const compressionRatio = originalInfo.size ? compressedInfo.size / originalInfo.size : 1;

      // Update cache
      this.cache[cacheKey] = {
        uri: cachedUri,
        originalUri: imageUri,
        size: compressedInfo.size,
        timestamp: Date.now(),
        compressionRatio,
      };

      await this.ensureCacheSize();
      await this.persistCache();

      return cachedUri;
    } catch (error) {
      console.error('Failed to compress receipt image:', error);
      throw error;
    }
  }

  async compressMultipleImages(
    imageUris: string[],
    options: CompressionOptions = { quality: 0.8, maxWidth: 1024, maxHeight: 1024 }
  ): Promise<string[]> {
    const compressionPromises = imageUris.map(uri => 
      this.compressReceiptImage(uri, options)
    );

    const results = await Promise.allSettled(compressionPromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.warn(`Failed to compress image ${imageUris[index]}:`, result.reason);
        return imageUris[index]; // Return original URI as fallback
      }
    });
  }

  private async performCompression(
    imageUri: string,
    options: CompressionOptions
  ): Promise<ImageResult> {
    const manipulateOptions: any[] = [];

    // Add resize if dimensions are specified
    if (options.maxWidth || options.maxHeight) {
      manipulateOptions.push({
        resize: {
          width: options.maxWidth,
          height: options.maxHeight,
        },
      });
    }

    return await manipulateAsync(
      imageUri,
      manipulateOptions,
      {
        compress: options.quality,
        format: options.format || SaveFormat.JPEG,
      }
    );
  }

  private generateCacheKey(imageUri: string, options: CompressionOptions): string {
    const optionsString = JSON.stringify(options);
    const combined = `${imageUri}_${optionsString}`;
    
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private async ensureCacheSize(): Promise<void> {
    const currentSize = Object.values(this.cache).reduce((sum, item) => sum + item.size, 0);
    
    if (currentSize <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Sort by timestamp (oldest first)
    const sortedEntries = Object.entries(this.cache)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    let freedSpace = 0;
    const targetSpace = currentSize - this.MAX_CACHE_SIZE + (this.MAX_CACHE_SIZE * 0.1); // Free 10% extra

    for (const [key, item] of sortedEntries) {
      if (freedSpace >= targetSpace) break;

      try {
        await FileSystem.deleteAsync(item.uri, { idempotent: true });
        freedSpace += item.size;
        delete this.cache[key];
      } catch (error) {
        console.warn(`Failed to delete cached image ${item.uri}:`, error);
      }
    }
  }

  private async cleanExpiredImages(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of Object.entries(this.cache)) {
      if (now - item.timestamp > this.CACHE_EXPIRY) {
        expiredKeys.push(key);
        try {
          await FileSystem.deleteAsync(item.uri, { idempotent: true });
        } catch (error) {
          console.warn(`Failed to delete expired image ${item.uri}:`, error);
        }
      }
    }

    expiredKeys.forEach(key => delete this.cache[key]);

    if (expiredKeys.length > 0) {
      await this.persistCache();
    }
  }

  private async persistCache(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to persist image cache:', error);
    }
  }

  async getCacheStats(): Promise<{
    totalSize: number;
    itemCount: number;
    averageCompressionRatio: number;
    oldestItem: number;
    newestItem: number;
  }> {
    const items = Object.values(this.cache);
    
    if (items.length === 0) {
      return {
        totalSize: 0,
        itemCount: 0,
        averageCompressionRatio: 0,
        oldestItem: 0,
        newestItem: 0,
      };
    }

    const totalSize = items.reduce((sum, item) => sum + item.size, 0);
    const averageCompressionRatio = items.reduce((sum, item) => sum + item.compressionRatio, 0) / items.length;
    const timestamps = items.map(item => item.timestamp);

    return {
      totalSize,
      itemCount: items.length,
      averageCompressionRatio,
      oldestItem: Math.min(...timestamps),
      newestItem: Math.max(...timestamps),
    };
  }

  async clearCache(): Promise<void> {
    try {
      // Delete all cached files
      for (const item of Object.values(this.cache)) {
        await FileSystem.deleteAsync(item.uri, { idempotent: true });
      }

      // Clear cache metadata
      this.cache = {};
      await AsyncStorage.removeItem(this.CACHE_KEY);

      // Recreate cache directory
      await FileSystem.deleteAsync(this.CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
    } catch (error) {
      console.error('Failed to clear image cache:', error);
      throw error;
    }
  }

  // Utility method to get optimal compression settings based on image size
  getOptimalCompressionSettings(imageUri: string): Promise<CompressionOptions> {
    return new Promise(async (resolve) => {
      try {
        const info = await FileSystem.getInfoAsync(imageUri);
        const sizeInMB = info.size / (1024 * 1024);

        if (sizeInMB > 10) {
          // Large images - aggressive compression
          resolve({
            quality: 0.6,
            maxWidth: 800,
            maxHeight: 800,
            format: SaveFormat.JPEG,
          });
        } else if (sizeInMB > 5) {
          // Medium images - moderate compression
          resolve({
            quality: 0.7,
            maxWidth: 1024,
            maxHeight: 1024,
            format: SaveFormat.JPEG,
          });
        } else {
          // Small images - light compression
          resolve({
            quality: 0.8,
            maxWidth: 1200,
            maxHeight: 1200,
            format: SaveFormat.JPEG,
          });
        }
      } catch (error) {
        // Fallback to default settings
        resolve({
          quality: 0.8,
          maxWidth: 1024,
          maxHeight: 1024,
          format: SaveFormat.JPEG,
        });
      }
    });
  }
}