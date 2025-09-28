import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Card, Typography, Button } from '../common';
import { useTheme } from '../../contexts/ThemeContext';
import { Income, IncomeSource } from '../../models/Financial';
import { formatCurrency } from '../../utils/formatting';

interface RecurringIncomeManagerProps {
  recurringIncome: Income[];
  onEdit: (income: Income) => void;
  onDelete: (incomeId: string) => void;
  onToggleActive: (incomeId: string, isActive: boolean) => void;
  testID?: string;
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

export const RecurringIncomeManager: React.FC<RecurringIncomeManagerProps> = ({
  recurringIncome,
  onEdit,
  onDelete,
  onToggleActive,
  testID = 'recurring-income-manager',
}) => {
  const { theme, colorScheme } = useTheme();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (incomeId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(incomeId)) {
      newExpanded.delete(incomeId);
    } else {
      newExpanded.add(incomeId);
    }
    setExpandedItems(newExpanded);
  };

  const handleDelete = (income: Income) => {
    Alert.alert(
      'Delete Recurring Income',
      `Are you sure you want to delete "${income.description}"? This will remove all future occurrences.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(income.id),
        },
      ]
    );
  };

  const getNextOccurrence = (income: Income): string => {
    const now = new Date();
    const lastDate = new Date(income.date);
    
    switch (income.recurringPeriod) {
      case 'daily':
        const nextDaily = new Date(lastDate);
        nextDaily.setDate(nextDaily.getDate() + 1);
        return nextDaily > now ? nextDaily.toLocaleDateString() : 'Today';
      
      case 'weekly':
        const nextWeekly = new Date(lastDate);
        nextWeekly.setDate(nextWeekly.getDate() + 7);
        return nextWeekly > now ? nextWeekly.toLocaleDateString() : 'This week';
      
      case 'monthly':
        const nextMonthly = new Date(lastDate);
        nextMonthly.setMonth(nextMonthly.getMonth() + 1);
        return nextMonthly > now ? nextMonthly.toLocaleDateString() : 'This month';
      
      default:
        return 'Unknown';
    }
  };

  const renderRecurringIncomeItem = ({ item }: { item: Income }) => {
    const isExpanded = expandedItems.has(item.id);
    const nextOccurrence = getNextOccurrence(item);

    const styles = StyleSheet.create({
      itemContainer: {
        marginBottom: theme.spacing.sm,
      },
      itemContent: {
        padding: theme.spacing.md,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
      },
      sourceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      sourceIcon: {
        fontSize: colorScheme === 'child' ? 20 : 16,
        marginRight: theme.spacing.sm,
      },
      sourceDetails: {
        flex: 1,
      },
      sourceTitle: {
        ...theme.typography.h4,
        color: theme.colors.onSurface,
      },
      periodBadge: {
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.dimensions.borderRadius.sm,
        marginTop: theme.spacing.xs,
      },
      periodText: {
        ...theme.typography.caption,
        color: theme.colors.onSecondary,
      },
      amountText: {
        ...theme.typography.h3,
        color: theme.colors.success,
        fontWeight: 'bold',
      },
      description: {
        ...theme.typography.body2,
        color: theme.colors.onSurfaceVariant,
        marginBottom: theme.spacing.sm,
      },
      expandButton: {
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.sm,
      },
      expandedContent: {
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline,
      },
      detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
      },
      detailLabel: {
        ...theme.typography.body2,
        color: theme.colors.onSurfaceVariant,
      },
      detailValue: {
        ...theme.typography.body2,
        color: theme.colors.onSurface,
        fontWeight: '500',
      },
      actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
      },
      actionButton: {
        flex: 1,
      },
      toggleButton: {
        backgroundColor: item.isRecurring ? theme.colors.success : theme.colors.error,
      },
    });

    return (
      <View style={styles.itemContainer} testID={`recurring-income-${item.id}`}>
        <Card>
          <View style={styles.itemContent}>
            <View style={styles.header}>
              <View style={styles.sourceInfo}>
                <Typography style={styles.sourceIcon}>
                  {INCOME_SOURCE_ICONS[item.source]}
                </Typography>
                <View style={styles.sourceDetails}>
                  <Typography style={styles.sourceTitle}>
                    {INCOME_SOURCE_LABELS[item.source]}
                  </Typography>
                  <View style={styles.periodBadge}>
                    <Typography style={styles.periodText}>
                      {item.recurringPeriod}
                    </Typography>
                  </View>
                </View>
              </View>
              <Typography style={styles.amountText}>
                {formatCurrency(item.amount)}
              </Typography>
            </View>

            <Typography style={styles.description}>
              {item.description}
            </Typography>

            <Button
              variant="outline"
              onPress={() => toggleExpanded(item.id)}
              style={styles.expandButton}
              testID={`expand-${item.id}`}
            >
              {isExpanded ? 'Show Less' : 'Show Details'}
            </Button>

            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.detailRow}>
                  <Typography style={styles.detailLabel}>Next Occurrence:</Typography>
                  <Typography style={styles.detailValue}>{nextOccurrence}</Typography>
                </View>

                <View style={styles.detailRow}>
                  <Typography style={styles.detailLabel}>Current Multiplier:</Typography>
                  <Typography style={styles.detailValue}>{item.multiplier.toFixed(1)}x</Typography>
                </View>

                <View style={styles.detailRow}>
                  <Typography style={styles.detailLabel}>Streak Count:</Typography>
                  <Typography style={styles.detailValue}>{item.streakCount} days</Typography>
                </View>

                <View style={styles.detailRow}>
                  <Typography style={styles.detailLabel}>Created:</Typography>
                  <Typography style={styles.detailValue}>
                    {item.createdAt.toLocaleDateString()}
                  </Typography>
                </View>

                <View style={styles.actions}>
                  <Button
                    variant="outline"
                    onPress={() => onEdit(item)}
                    style={styles.actionButton}
                    testID={`edit-recurring-${item.id}`}
                  >
                    Edit
                  </Button>
                  
                  <Button
                    variant={item.isRecurring ? 'secondary' : 'primary'}
                    onPress={() => onToggleActive(item.id, !item.isRecurring)}
                    style={[styles.actionButton, styles.toggleButton]}
                    testID={`toggle-recurring-${item.id}`}
                  >
                    {item.isRecurring ? 'Pause' : 'Resume'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onPress={() => handleDelete(item)}
                    style={styles.actionButton}
                    testID={`delete-recurring-${item.id}`}
                  >
                    Delete
                  </Button>
                </View>
              </View>
            )}
          </View>
        </Card>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    headerTitle: {
      ...theme.typography.h3,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
    headerSubtitle: {
      ...theme.typography.body2,
      color: theme.colors.onSurfaceVariant,
    },
    list: {
      padding: theme.spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      fontSize: colorScheme === 'child' ? 64 : 48,
      marginBottom: theme.spacing.md,
    },
    emptyTitle: {
      ...theme.typography.h3,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyDescription: {
      ...theme.typography.body2,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  if (recurringIncome.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <Typography style={styles.headerTitle}>Recurring Income</Typography>
          <Typography style={styles.headerSubtitle}>
            Manage your regular income sources
          </Typography>
        </View>
        
        <View style={styles.emptyContainer}>
          <Typography style={styles.emptyIcon}>💰</Typography>
          <Typography style={styles.emptyTitle}>No Recurring Income</Typography>
          <Typography style={styles.emptyDescription}>
            Set up recurring income sources like salary or allowance to automatically track your regular earnings and build streaks.
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Typography style={styles.headerTitle}>Recurring Income</Typography>
        <Typography style={styles.headerSubtitle}>
          {recurringIncome.length} recurring income source{recurringIncome.length !== 1 ? 's' : ''}
        </Typography>
      </View>
      
      <FlatList
        data={recurringIncome}
        renderItem={renderRecurringIncomeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};