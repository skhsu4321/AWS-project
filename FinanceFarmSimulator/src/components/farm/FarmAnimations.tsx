import React from 'react';
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

interface AnimationProps {
  x: number;
  y: number;
  isActive: boolean;
  onComplete?: () => void;
}

// Growth animation when crop advances to next stage
export const GrowthAnimation: React.FC<AnimationProps> = ({
  x,
  y,
  isActive,
  onComplete,
}) => {
  const progress = useValue(0);
  const scale = useValue(0);
  const opacity = useValue(0);

  React.useEffect(() => {
    if (isActive) {
      // Reset values
      progress.current = 0;
      scale.current = 0;
      opacity.current = 1;

      // Animate growth burst
      runTiming(progress, 1, {
        duration: 800,
        easing: Easing.out(Easing.back(1.7)),
      });

      runTiming(scale, 1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      });

      runTiming(opacity, 0, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      }, onComplete);
    }
  }, [isActive, progress, scale, opacity, onComplete]);

  if (!isActive) return null;

  const animatedScale = interpolate(scale.current, [0, 1], [0.5, 2]);
  const animatedOpacity = interpolate(opacity.current, [0, 1], [0, 0.8]);

  return (
    <Group>
      {/* Growth burst particles */}
      <Circle
        cx={x}
        cy={y - 20}
        r={8 * animatedScale}
        color="#4CAF50"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x - 15}
        cy={y - 10}
        r={6 * animatedScale}
        color="#8BC34A"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x + 15}
        cy={y - 10}
        r={6 * animatedScale}
        color="#8BC34A"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x - 10}
        cy={y + 10}
        r={4 * animatedScale}
        color="#CDDC39"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x + 10}
        cy={y + 10}
        r={4 * animatedScale}
        color="#CDDC39"
        opacity={animatedOpacity}
      />
    </Group>
  );
};

// Fertilizer animation when income is logged
export const FertilizerAnimation: React.FC<AnimationProps> = ({
  x,
  y,
  isActive,
  onComplete,
}) => {
  const progress = useValue(0);
  const sparkleScale = useValue(0);
  const sparkleOpacity = useValue(0);

  React.useEffect(() => {
    if (isActive) {
      progress.current = 0;
      sparkleScale.current = 0;
      sparkleOpacity.current = 1;

      runTiming(progress, 1, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      });

      runTiming(sparkleScale, 1, {
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
      });

      runTiming(sparkleOpacity, 0, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      }, onComplete);
    }
  }, [isActive, progress, sparkleScale, sparkleOpacity, onComplete]);

  if (!isActive) return null;

  const animatedScale = interpolate(sparkleScale.current, [0, 1], [0, 1.5]);
  const animatedOpacity = interpolate(sparkleOpacity.current, [0, 1], [0, 1]);

  return (
    <Group>
      {/* Golden sparkles */}
      <Circle
        cx={x}
        cy={y - 25}
        r={10 * animatedScale}
        color="#FFD700"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x - 20}
        cy={y - 15}
        r={8 * animatedScale}
        color="#FFC107"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x + 20}
        cy={y - 15}
        r={8 * animatedScale}
        color="#FFC107"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x - 15}
        cy={y + 15}
        r={6 * animatedScale}
        color="#FFEB3B"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x + 15}
        cy={y + 15}
        r={6 * animatedScale}
        color="#FFEB3B"
        opacity={animatedOpacity}
      />
      
      {/* Fertilizer particles falling */}
      <Circle
        cx={x - 5}
        cy={y - 30 + (progress.current * 40)}
        r={3}
        color="#8BC34A"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x + 5}
        cy={y - 35 + (progress.current * 45)}
        r={2}
        color="#4CAF50"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x}
        cy={y - 40 + (progress.current * 50)}
        r={2}
        color="#66BB6A"
        opacity={animatedOpacity}
      />
    </Group>
  );
};

// Harvest animation when goal is completed
export const HarvestAnimation: React.FC<AnimationProps> = ({
  x,
  y,
  isActive,
  onComplete,
}) => {
  const progress = useValue(0);
  const burstScale = useValue(0);
  const burstOpacity = useValue(0);
  const coinScale = useValue(0);

  React.useEffect(() => {
    if (isActive) {
      progress.current = 0;
      burstScale.current = 0;
      burstOpacity.current = 1;
      coinScale.current = 0;

      // Burst animation
      runTiming(burstScale, 1, {
        duration: 400,
        easing: Easing.out(Easing.back(2)),
      });

      runTiming(burstOpacity, 0, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      });

      // Coin animation
      runTiming(coinScale, 1, {
        duration: 600,
        easing: Easing.out(Easing.bounce),
      });

      runTiming(progress, 1, {
        duration: 1200,
        easing: Easing.out(Easing.ease),
      }, onComplete);
    }
  }, [isActive, progress, burstScale, burstOpacity, coinScale, onComplete]);

  if (!isActive) return null;

  const animatedBurstScale = interpolate(burstScale.current, [0, 1], [0, 3]);
  const animatedBurstOpacity = interpolate(burstOpacity.current, [0, 1], [0, 0.8]);
  const animatedCoinScale = interpolate(coinScale.current, [0, 1], [0, 1]);

  return (
    <Group>
      {/* Harvest burst */}
      <Circle
        cx={x}
        cy={y}
        r={20 * animatedBurstScale}
        color="#FFD700"
        opacity={animatedBurstOpacity * 0.3}
      />
      <Circle
        cx={x}
        cy={y}
        r={15 * animatedBurstScale}
        color="#FFC107"
        opacity={animatedBurstOpacity * 0.5}
      />
      <Circle
        cx={x}
        cy={y}
        r={10 * animatedBurstScale}
        color="#FFEB3B"
        opacity={animatedBurstOpacity}
      />

      {/* Floating coins */}
      <Circle
        cx={x - 10}
        cy={y - 20 - (progress.current * 30)}
        r={8 * animatedCoinScale}
        color="#FFD700"
        opacity={1 - progress.current}
      />
      <Circle
        cx={x + 10}
        cy={y - 25 - (progress.current * 35)}
        r={6 * animatedCoinScale}
        color="#FFC107"
        opacity={1 - progress.current}
      />
      <Circle
        cx={x}
        cy={y - 30 - (progress.current * 40)}
        r={7 * animatedCoinScale}
        color="#FFEB3B"
        opacity={1 - progress.current}
      />

      {/* Star particles */}
      <Circle
        cx={x - 25}
        cy={y - 15}
        r={4 * animatedBurstScale}
        color="#FF6B6B"
        opacity={animatedBurstOpacity}
      />
      <Circle
        cx={x + 25}
        cy={y - 15}
        r={4 * animatedBurstScale}
        color="#4ECDC4"
        opacity={animatedBurstOpacity}
      />
      <Circle
        cx={x - 20}
        cy={y + 20}
        r={3 * animatedBurstScale}
        color="#45B7D1"
        opacity={animatedBurstOpacity}
      />
      <Circle
        cx={x + 20}
        cy={y + 20}
        r={3 * animatedBurstScale}
        color="#96CEB4"
        opacity={animatedBurstOpacity}
      />
    </Group>
  );
};

// Weed pulling animation when expenses are logged
export const WeedPullingAnimation: React.FC<AnimationProps> = ({
  x,
  y,
  isActive,
  onComplete,
}) => {
  const progress = useValue(0);
  const weedScale = useValue(1);
  const weedOpacity = useValue(1);

  React.useEffect(() => {
    if (isActive) {
      progress.current = 0;
      weedScale.current = 1;
      weedOpacity.current = 1;

      // Weed shrinking animation
      runTiming(weedScale, 0, {
        duration: 600,
        easing: Easing.in(Easing.ease),
      });

      runTiming(weedOpacity, 0, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      });

      runTiming(progress, 1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      }, onComplete);
    }
  }, [isActive, progress, weedScale, weedOpacity, onComplete]);

  if (!isActive) return null;

  const animatedScale = interpolate(weedScale.current, [0, 1], [0, 1]);
  const animatedOpacity = interpolate(weedOpacity.current, [0, 1], [0, 1]);

  return (
    <Group>
      {/* Weeds being pulled */}
      <Circle
        cx={x - 15}
        cy={y + 20}
        r={6 * animatedScale}
        color="#8B4513"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x + 15}
        cy={y + 15}
        r={5 * animatedScale}
        color="#A0522D"
        opacity={animatedOpacity}
      />
      <Circle
        cx={x - 5}
        cy={y + 25}
        r={4 * animatedScale}
        color="#8B4513"
        opacity={animatedOpacity}
      />

      {/* Dust particles */}
      <Circle
        cx={x - 10}
        cy={y + 10}
        r={2}
        color="#D2B48C"
        opacity={animatedOpacity * 0.7}
      />
      <Circle
        cx={x + 10}
        cy={y + 12}
        r={2}
        color="#DEB887"
        opacity={animatedOpacity * 0.7}
      />
      <Circle
        cx={x}
        cy={y + 15}
        r={1}
        color="#F5DEB3"
        opacity={animatedOpacity * 0.7}
      />
    </Group>
  );
};

// Planting animation when new goal is created
export const PlantingAnimation: React.FC<AnimationProps> = ({
  x,
  y,
  isActive,
  onComplete,
}) => {
  const progress = useValue(0);
  const seedScale = useValue(0);
  const soilOpacity = useValue(0);

  React.useEffect(() => {
    if (isActive) {
      progress.current = 0;
      seedScale.current = 0;
      soilOpacity.current = 1;

      runTiming(soilOpacity, 0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });

      runTiming(seedScale, 1, {
        duration: 600,
        easing: Easing.out(Easing.back(1.7)),
      });

      runTiming(progress, 1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      }, onComplete);
    }
  }, [isActive, progress, seedScale, soilOpacity, onComplete]);

  if (!isActive) return null;

  const animatedSeedScale = interpolate(seedScale.current, [0, 1], [0, 1]);
  const animatedSoilOpacity = interpolate(soilOpacity.current, [0, 1], [0, 0.8]);

  return (
    <Group>
      {/* Soil particles */}
      <Circle
        cx={x - 8}
        cy={y + 10}
        r={3}
        color="#8B4513"
        opacity={animatedSoilOpacity}
      />
      <Circle
        cx={x + 8}
        cy={y + 12}
        r={4}
        color="#A0522D"
        opacity={animatedSoilOpacity}
      />
      <Circle
        cx={x}
        cy={y + 15}
        r={2}
        color="#8B4513"
        opacity={animatedSoilOpacity}
      />

      {/* Growing seed */}
      <Circle
        cx={x}
        cy={y}
        r={6 * animatedSeedScale}
        color="#8B4513"
      />

      {/* Sparkle effect */}
      <Circle
        cx={x - 12}
        cy={y - 8}
        r={2 * animatedSeedScale}
        color="#FFD700"
        opacity={0.8}
      />
      <Circle
        cx={x + 12}
        cy={y - 8}
        r={2 * animatedSeedScale}
        color="#FFD700"
        opacity={0.8}
      />
    </Group>
  );
};