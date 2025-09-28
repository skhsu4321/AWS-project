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
    // Map asset IDs to actual file paths
    const assetMap: { [key: string]: string } = {
      crop_tomato_seed: require('../../assets/crops/tomato_seed.png'),
      crop_tomato_sprout: require('../../assets/crops/tomato_sprout.png'),
      crop_tomato_growing: require('../../assets/crops/tomato_growing.png'),
      crop_tomato_mature: require('../../assets/crops/tomato_mature.png'),
      crop_tomato_harvest: require('../../assets/crops/tomato_harvest.png'),
      crop_carrot_seed: require('../../assets/crops/carrot_seed.png'),
      crop_carrot_sprout: require('../../assets/crops/carrot_sprout.png'),
      crop_carrot_growing: require('../../assets/crops/carrot_growing.png'),
      crop_carrot_mature: require('../../assets/crops/carrot_mature.png'),
      crop_carrot_harvest: require('../../assets/crops/carrot_harvest.png'),
      crop_corn_seed: require('../../assets/crops/corn_seed.png'),
      crop_corn_sprout: require('../../assets/crops/corn_sprout.png'),
      crop_corn_growing: require('../../assets/crops/corn_growing.png'),
      crop_corn_mature: require('../../assets/crops/corn_mature.png'),
      crop_corn_harvest: require('../../assets/crops/corn_harvest.png'),
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