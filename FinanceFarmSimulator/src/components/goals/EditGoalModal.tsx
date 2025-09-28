import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Typography } from '../common/Typography';
import { useTheme } from '../../contexts/ThemeContext';
import { SavingsGoal, GoalCategory, GoalStatus } from '../../models/Financial';
import { formatCurrency } from '../../utils/formatting';

interface EditGoalModalProps {
  visible: boolean;
  goal: SavingsGoal;
  onClose: () => void;
  onSubmit: (updates: any) => void;
}

interface EditFormData {
  title: string;
  description: string;
  targetAmount: string;
  deadline: Date;
  category: GoalCategory;
  status: GoalStatus;
}

const CATEGORY_OPTIONS = [
  { value: GoalCategory.EMERGENCY_FUND, label: 'Emergency Fund', emoji: '🛡️' },
  { value: GoalCategory.VACATION, label: 'Vacation', emoji: '✈️' },
  { value: GoalCategory.EDUCATION, label: 'Education', emoji: '📚' },
  { value: GoalCategory.GADGET, label: 'Gadget', emoji: '📱' },
  { value: GoalCategory.CLOTHING, label: 'Clothing', emoji: '👕' },
  { value: GoalCategory.ENTERTAINMENT, label: 'Entertainment', emoji: '🎮' },
  { value: GoalCategory.OTHER, label: 'Other', emoji: '💰' },
];

const STATUS_OPTIONS = [
  { value: GoalStatus.ACTIVE, label: 'Active', color: '#4CAF50' },
  { value: GoalStatus.PAUSED, label: 'Paused', color: '#FF9800' },
  { value: GoalStatus.CANCELLED, label: 'Cancelled', color: '#F44336' },
];

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  visible,
  goal,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<EditFormData>({
    title: '',
    description: '',
    targetAmount: '',
    deadline: new Date(),
    category: GoalCategory.OTHER,
    status: GoalStatus.ACTIVE,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        targetAmount: goal.targetAmount.toString(),
        deadline: goal.deadline,
        category: goal.category,
        status: goal.status,
      });
      setHasChanges(false);
    }
  }, [goal]);

  // Track changes
  useEffect(() => {
    if (!goal) return;
    
    const hasFormChanges = 
      formData.title !== goal.title ||
      formData.description !== (goal.description || '') ||
      parseFloat(formData.targetAmount) !== goal.targetAmount ||
      formData.deadline.getTime() !== goal.deadline.getTime() ||
      formData.category !== goal.category ||
      formData.status !== goal.status;
    
    setHasChanges(hasFormChanges);
  }, [formData, goal]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Goal title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    const amount = parseFloat(formData.targetAmount);
    if (!formData.targetAmount || isNaN(amount) || amount <= 0) {
      newErrors.targetAmount = 'Please enter a valid target amount';
    } else if (amount > 1000000) {
      newErrors.targetAmount = 'Target amount cannot exceed $1,000,000';
    } else if (amount < goal.currentAmount) {
      newErrors.targetAmount = `Target amount cannot be less than current progress (${formatCurrency(goal.currentAmount)})`;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.deadline <= today && formData.status === GoalStatus.ACTIVE) {
      newErrors.deadline = 'Active goals must have a future deadline';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check if target amount is being reduced significantly
    const newAmount = parseFloat(formData.targetAmount);
    if (newAmount < goal.targetAmount * 0.5) {
      Alert.alert(
        'Confirm Change',
        'You are reducing the target amount significantly. This may affect your progress calculations. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: submitChanges },
        ]
      );
      return;
    }

    await submitChanges();
  };

  const submitChanges = async () => {
    setIsSubmitting(true);
    try {
      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        deadline: formData.deadline,
        category: formData.category,
        status: formData.status,
      };

      await onSubmit(updates);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard Changes', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      setFormData(prev => ({ ...prev, deadline: date }));
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.selectorContainer}>
      <Typography variant="body2" style={styles.selectorLabel}>
        Category *
      </Typography>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionsRow}>
          {CATEGORY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                formData.category === option.value && styles.selectedOptionCard
              ]}
              onPress={() => setFormData(prev => ({ ...prev, category: option.value }))}
            >
              <Typography style={styles.optionEmoji}>
                {option.emoji}
              </Typography>
              <Typography
                variant="caption"
                style={[
                  styles.optionLabel,
                  formData.category === option.value && styles.selectedOptionLabel
                ]}
              >
                {option.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderStatusSelector = () => (
    <View style={styles.selectorContainer}>
      <Typography variant="body2" style={styles.selectorLabel}>
        Status *
      </Typography>
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.statusCard,
              formData.status === option.value && {
                backgroundColor: option.color + '20',
                borderColor: option.color,
              }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, status: option.value }))}
          >
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: option.color }
              ]}
            />
            <Typography
              variant="body2"
              style={[
                styles.statusLabel,
                formData.status === option.value && { color: option.color }
              ]}
            >
              {option.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const progress = (goal.currentAmount / goal.targetAmount) * 100;

  const styles = StyleSheet.create({
    content: {
      maxHeight: '80%',
    },
    progressInfo: {
      backgroundColor: theme.colors.primaryContainer,
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      marginBottom: theme.spacing.lg,
    },
    progressTitle: {
      color: theme.colors.onPrimaryContainer,
      marginBottom: theme.spacing.xs,
    },
    progressText: {
      color: theme.colors.onPrimaryContainer,
    },
    form: {
      gap: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    halfWidth: {
      flex: 1,
    },
    selectorContainer: {
      marginBottom: theme.spacing.md,
    },
    selectorLabel: {
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
    optionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    optionCard: {
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.medium,
      backgroundColor: theme.colors.surfaceVariant,
      minWidth: 80,
    },
    selectedOptionCard: {
      backgroundColor: theme.colors.primary + '20',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    optionEmoji: {
      fontSize: 20,
      marginBottom: theme.spacing.xs,
    },
    optionLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    selectedOptionLabel: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    statusRow: {
      gap: theme.spacing.sm,
    },
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.sm,
    },
    statusLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    warningBox: {
      backgroundColor: theme.colors.errorContainer,
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      marginBottom: theme.spacing.md,
    },
    warningText: {
      color: theme.colors.onErrorContainer,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
    },
  });

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Edit Goal"
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressInfo}>
          <Typography variant="h5" style={styles.progressTitle}>
            Current Progress
          </Typography>
          <Typography variant="body2" style={styles.progressText}>
            {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)} ({progress.toFixed(1)}%)
          </Typography>
        </View>

        <View style={styles.form}>
          <Input
            label="Goal Title"
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            placeholder="e.g., New Laptop, Vacation Fund"
            error={errors.title}
            required
            maxLength={100}
          />

          <Input
            label="Description (Optional)"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Add details about your goal..."
            multiline
            numberOfLines={3}
            error={errors.description}
            maxLength={500}
          />

          <View style={styles.row}>
            <Input
              label="Target Amount"
              value={formData.targetAmount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, targetAmount: text }))}
              placeholder="0.00"
              keyboardType="numeric"
              error={errors.targetAmount}
              required
              containerStyle={styles.halfWidth}
            />

            <Input
              label="Deadline"
              value={formatDateForInput(formData.deadline)}
              onChangeText={handleDateChange}
              error={errors.deadline}
              required
              containerStyle={styles.halfWidth}
            />
          </View>

          {renderCategorySelector()}
          {renderStatusSelector()}

          {parseFloat(formData.targetAmount) < goal.targetAmount && (
            <View style={styles.warningBox}>
              <Typography variant="body2" style={styles.warningText}>
                ⚠️ Reducing the target amount may affect your progress calculations and farm growth.
              </Typography>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={handleClose}
          style={styles.actionButton}
        />
        <Button
          title="Save Changes"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!hasChanges || !formData.title || !formData.targetAmount}
          style={styles.actionButton}
        />
      </View>
    </Modal>
  );
};