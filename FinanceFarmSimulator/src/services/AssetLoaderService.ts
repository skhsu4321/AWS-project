import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AssetCache {
  [key: string]: {
    uri: string;
    timestamp: number;
    size: number;
  };
}

interface LoadingState {
  [key: string]: Promise<string>;
}

export class AssetLoaderService {
  private static instance: AssetLoaderService;
  private cache: AssetCache = {};
  private loadingStates: LoadingState = {};
  private readonly CACHE_KEY = 'asset_cache';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  static getInstance(): AssetLoaderService {
    if (!AssetLoaderService.instance) {
      AssetLoaderService.instance = new AssetLoaderService();
    }
    return AssetLoaderService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        this.cache = JSON.parse(cachedData);
        await this.cleanExpiredAssets();
      }
    } catch (error) {
      console.warn('Failed to load asset cache:', error);
      this.cache = {};
    }
  }

  async preloadCropAssets(): Promise<void> {
    const cropAssets = [
      'crop_tomato_seed',
      'crop_tomato_sprout',
      'crop_tomato_growing',
      'crop_tomato_mature',
      'crop_tomato_harvest',
      'crop_carrot_seed',
      'crop_carrot_sprout',
      'crop_carrot_growing',
      'crop_carrot_mature',
      'crop_carrot_harvest',
      'crop_corn_seed',
      'crop_corn_sprout',
      'crop_corn_growing',
      'crop_corn_mature',
      'crop_corn_harvest',
    ];

    const preloadPromises = cropAssets.map(assetId => 
      this.loadAssetLazy(assetId, this.getAssetPath(assetId))
    );

    await Promise.allSettled(preloadPromises);
  }

  async loadAssetLazy(assetId: string, assetPath: string): Promise<string> {
    // Return cached asset if available and not expired
    const cached = this.cache[assetId];
    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      return cached.uri;
    }

    // Return existing loading promise if asset is currently being loaded
    if (this.loadingStates[assetId]) {
      return this.loadingStates[assetId];
    }

    // Start loading the asset
    this.loadingStates[assetId] = this.loadAndCacheAsset(assetId, assetPath);
    
    try {
      const result = await this.loadingStates[assetId];
      delete this.loadingStates[assetId];
      return result;
    } catch (error) {
      delete this.loadingStates[assetId];
      throw error;
    }
  }

  private async loadAndCacheAsset(assetId: string, assetPath: string): Promise<string> {
    try {
      // Preload the image to ensure it's cached by React Native
      await new Promise<void>((resolve, reject) => {
        Image.prefetch(assetPath)
          .then(() => resolve())
          .catch(reject);
      });

      // Get image dimensions for cache size calculation
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(
          assetPath,
          (width, height) => resolve({ width, height }),
          reject
        );
      });

      const estimatedSize = width * height * 4; // Rough estimate for RGBA

      // Check if adding this asset would exceed cache size
      await this.ensureCacheSpace(estimatedSize);

      // Cache the asset
      this.cache[assetId] = {
        uri: assetPath,
        timestamp: Date.now(),
        size: estimatedSize,
      };

      await this.persistCache();
      return assetPath;
    } catch (error) {
      console.warn(`Failed to load asset ${assetId}:`, error);
      throw error;
    }
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const currentSize = Object.values(this.cache).reduce((sum, asset) => sum + asset.size, 0);
    
    if (currentSize + requiredSize <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Remove oldest assets until we have enough space
    const sortedAssets = Object.entries(this.cache)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    let freedSpace = 0;
    for (const [assetId] of sortedAssets) {
      if (freedSpace >= requiredSize) break;
      
      freedSpace += this.cache[assetId].size;
      delete this.cache[assetId];
    }
  }

  private async cleanExpiredAssets(): Promise<void> {
    const now = Date.now();
    let hasExpired = false;

    for (const [assetId, asset] of Object.entries(this.cache)) {
      if (now - asset.timestamp > this.CACHE_EXPIRY) {
        delete this.cache[assetId];
        hasExpired = true;
      }
    }

    if (hasExpired) {
      await this.persistCache();
    }
  }

  private async persistCache(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to persist asset cache:', error);
    }
  }

  private getAssetPath(assetId: string): string {
    // For web version, use placeholder data URLs or return asset ID
    // In production, these would be actual image files
    const assetMap: { [key: string]: string } = {
      crop_tomato_seed: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iOCIgZmlsbD0iIzg4NTQzMyIvPgo8L3N2Zz4K',
      crop_tomato_sprout: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIyMCIgcj0iNiIgZmlsbD0iIzg4NTQzMyIvPgo8cmVjdCB4PSIxNCIgeT0iOCIgd2lkdGg9IjQiIGhlaWdodD0iMTIiIGZpbGw9IiM0Q0FGNTASCZ8L3N2Zz4K',
      crop_tomato_growing: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIyMCIgcj0iOCIgZmlsbD0iI0ZGNkI2QiIvPgo8cmVjdCB4PSIxNCIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iMTYiIGZpbGw9IiM0Q0FGNTASCZ8L3N2Zz4K',
      crop_tomato_mature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxOCIgcj0iMTAiIGZpbGw9IiNGRjZCNkIiLz4KPHJlY3QgeD0iMTQiIHk9IjIiIHdpZHRoPSI0IiBoZWlnaHQ9IjE2IiBmaWxsPSIjNENBRjUwIi8+Cjwvc3ZnPgo=',
      crop_tomato_harvest: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiNGRjZCNkIiLz4KPC9zdmc+Cg==',
      crop_carrot_seed: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iOCIgZmlsbD0iIzg4NTQzMyIvPgo8L3N2Zz4K',
      crop_carrot_sprout: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjE2IiBjeT0iMjQiIHJ4PSI0IiByeT0iNiIgZmlsbD0iI0ZGOEMwMCIvPgo8cmVjdCB4PSIxNCIgeT0iOCIgd2lkdGg9IjQiIGhlaWdodD0iMTYiIGZpbGw9IiM0Q0FGNTASCZ8L3N2Zz4K',
      crop_carrot_growing: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjE2IiBjeT0iMjIiIHJ4PSI2IiByeT0iOCIgZmlsbD0iI0ZGOEMwMCIvPgo8cmVjdCB4PSIxNCIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iMTgiIGZpbGw9IiM0Q0FGNTASCZ8L3N2Zz4K',
      crop_carrot_mature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjE2IiBjeT0iMjAiIHJ4PSI4IiByeT0iMTAiIGZpbGw9IiNGRjhDMDAiLz4KPHJlY3QgeD0iMTQiIHk9IjIiIHdpZHRoPSI0IiBoZWlnaHQ9IjE4IiBmaWxsPSIjNENBRjUwIi8+Cjwvc3ZnPgo=',
      crop_carrot_harvest: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjE2IiBjeT0iMTYiIHJ4PSIxMCIgcnk9IjEyIiBmaWxsPSIjRkY4QzAwIi8+Cjwvc3ZnPgo=',
      crop_corn_seed: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iOCIgZmlsbD0iIzg4NTQzMyIvPgo8L3N2Zz4K',
      crop_corn_sprout: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMTQiIHk9IjE2IiB3aWR0aD0iNCIgaGVpZ2h0PSIxMiIgZmlsbD0iI0ZGRDkzRCIvPgo8cmVjdCB4PSIxNCIgeT0iOCIgd2lkdGg9IjQiIGhlaWdodD0iOCIgZmlsbD0iIzRDQUY1MCIvPgo8L3N2Zz4K',
      crop_corn_growing: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMTIiIHk9IjEyIiB3aWR0aD0iOCIgaGVpZ2h0PSIxNiIgZmlsbD0iI0ZGRDkzRCIvPgo8cmVjdCB4PSIxNCIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iOCIgZmlsbD0iIzRDQUY1MCIvPgo8L3N2Zz4K',
      crop_corn_mature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMTAiIHk9IjgiIHdpZHRoPSIxMiIgaGVpZ2h0PSIyMCIgZmlsbD0iI0ZGRDkzRCIvPgo8cmVjdCB4PSIxNCIgeT0iMiIgd2lkdGg9IjQiIGhlaWdodD0iNiIgZmlsbD0iIzRDQUY1MCIvPgo8L3N2Zz4K',
      crop_corn_harvest: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iOCIgeT0iNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkZEOTNEIi8+Cjwvc3ZnPgo=',
    };

    return assetMap[assetId] || assetId;
  }

  getCachedAsset(assetId: string): string | null {
    const cached = this.cache[assetId];
    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      return cached.uri;
    }
    return null;
  }

  async clearCache(): Promise<void> {
    this.cache = {};
    this.loadingStates = {};
    await AsyncStorage.removeItem(this.CACHE_KEY);
  }

  getCacheStats(): { size: number; count: number; maxSize: number } {
    const size = Object.values(this.cache).reduce((sum, asset) => sum + asset.size, 0);
    const count = Object.keys(this.cache).length;
    return { size, count, maxSize: this.MAX_CACHE_SIZE };
  }
}