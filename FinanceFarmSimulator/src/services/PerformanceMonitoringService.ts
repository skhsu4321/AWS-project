import { InteractionManager, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceMetrics {
  timestamp: number;
  fps: number;
  memoryUsage: number;
  renderTime: number;
  interactionDelay: number;
  componentCount: number;
}

interface PerformanceThresholds {
  minFPS: number;
  maxMemoryUsage: number;
  maxRenderTime: number;
  maxInteractionDelay: number;
}

interface PerformanceReport {
  averageFPS: number;
  averageMemoryUsage: number;
  averageRenderTime: number;
  averageInteractionDelay: number;
  performanceScore: number;
  recommendations: string[];
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 100;
  private readonly STORAGE_KEY = 'performance_metrics';
  private isMonitoring = false;
  private frameCount = 0;
  private lastFrameTime = 0;
  private renderStartTime = 0;
  
  private readonly thresholds: PerformanceThresholds = {
    minFPS: 30,
    maxMemoryUsage: 150 * 1024 * 1024, // 150MB
    maxRenderTime: 16.67, // 60fps = 16.67ms per frame
    maxInteractionDelay: 100, // 100ms
  };

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadMetrics();
      this.startMonitoring();
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.scheduleMetricsCollection();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  private scheduleMetricsCollection(): void {
    if (!this.isMonitoring) return;

    InteractionManager.runAfterInteractions(() => {
      this.collectMetrics();
      
      // Schedule next collection
      setTimeout(() => {
        this.scheduleMetricsCollection();
      }, 1000); // Collect metrics every second
    });
  }

  private async collectMetrics(): Promise<void> {
    try {
      const now = Date.now();
      
      // Calculate FPS
      const fps = this.calculateFPS(now);
      
      // Estimate memory usage (React Native doesn't provide direct access)
      const memoryUsage = this.estimateMemoryUsage();
      
      // Calculate render time
      const renderTime = this.calculateRenderTime();
      
      // Measure interaction delay
      const interactionDelay = await this.measureInteractionDelay();
      
      // Count active components (estimated)
      const componentCount = this.estimateComponentCount();

      const metric: PerformanceMetrics = {
        timestamp: now,
        fps,
        memoryUsage,
        renderTime,
        interactionDelay,
        componentCount,
      };

      this.addMetric(metric);
      
      // Check for performance issues
      this.checkPerformanceThresholds(metric);
      
    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
    }
  }

  private calculateFPS(currentTime: number): number {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
      return 60; // Default assumption
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.frameCount++;

    // Calculate FPS over the last second
    if (deltaTime > 0) {
      return Math.min(60, 1000 / deltaTime);
    }
    
    return 60;
  }

  private estimateMemoryUsage(): number {
    // Since React Native doesn't provide direct memory access,
    // we estimate based on component count and known patterns
    const baseMemory = 50 * 1024 * 1024; // 50MB base
    const componentMemory = this.estimateComponentCount() * 1024; // 1KB per component
    const imageMemory = this.estimateImageMemoryUsage();
    
    return baseMemory + componentMemory + imageMemory;
  }

  private estimateImageMemoryUsage(): number {
    // Estimate based on screen dimensions and typical image usage
    const { width, height } = Dimensions.get('window');
    const screenPixels = width * height;
    const bytesPerPixel = 4; // RGBA
    const estimatedImages = 10; // Rough estimate of images in memory
    
    return screenPixels * bytesPerPixel * estimatedImages;
  }

  private calculateRenderTime(): number {
    // This would typically be measured during actual render cycles
    // For now, we'll estimate based on component count
    const componentCount = this.estimateComponentCount();
    const baseRenderTime = 5; // 5ms base
    const componentRenderTime = componentCount * 0.1; // 0.1ms per component
    
    return baseRenderTime + componentRenderTime;
  }

  private async measureInteractionDelay(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      InteractionManager.runAfterInteractions(() => {
        const endTime = Date.now();
        resolve(endTime - startTime);
      });
    });
  }

  private estimateComponentCount(): number {
    // Rough estimation based on typical app structure
    // This could be improved by integrating with React DevTools
    return 50 + Math.floor(Math.random() * 20); // 50-70 components
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    
    // Persist metrics periodically
    if (this.metrics.length % 10 === 0) {
      this.persistMetrics();
    }
  }

  private checkPerformanceThresholds(metric: PerformanceMetrics): void {
    const issues: string[] = [];
    
    if (metric.fps < this.thresholds.minFPS) {
      issues.push(`Low FPS: ${metric.fps.toFixed(1)} (threshold: ${this.thresholds.minFPS})`);
    }
    
    if (metric.memoryUsage > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${(metric.memoryUsage / 1024 / 1024).toFixed(1)}MB (threshold: ${(this.thresholds.maxMemoryUsage / 1024 / 1024).toFixed(1)}MB)`);
    }
    
    if (metric.renderTime > this.thresholds.maxRenderTime) {
      issues.push(`Slow render time: ${metric.renderTime.toFixed(1)}ms (threshold: ${this.thresholds.maxRenderTime}ms)`);
    }
    
    if (metric.interactionDelay > this.thresholds.maxInteractionDelay) {
      issues.push(`High interaction delay: ${metric.interactionDelay}ms (threshold: ${this.thresholds.maxInteractionDelay}ms)`);
    }
    
    if (issues.length > 0) {
      console.warn('Performance issues detected:', issues);
    }
  }

  generatePerformanceReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        averageFPS: 0,
        averageMemoryUsage: 0,
        averageRenderTime: 0,
        averageInteractionDelay: 0,
        performanceScore: 0,
        recommendations: ['No performance data available'],
      };
    }

    const recentMetrics = this.metrics.slice(-20); // Last 20 metrics
    
    const averageFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const averageMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const averageRenderTime = recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length;
    const averageInteractionDelay = recentMetrics.reduce((sum, m) => sum + m.interactionDelay, 0) / recentMetrics.length;
    
    const performanceScore = this.calculatePerformanceScore(
      averageFPS,
      averageMemoryUsage,
      averageRenderTime,
      averageInteractionDelay
    );
    
    const recommendations = this.generateRecommendations(
      averageFPS,
      averageMemoryUsage,
      averageRenderTime,
      averageInteractionDelay
    );

    return {
      averageFPS,
      averageMemoryUsage,
      averageRenderTime,
      averageInteractionDelay,
      performanceScore,
      recommendations,
    };
  }

  private calculatePerformanceScore(
    fps: number,
    memoryUsage: number,
    renderTime: number,
    interactionDelay: number
  ): number {
    // Score out of 100
    let score = 100;
    
    // FPS score (30% weight)
    const fpsScore = Math.min(100, (fps / 60) * 100);
    score = score * 0.3 + fpsScore * 0.3;
    
    // Memory score (25% weight)
    const memoryScore = Math.max(0, 100 - ((memoryUsage / this.thresholds.maxMemoryUsage) * 100));
    score = score * 0.75 + memoryScore * 0.25;
    
    // Render time score (25% weight)
    const renderScore = Math.max(0, 100 - ((renderTime / this.thresholds.maxRenderTime) * 100));
    score = score * 0.75 + renderScore * 0.25;
    
    // Interaction delay score (20% weight)
    const interactionScore = Math.max(0, 100 - ((interactionDelay / this.thresholds.maxInteractionDelay) * 100));
    score = score * 0.8 + interactionScore * 0.2;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(
    fps: number,
    memoryUsage: number,
    renderTime: number,
    interactionDelay: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (fps < this.thresholds.minFPS) {
      recommendations.push('Consider reducing animation complexity or enabling FPS limiting');
      recommendations.push('Optimize component re-renders using React.memo and useMemo');
    }
    
    if (memoryUsage > this.thresholds.maxMemoryUsage) {
      recommendations.push('Implement image lazy loading and compression');
      recommendations.push('Clear unused assets from memory');
      recommendations.push('Consider reducing the number of simultaneous animations');
    }
    
    if (renderTime > this.thresholds.maxRenderTime) {
      recommendations.push('Optimize render cycles by memoizing expensive calculations');
      recommendations.push('Consider virtualization for large lists');
      recommendations.push('Reduce the complexity of Skia canvas operations');
    }
    
    if (interactionDelay > this.thresholds.maxInteractionDelay) {
      recommendations.push('Move heavy computations to background threads');
      recommendations.push('Implement interaction debouncing');
      recommendations.push('Optimize gesture handler performance');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable thresholds');
    }
    
    return recommendations;
  }

  private async loadMetrics(): Promise<void> {
    try {
      const metricsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (metricsData) {
        this.metrics = JSON.parse(metricsData);
      }
    } catch (error) {
      console.warn('Failed to load performance metrics:', error);
    }
  }

  private async persistMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to persist performance metrics:', error);
    }
  }

  async clearMetrics(): Promise<void> {
    this.metrics = [];
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Method to be called at the start of render cycles
  startRenderMeasurement(): void {
    this.renderStartTime = Date.now();
  }

  // Method to be called at the end of render cycles
  endRenderMeasurement(): number {
    if (this.renderStartTime === 0) return 0;
    
    const renderTime = Date.now() - this.renderStartTime;
    this.renderStartTime = 0;
    return renderTime;
  }
}