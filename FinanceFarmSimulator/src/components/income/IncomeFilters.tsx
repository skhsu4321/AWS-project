import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Typography } from '../common';
import { useTheme } from '../../contexts/ThemeContext';
import { IncomeSource } from '../../models/Financial';

export interface IncomeFilterOptions {
  source?: IncomeSource | 'all';
  period?: 'week' | 'month' | 'year' | 'all';
  recurring?: boolean | 'all';
  sortBy?: 'date' | 'amount' | 'streak';
  sortOrder?: 'asc' | 'desc';
}

interface IncomeFiltersProps {
  filters: IncomeFilterOptions;
  onFiltersChange: (filters: IncomeFilterOptions) => void;
  testID?: string;
}

const INCOME_SOURCES = [
  { value: 'all' as const, label: 'All Sources', icon: '💰' },
  { value: IncomeSource.SALARY, label: 'Salary', icon: '💼' },
  { value: IncomeSource.ALLOWANCE, label: 'Allowance', icon: '💰' },
  { value: IncomeSource.CHORES, label: 'Chores', icon: '🧹' },
  { value: IncomeSource.GIFT, label: 'Gift', icon: '🎁' },
  { value: IncomeSource.BONUS, label: 'Bonus', icon: '⭐' },
  { value: IncomeSource.INVESTMENT, label: 'Investment', icon: '📈' },
  { value: IncomeSource.OTHER, label: 'Other', icon: '💵' },
];

const TIME_PERIODS = [
  { value: 'all' as const, label: 'All Time' },
  { value: 'week' as const, label: 'This Week' },
  { value: 'month' as const, label: 'This Month' },
  { value: 'year' as const, label: 'This Year' },
];

const RECURRING_OPTIONS = [
  { value: 'all' as const, label: 'All Income' },
  { value: true, label: 'Recurring Only' },
  { value: false, label: 'One-time Only' },
];

const SORT_OPTIONS = [
  { value: 'date' as const, label: 'Date' },
  { value: 'amount' as const, label: 'Amount' },
  { value: 'streak' as const, label: 'Streak' },
];

export const IncomeFilters: React.FC<IncomeFiltersProps> = ({
  filters,
  onFiltersChange,
  testID = 'income-filters',
}) => {
  const { theme, colorScheme } = useTheme();

  const updateFilter = <K extends keyof IncomeFilterOptions>(
    key: K,
    value: IncomeFilterOptions[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      source: 'all',
      period: 'all',
      recurring: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    section: {
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.body1,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    scrollContainer: {
      paddingHorizontal: theme.spacing.md,
    },
    filterRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    filterButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 80,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterIcon: {
      fontSize: colorScheme === 'child' ? 16 : 14,
      marginRight: theme.spacing.xs,
    },
    filterText: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
    },
    filterTextActive: {
      color: theme.colors.onPrimary,
    },
    sortSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    sortButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
    },
    sortButtonActive: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
    },
    orderButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.sm,
      backgroundColor: theme.colors.surfaceVariant,
    },
    orderButtonActive: {
      backgroundColor: theme.colors.tertiary,
    },
    resetButton: {
      margin: theme.spacing.md,
      alignSelf: 'center',
    },
  });

  return (
    <View style={styles.container} testID={testID}>
      {/* Source Filter */}
      <View style={styles.section}>
        <Typography style={styles.sectionTitle}>Income Source</Typography>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.filterRow}>
            {INCOME_SOURCES.map((source) => (
              <Button
                key={source.value}
                variant={filters.source === source.value ? 'primary' : 'outline'}
                onPress={() => updateFilter('source', source.value)}
                style={[
                  styles.filterButton,
                  filters.source === source.value && styles.filterButtonActive,
                ]}
                testID={`filter-source-${source.value}`}
              >
                <Typography style={styles.filterIcon}>
                  {source.icon}
                </Typography>
                <Typography
                  style={[
                    styles.filterText,
                    filters.source === source.value && styles.filterTextActive,
                  ]}
                >
                  {source.label}
                </Typography>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Time Period Filter */}
      <View style={styles.section}>
        <Typography style={styles.sectionTitle}>Time Period</Typography>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.filterRow}>
            {TIME_PERIODS.map((period) => (
              <Button
                key={period.value}
                variant={filters.period === period.value ? 'primary' : 'outline'}
                onPress={() => updateFilter('period', period.value)}
                style={[
                  styles.filterButton,
                  filters.period === period.value && styles.filterButtonActive,
                ]}
                testID={`filter-period-${period.value}`}
              >
                <Typography
                  style={[
                    styles.filterText,
                    filters.period === period.value && styles.filterTextActive,
                  ]}
                >
                  {period.label}
                </Typography>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Recurring Filter */}
      <View style={styles.section}>
        <Typography style={styles.sectionTitle}>Income Type</Typography>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.filterRow}>
            {RECURRING_OPTIONS.map((option) => (
              <Button
                key={String(option.value)}
                variant={filters.recurring === option.value ? 'primary' : 'outline'}
                onPress={() => updateFilter('recurring', option.value)}
                style={[
                  styles.filterButton,
                  filters.recurring === option.value && styles.filterButtonActive,
                ]}
                testID={`filter-recurring-${String(option.value)}`}
              >
                <Typography
                  style={[
                    styles.filterText,
                    filters.recurring === option.value && styles.filterTextActive,
                  ]}
                >
                  {option.label}
                </Typography>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.section}>
        <Typography style={styles.sectionTitle}>Sort By</Typography>
        <View style={styles.sortSection}>
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={filters.sortBy === option.value ? 'secondary' : 'outline'}
              onPress={() => updateFilter('sortBy', option.value)}
              style={[
                styles.sortButton,
                filters.sortBy === option.value && styles.sortButtonActive,
              ]}
              testID={`sort-${option.value}`}
            >
              <Typography
                style={[
                  styles.filterText,
                  filters.sortBy === option.value && styles.filterTextActive,
                ]}
              >
                {option.label}
              </Typography>
            </Button>
          ))}
          
          <Button
            variant="outline"
            onPress={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            style={[
              styles.orderButton,
              filters.sortOrder === 'desc' && styles.orderButtonActive,
            ]}
            testID="sort-order-toggle"
          >
            <Typography>
              {filters.sortOrder === 'desc' ? '↓' : '↑'}
            </Typography>
          </Button>
        </View>
      </View>

      {/* Reset Button */}
      <Button
        variant="outline"
        onPress={resetFilters}
        style={styles.resetButton}
        testID="reset-filters"
      >
        Reset Filters
      </Button>
    </View>
  );
};