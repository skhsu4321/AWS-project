import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Typography } from '../common/Typography';
import { useTheme } from '../../contexts/ThemeContext';
import { SavingsGoal } from '../../models/Financial';
import { formatCurrency, formatDate } from '../../utils/formatting';

interface GoalCompletionModalProps {
  visible: boolean;
  goal: SavingsGoal;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const GoalCompletionModal: React.FC<GoalCompletionModalProps> = ({
  visible,
  goal,
  onClose,
}) => {
  const { theme } = useTheme();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      confettiAnim.setValue(0);
      slideAnim.setValue(50);
      opacityAnim.setValue(0);

      // Start celebration animation sequence
      Animated.sequence([
        // Trophy scale in
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        // Confetti and content fade in
        Animated.parallel([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Continuous trophy rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible]);

  const getCropEmoji = (cropType: string): string => {
    const cropEmojis: Record<string, string> = {
      tomato: '🍅',
      carrot: '🥕',
      corn: '🌽',
      sunflower: '🌻',
      apple: '🍎',
      pumpkin: '🎃',
    };
    return cropEmojis[cropType] || '🌱';
  };

  const getRewardMessage = (): string => {
    const messages = [
      "Your financial garden is blooming! 🌸",
      "Another goal harvested successfully! 🚜",
      "Your savings have grown into something beautiful! 🌺",
      "Time to celebrate your financial growth! 🎊",
      "Your dedication has paid off! 💰",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const renderConfetti = () => {
    const confettiPieces = Array.from({ length: 20 }, (_, i) => {
      const randomDelay = Math.random() * 1000;
      const randomX = Math.random() * screenWidth;
      const randomRotation = Math.random() * 360;
      const colors = [
        theme.colors.primary,
        theme.colors.secondary,
        theme.colors.success,
        '#FFD700',
        '#FF6B6B',
        '#4ECDC4',
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      return (
        <Animated.View
          key={i}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: randomColor,
              left: randomX,
              transform: [
                {
                  translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 400],
                  }),
                },
                {
                  rotate: `${randomRotation}deg`,
                },
              ],
              opacity: confettiAnim.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
      );
    });

    return <View style={styles.confettiContainer}>{confettiPieces}</View>;
  };

  const styles = StyleSheet.create({
    content: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    confettiContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 400,
      zIndex: 1,
    },
    confettiPiece: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    trophyContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      zIndex: 2,
    },
    trophy: {
      fontSize: 80,
      marginBottom: theme.spacing.md,
    },
    cropEmoji: {
      fontSize: 40,
      position: 'absolute',
      top: 10,
      right: 10,
    },
    celebrationTitle: {
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    goalTitle: {
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    statsContainer: {
      backgroundColor: theme.colors.successContainer,
      padding: theme.spacing.lg,
      borderRadius: theme.dimensions.borderRadius.large,
      width: '100%',
      marginBottom: theme.spacing.xl,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    statLabel: {
      color: theme.colors.onSuccessContainer,
    },
    statValue: {
      color: theme.colors.onSuccessContainer,
      fontWeight: '600',
    },
    rewardMessage: {
      color: theme.colors.outline,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      fontStyle: 'italic',
    },
    actionButton: {
      minWidth: 200,
    },
  });

  const completionDate = new Date();
  const daysToComplete = Math.ceil(
    (completionDate.getTime() - goal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
  );

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title=""
      showCloseButton={false}
    >
      {renderConfetti()}
      
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.trophyContainer,
            {
              transform: [
                { scale: scaleAnim },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Typography style={styles.trophy}>🏆</Typography>
          <Typography style={styles.cropEmoji}>
            {getCropEmoji(goal.cropType)}
          </Typography>
        </Animated.View>

        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography variant="h2" style={styles.celebrationTitle}>
            Goal Completed! 🎉
          </Typography>

          <Typography variant="h4" style={styles.goalTitle}>
            {goal.title}
          </Typography>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Typography variant="body1" style={styles.statLabel}>
                Target Amount:
              </Typography>
              <Typography variant="body1" style={styles.statValue}>
                {formatCurrency(goal.targetAmount)}
              </Typography>
            </View>

            <View style={styles.statRow}>
              <Typography variant="body1" style={styles.statLabel}>
                Final Amount:
              </Typography>
              <Typography variant="body1" style={styles.statValue}>
                {formatCurrency(goal.currentAmount)}
              </Typography>
            </View>

            <View style={styles.statRow}>
              <Typography variant="body1" style={styles.statLabel}>
                Days to Complete:
              </Typography>
              <Typography variant="body1" style={styles.statValue}>
                {daysToComplete} days
              </Typography>
            </View>

            <View style={styles.statRow}>
              <Typography variant="body1" style={styles.statLabel}>
                Category:
              </Typography>
              <Typography variant="body1" style={styles.statValue}>
                {goal.category.replace('_', ' ')}
              </Typography>
            </View>
          </View>

          <Typography variant="body2" style={styles.rewardMessage}>
            {getRewardMessage()}
          </Typography>

          <Button
            title="Celebrate! 🎊"
            onPress={onClose}
            style={styles.actionButton}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};