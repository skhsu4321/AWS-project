import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Group,
  useValue,
  runTiming,
  Easing,
  interpolate,
} from '@shopify/react-native-skia';
import { Farm, Crop } from '../../models/Game';
import { CropSprite } from './CropSprite';

interface FarmPerformanceOptimizerProps {
  farm: Farm;
  viewportBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scale: number;
  children?: React.ReactNode;
}

// Optimized farm renderer that only renders visible crops and uses object pooling
export const FarmPerformanceOptimizer: React.FC<FarmPerformanceOptimizerProps> = ({
  farm,
  viewportBounds,
  scale,
  children,
}) => {
  const animationProgress = useValue(0);
  
  // Start continuous animation loop for smooth effects
  React.useEffect(() => {
    const animate = () => {
      runTiming(animationProgress, 1, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }, () => {
        animationProgress.current = 0;
        animate();
      });
    };
    animate();
  }, [animationProgress]);

  // Viewport culling - only render crops that are visible
  const visibleCrops = useMemo(() => {
    const GRID_SIZE = 40;
    const CROP_SIZE = 32;
    
    return farm.crops.filter(crop => {
      const cropX = crop.position.x * GRID_SIZE;
      const cropY = crop.position.y * GRID_SIZE;
      
      // Check if crop is within viewport bounds (with some padding)
      const padding = CROP_SIZE;
      return (
        cropX + CROP_SIZE >= viewportBounds.x - padding &&
        cropX <= viewportBounds.x + viewportBounds.width + padding &&
        cropY + CROP_SIZE >= viewportBounds.y - padding &&
        cropY <= viewportBounds.y + viewportBounds.height + padding
      );
    });
  }, [farm.crops, viewportBounds]);

  // Level of detail - reduce detail for distant crops
  const getLevelOfDetail = useCallback((crop: Crop): 'high' | 'medium' | 'low' => {
    if (scale > 1.5) return 'high';
    if (scale > 0.8) return 'medium';
    return 'low';
  }, [scale]);

  // Batch similar crops for efficient rendering
  const batchedCrops = useMemo(() => {
    const batches: { [key: string]: Crop[] } = {};
    
    visibleCrops.forEach(crop => {
      const batchKey = `${crop.type}-${crop.growthStage}-${getLevelOfDetail(crop)}`;
      if (!batches[batchKey]) {
        batches[batchKey] = [];
      }
      batches[batchKey].push(crop);
    });
    
    return batches;
  }, [visibleCrops, getLevelOfDetail]);

  // Render crops with performance optimizations
  const renderOptimizedCrops = useMemo(() => {
    const GRID_SIZE = 40;
    const CROP_SIZE = 32;
    
    return Object.entries(batchedCrops).map(([batchKey, crops]) => {
      const lod = batchKey.split('-').pop() as 'high' | 'medium' | 'low';
      
      return (
        <Group key={batchKey}>
          {crops.map(crop => {
            const x = crop.position.x * GRID_SIZE + GRID_SIZE / 2;
            const y = crop.position.y * GRID_SIZE + GRID_SIZE / 2;
            
            // Adjust crop size based on level of detail
            let cropSize = CROP_SIZE;
            if (lod === 'medium') cropSize *= 0.8;
            if (lod === 'low') cropSize *= 0.6;
            
            return (
              <CropSprite
                key={crop.id}
                crop={crop}
                x={x}
                y={y}
                size={cropSize}
                animationProgress={animationProgress}
              />
            );
          })}
        </Group>
      );
    });
  }, [batchedCrops, animationProgress]);

  return (
    <View style={styles.container}>
      {renderOptimizedCrops}
      {children}
    </View>
  );
};

// Performance monitoring hook
export const useFarmPerformance = () => {
  const [frameRate, setFrameRate] = React.useState(60);
  const [renderTime, setRenderTime] = React.useState(0);
  const frameCount = React.useRef(0);
  const lastTime = React.useRef(Date.now());

  const measurePerformance = useCallback(() => {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const renderDuration = endTime - startTime;
      
      setRenderTime(renderDuration);
      
      frameCount.current++;
      const currentTime = Date.now();
      
      if (currentTime - lastTime.current >= 1000) {
        setFrameRate(frameCount.current);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
    };
  }, []);

  return {
    frameRate,
    renderTime,
    measurePerformance,
  };
};

// Memory pool for reusing animation objects
class AnimationPool {
  private pool: any[] = [];
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createNew();
  }

  release(obj: any) {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  private createNew() {
    return {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      rotation: 0,
      active: false,
    };
  }

  private reset(obj: any) {
    obj.x = 0;
    obj.y = 0;
    obj.scale = 1;
    obj.opacity = 1;
    obj.rotation = 0;
    obj.active = false;
  }
}

export const animationPool = new AnimationPool();

// Texture atlas for efficient sprite rendering
export class TextureAtlas {
  private textures: Map<string, any> = new Map();
  private loadedTextures: Set<string> = new Set();

  async preloadTextures(textureList: string[]) {
    const loadPromises = textureList.map(async (textureName) => {
      if (!this.loadedTextures.has(textureName)) {
        // In a real implementation, this would load actual texture files
        // For now, we'll simulate texture loading
        await new Promise(resolve => setTimeout(resolve, 10));
        this.textures.set(textureName, { name: textureName, loaded: true });
        this.loadedTextures.add(textureName);
      }
    });

    await Promise.all(loadPromises);
  }

  getTexture(name: string) {
    return this.textures.get(name);
  }

  isLoaded(name: string) {
    return this.loadedTextures.has(name);
  }

  unloadTexture(name: string) {
    this.textures.delete(name);
    this.loadedTextures.delete(name);
  }

  clear() {
    this.textures.clear();
    this.loadedTextures.clear();
  }
}

export const textureAtlas = new TextureAtlas();

// Performance optimization utilities
export const FarmOptimizationUtils = {
  // Throttle function calls to maintain 60fps
  throttle: (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Debounce expensive operations
  debounce: (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function(this: any, ...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // Calculate optimal viewport bounds for culling
  calculateViewportBounds: (
    canvasWidth: number,
    canvasHeight: number,
    scale: number,
    translateX: number,
    translateY: number
  ) => {
    const scaledWidth = canvasWidth / scale;
    const scaledHeight = canvasHeight / scale;
    
    return {
      x: -translateX / scale,
      y: -translateY / scale,
      width: scaledWidth,
      height: scaledHeight,
    };
  },

  // Batch state updates to reduce re-renders
  batchStateUpdates: (updates: (() => void)[]) => {
    // In React 18, this would use startTransition
    // For now, we'll use setTimeout to batch updates
    setTimeout(() => {
      updates.forEach(update => update());
    }, 0);
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});