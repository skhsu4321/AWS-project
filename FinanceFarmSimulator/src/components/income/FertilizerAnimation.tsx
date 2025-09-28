import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface FertilizerAnimationProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
  intensity?: number; // 1-5, affects particle count and animation speed
  testID?: string;
}

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FertilizerAnimation: React.FC<FertilizerAnimationProps> = ({
  isVisible,
  onAnimationComplete,
  intensity = 3,
  testID = 'fertilizer-animation',
}) => {
  const { theme } = useTheme();
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const particleCount = Math.min(Math.max(intensity * 8, 8), 40);
  const animationDuration = Math.max(2000 - (intensity * 200), 1000);

  useEffect(() => {
    if (isVisible) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [isVisible, intensity]);

  const createParticles = (): Particle[] => {
    return Array.from({ length: particleCount }, (_, index) => ({
      id: index,
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(screenHeight + 50),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      rotation: new Animated.Value(0),
    }));
  };

  const startAnimation = () => {
    particlesRef.current = createParticles();

    const animations = particlesRef.current.map((particle, index) => {
      const delay = (index * animationDuration) / particleCount;
      const targetY = -100 - Math.random() * 200;
      const targetX = particle.x._value + (Math.random() - 0.5) * 200;

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // Fade in
          Animated.timing(particle.opacity, {
            toValue: 0.8 + Math.random() * 0.2,
            duration: 300,
            useNativeDriver: true,
          }),
          // Scale up
          Animated.timing(particle.scale, {
            toValue: 0.8 + Math.random() * 0.4,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          // Move up and slightly sideways
          Animated.timing(particle.y, {
            toValue: targetY,
            duration: animationDuration - 600,
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: targetX,
            duration: animationDuration - 600,
            useNativeDriver: true,
          }),
          // Rotate
          Animated.timing(particle.rotation, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration: animationDuration - 600,
            useNativeDriver: true,
          }),
          // Fade out
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    animationRef.current = Animated.parallel(animations);
    animationRef.current.start((finished) => {
      if (finished && onAnimationComplete) {
        onAnimationComplete();
      }
    });
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    particlesRef.current = [];
  };

  const getParticleEmoji = (index: number): string => {
    const emojis = ['✨', '💫', '⭐', '🌟', '💎', '🔥', '⚡'];
    return emojis[index % emojis.length];
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 1000,
    },
    particle: {
      position: 'absolute',
      fontSize: 20,
      textAlign: 'center',
      width: 30,
      height: 30,
    },
  });

  if (!isVisible || particlesRef.current.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      {particlesRef.current.map((particle, index) => (
        <Animated.Text
          key={particle.id}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          {getParticleEmoji(index)}
        </Animated.Text>
      ))}
    </View>
  );
};