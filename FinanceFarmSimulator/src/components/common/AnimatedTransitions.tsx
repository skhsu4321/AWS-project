import React, { useEffect } from 'react';
import {
  View,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,

  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) })
    );
  }, [opacity, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  direction: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction,
  duration = 400,
  delay = 0,
  distance,
  style,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const defaultDistance = distance || screenWidth * 0.5;
    
    switch (direction) {
      case 'left':
        translateX.value = -defaultDistance;
        translateX.value = withDelay(
          delay,
          withSpring(0, { damping: 15, stiffness: 150 })
        );
        break;
      case 'right':
        translateX.value = defaultDistance;
        translateX.value = withDelay(
          delay,
          withSpring(0, { damping: 15, stiffness: 150 })
        );
        break;
      case 'up':
        translateY.value = -defaultDistance;
        translateY.value = withDelay(
          delay,
          withSpring(0, { damping: 15, stiffness: 150 })
        );
        break;
      case 'down':
        translateY.value = defaultDistance;
        translateY.value = withDelay(
          delay,
          withSpring(0, { damping: 15, stiffness: 150 })
        );
        break;
    }
  }, [translateX, translateY, direction, delay, distance]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

interface ScaleInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  initialScale?: number;
  style?: ViewStyle;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  duration = 300,
  delay = 0,
  initialScale = 0,
  style,
}) => {
  const scale = useSharedValue(initialScale);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 200 })
    );
  }, [scale, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

interface PulseProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  repeat?: boolean;
  style?: ViewStyle;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  scale = 1.1,
  duration = 1000,
  repeat = true,
  style,
}) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const animation = withSequence(
      withTiming(scale, { duration: duration / 2 }),
      withTiming(1, { duration: duration / 2 })
    );

    pulseScale.value = repeat ? withRepeat(animation, -1) : animation;
  }, [pulseScale, scale, duration, repeat]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

interface ShakeProps {
  children: React.ReactNode;
  intensity?: number;
  duration?: number;
  trigger?: boolean;
  style?: ViewStyle;
}

export const Shake: React.FC<ShakeProps> = ({
  children,
  intensity = 10,
  duration = 500,
  trigger = false,
  style,
}) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateX.value = withSequence(
        withTiming(intensity, { duration: 50 }),
        withTiming(-intensity, { duration: 50 }),
        withTiming(intensity, { duration: 50 }),
        withTiming(-intensity, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [trigger, translateX, intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

interface BouncyButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const BouncyButton: React.FC<BouncyButtonProps> = ({
  children,
  onPress,
  style,
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(0.8, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(1, { duration: 100 });
      if (onPress) {
        'worklet';
        onPress();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

interface FloatingActionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FloatingAction: React.FC<FloatingActionProps> = ({
  children,
  style,
}) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

interface ProgressBarProps {
  progress: number; // 0 to 1
  width?: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  width = 200,
  height = 8,
  backgroundColor = '#E0E0E0',
  progressColor = '#4CAF50',
  animated = true,
  style,
}) => {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const targetWidth = Math.max(0, Math.min(1, progress)) * width;
    
    if (animated) {
      progressWidth.value = withSpring(targetWidth, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      progressWidth.value = targetWidth;
    }
  }, [progress, width, animated, progressWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor,
          borderRadius: height / 2,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: progressColor,
            borderRadius: height / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

interface CounterProps {
  value: number;
  duration?: number;
  style?: ViewStyle;
  textStyle?: any;
  formatter?: (value: number) => string;
}

export const AnimatedCounter: React.FC<CounterProps> = ({
  value,
  duration = 1000,
  style,
  textStyle,
  formatter = (val) => Math.round(val).toString(),
}) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [value, duration, animatedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentValue = animatedValue.value;
    return {
      // We'll use a text component that updates based on the animated value
    };
  });

  return (
    <Animated.View style={style}>
      <Animated.Text style={textStyle}>
        {/* This would need a custom text component that can animate numbers */}
        {formatter(value)}
      </Animated.Text>
    </Animated.View>
  );
};

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animationType?: 'fadeIn' | 'slideIn' | 'scaleIn';
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  animationType = 'fadeIn',
  direction = 'up',
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        const delay = index * staggerDelay;
        
        switch (animationType) {
          case 'slideIn':
            return (
              <SlideIn key={index} direction={direction} delay={delay}>
                {child}
              </SlideIn>
            );
          case 'scaleIn':
            return (
              <ScaleIn key={index} delay={delay}>
                {child}
              </ScaleIn>
            );
          default:
            return (
              <FadeIn key={index} delay={delay}>
                {child}
              </FadeIn>
            );
        }
      })}
    </>
  );
};

export default {
  FadeIn,
  SlideIn,
  ScaleIn,
  Pulse,
  Shake,
  BouncyButton,
  FloatingAction,
  AnimatedProgressBar,
  AnimatedCounter,
  StaggeredList,
};