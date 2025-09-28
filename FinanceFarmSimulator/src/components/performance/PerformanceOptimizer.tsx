import React, { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AssetLoaderService } from '../../services/AssetLoaderService';
import { ImageCompressionService } from '../../services/ImageCompressionService';
import { BackgroundProcessingService } from '../../services/BackgroundProcessingService';
import { PerformanceMonitoringService } from '../../services/PerformanceMonitoringService';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  enableBackgroundProcessing?: boolean;
  enableAssetOptimization?: boolean;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  children,
  enableMonitoring = true,
  enableBackgroundProcessing = true,
  enableAssetOptimization = true,
}) => {
  const servicesInitialized = useRef(false);
  const assetLoader = useRef(AssetLoaderService.getInstance());
  const compressionService = useRef(ImageCompressionService.getInstance());
  const backgroundService = useRef(BackgroundProcessingService.getInstance());
  const monitoringService = useRef(PerformanceMonitoringService.getInstance());

  // Initialize all performance services
  const initializeServices = useCallback(async () => {
    if (servicesInitialized.current) return;

    try {
      const initPromises: Promise<void>[] = [];

      if (enableAssetOptimization) {
        initPromises.push(assetLoader.current.initialize());
        initPromises.push(compressionService.current.initialize());
      }

      if (enableBackgroundProcessing) {
        initPromises.push(backgroundService.current.initialize());
      }

      if (enableMonitoring) {
        initPromises.push(monitoringService.current.initialize());
      }

      await Promise.all(initPromises);
      servicesInitialized.current = true;

      console.log('Performance optimization services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize performance services:', error);
    }
  }, [enableAssetOptimization, enableBackgroundProcessing, enableMonitoring]);

  // Handle app state changes for performance optimization
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      // App going to background - optimize for background performance
      if (enableMonitoring) {
        monitoringService.current.stopMonitoring();
      }
    } else if (nextAppState === 'active') {
      // App becoming active - resume performance monitoring
      if (enableMonitoring) {
        monitoringService.current.startMonitoring();
      }
    }
  }, [enableMonitoring]);

  // Memory pressure handler
  const handleMemoryPressure = useCallback(async () => {
    console.warn('Memory pressure detected - performing cleanup');

    try {
      // Clear asset caches if needed
      if (enableAssetOptimization) {
        const assetStats = assetLoader.current.getCacheStats();
        const compressionStats = await compressionService.current.getCacheStats();

        // Clear caches if they're using too much memory
        if (assetStats.size > assetStats.maxSize * 0.8) {
          console.log('Clearing asset cache due to memory pressure');
          await assetLoader.current.clearCache();
        }

        if (compressionStats.totalSize > 50 * 1024 * 1024) { // 50MB threshold
          console.log('Clearing compression cache due to memory pressure');
          await compressionService.current.clearCache();
        }
      }

      // Clear background processing queue of low-priority tasks
      if (enableBackgroundProcessing) {
        const queueStats = await backgroundService.current.getQueueStats();
        if (queueStats.totalTasks > 50) {
          console.log('Clearing background processing queue due to memory pressure');
          await backgroundService.current.clearQueue();
        }
      }
    } catch (error) {
      console.error('Error handling memory pressure:', error);
    }
  }, [enableAssetOptimization, enableBackgroundProcessing]);

  // Performance monitoring and optimization
  const optimizePerformance = useCallback(async () => {
    if (!enableMonitoring) return;

    try {
      const report = monitoringService.current.generatePerformanceReport();
      
      // Take action based on performance metrics
      if (report.performanceScore < 60) {
        console.warn('Low performance detected:', report);
        
        // Implement performance optimizations based on recommendations
        for (const recommendation of report.recommendations) {
          if (recommendation.includes('image') && enableAssetOptimization) {
            // Clear image caches
            await compressionService.current.clearCache();
          } else if (recommendation.includes('background') && enableBackgroundProcessing) {
            // Reduce background processing
            await backgroundService.current.clearQueue();
          }
        }
      }
    } catch (error) {
      console.error('Error optimizing performance:', error);
    }
  }, [enableMonitoring, enableAssetOptimization, enableBackgroundProcessing]);

  useEffect(() => {
    // Initialize services on mount
    initializeServices();

    // Set up app state listener
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up periodic performance optimization
    const optimizationInterval = setInterval(optimizePerformance, 30000); // Every 30 seconds

    // Cleanup on unmount
    return () => {
      appStateSubscription?.remove();
      clearInterval(optimizationInterval);
      
      if (enableMonitoring) {
        monitoringService.current.stopMonitoring();
      }
      
      if (enableBackgroundProcessing) {
        backgroundService.current.destroy();
      }
    };
  }, [initializeServices, handleAppStateChange, optimizePerformance, enableMonitoring, enableBackgroundProcessing]);

  // Expose performance utilities through context if needed
  const performanceContext = {
    assetLoader: assetLoader.current,
    compressionService: compressionService.current,
    backgroundService: backgroundService.current,
    monitoringService: monitoringService.current,
    handleMemoryPressure,
    optimizePerformance,
  };

  return (
    <PerformanceContext.Provider value={performanceContext}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Context for accessing performance services
const PerformanceContext = React.createContext<{
  assetLoader: AssetLoaderService;
  compressionService: ImageCompressionService;
  backgroundService: BackgroundProcessingService;
  monitoringService: PerformanceMonitoringService;
  handleMemoryPressure: () => Promise<void>;
  optimizePerformance: () => Promise<void>;
} | null>(null);

// Hook for using performance services
export const usePerformanceServices = () => {
  const context = React.useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceServices must be used within a PerformanceOptimizer');
  }
  return context;
};

// HOC for performance-optimized components
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.memo((props: P) => {
    const { monitoringService } = usePerformanceServices();
    
    useEffect(() => {
      monitoringService.startRenderMeasurement();
      
      return () => {
        const renderTime = monitoringService.endRenderMeasurement();
        if (renderTime > 50) { // Log slow renders
          console.warn(`Slow render detected in ${Component.name}: ${renderTime}ms`);
        }
      };
    });

    return <Component {...props} />;
  });
}