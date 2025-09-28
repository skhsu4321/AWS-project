import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Typography } from '../common/Typography';
import { useTheme } from '../../contexts/ThemeContext';

interface GoalProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  animated?: boolean;
  showPercentage?: boolean;
  style?: any;
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({
  progress,
  color,
  height = 8,
  animated = true,
  showPercentage = true,
  style,
}) => {
  const { theme } = useTheme();
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  const progressColor = color || theme.colors.primary;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  useEffect(() => {
    if (animated) {
      // Animate the progress bar fill
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      // Animate the percentage text
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
      animatedOpacity.setValue(1);
    }
  }, [clampedProgress, animated]);

  const styles = StyleSheet.create({
    container: {
      width: '100%',
    },
    progressContainer: {
      height,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: height / 2,
      overflow: 'hidden',
      marginBottom: showPercentage ? theme.spacing.xs : 0,
    },
    progressBar: {
      height: '100%',
      backgroundColor: progressColor,
      borderRadius: height / 2,
    },
    percentageContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    percentage: {
      color: progressColor,
      fontWeight: '600',
    },
    milestones: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '100%',
    },
    milestone: {
      width: 2,
      height: '100%',
      backgroundColor: theme.colors.outline + '40',
    },
  });

  const renderMilestones = () => {
    const milestones = [25, 50, 75];
    return (
      <View style={styles.milestones}>
        {milestones.map((milestone) => (
          <View
            key={milestone}
            style={[
              styles.milestone,
              {
                left: `${milestone}%`,
                opacity: clampedProgress > milestone ? 0 : 1,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
        {renderMilestones()}
      </View>
      
      {showPercentage && (
        <Animated.View 
          style={[
            styles.percentageContainer,
            { opacity: animatedOpacity }
          ]}
        >
          <Typography variant="caption" style={styles.percentage}>
            {clampedProgress.toFixed(1)}%
          </Typography>
          {clampedProgress >= 100 && (
            <Typography variant="caption" style={styles.percentage}>
              🎯 Goal Reached!
            </Typography>
          )}
        </Animated.View>
      )}
    </View>
  );
};