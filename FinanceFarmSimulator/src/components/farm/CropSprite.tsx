import React, { useMemo } from 'react';
import {
  Group,
  Circle,
  Rect,
  Path,
  Skia,
  useValue,
  runTiming,
  Easing,
  interpolate,
} from '@shopify/react-native-skia';
import { Crop, GrowthStage, CropType } from '../../models/Game';

interface CropSpriteProps {
  crop: Crop;
  x: number;
  y: number;
  size: number;
  animationProgress: any; // Skia shared value
}

export const CropSprite: React.FC<CropSpriteProps> = ({
  crop,
  x,
  y,
  size,
  animationProgress,
}) => {
  // Animation values for different effects
  const growthAnimation = useValue(0);
  const fertilizerAnimation = useValue(0);
  const harvestAnimation = useValue(0);

  // Start growth animation when crop changes stage
  React.useEffect(() => {
    runTiming(growthAnimation, 1, {
      duration: 1000,
      easing: Easing.out(Easing.ease),
    });
  }, [crop.growthStage, growthAnimation]);

  // Start fertilizer animation when boost is applied
  React.useEffect(() => {
    if (crop.fertilizerBoost > 1) {
      runTiming(fertilizerAnimation, 1, {
        duration: 500,
        easing: Easing.bounce,
      }, () => {
        fertilizerAnimation.current = 0;
      });
    }
  }, [crop.fertilizerBoost, fertilizerAnimation]);

  // Start harvest animation when ready
  React.useEffect(() => {
    if (crop.growthStage === GrowthStage.READY_TO_HARVEST) {
      const animate = () => {
        runTiming(harvestAnimation, 1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }, () => {
          harvestAnimation.current = 0;
          animate();
        });
      };
      animate();
    }
  }, [crop.growthStage, harvestAnimation]);

  // Get crop-specific colors
  const getCropColors = useMemo(() => {
    const colorSchemes = {
      [CropType.TOMATO]: {
        primary: '#FF6B6B',
        secondary: '#FF8E8E',
        accent: '#4CAF50', // Green leaves
      },
      [CropType.CARROT]: {
        primary: '#FF8E53',
        secondary: '#FFB366',
        accent: '#4CAF50',
      },
      [CropType.CORN]: {
        primary: '#FFD93D',
        secondary: '#FFE066',
        accent: '#8BC34A',
      },
      [CropType.WHEAT]: {
        primary: '#F4D03F',
        secondary: '#F7DC6F',
        accent: '#D4AC0D',
      },
      [CropType.RICE]: {
        primary: '#A8E6CF',
        secondary: '#C8F7C5',
        accent: '#4CAF50',
      },
      [CropType.APPLE]: {
        primary: '#FF6B9D',
        secondary: '#FF8FB3',
        accent: '#4CAF50',
      },
      [CropType.ORANGE]: {
        primary: '#FFA726',
        secondary: '#FFB74D',
        accent: '#4CAF50',
      },
      [CropType.STRAWBERRY]: {
        primary: '#E91E63',
        secondary: '#F06292',
        accent: '#4CAF50',
      },
    };
    return colorSchemes[crop.type] || colorSchemes[CropType.CARROT];
  }, [crop.type]);

  // Render different growth stages
  const renderCropByStage = useMemo(() => {
    const colors = getCropColors;
    const baseSize = size;
    
    switch (crop.growthStage) {
      case GrowthStage.SEED:
        return (
          <Group>
            {/* Small brown seed */}
            <Circle
              cx={x}
              cy={y}
              r={baseSize * 0.15}
              color="#8B4513"
            />
          </Group>
        );

      case GrowthStage.SPROUT:
        return (
          <Group>
            {/* Small green sprout */}
            <Circle
              cx={x}
              cy={y + baseSize * 0.1}
              r={baseSize * 0.2}
              color={colors.accent}
            />
            {/* Tiny leaves */}
            <Circle
              cx={x - baseSize * 0.15}
              cy={y - baseSize * 0.1}
              r={baseSize * 0.1}
              color={colors.accent}
            />
            <Circle
              cx={x + baseSize * 0.15}
              cy={y - baseSize * 0.1}
              r={baseSize * 0.1}
              color={colors.accent}
            />
          </Group>
        );

      case GrowthStage.GROWING:
        return (
          <Group>
            {/* Growing plant with stem and leaves */}
            <Rect
              x={x - 2}
              y={y - baseSize * 0.2}
              width={4}
              height={baseSize * 0.4}
              color={colors.accent}
            />
            {/* Multiple leaves */}
            <Circle
              cx={x - baseSize * 0.2}
              cy={y - baseSize * 0.1}
              r={baseSize * 0.15}
              color={colors.accent}
            />
            <Circle
              cx={x + baseSize * 0.2}
              cy={y - baseSize * 0.1}
              r={baseSize * 0.15}
              color={colors.accent}
            />
            <Circle
              cx={x}
              cy={y - baseSize * 0.25}
              r={baseSize * 0.12}
              color={colors.accent}
            />
          </Group>
        );

      case GrowthStage.MATURE:
        return (
          <Group>
            {/* Mature plant with developing fruit */}
            <Rect
              x={x - 3}
              y={y - baseSize * 0.3}
              width={6}
              height={baseSize * 0.6}
              color={colors.accent}
            />
            {/* Larger leaves */}
            <Circle
              cx={x - baseSize * 0.25}
              cy={y - baseSize * 0.15}
              r={baseSize * 0.18}
              color={colors.accent}
            />
            <Circle
              cx={x + baseSize * 0.25}
              cy={y - baseSize * 0.15}
              r={baseSize * 0.18}
              color={colors.accent}
            />
            {/* Small developing fruit */}
            <Circle
              cx={x}
              cy={y - baseSize * 0.1}
              r={baseSize * 0.2}
              color={colors.secondary}
            />
          </Group>
        );

      case GrowthStage.READY_TO_HARVEST:
        const glowSize = interpolate(harvestAnimation.current, [0, 1], [1, 1.2]);
        return (
          <Group>
            {/* Full grown plant with ripe fruit */}
            <Rect
              x={x - 4}
              y={y - baseSize * 0.35}
              width={8}
              height={baseSize * 0.7}
              color={colors.accent}
            />
            {/* Full leaves */}
            <Circle
              cx={x - baseSize * 0.3}
              cy={y - baseSize * 0.2}
              r={baseSize * 0.2}
              color={colors.accent}
            />
            <Circle
              cx={x + baseSize * 0.3}
              cy={y - baseSize * 0.2}
              r={baseSize * 0.2}
              color={colors.accent}
            />
            {/* Ripe fruit with glow effect */}
            <Circle
              cx={x}
              cy={y - baseSize * 0.1}
              r={baseSize * 0.35 * glowSize}
              color={colors.primary}
            />
            {/* Harvest glow */}
            <Circle
              cx={x}
              cy={y - baseSize * 0.1}
              r={baseSize * 0.4 * glowSize}
              color={colors.primary}
              opacity={0.3}
            />
          </Group>
        );

      case GrowthStage.HARVESTED:
        return (
          <Group>
            {/* Just the stem remains */}
            <Rect
              x={x - 2}
              y={y - baseSize * 0.1}
              width={4}
              height={baseSize * 0.2}
              color={colors.accent}
              opacity={0.5}
            />
          </Group>
        );

      case GrowthStage.WITHERED:
        return (
          <Group>
            {/* Withered plant */}
            <Rect
              x={x - 3}
              y={y - baseSize * 0.2}
              width={6}
              height={baseSize * 0.4}
              color="#8B4513"
              opacity={0.7}
            />
            <Circle
              cx={x - baseSize * 0.2}
              cy={y - baseSize * 0.1}
              r={baseSize * 0.15}
              color="#8B4513"
              opacity={0.7}
            />
            <Circle
              cx={x + baseSize * 0.2}
              cy={y - baseSize * 0.1}
              r={baseSize * 0.15}
              color="#8B4513"
              opacity={0.7}
            />
          </Group>
        );

      default:
        return null;
    }
  }, [crop.growthStage, getCropColors, x, y, size, harvestAnimation]);

  // Render health bar
  const renderHealthBar = useMemo(() => {
    if (crop.healthPoints >= 100) return null;
    
    const barWidth = size * 0.8;
    const barHeight = 4;
    const barX = x - barWidth / 2;
    const barY = y - size * 0.6;
    
    return (
      <Group>
        {/* Background bar */}
        <Rect
          x={barX}
          y={barY}
          width={barWidth}
          height={barHeight}
          color="rgba(255,0,0,0.3)"
        />
        {/* Health bar */}
        <Rect
          x={barX}
          y={barY}
          width={barWidth * (crop.healthPoints / 100)}
          height={barHeight}
          color="#4CAF50"
        />
      </Group>
    );
  }, [crop.healthPoints, x, y, size]);

  // Render fertilizer boost effect
  const renderFertilizerEffect = useMemo(() => {
    if (crop.fertilizerBoost <= 1) return null;
    
    const sparkleSize = interpolate(fertilizerAnimation.current, [0, 1], [0, 8]);
    const sparkleOpacity = interpolate(fertilizerAnimation.current, [0, 0.5, 1], [0, 1, 0]);
    
    return (
      <Group>
        {/* Sparkle effects around the crop */}
        <Circle
          cx={x + size * 0.4}
          cy={y - size * 0.4}
          r={sparkleSize}
          color="#FFD700"
          opacity={sparkleOpacity}
        />
        <Circle
          cx={x - size * 0.4}
          cy={y - size * 0.2}
          r={sparkleSize * 0.7}
          color="#FFD700"
          opacity={sparkleOpacity}
        />
        <Circle
          cx={x + size * 0.2}
          cy={y + size * 0.3}
          r={sparkleSize * 0.5}
          color="#FFD700"
          opacity={sparkleOpacity}
        />
      </Group>
    );
  }, [crop.fertilizerBoost, fertilizerAnimation, x, y, size]);

  // Render weed penalty effect
  const renderWeedEffect = useMemo(() => {
    if (crop.weedPenalty <= 0) return null;
    
    const weedOpacity = crop.weedPenalty * 0.7;
    
    return (
      <Group>
        {/* Small brown weeds around the crop */}
        <Circle
          cx={x - size * 0.3}
          cy={y + size * 0.3}
          r={size * 0.1}
          color="#8B4513"
          opacity={weedOpacity}
        />
        <Circle
          cx={x + size * 0.3}
          cy={y + size * 0.2}
          r={size * 0.08}
          color="#8B4513"
          opacity={weedOpacity}
        />
        <Circle
          cx={x - size * 0.1}
          cy={y + size * 0.4}
          r={size * 0.06}
          color="#8B4513"
          opacity={weedOpacity}
        />
      </Group>
    );
  }, [crop.weedPenalty, x, y, size]);

  return (
    <Group>
      {/* Crop shadow */}
      <Circle
        cx={x + 2}
        cy={y + 2}
        r={size * 0.4}
        color="rgba(0,0,0,0.2)"
      />
      
      {/* Main crop sprite */}
      {renderCropByStage}
      
      {/* Effects and indicators */}
      {renderHealthBar}
      {renderFertilizerEffect}
      {renderWeedEffect}
    </Group>
  );
};