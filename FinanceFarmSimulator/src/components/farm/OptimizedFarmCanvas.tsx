import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Group,
  Rect,
  Circle,
  Path,
  Skia,
  useSharedValueEffect,
  useValue,
  runTiming,
  Easing,
  useCanvasRef,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useDerivedValue,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Farm, Crop, GrowthStage, CropType } from '../../models/Game';
import { useTheme } from '../../contexts/ThemeContext';
import { usePerformanceOptimizedSelector } from '../../hooks/usePerformanceOptimizedSelector';
import { selectFarmRenderData, selectAnimationData } from '../../store/selectors/performanceSelectors';
import { AssetLoaderService } from '../../services/AssetLoaderService';

interface OptimizedFarmCanvasProps {
  onCropTap?: (crop: Crop) => void;
  onEmptySpaceTap?: (position: { x: number; y: number }) => void;
  isInteractive?: boolean;
  enableAnimations?: boolean;
  maxFPS?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 32;
const CANVAS_HEIGHT = screenHeight * 0.6;
const GRID_SIZE = 40;
const CROP_SIZE = 32;

// Memoized crop component to prevent unnecessary re-renders
const MemoizedCrop = React.memo<{
  crop: any;
  offsetX: number;
  offsetY: number;
  animationProgress: any;
  theme: any;
}>(({ crop, offsetX, offsetY, animationProgress, theme }) => {
  const cropX = offsetX + crop.position.x * GRID_SIZE + GRID_SIZE / 2;
  const cropY = offsetY + crop.position.y * GRID_SIZE + GRID_SIZE / 2;
  
  const cropSize = useMemo(() => {
    const sizeMultipliers = {
      [GrowthStage.SEED]: 0.3,
      [GrowthStage.SPROUT]: 0.5,
      [GrowthStage.GROWING]: 0.7,
      [GrowthStage.MATURE]: 0.9,
      [GrowthStage.READY_TO_HARVEST]: 1.0,
      [GrowthStage.HARVESTED]: 0.2,
      [GrowthStage.WITHERED]: 0.4,
    };
    return CROP_SIZE * sizeMultipliers[crop.growthStage];
  }, [crop.growthStage]);

  const cropColor = useMemo(() => {
    const colors = {
      [CropType.TOMATO]: '#FF6B6B',
      [CropType.CARROT]: '#FF8E53',
      [CropType.CORN]: '#FFD93D',
      [CropType.WHEAT]: '#F4D03F',
      [CropType.RICE]: '#A8E6CF',
      [CropType.APPLE]: '#FF6B9D',
      [CropType.ORANGE]: '#FFA726',
      [CropType.STRAWBERRY]: '#E91E63',
    };
    return colors[crop.type] || '#4CAF50';
  }, [crop.type]);

  // Optimize animations - only animate when necessary
  const shouldAnimate = crop.growthStage === GrowthStage.GROWING || 
                       crop.growthStage === GrowthStage.READY_TO_HARVEST;
  
  const animatedSize = useDerivedValue(() => {
    if (!shouldAnimate) return cropSize;
    
    const pulse = crop.growthStage === GrowthStage.GROWING ? 1.05 : 1.0;
    const glow = crop.growthStage === GrowthStage.READY_TO_HARVEST ? 1.1 : 1.0;
    return cropSize * pulse * glow * (1 + Math.sin(animationProgress.value * Math.PI * 2) * 0.05);
  }, [cropSize, shouldAnimate, crop.growthStage]);

  return (
    <Group key={crop.id}>
      {/* Crop shadow - only render if crop is visible */}
      {cropSize > 10 && (
        <Circle
          cx={cropX + 1}
          cy={cropY + 1}
          r={animatedSize.value / 2}
          color="rgba(0,0,0,0.15)"
        />
      )}
      
      {/* Main crop */}
      <Circle
        cx={cropX}
        cy={cropY}
        r={animatedSize.value / 2}
        color={cropColor}
      />
      
      {/* Health indicator - only show when health is low */}
      {crop.healthPoints < 80 && (
        <Group>
          <Rect
            x={cropX - 12}
            y={cropY - cropSize / 2 - 6}
            width={24}
            height={3}
            color="rgba(255,0,0,0.3)"
          />
          <Rect
            x={cropX - 12}
            y={cropY - cropSize / 2 - 6}
            width={24 * (crop.healthPoints / 100)}
            height={3}
            color="#4CAF50"
          />
        </Group>
      )}
      
      {/* Status indicators - only show when relevant */}
      {crop.fertilizerBoost > 1 && (
        <Circle
          cx={cropX + cropSize / 4}
          cy={cropY - cropSize / 4}
          r={3}
          color="#FFD700"
        />
      )}
      
      {crop.weedPenalty > 0 && (
        <Circle
          cx={cropX - cropSize / 4}
          cy={cropY + cropSize / 4}
          r={2}
          color="#8B4513"
        />
      )}
    </Group>
  );
});

export const OptimizedFarmCanvas: React.FC<OptimizedFarmCanvasProps> = ({
  onCropTap,
  onEmptySpaceTap,
  isInteractive = true,
  enableAnimations = true,
  maxFPS = 60,
}) => {
  const { theme } = useTheme();
  const canvasRef = useCanvasRef();
  
  // Use optimized selectors to prevent unnecessary re-renders
  const farmData = usePerformanceOptimizedSelector(selectFarmRenderData);
  const animationData = usePerformanceOptimizedSelector(selectAnimationData);
  
  // Animation values with FPS limiting
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const animationProgress = useValue(0);
  
  // FPS limiting for animations
  const lastFrameTime = useRef(0);
  const frameInterval = 1000 / maxFPS;
  
  // Asset loader service
  const assetLoader = useRef(AssetLoaderService.getInstance());
  
  useEffect(() => {
    // Initialize asset loader and preload assets
    assetLoader.current.initialize().then(() => {
      assetLoader.current.preloadCropAssets();
    });
  }, []);

  // Optimized animation loop with FPS limiting
  useEffect(() => {
    if (!enableAnimations) return;
    
    const animate = () => {
      const now = Date.now();
      if (now - lastFrameTime.current >= frameInterval) {
        runTiming(animationProgress, 1, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }, () => {
          animationProgress.current = 0;
          lastFrameTime.current = now;
          animate();
        });
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [animationProgress, enableAnimations, frameInterval]);

  // Memoized farm dimensions
  const farmDimensions = useMemo(() => {
    if (!farmData?.layout) return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    
    const farmWidth = farmData.layout.width * GRID_SIZE;
    const farmHeight = farmData.layout.height * GRID_SIZE;
    const offsetX = (CANVAS_WIDTH - farmWidth) / 2;
    const offsetY = (CANVAS_HEIGHT - farmHeight) / 2;
    
    return { farmWidth, farmHeight, offsetX, offsetY };
  }, [farmData?.layout]);

  // Optimized gesture handlers with debouncing
  const gestureHandlers = useMemo(() => {
    const pinchGesture = Gesture.Pinch()
      .onUpdate((event) => {
        scale.value = Math.max(0.5, Math.min(3, event.scale));
      })
      .onEnd(() => {
        scale.value = withSpring(Math.max(0.8, Math.min(2, scale.value)), {
          damping: 15,
          stiffness: 150,
        });
      });

    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      })
      .onEnd(() => {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      });

    const tapGesture = Gesture.Tap()
      .onEnd((event) => {
        if (!isInteractive) return;
        
        const tapX = event.x - farmDimensions.offsetX - translateX.value;
        const tapY = event.y - farmDimensions.offsetY - translateY.value;
        
        const gridX = Math.floor(tapX / GRID_SIZE);
        const gridY = Math.floor(tapY / GRID_SIZE);
        
        const tappedCrop = farmData?.crops.find(
          crop => crop.position.x === gridX && crop.position.y === gridY
        );
        
        if (tappedCrop && onCropTap) {
          runOnJS(onCropTap)(tappedCrop);
        } else if (onEmptySpaceTap && gridX >= 0 && gridX < (farmData?.layout.width || 0) && gridY >= 0 && gridY < (farmData?.layout.height || 0)) {
          runOnJS(onEmptySpaceTap)({ x: gridX, y: gridY });
        }
      });

    return Gesture.Simultaneous(
      Gesture.Race(pinchGesture, panGesture),
      tapGesture
    );
  }, [isInteractive, farmDimensions, farmData, onCropTap, onEmptySpaceTap, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }), []);

  // Memoized grid rendering with reduced complexity
  const gridElements = useMemo(() => {
    if (!farmData?.layout) return [];
    
    const { farmWidth, farmHeight, offsetX, offsetY } = farmDimensions;
    const gridLines = [];
    
    // Reduce grid line density for better performance
    const lineSpacing = GRID_SIZE;
    
    // Vertical lines
    for (let x = 0; x <= farmData.layout.width; x += 1) {
      const path = Skia.Path.Make();
      path.moveTo(offsetX + x * lineSpacing, offsetY);
      path.lineTo(offsetX + x * lineSpacing, offsetY + farmHeight);
      
      gridLines.push(
        <Path
          key={`v-${x}`}
          path={path}
          style="stroke"
          strokeWidth={0.5}
          color={theme.colors.border}
          opacity={0.2}
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= farmData.layout.height; y += 1) {
      const path = Skia.Path.Make();
      path.moveTo(offsetX, offsetY + y * lineSpacing);
      path.lineTo(offsetX + farmWidth, offsetY + y * lineSpacing);
      
      gridLines.push(
        <Path
          key={`h-${y}`}
          path={path}
          style="stroke"
          strokeWidth={0.5}
          color={theme.colors.border}
          opacity={0.2}
        />
      );
    }
    
    return gridLines;
  }, [farmData?.layout, farmDimensions, theme.colors.border]);

  // Memoized background
  const backgroundElement = useMemo(() => {
    if (!farmData?.layout) return null;
    
    const { farmWidth, farmHeight, offsetX, offsetY } = farmDimensions;
    
    return (
      <Rect
        x={offsetX}
        y={offsetY}
        width={farmWidth}
        height={farmHeight}
        color={theme.colors.surface}
      />
    );
  }, [farmData?.layout, farmDimensions, theme.colors.surface]);

  // Optimized crop rendering with culling
  const cropElements = useMemo(() => {
    if (!farmData?.crops) return [];
    
    // Only render crops that are visible (basic culling)
    const visibleCrops = farmData.crops.filter(crop => {
      const cropX = farmDimensions.offsetX + crop.position.x * GRID_SIZE;
      const cropY = farmDimensions.offsetY + crop.position.y * GRID_SIZE;
      
      return cropX >= -CROP_SIZE && cropX <= CANVAS_WIDTH + CROP_SIZE &&
             cropY >= -CROP_SIZE && cropY <= CANVAS_HEIGHT + CROP_SIZE;
    });
    
    return visibleCrops.map((crop) => (
      <MemoizedCrop
        key={crop.id}
        crop={crop}
        offsetX={farmDimensions.offsetX}
        offsetY={farmDimensions.offsetY}
        animationProgress={animationProgress}
        theme={theme}
      />
    ));
  }, [farmData?.crops, farmDimensions, animationProgress, theme]);

  // Performance monitoring
  useAnimatedReaction(
    () => animationData?.length || 0,
    (currentCount, previousCount) => {
      if (previousCount !== null && currentCount !== previousCount) {
        console.log(`Crop count changed: ${previousCount} -> ${currentCount}`);
      }
    }
  );

  if (!farmData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading farm...
          </Animated.Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gestureHandlers}>
        <Animated.View style={[styles.canvasContainer, animatedStyle]}>
          <Canvas ref={canvasRef} style={styles.canvas}>
            {backgroundElement}
            {gridElements}
            {cropElements}
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  canvasContainer: {
    flex: 1,
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});