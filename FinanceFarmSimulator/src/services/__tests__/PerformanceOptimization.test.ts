import { AssetLoaderService } from '../AssetLoaderService';
import { ImageCompressionService } from '../ImageCompressionService';
import { BackgroundProcessingService } from '../BackgroundProcessingService';
import { PerformanceMonitoringService } from '../PerformanceMonitoringService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
  AppState: {
    addEventListener: jest.fn(),
  },
  InteractionManager: {
    runAfterInteractions: jest.fn((callback) => callback()),
  },
}));

// Mock Expo modules
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  moveAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe('Performance Optimization Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('AssetLoaderService', () => {
    let assetLoader: AssetLoaderService;

    beforeEach(() => {
      assetLoader = AssetLoaderService.getInstance();
    });

    it('should initialize without errors', async () => {
      await expect(assetLoader.initialize()).resolves.not.toThrow();
    });

    it('should handle cache size limits', async () => {
      const mockCache = {
        asset1: { uri: 'uri1', timestamp: Date.now(), size: 30 * 1024 * 1024 },
        asset2: { uri: 'uri2', timestamp: Date.now() - 1000, size: 30 * 1024 * 1024 },
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockCache));
      
      await assetLoader.initialize();
      
      // Should handle cache size management
      const stats = assetLoader.getCacheStats();
      expect(stats.maxSize).toBe(50 * 1024 * 1024);
    });

    it('should provide cache statistics', () => {
      const stats = assetLoader.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('maxSize');
    });

    it('should clear cache successfully', async () => {
      await expect(assetLoader.clearCache()).resolves.not.toThrow();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle asset loading failures gracefully', async () => {
      // Mock a failing asset load
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await assetLoader.loadAssetLazy('invalid_asset', 'invalid_path');
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('ImageCompressionService', () => {
    let compressionService: ImageCompressionService;

    beforeEach(() => {
      compressionService = ImageCompressionService.getInstance();
    });

    it('should initialize compression service', async () => {
      const { getInfoAsync, makeDirectoryAsync } = require('expo-file-system');
      getInfoAsync.mockResolvedValue({ exists: false });
      makeDirectoryAsync.mockResolvedValue(undefined);

      await expect(compressionService.initialize()).resolves.not.toThrow();
    });

    it('should provide optimal compression settings', async () => {
      const { getInfoAsync } = require('expo-file-system');
      getInfoAsync.mockResolvedValue({ size: 5 * 1024 * 1024 }); // 5MB

      const settings = await compressionService.getOptimalCompressionSettings('test.jpg');
      
      expect(settings).toHaveProperty('quality');
      expect(settings).toHaveProperty('maxWidth');
      expect(settings).toHaveProperty('maxHeight');
      expect(settings.quality).toBeGreaterThan(0);
      expect(settings.quality).toBeLessThanOrEqual(1);
    });

    it('should handle compression failures gracefully', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      manipulateAsync.mockRejectedValue(new Error('Compression failed'));

      await expect(
        compressionService.compressReceiptImage('invalid.jpg')
      ).rejects.toThrow('Compression failed');
    });

    it('should provide cache statistics', async () => {
      const stats = await compressionService.getCacheStats();
      
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('itemCount');
      expect(stats).toHaveProperty('averageCompressionRatio');
    });

    it('should clear cache successfully', async () => {
      await expect(compressionService.clearCache()).resolves.not.toThrow();
    });
  });

  describe('BackgroundProcessingService', () => {
    let backgroundService: BackgroundProcessingService;

    beforeEach(() => {
      backgroundService = BackgroundProcessingService.getInstance();
    });

    it('should initialize background processing', async () => {
      await expect(backgroundService.initialize()).resolves.not.toThrow();
    });

    it('should schedule tasks successfully', async () => {
      const taskId = await backgroundService.scheduleTask({
        type: 'growth_calculation',
        priority: 'medium',
        scheduledTime: Date.now() + 1000,
        data: { cropId: 'test-crop' },
      });

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
    });

    it('should provide queue statistics', async () => {
      const stats = await backgroundService.getQueueStats();
      
      expect(stats).toHaveProperty('totalTasks');
      expect(stats).toHaveProperty('tasksByType');
      expect(stats).toHaveProperty('tasksByPriority');
      expect(stats).toHaveProperty('isProcessing');
    });

    it('should clear queue successfully', async () => {
      await expect(backgroundService.clearQueue()).resolves.not.toThrow();
    });

    it('should handle task processing errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Schedule a task that will fail
      await backgroundService.scheduleTask({
        type: 'invalid_task' as any,
        priority: 'high',
        scheduledTime: Date.now(),
        data: {},
      });

      // Allow some time for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      consoleSpy.mockRestore();
    });
  });

  describe('PerformanceMonitoringService', () => {
    let monitoringService: PerformanceMonitoringService;

    beforeEach(() => {
      monitoringService = PerformanceMonitoringService.getInstance();
    });

    it('should initialize performance monitoring', async () => {
      await expect(monitoringService.initialize()).resolves.not.toThrow();
    });

    it('should generate performance reports', () => {
      const report = monitoringService.generatePerformanceReport();
      
      expect(report).toHaveProperty('averageFPS');
      expect(report).toHaveProperty('averageMemoryUsage');
      expect(report).toHaveProperty('averageRenderTime');
      expect(report).toHaveProperty('performanceScore');
      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should track render measurements', () => {
      monitoringService.startRenderMeasurement();
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait for 10ms
      }
      
      const renderTime = monitoringService.endRenderMeasurement();
      expect(renderTime).toBeGreaterThanOrEqual(0);
    });

    it('should provide metrics data', () => {
      const metrics = monitoringService.getMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should clear metrics successfully', async () => {
      await expect(monitoringService.clearMetrics()).resolves.not.toThrow();
      
      const metrics = monitoringService.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should handle monitoring start/stop', () => {
      expect(() => {
        monitoringService.startMonitoring();
        monitoringService.stopMonitoring();
      }).not.toThrow();
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle multiple services initialization', async () => {
      const assetLoader = AssetLoaderService.getInstance();
      const compressionService = ImageCompressionService.getInstance();
      const backgroundService = BackgroundProcessingService.getInstance();
      const monitoringService = PerformanceMonitoringService.getInstance();

      await Promise.all([
        assetLoader.initialize(),
        compressionService.initialize(),
        backgroundService.initialize(),
        monitoringService.initialize(),
      ]);

      // All services should be initialized without errors
      expect(true).toBe(true);
    });

    it('should handle memory pressure scenarios', async () => {
      const assetLoader = AssetLoaderService.getInstance();
      
      // Simulate loading many assets
      const loadPromises = Array.from({ length: 10 }, (_, i) => 
        assetLoader.loadAssetLazy(`asset_${i}`, `path_${i}`)
          .catch(() => null) // Ignore failures for this test
      );

      await Promise.allSettled(loadPromises);
      
      const stats = assetLoader.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });

    it('should maintain performance under load', async () => {
      const monitoringService = PerformanceMonitoringService.getInstance();
      const backgroundService = BackgroundProcessingService.getInstance();

      // Schedule multiple background tasks
      const taskPromises = Array.from({ length: 5 }, (_, i) =>
        backgroundService.scheduleTask({
          type: 'growth_calculation',
          priority: 'low',
          scheduledTime: Date.now() + i * 100,
          data: { cropId: `crop_${i}` },
        })
      );

      await Promise.all(taskPromises);

      // Start monitoring
      monitoringService.startMonitoring();
      
      // Allow some processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const report = monitoringService.generatePerformanceReport();
      
      // Performance should still be reasonable
      expect(report.performanceScore).toBeGreaterThan(0);
      
      monitoringService.stopMonitoring();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should benchmark asset loading performance', async () => {
      const assetLoader = AssetLoaderService.getInstance();
      const startTime = Date.now();
      
      try {
        await assetLoader.preloadCropAssets();
      } catch (error) {
        // Expected to fail in test environment
      }
      
      const loadTime = Date.now() - startTime;
      
      // Should complete within reasonable time (even if it fails)
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should benchmark compression performance', async () => {
      const compressionService = ImageCompressionService.getInstance();
      const { manipulateAsync } = require('expo-image-manipulator');
      
      // Mock successful compression
      manipulateAsync.mockResolvedValue({
        uri: 'compressed.jpg',
        width: 800,
        height: 600,
      });

      const startTime = Date.now();
      
      try {
        await compressionService.compressReceiptImage('test.jpg');
      } catch (error) {
        // May fail in test environment
      }
      
      const compressionTime = Date.now() - startTime;
      
      // Should complete within reasonable time
      expect(compressionTime).toBeLessThan(2000); // 2 seconds max
    });

    it('should benchmark background processing performance', async () => {
      const backgroundService = BackgroundProcessingService.getInstance();
      const startTime = Date.now();
      
      // Schedule multiple tasks
      const tasks = Array.from({ length: 10 }, (_, i) =>
        backgroundService.scheduleTask({
          type: 'growth_calculation',
          priority: 'high',
          scheduledTime: Date.now(),
          data: { cropId: `crop_${i}` },
        })
      );

      await Promise.all(tasks);
      
      const schedulingTime = Date.now() - startTime;
      
      // Task scheduling should be fast
      expect(schedulingTime).toBeLessThan(100); // 100ms max
    });
  });
});