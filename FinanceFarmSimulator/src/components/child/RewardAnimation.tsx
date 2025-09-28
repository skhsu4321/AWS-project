import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export interface RewardAnimationProps {
  reward: {
    type: 'money' | 'badge' | 'collectible' | 'boost';
    amount?: number;
    title: string;
    description: string;
    icon?: string;
  };
  onComplete: () => void;
  duration?: number;
}

export const RewardAnimation: React.FC<RewardAnimationProps> = ({
  reward,
  onComplete,
  duration = 3000,
}) => {
  const {theme, colorScheme} = useTheme();
  const isChildMode = colorScheme === 'child';
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animationStyles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    rewardContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.xl,
      padding: theme.spacing.xl,
      margin: theme.spacing.lg,
      ...(isChildMode && {
        borderWidth: 4,
        borderColor: theme.colors.primary,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 12,
      }),
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: theme.colors.primaryDark,
      }),
    },
    iconText: {
      fontSize: isChildMode ? 60 : 50,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      ...(isChildMode && {
        fontSize: theme.typography.h2.fontSize + 4,
        fontWeight: '800',
      }),
    },
    description: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 2,
        fontWeight: '600',
      }),
    },
    amountContainer: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.dimensions.borderRadius.large,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      ...(isChildMode && {
        borderWidth: 3,
        borderColor: theme.colors.primaryDark,
      }),
    },
    amountText: {
      ...theme.typography.h1,
      color: theme.colors.onPrimary,
      fontWeight: '700',
      textAlign: 'center',
      ...(isChildMode && {
        fontSize: theme.typography.h1.fontSize + 6,
        fontWeight: '800',
      }),
    },
    sparkle: {
      position: 'absolute',
      fontSize: isChildMode ? 30 : 24,
    },
  });

  useEffect(() => {
    // Start the animation sequence
    const animationSequence = Animated.sequence([
      // Scale in
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Bounce effect
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 200,
        friction: 4,
        useNativeDriver: true,
      }),
    ]);

    // Sparkle animation
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    // Fade out after duration
    const fadeOut = Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      delay: duration - 500,
      useNativeDriver: true,
    });

    // Start all animations
    animationSequence.start();
    sparkleAnimation.start();
    fadeOut.start(() => {
      onComplete();
    });

    return () => {
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
      sparkleAnim.setValue(0);
      fadeAnim.setValue(1);
    };
  }, [duration, onComplete]);

  const getRewardIcon = () => {
    if (reward.icon) return reward.icon;
    
    switch (reward.type) {
      case 'money':
        return '💰';
      case 'badge':
        return '🏆';
      case 'collectible':
        return '🎁';
      case 'boost':
        return '⚡';
      default:
        return '🎉';
    }
  };

  const sparklePositions = [
    {top: '10%', left: '10%'},
    {top: '15%', right: '15%'},
    {top: '30%', left: '5%'},
    {top: '35%', right: '10%'},
    {bottom: '20%', left: '15%'},
    {bottom: '25%', right: '20%'},
    {bottom: '40%', left: '8%'},
    {bottom: '45%', right: '12%'},
  ];

  return (
    <Animated.View 
      style={[
        animationStyles.container,
        {
          opacity: fadeAnim,
        }
      ]}
    >
      {/* Sparkles */}
      {sparklePositions.map((position, index) => (
        <Animated.Text
          key={index}
          style={[
            animationStyles.sparkle,
            position,
            {
              opacity: sparkleAnim,
              transform: [
                {
                  scale: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.5],
                  }),
                },
                {
                  rotate: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          ✨
        </Animated.Text>
      ))}

      <Animated.View
        style={[
          animationStyles.rewardContainer,
          {
            transform: [
              {
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
              {
                translateY: bounceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            animationStyles.iconContainer,
            {
              transform: [
                {
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={animationStyles.iconText}>
            {getRewardIcon()}
          </Text>
        </Animated.View>

        <Text style={animationStyles.title}>{reward.title}</Text>
        <Text style={animationStyles.description}>{reward.description}</Text>

        {reward.amount && (
          <Animated.View
            style={[
              animationStyles.amountContainer,
              {
                transform: [
                  {
                    scale: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={animationStyles.amountText}>
              +${reward.amount.toFixed(2)}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
};