import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Typography } from '../common/Typography';
import { useTheme } from '../../contexts/ThemeContext';
import { SavingsGoal } from '../../models/Financial';
import { formatCurrency } from '../../utils/formatting';

interface AddProgressModalProps {
  visible: boolean;
  goal: SavingsGoal;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

export const AddProgressModal: React.FC<AddProgressModalProps> = ({
  visible,
  goal,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const currentProgress = (goal.currentAmount / goal.targetAmount) * 100;

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    
    if (!value || isNaN(numValue)) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (numValue <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    
    if (numValue > 100000) {
      setError('Amount cannot exceed $100,000');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAmount(amount)) return;

    const numAmount = parseFloat(amount);
    const newTotal = goal.currentAmount + numAmount;
    
    if (newTotal > goal.targetAmount) {
      Alert.alert(
        'Exceeds Goal',
        `Adding ${formatCurrency(numAmount)} will exceed your goal by ${formatCurrency(newTotal - goal.targetAmount)}. Continue anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: submitAmount },
        ]
      );
      return;
    }

    await submitAmount();
  };

  const submitAmount = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(parseFloat(amount));
      setAmount('');
      setError('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose();
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = (remainingAmount * percentage / 100).toFixed(2);
    setAmount(quickAmount);
    validateAmount(quickAmount);
  };

  const getNewProgress = (): number => {
    const numAmount = parseFloat(amount) || 0;
    return ((goal.currentAmount + numAmount) / goal.targetAmount) * 100;
  };

  const styles = StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
    },
    goalInfo: {
      backgroundColor: theme.colors.primaryContainer,
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
    },
    goalTitle: {
      color: theme.colors.onPrimaryContainer,
      marginBottom: theme.spacing.xs,
    },
    goalProgress: {
      color: theme.colors.onPrimaryContainer,
    },
    quickAmounts: {
      gap: theme.spacing.sm,
    },
    quickAmountsTitle: {
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
    quickAmountsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    quickAmountButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.dimensions.borderRadius.medium,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
    },
    quickAmountText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: '600',
    },
    quickAmountValue: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 10,
    },
    previewContainer: {
      backgroundColor: theme.colors.successContainer,
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
    },
    previewTitle: {
      color: theme.colors.onSuccessContainer,
      marginBottom: theme.spacing.xs,
    },
    previewText: {
      color: theme.colors.onSuccessContainer,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
    },
  });

  const newProgress = getNewProgress();
  const willComplete = newProgress >= 100;

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Add Progress"
    >
      <View style={styles.content}>
        <View style={styles.goalInfo}>
          <Typography variant="h5" style={styles.goalTitle}>
            {goal.title}
          </Typography>
          <Typography variant="body2" style={styles.goalProgress}>
            Current: {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </Typography>
          <Typography variant="body2" style={styles.goalProgress}>
            Remaining: {formatCurrency(remainingAmount)}
          </Typography>
        </View>

        <Input
          label="Amount to Add"
          value={amount}
          onChangeText={(text) => {
            setAmount(text);
            if (text) validateAmount(text);
          }}
          placeholder="0.00"
          keyboardType="numeric"
          error={error}
          required
        />

        <View style={styles.quickAmounts}>
          <Typography variant="body2" style={styles.quickAmountsTitle}>
            Quick Amounts
          </Typography>
          <View style={styles.quickAmountsRow}>
            <Button
              title="25%"
              variant="outline"
              size="small"
              onPress={() => handleQuickAmount(25)}
              style={styles.actionButton}
            />
            <Button
              title="50%"
              variant="outline"
              size="small"
              onPress={() => handleQuickAmount(50)}
              style={styles.actionButton}
            />
            <Button
              title="100%"
              variant="outline"
              size="small"
              onPress={() => handleQuickAmount(100)}
              style={styles.actionButton}
            />
          </View>
        </View>

        {amount && !error && (
          <View style={styles.previewContainer}>
            <Typography variant="h5" style={styles.previewTitle}>
              {willComplete ? '🎉 Goal Complete!' : 'New Progress'}
            </Typography>
            <Typography variant="body2" style={styles.previewText}>
              New Total: {formatCurrency(goal.currentAmount + parseFloat(amount))}
            </Typography>
            <Typography variant="body2" style={styles.previewText}>
              Progress: {newProgress.toFixed(1)}%
            </Typography>
            {willComplete && (
              <Typography variant="body2" style={styles.previewText}>
                Your crop will be ready for harvest! 🌱
              </Typography>
            )}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={handleClose}
          style={styles.actionButton}
        />
        <Button
          title={willComplete ? 'Complete Goal!' : 'Add Progress'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!amount || !!error}
          style={styles.actionButton}
        />
      </View>
    </Modal>
  );
};