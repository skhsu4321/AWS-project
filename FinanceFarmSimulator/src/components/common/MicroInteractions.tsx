import React, { useEffect } from 'react';
import {
  View,
  ViewStyle,
  Haptics,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Haptic feedback helper
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
  if (Platform.OS === 'ios') {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  }
};

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  scaleValue?: number;
  hapticFeedback?: 'light' | 'medium' | 'heavy';
  disabled?: boolean;
  style?: ViewStyle;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  children,
  onPress,
  onLongPress,
  scaleValue = 0.95,
  hapticFeedback = 'light',
  disabled = false,
  style,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withSpring(scaleValue, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(0.8, { duration: 100 });
      if (hapticFeedback) {
        'worklet';
        triggerHaptic(hapticFeedback);
      }
    })
    .onFinalize((event) => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(1, { duration: 100 });
      
      if (event.state === 4 && onPress) { // GESTURE_STATE_END
        'worklet';
        onPress();
      }
    });

  const longPressGesture = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(500)
    .onStart(() => {
      if (onLongPress) {
        'worklet';
        triggerHaptic('medium');
        onLongPress();
      }
    });

  const composedGesture = Gesture.Race(gesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  style?: ViewStyle;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  style,
}) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      opacity.value = interpolate(
        Math.abs(event.translationX),
        [0, swipeThreshold],
        [1, 0.7]
      );
    })
    .onEnd((event) => {
      const shouldSwipeLeft = event.translationX < -swipeThreshold;
      const shouldSwipeRight = event.translationX > swipeThreshold;

      if (shouldSwipeLeft && onSwipeLeft) {
        translateX.value = withTiming(-300, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        'worklet';
        triggerHaptic('medium');
        onSwipeLeft();
      } else if (shouldSwipeRight && onSwipeRight) {
        translateX.value = withTiming(300, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        'worklet';
        triggerHaptic('medium');
        onSwipeRight();
      } else {
        translateX.value = withSpring(0);
        opacity.value = withTiming(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
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

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  style?: ViewStyle;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  style,
}) => {
  const translateY = useSharedValue(0);
  const isRefreshing = useSharedValue(false);
  const refreshProgress = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0 && !isRefreshing.value) {
        translateY.value = event.translationY * 0.5; // Damping effect
        refreshProgress.value = Math.min(event.translationY / refreshThreshold, 1);
      }
    })
    .onEnd((event) => {
      if (event.translationY > refreshThreshold && !isRefreshing.value) {
        isRefreshing.value = true;
        'worklet';
        triggerHaptic('success');
        
        (async () => {
          await onRefresh();
          isRefreshing.value = false;
          translateY.value = withSpring(0);
          refreshProgress.value = withTiming(0);
        })();
      } else {
        translateY.value = withSpring(0);
        refreshProgress.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const refreshIndicatorStyle = useAnimatedStyle(() => ({
    opacity: refreshProgress.value,
    transform: [
      { scale: refreshProgress.value },
      { rotate: `${refreshProgress.value * 360}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -40,
              left: '50%',
              marginLeft: -20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            },
            refreshIndicatorStyle,
          ]}
        >
          {/* Refresh indicator - could be a spinner or custom icon */}
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#007AFF',
              borderTopColor: 'transparent',
            }}
          />
        </Animated.View>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

interface FloatingLabelInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  label: string;
  style?: ViewStyle;
  inputStyle?: any;
  labelStyle?: any;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  style,
  inputStyle,
  labelStyle,
}) => {
  const labelPosition = useSharedValue(value ? 1 : 0);
  const labelScale = useSharedValue(value ? 0.8 : 1);

  useEffect(() => {
    if (value) {
      labelPosition.value = withSpring(1);
      labelScale.value = withSpring(0.8);
    } else {
      labelPosition.value = withSpring(0);
      labelScale.value = withSpring(1);
    }
  }, [value, labelPosition, labelScale]);

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(labelPosition.value, [0, 1], [0, -25]),
      },
      {
        scale: labelScale.value,
      },
    ],
    color: interpolate(labelPosition.value, [0, 1], [0x999999, 0x007AFF]),
  }));

  return (
    <View style={[{ marginVertical: 10 }, style]}>
      <Animated.Text style={[{ position: 'absolute', left: 10, top: 15 }, labelStyle, animatedLabelStyle]}>
        {label}
      </Animated.Text>
      {/* TextInput would go here - simplified for this example */}
      <View
        style={[
          {
            borderWidth: 1,
            borderColor: '#E0E0E0',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 15,
            paddingTop: value ? 25 : 15,
          },
          inputStyle,
        ]}
      >
        {/* Actual TextInput component would be rendered here */}
      </View>
    </View>
  );
};

interface RippleEffectProps {
  children: React.ReactNode;
  onPress?: () => void;
  rippleColor?: string;
  style?: ViewStyle;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  onPress,
  rippleColor = 'rgba(0, 122, 255, 0.3)',
  style,
}) => {
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  const gesture = Gesture.Tap()
    .onBegin(() => {
      rippleScale.value = 0;
      rippleOpacity.value = 1;
      
      rippleScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      rippleOpacity.value = withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) })
      );
    })
    .onFinalize(() => {
      if (onPress) {
        'worklet';
        onPress();
      }
    });

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={[{ overflow: 'hidden' }, style]}>
        {children}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: rippleColor,
              borderRadius: 1000, // Large radius for circular ripple
            },
            rippleStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
};

interface ParallaxScrollProps {
  children: React.ReactNode;
  headerHeight: number;
  headerComponent: React.ReactNode;
  style?: ViewStyle;
}

export const ParallaxScroll: React.FC<ParallaxScrollProps> = ({
  children,
  headerHeight,
  headerComponent,
  style,
}) => {
  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: scrollY.value * 0.5, // Parallax effect
      },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, headerHeight], [0, 0.8]),
  }));

  // This would need to be integrated with a ScrollView
  // For now, we'll just show the structure

  return (
    <View style={style}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: headerHeight,
            zIndex: 1,
          },
          headerStyle,
        ]}
      >
        {headerComponent}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'black',
            },
            overlayStyle,
          ]}
        />
      </Animated.View>
      <View style={{ paddingTop: headerHeight }}>
        {children}
      </View>
    </View>
  );
};

export default {
  PressableScale,
  SwipeableCard,
  PullToRefresh,
  FloatingLabelInput,
  RippleEffect,
  ParallaxScroll,
};