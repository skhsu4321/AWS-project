import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Typography } from '../common';
import { useTheme } from '../../contexts/ThemeContext';
import { Income, IncomeSource } from '../../models/Financial';
import { formatCurrency, formatDate } from '../../utils/formatting';

interface IncomeCardProps {
  income: Income;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const INCOME_SOURCE_ICONS: Record<IncomeSource, string> = {
  [IncomeSource.SALARY]: '💼',
  [IncomeSource.ALLOWANCE]: '💰',
  [IncomeSource.CHORES]: '🧹',
  [IncomeSource.GIFT]: '🎁',
  [IncomeSource.BONUS]: '⭐',
  [IncomeSource.INVESTMENT]: '📈',
  [IncomeSource.OTHER]: '💵',
};

const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  [IncomeSource.SALARY]: 'Salary',
  [IncomeSource.ALLOWANCE]: 'Allowance',
  [IncomeSource.CHORES]: 'Chores',
  [IncomeSource.GIFT]: 'Gift',
  [IncomeSource.BONUS]: 'Bonus',
  [IncomeSource.INVESTMENT]: 'Investment',
  [IncomeSource.OTHER]: 'Other',
};

export const IncomeCard: React.FC<IncomeCardProps> = ({
  income,
  onPress,
  onEdit,
  onDelete,
}) => {
  const { theme, colorScheme } = useTheme();

  const totalAmount = income.amount * income.multiplier;
  const hasMultiplier = income.multiplier > 1;

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.sm,
    },
    content: {
      padding: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    sourceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    sourceIcon: {
      fontSize: colorScheme === 'child' ? 24 : 20,
      marginRight: theme.spacing.sm,
    },
    sourceDetails: {
      flex: 1,
    },
    amountSection: {
      alignItems: 'flex-end',
    },
    originalAmount: {
      ...theme.typography.body2,
      color: theme.colors.onSurfaceVariant,
      textDecorationLine: hasMultiplier ? 'line-through' : 'none',
    },
    totalAmount: {
      ...theme.typography.h3,
      color: theme.colors.success,
      fontWeight: 'bold',
    },
    multiplierBadge: {
      backgroundColor: theme.colors.tertiary,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.dimensions.borderRadius.sm,
      marginTop: theme.spacing.xs,
    },
    multiplierText: {
      ...theme.typography.caption,
      color: theme.colors.onTertiary,
      fontWeight: 'bold',
    },
    description: {
      ...theme.typography.body2,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateText: {
      ...theme.typography.caption,
      color: theme.colors.onSurfaceVariant,
    },
    streakInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    streakBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.dimensions.borderRadius.sm,
      marginLeft: theme.spacing.sm,
    },
    streakText: {
      ...theme.typography.caption,
      color: theme.colors.onPrimary,
      fontWeight: 'bold',
    },
    recurringBadge: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.dimensions.borderRadius.sm,
      marginLeft: theme.spacing.sm,
    },
    recurringText: {
      ...theme.typography.caption,
      color: theme.colors.onSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    actionButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.sm,
      backgroundColor: theme.colors.surfaceVariant,
    },
    actionText: {
      ...theme.typography.caption,
      color: theme.colors.onSurfaceVariant,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`income-card-${income.id}`}
    >
      <Card>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.sourceInfo}>
              <Typography style={styles.sourceIcon}>
                {INCOME_SOURCE_ICONS[income.source]}
              </Typography>
              <View style={styles.sourceDetails}>
                <Typography variant="h4">
                  {INCOME_SOURCE_LABELS[income.source]}
                </Typography>
                {income.isRecurring && (
                  <View style={styles.recurringBadge}>
                    <Typography style={styles.recurringText}>
                      {income.recurringPeriod}
                    </Typography>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.amountSection}>
              {hasMultiplier && (
                <Typography style={styles.originalAmount}>
                  {formatCurrency(income.amount)}
                </Typography>
              )}
              <Typography style={styles.totalAmount}>
                {formatCurrency(totalAmount)}
              </Typography>
              {hasMultiplier && (
                <View style={styles.multiplierBadge}>
                  <Typography style={styles.multiplierText}>
                    {income.multiplier.toFixed(1)}x
                  </Typography>
                </View>
              )}
            </View>
          </View>

          <Typography style={styles.description}>
            {income.description}
          </Typography>

          <View style={styles.footer}>
            <Typography style={styles.dateText}>
              {formatDate(income.date)}
            </Typography>
            
            <View style={styles.streakInfo}>
              {income.streakCount > 0 && (
                <View style={styles.streakBadge}>
                  <Typography style={styles.streakText}>
                    🔥 {income.streakCount} day streak
                  </Typography>
                </View>
              )}
            </View>
          </View>

          {(onEdit || onDelete) && (
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onEdit}
                  testID={`edit-income-${income.id}`}
                >
                  <Typography style={styles.actionText}>Edit</Typography>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onDelete}
                  testID={`delete-income-${income.id}`}
                >
                  <Typography style={styles.actionText}>Delete</Typography>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};