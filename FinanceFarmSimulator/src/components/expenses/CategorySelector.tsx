import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Typography } from '../common';
import { ExpenseCategory } from '../../models/Financial';

interface CategorySelectorProps {
  selectedCategory: ExpenseCategory;
  onCategoryChange: (category: ExpenseCategory) => void;
  childMode?: boolean;
}

const CATEGORY_CONFIG: Record<ExpenseCategory, { 
  emoji: string; 
  childEmoji: string; 
  label: string; 
  childLabel: string;
  color: string;
}> = {
  [ExpenseCategory.FOOD]: {
    emoji: '🍔',
    childEmoji: '🌿',
    label: 'Food & Dining',
    childLabel: 'Food Weeds',
    color: '#4CAF50',
  },
  [ExpenseCategory.TRANSPORT]: {
    emoji: '🚗',
    childEmoji: '🌱',
    label: 'Transportation',
    childLabel: 'Travel Weeds',
    color: '#2196F3',
  },
  [ExpenseCategory.ENTERTAINMENT]: {
    emoji: '🎬',
    childEmoji: '🍃',
    label: 'Entertainment',
    childLabel: 'Fun Weeds',
    color: '#9C27B0',
  },
  [ExpenseCategory.SHOPPING]: {
    emoji: '🛍️',
    childEmoji: '🌾',
    label: 'Shopping',
    childLabel: 'Shopping Weeds',
    color: '#FF9800',
  },
  [ExpenseCategory.UTILITIES]: {
    emoji: '💡',
    childEmoji: '🌿',
    label: 'Utilities',
    childLabel: 'Home Weeds',
    color: '#607D8B',
  },
  [ExpenseCategory.HEALTHCARE]: {
    emoji: '🏥',
    childEmoji: '🌱',
    label: 'Healthcare',
    childLabel: 'Health Weeds',
    color: '#F44336',
  },
  [ExpenseCategory.EDUCATION]: {
    emoji: '📚',
    childEmoji: '🍃',
    label: 'Education',
    childLabel: 'School Weeds',
    color: '#3F51B5',
  },
  [ExpenseCategory.OTHER]: {
    emoji: '📦',
    childEmoji: '🌾',
    label: 'Other',
    childLabel: 'Other Weeds',
    color: '#795548',
  },
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  childMode = false,
}) => {
  const { theme } = useTheme();
  const [expandedView, setExpandedView] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  const toggleExpandedView = () => {
    const toValue = expandedView ? 0 : 1;
    setExpandedView(!expandedView);
    
    Animated.spring(animatedValue, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleCategorySelect = (category: ExpenseCategory) => {
    onCategoryChange(category);
    if (expandedView) {
      toggleExpandedView();
    }
  };

  const getCategoryConfig = (category: ExpenseCategory) => {
    const config = CATEGORY_CONFIG[category];
    return {
      emoji: childMode ? config.childEmoji : config.emoji,
      label: childMode ? config.childLabel : config.label,
      color: config.color,
    };
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
      fontWeight: '600',
    },
    selectedCategory: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: theme.dimensions.borderRadius.medium,
      padding: theme.spacing.md,
      minHeight: 56,
    },
    selectedCategoryContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryEmoji: {
      fontSize: childMode ? 28 : 24,
      marginRight: theme.spacing.md,
    },
    categoryLabel: {
      flex: 1,
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    expandIcon: {
      fontSize: 20,
      color: theme.colors.outline,
      transform: [{ 
        rotate: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }) as any
      }],
    },
    expandedContainer: {
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.medium,
      marginTop: theme.spacing.sm,
      elevation: 2,
      shadowColor: theme.colors.common.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    categoryGrid: {
      padding: theme.spacing.sm,
    },
    categoryRow: {
      flexDirection: 'row',
      marginBottom: theme.spacing.sm,
    },
    categoryItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.dimensions.borderRadius.medium,
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.xs,
      minHeight: 60,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedCategoryItem: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    categoryItemEmoji: {
      fontSize: childMode ? 24 : 20,
      marginRight: theme.spacing.sm,
    },
    categoryItemLabel: {
      flex: 1,
      ...theme.typography.body2,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
      fontSize: childMode ? 14 : 12,
    },
    selectedCategoryItemLabel: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    },
    quickSelectContainer: {
      flexDirection: 'row',
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
    },
    quickSelectItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.surfaceVariant,
      marginHorizontal: theme.spacing.xs,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedQuickSelectItem: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    quickSelectEmoji: {
      fontSize: childMode ? 20 : 18,
    },
  });

  const selectedConfig = getCategoryConfig(selectedCategory);
  const categories = Object.values(ExpenseCategory);
  
  // Group categories into rows of 2
  const categoryRows = [];
  for (let i = 0; i < categories.length; i += 2) {
    categoryRows.push(categories.slice(i, i + 2));
  }

  const maxHeight = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  return (
    <View style={styles.container}>
      <Typography style={styles.label}>
        {childMode ? '🌿 What kind of weed?' : '📂 Category'} *
      </Typography>

      {/* Selected Category Display */}
      <TouchableOpacity 
        style={styles.selectedCategory}
        onPress={toggleExpandedView}
        activeOpacity={0.7}
      >
        <View style={styles.selectedCategoryContent}>
          <Typography style={styles.categoryEmoji}>
            {selectedConfig.emoji}
          </Typography>
          <Typography style={styles.categoryLabel}>
            {selectedConfig.label}
          </Typography>
        </View>
        <Animated.Text style={styles.expandIcon}>
          ▼
        </Animated.Text>
      </TouchableOpacity>

      {/* Quick Select (Mobile-friendly) */}
      {!expandedView && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickSelectContainer}
        >
          {categories.map((category) => {
            const config = getCategoryConfig(category);
            const isSelected = category === selectedCategory;
            
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.quickSelectItem,
                  isSelected && styles.selectedQuickSelectItem,
                ]}
                onPress={() => handleCategorySelect(category)}
                activeOpacity={0.7}
              >
                <Typography style={styles.quickSelectEmoji}>
                  {config.emoji}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Expanded Category Grid */}
      <Animated.View 
        style={[
          styles.expandedContainer,
          { maxHeight }
        ]}
      >
        <ScrollView style={styles.categoryGrid} showsVerticalScrollIndicator={false}>
          {categoryRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.categoryRow}>
              {row.map((category) => {
                const config = getCategoryConfig(category);
                const isSelected = category === selectedCategory;
                
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.selectedCategoryItem,
                    ]}
                    onPress={() => handleCategorySelect(category)}
                    activeOpacity={0.7}
                  >
                    <Typography style={styles.categoryItemEmoji}>
                      {config.emoji}
                    </Typography>
                    <Typography 
                      style={[
                        styles.categoryItemLabel,
                        isSelected && styles.selectedCategoryItemLabel,
                      ]}
                      numberOfLines={2}
                    >
                      {config.label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
              
              {/* Fill empty space if odd number of categories */}
              {row.length === 1 && <View style={styles.categoryItem} />}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};