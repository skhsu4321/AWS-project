import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from '../common/Card';
import { Typography } from '../common/Typography';
import { Button } from '../common/Button';
import { GoalProgressBar } from './GoalProgressBar';
import { AddProgressModal } from './AddProgressModal';
import { useTheme } from '../../contexts/ThemeContext';
import { SavingsGoal, GoalStatus } from '../../models/Financial';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { calculateProgressPercentage, calculateDaysToGoal } from '../../utils/calculations';

interface GoalCardProps {
  goal: SavingsGoal;
  onEdit: () => void;
  onDelete: () => void;
  onProgressUpdate: (amount: number) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onProgressUpdate,
}) => {
  const { theme } = useTheme();
  const [showProgressModal, setShowProgressModal] = useState(false);

  const progress = calculateProgressPercentage(goal.currentAmount, goal.targetAmount);
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const daysLeft = Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
  const isOverdue = daysLeft < 0;
  const isCompleted = goal.status === GoalStatus.COMPLETED;
  const isNearDeadline = daysLeft <= 7 && daysLeft > 0;

  const getStatusColor = () => {
    if (isCompleted) return theme.colors.success;
    if (isOverdue) return theme.colors.error;
    if (isNearDeadline) return theme.colors.warning;
    return theme.colors.primary;
  };

  const getStatusText = () => {
    if (isCompleted) return 'Completed';
    if (isOverdue) return `${Math.abs(daysLeft)} days overdue`;
    if (daysLeft === 0) return 'Due today';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  };

  const handleAddProgress = (amount: number) => {
    onProgressUpdate(amount);
    setShowProgressModal(false);
  };

  const handleLongPress = () => {
    Alert.alert(
      'Goal Options',
      `What would you like to do with "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: onEdit },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const styles = StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    titleContainer: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    title: {
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    category: {
      color: theme.colors.outline,
      textTransform: 'capitalize',
    },
    statusContainer: {
      alignItems: 'flex-end',
    },
    status: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    cropType: {
      color: theme.colors.outline,
      fontSize: 11,
      textTransform: 'capitalize',
    },
    progressSection: {
      marginBottom: theme.spacing.md,
    },
    amountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    currentAmount: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    targetAmount: {
      color: theme.colors.onSurface,
    },
    remainingAmount: {
      color: theme.colors.outline,
      fontSize: 12,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressButton: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    editButton: {
      paddingHorizontal: theme.spacing.md,
    },
    completedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.success + '20',
      borderRadius: theme.dimensions.borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
    },
    completedText: {
      color: theme.colors.success,
      fontWeight: 'bold',
      fontSize: 18,
    },
  });

  return (
    <>
      <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.8}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Typography variant="h4" style={styles.title}>
                {goal.title}
              </Typography>
              <Typography variant="caption" style={styles.category}>
                {goal.category.replace('_', ' ')}
              </Typography>
            </View>
            <View style={styles.statusContainer}>
              <Typography 
                variant="caption" 
                style={[styles.status, { color: getStatusColor() }]}
              >
                {getStatusText()}
              </Typography>
              <Typography variant="caption" style={styles.cropType}>
                {goal.cropType}
              </Typography>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.amountRow}>
              <Typography variant="body2" style={styles.currentAmount}>
                {formatCurrency(goal.currentAmount)}
              </Typography>
              <Typography variant="body2" style={styles.targetAmount}>
                {formatCurrency(goal.targetAmount)}
              </Typography>
            </View>
            
            <GoalProgressBar
              progress={progress}
              color={getStatusColor()}
              animated={true}
            />
            
            <Typography variant="caption" style={styles.remainingAmount}>
              {remainingAmount > 0 
                ? `${formatCurrency(remainingAmount)} remaining`
                : 'Goal achieved!'
              }
            </Typography>
          </View>

          {!isCompleted && (
            <View style={styles.actions}>
              <Button
                title="Add Progress"
                onPress={() => setShowProgressModal(true)}
                variant="outline"
                size="small"
                style={styles.progressButton}
              />
              <Button
                title="Edit"
                onPress={onEdit}
                variant="text"
                size="small"
                style={styles.editButton}
              />
            </View>
          )}

          {isCompleted && (
            <View style={styles.completedOverlay}>
              <Typography style={styles.completedText}>
                🎉 Completed!
              </Typography>
            </View>
          )}
        </Card>
      </TouchableOpacity>

      <AddProgressModal
        visible={showProgressModal}
        goal={goal}
        onClose={() => setShowProgressModal(false)}
        onSubmit={handleAddProgress}
      />
    </>
  );
};