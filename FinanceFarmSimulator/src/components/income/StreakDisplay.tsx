import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Typography } from '../common';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateStreakMultiplier } from '../../utils/calculations';

interface StreakDisplayProps {
  currentStreak: number;
  highestStreak?: number;
  nextMilestone?: number;
  testID?: string;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  highestStreak = 0,
  nextMilestone,
  testID = 'streak-display',
}) => {
  const { theme, colorScheme } = useTheme();

  const currentMultiplier = calculateStreakMultiplier(currentStreak);
  const nextMultiplier = calculateStreakMultiplier(currentStreak + 1);
  const isAtMaxMultiplier = currentMultiplier >= 2.0;

  // Calculate next milestone if not provided
  const calculatedNextMilestone = nextMilestone || Math.ceil((currentStreak + 1) / 5) * 5;

  const getStreakEmoji = (streak: number): string => {
    if (streak === 0) return '🌱';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🚀';
    if (streak < 14) return '⭐';
    if (streak < 30) return '💎';
    return '👑';
  };

  const getStreakTitle = (streak: number): string => {
    if (streak === 0) return 'Start Your Streak!';
    if (streak < 3) return 'Getting Started';
    if (streak < 7) return 'Building Momentum';
    if (streak < 14) return 'On Fire!';
    if (streak < 30) return 'Streak Master';
    return 'Legendary Streak!';
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    content: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    streakIcon: {
      fontSize: colorScheme === 'child' ? 48 : 40,
      marginBottom: theme.spacing.sm,
    },
    streakNumber: {
      ...theme.typography.h1,
      color: theme.colors.primary,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
    },
    streakTitle: {
      ...theme.typography.h3,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    multiplierSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    multiplierBadge: {
      backgroundColor: theme.colors.tertiary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.lg,
      marginHorizontal: theme.spacing.sm,
    },
    multiplierText: {
      ...theme.typography.h3,
      color: theme.colors.onTertiary,
      fontWeight: 'bold',
    },
    arrow: {
      ...theme.typography.h3,
      color: theme.colors.onSurfaceVariant,
    },
    nextMultiplierBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.lg,
      opacity: isAtMaxMultiplier ? 0.5 : 1,
    },
    nextMultiplierText: {
      ...theme.typography.h3,
      color: theme.colors.onPrimary,
      fontWeight: 'bold',
    },
    progressSection: {
      width: '100%',
      marginBottom: theme.spacing.md,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    progressText: {
      ...theme.typography.caption,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      ...theme.typography.h4,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    statLabel: {
      ...theme.typography.caption,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    },
    encouragementText: {
      ...theme.typography.body2,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: theme.spacing.sm,
    },
  });

  const progressToNextMilestone = calculatedNextMilestone > currentStreak 
    ? (currentStreak % 5) / 5 
    : 1;

  return (
    <View style={styles.container} testID={testID}>
      <Card>
        <View style={styles.content}>
          <Typography style={styles.streakIcon}>
            {getStreakEmoji(currentStreak)}
          </Typography>
          
          <Typography style={styles.streakNumber}>
            {currentStreak}
          </Typography>
          
          <Typography style={styles.streakTitle}>
            {getStreakTitle(currentStreak)}
          </Typography>

          <View style={styles.multiplierSection}>
            <View style={styles.multiplierBadge}>
              <Typography style={styles.multiplierText}>
                {currentMultiplier.toFixed(1)}x
              </Typography>
            </View>
            
            {!isAtMaxMultiplier && (
              <>
                <Typography style={styles.arrow}>→</Typography>
                <View style={styles.nextMultiplierBadge}>
                  <Typography style={styles.nextMultiplierText}>
                    {nextMultiplier.toFixed(1)}x
                  </Typography>
                </View>
              </>
            )}
          </View>

          {!isAtMaxMultiplier && calculatedNextMilestone > currentStreak && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressToNextMilestone * 100}%` }
                  ]} 
                />
              </View>
              <Typography style={styles.progressText}>
                {calculatedNextMilestone - currentStreak} days to next milestone
              </Typography>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Typography style={styles.statValue}>
                {currentStreak}
              </Typography>
              <Typography style={styles.statLabel}>
                Current
              </Typography>
            </View>
            
            <View style={styles.statItem}>
              <Typography style={styles.statValue}>
                {highestStreak}
              </Typography>
              <Typography style={styles.statLabel}>
                Best Ever
              </Typography>
            </View>
            
            <View style={styles.statItem}>
              <Typography style={styles.statValue}>
                {currentMultiplier.toFixed(1)}x
              </Typography>
              <Typography style={styles.statLabel}>
                Multiplier
              </Typography>
            </View>
          </View>

          {currentStreak === 0 && (
            <Typography style={styles.encouragementText}>
              Log your income daily to build streaks and earn bonus multipliers! 🌱
            </Typography>
          )}

          {currentStreak > 0 && currentStreak < 7 && (
            <Typography style={styles.encouragementText}>
              Keep it up! Each day of logging increases your fertilizer power! 🔥
            </Typography>
          )}

          {currentStreak >= 7 && !isAtMaxMultiplier && (
            <Typography style={styles.encouragementText}>
              Amazing streak! You're earning great multiplier bonuses! ⭐
            </Typography>
          )}

          {isAtMaxMultiplier && (
            <Typography style={styles.encouragementText}>
              Maximum multiplier achieved! You're a true income logging champion! 👑
            </Typography>
          )}
        </View>
      </Card>
    </View>
  );
};