import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Typography, Button } from '../common';
import { Expense, ExpenseCategory } from '../../models/Financial';
import { formatCurrency, formatDate } from '../../utils/formatting';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  showWeedAnimation?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const CATEGORY_EMOJIS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FOOD]: '🍔',
  [ExpenseCategory.TRANSPORT]: '🚗',
  [ExpenseCategory.ENTERTAINMENT]: '🎬',
  [ExpenseCategory.SHOPPING]: '🛍️',
  [ExpenseCategory.UTILITIES]: '💡',
  [ExpenseCategory.HEALTHCARE]: '🏥',
  [ExpenseCategory.EDUCATION]: '📚',
  [ExpenseCategory.OTHER]: '📦',
};

const WEED_EMOJIS = ['🌿', '🌱', '🍃', '🌾'];

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onEdit,
  onDelete,
  showWeedAnimation = false,
  selectable = false,
  selected = false,
  onSelect,
}) => {
  const { theme, colorScheme } = useTheme();
  const [dragX] = useState(new Animated.Value(0));
  const [showActions, setShowActions] = useState(false);
  const [weedEmoji] = useState(WEED_EMOJIS[Math.floor(Math.random() * WEED_EMOJIS.length)]);

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: dragX } }],
    { useNativeDriver: false }
  );

  const handlePanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (Math.abs(translationX) > 100) {
        // Swipe threshold reached - show actions or trigger weed pulling
        if (colorScheme === 'child') {
          // In child mode, swiping triggers weed pulling animation
          Animated.sequence([
            Animated.timing(dragX, {
              toValue: translationX > 0 ? 300 : -300,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(dragX, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start();
          
          // Trigger haptic feedback and show weed pulling effect
          setTimeout(() => onDelete(), 200);
        } else {
          // In adult mode, show action buttons
          setShowActions(true);
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      } else {
        // Return to original position
        Animated.spring(dragX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const getCategoryColor = (category: ExpenseCategory): string => {
    const colorMap: Record<ExpenseCategory, string> = {
      [ExpenseCategory.FOOD]: theme.colors.success,
      [ExpenseCategory.TRANSPORT]: theme.colors.primary,
      [ExpenseCategory.ENTERTAINMENT]: theme.colors.secondary,
      [ExpenseCategory.SHOPPING]: theme.colors.warning,
      [ExpenseCategory.UTILITIES]: theme.colors.info,
      [ExpenseCategory.HEALTHCARE]: theme.colors.error,
      [ExpenseCategory.EDUCATION]: theme.colors.primary,
      [ExpenseCategory.OTHER]: theme.colors.outline,
    };
    return colorMap[category];
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    dragContainer: {
      flex: 1,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: getCategoryColor(expense.category),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    categoryEmoji: {
      fontSize: colorScheme === 'child' ? 24 : 20,
    },
    weedEmoji: {
      fontSize: colorScheme === 'child' ? 28 : 24,
    },
    contentContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.xs,
    },
    description: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    amount: {
      fontWeight: 'bold',
      color: theme.colors.error,
    },
    metadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    category: {
      color: getCategoryColor(expense.category),
      fontWeight: '600',
    },
    date: {
      color: theme.colors.outline,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.xs,
    },
    tag: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.dimensions.borderRadius.small,
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    tagText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    actionButton: {
      marginLeft: theme.spacing.sm,
      minWidth: 80,
    },
    selectableContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      marginRight: theme.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: selected ? theme.colors.primary : 'transparent',
    },
    checkmark: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    weedAnimation: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderRadius: theme.dimensions.borderRadius.medium,
    },
    weedAnimationText: {
      fontSize: 32,
      opacity: showWeedAnimation ? 1 : 0,
    },
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={handlePanGestureEvent}
        onHandlerStateChange={handlePanHandlerStateChange}
        enabled={!selectable}
      >
        <Animated.View
          style={[
            styles.dragContainer,
            {
              transform: [{ translateX: dragX }],
            },
          ]}
        >
          <Card>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => selectable && onSelect?.(!selected)}
              disabled={!selectable}
            >
              {selectable && (
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => onSelect?.(!selected)}
                >
                  {selected && <Typography style={styles.checkmark}>✓</Typography>}
                </TouchableOpacity>
              )}

              <View style={styles.categoryIcon}>
                <Typography style={colorScheme === 'child' ? styles.weedEmoji : styles.categoryEmoji}>
                  {colorScheme === 'child' ? weedEmoji : CATEGORY_EMOJIS[expense.category]}
                </Typography>
              </View>

              <View style={styles.contentContainer}>
                <View style={styles.header}>
                  <Typography variant="body1" style={styles.description} numberOfLines={1}>
                    {expense.description}
                  </Typography>
                  <Typography variant="h3" style={styles.amount}>
                    -{formatCurrency(expense.amount)}
                  </Typography>
                </View>

                <View style={styles.metadata}>
                  <Typography variant="caption" style={styles.category}>
                    {expense.category.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="caption" style={styles.date}>
                    {formatDate(expense.date)}
                  </Typography>
                </View>

                {expense.tags.length > 0 && (
                  <View style={styles.tags}>
                    {expense.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Typography style={styles.tagText}>{tag}</Typography>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {showActions && !selectable && (
              <View style={styles.actions}>
                <Button
                  title="Edit"
                  onPress={() => {
                    setShowActions(false);
                    onEdit();
                  }}
                  variant="outline"
                  size="small"
                  style={styles.actionButton}
                />
                <Button
                  title={colorScheme === 'child' ? 'Pull Weed' : 'Delete'}
                  onPress={() => {
                    setShowActions(false);
                    onDelete();
                  }}
                  variant="outline"
                  size="small"
                  style={styles.actionButton}
                />
              </View>
            )}

            {/* Weed pulling animation overlay */}
            {showWeedAnimation && colorScheme === 'child' && (
              <View style={styles.weedAnimation}>
                <Animated.Text style={styles.weedAnimationText}>
                  🌿✨
                </Animated.Text>
              </View>
            )}
          </Card>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};