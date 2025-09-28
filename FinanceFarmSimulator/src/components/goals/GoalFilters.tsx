import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Typography } from '../common/Typography';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { GoalStatus, GoalCategory } from '../../models/Financial';

interface GoalFiltersState {
  status: GoalStatus | 'all';
  category: GoalCategory | 'all';
  sortBy: 'deadline' | 'progress' | 'amount' | 'created';
  sortOrder: 'asc' | 'desc';
}

interface GoalFiltersProps {
  filters: GoalFiltersState;
  onFiltersChange: (filters: GoalFiltersState) => void;
  goalCount: number;
}

export const GoalFilters: React.FC<GoalFiltersProps> = ({
  filters,
  onFiltersChange,
  goalCount,
}) => {
  const { theme } = useTheme();
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Goals' },
    { value: GoalStatus.ACTIVE, label: 'Active' },
    { value: GoalStatus.COMPLETED, label: 'Completed' },
    { value: GoalStatus.PAUSED, label: 'Paused' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: GoalCategory.EMERGENCY_FUND, label: 'Emergency Fund' },
    { value: GoalCategory.VACATION, label: 'Vacation' },
    { value: GoalCategory.EDUCATION, label: 'Education' },
    { value: GoalCategory.GADGET, label: 'Gadget' },
    { value: GoalCategory.CLOTHING, label: 'Clothing' },
    { value: GoalCategory.ENTERTAINMENT, label: 'Entertainment' },
    { value: GoalCategory.OTHER, label: 'Other' },
  ];

  const sortOptions = [
    { value: 'deadline', label: 'Deadline' },
    { value: 'progress', label: 'Progress' },
    { value: 'amount', label: 'Amount' },
    { value: 'created', label: 'Date Created' },
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.category !== 'all') count++;
    return count;
  };

  const resetFilters = () => {
    onFiltersChange({
      status: 'all',
      category: 'all',
      sortBy: 'deadline',
      sortOrder: 'asc',
    });
  };

  const renderFilterChip = (label: string, isActive: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        isActive && { backgroundColor: theme.colors.primary + '20' }
      ]}
      onPress={onPress}
    >
      <Typography
        variant="caption"
        style={[
          styles.filterChipText,
          isActive && { color: theme.colors.primary }
        ]}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );

  const renderFilterSection = (
    title: string,
    options: Array<{ value: string; label: string }>,
    currentValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.filterSection}>
      <Typography variant="h5" style={styles.sectionTitle}>
        {title}
      </Typography>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              currentValue === option.value && styles.selectedOption
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Typography
              variant="body2"
              style={[
                styles.optionText,
                currentValue === option.value && styles.selectedOptionText
              ]}
            >
              {option.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    goalCount: {
      color: theme.colors.outline,
    },
    filtersButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    filtersButtonText: {
      color: theme.colors.primary,
      marginRight: theme.spacing.xs,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: theme.colors.onPrimary,
      fontSize: 12,
      fontWeight: 'bold',
    },
    quickFilters: {
      flexDirection: 'row',
      marginBottom: theme.spacing.sm,
    },
    filterChip: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.dimensions.borderRadius.small,
      backgroundColor: theme.colors.surfaceVariant,
      marginRight: theme.spacing.xs,
    },
    filterChipText: {
      color: theme.colors.onSurfaceVariant,
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sortLabel: {
      color: theme.colors.outline,
      marginRight: theme.spacing.sm,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.dimensions.borderRadius.small,
      backgroundColor: theme.colors.surfaceVariant,
    },
    sortButtonText: {
      color: theme.colors.onSurfaceVariant,
      marginRight: theme.spacing.xs,
    },
    modalContent: {
      maxHeight: '80%',
    },
    filterSection: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
    },
    optionsContainer: {
      gap: theme.spacing.xs,
    },
    option: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      backgroundColor: theme.colors.surfaceVariant,
    },
    selectedOption: {
      backgroundColor: theme.colors.primary + '20',
    },
    optionText: {
      color: theme.colors.onSurfaceVariant,
    },
    selectedOptionText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="body2" style={styles.goalCount}>
          {goalCount} {goalCount === 1 ? 'goal' : 'goals'}
        </Typography>
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={() => setShowFiltersModal(true)}
        >
          <Typography variant="body2" style={styles.filtersButtonText}>
            Filters
          </Typography>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.badge}>
              <Typography style={styles.badgeText}>
                {getActiveFiltersCount()}
              </Typography>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.quickFilters}>
          {renderFilterChip(
            'Active',
            filters.status === GoalStatus.ACTIVE,
            () => onFiltersChange({
              ...filters,
              status: filters.status === GoalStatus.ACTIVE ? 'all' : GoalStatus.ACTIVE
            })
          )}
          {renderFilterChip(
            'Completed',
            filters.status === GoalStatus.COMPLETED,
            () => onFiltersChange({
              ...filters,
              status: filters.status === GoalStatus.COMPLETED ? 'all' : GoalStatus.COMPLETED
            })
          )}
          {renderFilterChip(
            'Emergency Fund',
            filters.category === GoalCategory.EMERGENCY_FUND,
            () => onFiltersChange({
              ...filters,
              category: filters.category === GoalCategory.EMERGENCY_FUND ? 'all' : GoalCategory.EMERGENCY_FUND
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.sortContainer}>
        <Typography variant="caption" style={styles.sortLabel}>
          Sort by:
        </Typography>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => onFiltersChange({
            ...filters,
            sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
          })}
        >
          <Typography variant="caption" style={styles.sortButtonText}>
            {sortOptions.find(opt => opt.value === filters.sortBy)?.label}
          </Typography>
          <Typography variant="caption" style={styles.sortButtonText}>
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </Typography>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filter & Sort Goals"
      >
        <ScrollView style={styles.modalContent}>
          {renderFilterSection(
            'Status',
            statusOptions,
            filters.status,
            (value) => onFiltersChange({ ...filters, status: value as any })
          )}

          {renderFilterSection(
            'Category',
            categoryOptions,
            filters.category,
            (value) => onFiltersChange({ ...filters, category: value as any })
          )}

          {renderFilterSection(
            'Sort By',
            sortOptions,
            filters.sortBy,
            (value) => onFiltersChange({ ...filters, sortBy: value as any })
          )}
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            title="Reset"
            variant="outline"
            onPress={resetFilters}
            style={styles.actionButton}
          />
          <Button
            title="Apply"
            onPress={() => setShowFiltersModal(false)}
            style={styles.actionButton}
          />
        </View>
      </Modal>
    </View>
  );
};