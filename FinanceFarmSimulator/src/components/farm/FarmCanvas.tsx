import React, { useMemo, useCallback } from 'react';
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
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Farm, Crop, GrowthStage, CropType } from '../../models/Game';
import { useTheme } from '../../contexts/ThemeContext';

interface FarmCanvasProps {
  farm: Farm;
  onCropTap?: (crop: Crop) => void;
  onEmptySpaceTap?: (position: { x: number; y: number }) => void;
  isInteractive?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 32; // Account for padding
const CANVAS_HEIGHT = screenHeight * 0.6; // 60% of screen height
const GRID_SIZE = 40; // Size of each grid cell
const CROP_SIZE = 32; // Size of crop sprites

export const FarmCanvas: React.FC<FarmCanvasProps> = ({
  farm,
  onCropTap,
  onEmptySpaceTap,
  isInteractive = true,
}) => {
  const { theme } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // Skia animation values
  const animationProgress = useValue(0);
  
  // Start continuous animation loop
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

  // Calculate farm dimensions
  const farmWidth = farm.layout.width * GRID_SIZE;
  const farmHeight = farm.layout.height * GRID_SIZE;
  
  // Center the farm in the canvas
  const offsetX = (CANVAS_WIDTH - farmWidth) / 2;
  const offsetY = (CANVAS_HEIGHT - farmHeight) / 2;

  // Gesture handlers for zoom and pan
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(3, event.scale));
    })
    .onEnd(() => {
      scale.value = withSpring(Math.max(0.8, Math.min(2, scale.value)));
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      if (!isInteractive) return;
      
      const tapX = event.x - offsetX - translateX.value;
      const tapY = event.y - offsetY - translateY.value;
      
      // Convert tap coordinates to grid position
      const gridX = Math.floor(tapX / GRID_SIZE);
      const gridY = Math.floor(tapY / GRID_SIZE);
      
      // Check if tap is on a crop
      const tappedCrop = farm.crops.find(
        crop => crop.position.x === gridX && crop.position.y === gridY
      );
      
      if (tappedCrop && onCropTap) {
        runOnJS(onCropTap)(tappedCrop);
      } else if (onEmptySpaceTap && gridX >= 0 && gridX < farm.layout.width && gridY >= 0 && gridY < farm.layout.height) {
        runOnJS(onEmptySpaceTap)({ x: gridX, y: gridY });
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(pinchGesture, panGesture),
    tapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Generate crop sprites based on type and growth stage
  const getCropColor = useCallback((crop: Crop): string => {
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
  }, []);

  const getCropSize = useCallback((crop: Crop): number => {
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
  }, []);

  // Render farm grid
  const renderGrid = useMemo(() => {
    const gridLines = [];
    
    // Vertical lines
    for (let x = 0; x <= farm.layout.width; x++) {
      const path = Skia.Path.Make();
      path.moveTo(offsetX + x * GRID_SIZE, offsetY);
      path.lineTo(offsetX + x * GRID_SIZE, offsetY + farmHeight);
      
      gridLines.push(
        <Path
          key={`v-${x}`}
          path={path}
          style="stroke"
          strokeWidth={1}
          color={theme.colors.border}
          opacity={0.3}
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= farm.layout.height; y++) {
      const path = Skia.Path.Make();
      path.moveTo(offsetX, offsetY + y * GRID_SIZE);
      path.lineTo(offsetX + farmWidth, offsetY + y * GRID_SIZE);
      
      gridLines.push(
        <Path
          key={`h-${y}`}
          path={path}
          style="stroke"
          strokeWidth={1}
          color={theme.colors.border}
          opacity={0.3}
        />
      );
    }
    
    return gridLines;
  }, [farm.layout, offsetX, offsetY, farmWidth, farmHeight, theme.colors.border]);

  // Render farm background
  const renderBackground = useMemo(() => (
    <Rect
      x={offsetX}
      y={offsetY}
      width={farmWidth}
      height={farmHeight}
      color={theme.colors.surface}
    />
  ), [offsetX, offsetY, farmWidth, farmHeight, theme.colors.surface]);

  // Render crops with animations
  const renderCrops = useMemo(() => {
    return farm.crops.map((crop) => {
      const cropX = offsetX + crop.position.x * GRID_SIZE + GRID_SIZE / 2;
      const cropY = offsetY + crop.position.y * GRID_SIZE + GRID_SIZE / 2;
      const cropSize = getCropSize(crop);
      const cropColor = getCropColor(crop);
      
      // Add growth animation effect
      const growthPulse = crop.growthStage === GrowthStage.GROWING ? 1.1 : 1.0;
      const harvestGlow = crop.growthStage === GrowthStage.READY_TO_HARVEST ? 1.2 : 1.0;
      
      return (
        <Group key={crop.id}>
          {/* Crop shadow */}
          <Circle
            cx={cropX + 2}
            cy={cropY + 2}
            r={cropSize / 2}
            color="rgba(0,0,0,0.2)"
          />
          
          {/* Main crop */}
          <Circle
            cx={cropX}
            cy={cropY}
            r={cropSize / 2 * growthPulse * harvestGlow}
            color={cropColor}
          />
          
          {/* Health indicator */}
          {crop.healthPoints < 100 && (
            <Rect
              x={cropX - 15}
              y={cropY - cropSize / 2 - 8}
              width={30}
              height={4}
              color="rgba(255,0,0,0.3)"
            />
          )}
          {crop.healthPoints < 100 && (
            <Rect
              x={cropX - 15}
              y={cropY - cropSize / 2 - 8}
              width={30 * (crop.healthPoints / 100)}
              height={4}
              color="#4CAF50"
            />
          )}
          
          {/* Fertilizer boost indicator */}
          {crop.fertilizerBoost > 1 && (
            <Circle
              cx={cropX + cropSize / 3}
              cy={cropY - cropSize / 3}
              r={4}
              color="#FFD700"
            />
          )}
          
          {/* Weed penalty indicator */}
          {crop.weedPenalty > 0 && (
            <Circle
              cx={cropX - cropSize / 3}
              cy={cropY + cropSize / 3}
              r={3}
              color="#8B4513"
            />
          )}
        </Group>
      );
    });
  }, [farm.crops, offsetX, offsetY, getCropSize, getCropColor]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.canvasContainer, animatedStyle]}>
          <Canvas style={styles.canvas}>
            {renderBackground}
            {renderGrid}
            {renderCrops}
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
});