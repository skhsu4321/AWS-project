import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Typography, Input, Button } from '../common';
import { ExpenseCategory } from '../../models/Financial';

interface FilterOptions {
  category?: ExpenseCategory;
  dateRange?: { start: Date; end: Date };
  searchText?: string;
}

interface ExpenseFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  totalExpenses: number;
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  onFiltersChange,
  totalExpenses,
}) => {
  const { theme, colorScheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchText, setSearchText] = useState('');

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchText('');
    onFiltersChange({});
  };

  const handleCategoryFilter = (category: ExpenseCategory) => {
    const newCategory = filters.category === category ? undefined : category;
    updateFilters({ category: newCategory });
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    updateFilters({ searchText: text.trim() || undefined });
  };

  const setDateRangeFilter = (range: 'today' | 'week' | 'month' | 'all') => {
    const now = new Date();
    let dateRange: { start: Date; end: Date } | undefined;

    switch (range) {
      case 'today':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
        };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        dateRange = {
          start: weekStart,
          end: now,
        };
        break;
      case 'month':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now,
        };
        break;
      case 'all':
      default:
        dateRange = undefined;
        break;
    }

    updateFilters({ dateRange });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.dateRange) count++;
    if (filters.searchText) count++;
    return count;
  };

  const getCategoryEmoji = (category: ExpenseCategory) => {
    const emojiMap: Record<ExpenseCategory, string> = {
      [ExpenseCategory.FOOD]: colorScheme === 'child' ? '🌿' : '🍔',
      [ExpenseCategory.TRANSPORT]: colorScheme === 'child' ? '🌱' : '🚗',
      [ExpenseCategory.ENTERTAINMENT]: colorScheme === 'child' ? '🍃' : '🎬',
      [ExpenseCategory.SHOPPING]: colorScheme === 'child' ? '🌾' : '🛍️',
      [ExpenseCategory.UTILITIES]: colorScheme === 'child' ? '🌿' : '💡',
      [ExpenseCategory.HEALTHCARE]: colorScheme === 'child' ? '🌱' : '🏥',
      [ExpenseCategory.EDUCATION]: colorScheme === 'child' ? '🍃' : '📚',
      [ExpenseCategory.OTHER]: colorScheme === 'child' ? '🌾' : '📦',
    };
    return emojiMap[category];
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      elevation: 1,
      shadowColor: theme.colors.common.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    filterIcon: {
      fontSize: 20,
      marginRight: theme.spacing.sm,
    },
    headerTitle: {
      flex: 1,
    },
    resultCount: {
      color: theme.colors.outline,
      marginLeft: theme.spacing.sm,
    },
    filterBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    filterBadgeText: {
      color: theme.colors.onPrimary,
      fontSize: 12,
      fontWeight: 'bold',
    },
    expandIcon: {
      fontSize: 16,
      color: theme.colors.outline,
      transform: [{ 
        rotate: animatedHeight.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }) as any
      }],
    },
    expandedContent: {
      overflow: 'hidden',
    },
    section: {
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    sectionTitle: {
      ...theme.typography.body2,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
    searchContainer: {
      marginBottom: theme.spacing.md,
    },
    dateRangeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.md,
    },
    dateRangeButton: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.small,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    activeDateRangeButton: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    dateRangeButtonText: {
      ...theme.typography.caption,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    activeDateRangeButtonText: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.md,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.small,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    activeCategoryButton: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    categoryEmoji: {
      fontSize: 16,
      marginRight: theme.spacing.xs,
    },
    categoryButtonText: {
      ...theme.typography.caption,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    activeCategoryButtonText: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
  });

  const maxHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const activeFiltersCount = getActiveFiltersCount();
  const categories = Object.values(ExpenseCategory);

  const dateRangeOptions = [
    { key: 'all', label: colorScheme === 'child' ? 'All Time' : 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  const getCurrentDateRangeKey = () => {
    if (!filters.dateRange) return 'all';
    
    const now = new Date();
    const { start, end } = filters.dateRange;
    
    // Check if it's today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (start.getTime() === todayStart.getTime()) return 'today';
    
    // Check if it's this week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    if (Math.abs(start.getTime() - weekStart.getTime()) < 86400000) return 'week';
    
    // Check if it's this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (start.getTime() === monthStart.getTime()) return 'month';
    
    return 'custom';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.headerLeft}>
          <Typography style={styles.filterIcon}>🔍</Typography>
          <Typography variant="body1" style={styles.headerTitle}>
            {colorScheme === 'child' ? 'Find Weeds' : 'Filter & Search'}
          </Typography>
          <Typography variant="caption" style={styles.resultCount}>
            {totalExpenses} {colorScheme === 'child' ? 'weeds' : 'expenses'}
          </Typography>
        </View>
        
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Typography style={styles.filterBadgeText}>
              {activeFiltersCount}
            </Typography>
          </View>
        )}
        
        <Animated.Text style={styles.expandIcon}>
          ▼
        </Animated.Text>
      </TouchableOpacity>

      {/* Expanded Content */}
      <Animated.View 
        style={[
          styles.expandedContent,
          { maxHeight }
        ]}
      >
        <View style={styles.section}>
          {/* Search */}
          <Typography style={styles.sectionTitle}>
            {colorScheme === 'child' ? '🔍 Search for weeds' : '🔍 Search'}
          </Typography>
          <View style={styles.searchContainer}>
            <Input
              value={searchText}
              onChangeText={handleSearchChange}
              placeholder={colorScheme === 'child' ? 'What weed are you looking for?' : 'Search descriptions or tags...'}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* Date Range */}
          <Typography style={styles.sectionTitle}>
            {colorScheme === 'child' ? '📅 When did you pull weeds?' : '📅 Time Period'}
          </Typography>
          <View style={styles.dateRangeContainer}>
            {dateRangeOptions.map((option) => {
              const isActive = getCurrentDateRangeKey() === option.key;
              
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.dateRangeButton,
                    isActive && styles.activeDateRangeButton,
                  ]}
                  onPress={() => setDateRangeFilter(option.key as any)}
                >
                  <Typography 
                    style={[
                      styles.dateRangeButtonText,
                      isActive && styles.activeDateRangeButtonText,
                    ]}
                  >
                    {option.label}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Categories */}
          <Typography style={styles.sectionTitle}>
            {colorScheme === 'child' ? '🌿 Types of weeds' : '📂 Categories'}
          </Typography>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const isActive = filters.category === category;
              const emoji = getCategoryEmoji(category);
              const label = category.replace('_', ' ').toLowerCase();
              
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    isActive && styles.activeCategoryButton,
                  ]}
                  onPress={() => handleCategoryFilter(category)}
                >
                  <Typography style={styles.categoryEmoji}>
                    {emoji}
                  </Typography>
                  <Typography 
                    style={[
                      styles.categoryButtonText,
                      isActive && styles.activeCategoryButtonText,
                    ]}
                  >
                    {label}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              title="Clear All"
              onPress={clearFilters}
              variant="outline"
              size="small"
              style={styles.actionButton}
              disabled={activeFiltersCount === 0}
            />
            <Button
              title="Close"
              onPress={toggleExpanded}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};