import React, { useState } from 'react';
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
import { Card } from '../common/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { GoalCategory } from '../../models/Financial';
import { validateSavingsGoalInput } from '../../models/Financial';
import { formatCurrency } from '../../utils/formatting';

interface CreateGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (goalData: any) => void;
}

interface GoalFormData {
  title: string;
  description: string;
  targetAmount: string;
  deadline: Date;
  category: GoalCategory;
  cropType: string;
}

const CROP_TYPES = [
  { id: 'tomato', name: 'Tomato', emoji: '🍅', description: 'Fast growing, perfect for short-term goals' },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', description: 'Steady growth for medium-term savings' },
  { id: 'corn', name: 'Corn', emoji: '🌽', description: 'Tall and strong for big goals' },
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', description: 'Bright and cheerful for fun goals' },
  { id: 'apple', name: 'Apple Tree', emoji: '🍎', description: 'Long-term investment that pays off' },
  { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', description: 'Large harvest for major purchases' },
];

const CATEGORY_OPTIONS = [
  { value: GoalCategory.EMERGENCY_FUND, label: 'Emergency Fund', emoji: '🛡️' },
  { value: GoalCategory.VACATION, label: 'Vacation', emoji: '✈️' },
  { value: GoalCategory.EDUCATION, label: 'Education', emoji: '📚' },
  { value: GoalCategory.GADGET, label: 'Gadget', emoji: '📱' },
  { value: GoalCategory.CLOTHING, label: 'Clothing', emoji: '👕' },
  { value: GoalCategory.ENTERTAINMENT, label: 'Entertainment', emoji: '🎮' },
  { value: GoalCategory.OTHER, label: 'Other', emoji: '💰' },
];

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    targetAmount: '',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    category: GoalCategory.OTHER,
    cropType: 'tomato',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.deadline <= today) {
      newErrors.deadline = 'Deadline must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        deadline: formData.deadline,
        category: formData.category,
        cropType: formData.cropType,
      };

      // Validate using Zod schema
      validateSavingsGoalInput(goalData);
      
      await onSubmit(goalData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        targetAmount: '',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: GoalCategory.OTHER,
        cropType: 'tomato',
      });
      setErrors({});
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      targetAmount: '',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      category: GoalCategory.OTHER,
      cropType: 'tomato',
    });
    setErrors({});
    onClose();
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

  const renderCropSelector = () => (
    <View style={styles.selectorContainer}>
      <Typography variant="body2" style={styles.selectorLabel}>
        Choose Your Crop *
      </Typography>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionsRow}>
          {CROP_TYPES.map((crop) => (
            <TouchableOpacity
              key={crop.id}
              style={[
                styles.cropCard,
                formData.cropType === crop.id && styles.selectedCropCard
              ]}
              onPress={() => setFormData(prev => ({ ...prev, cropType: crop.id }))}
            >
              <Typography style={styles.cropEmoji}>
                {crop.emoji}
              </Typography>
              <Typography
                variant="caption"
                style={[
                  styles.cropName,
                  formData.cropType === crop.id && styles.selectedCropName
                ]}
              >
                {crop.name}
              </Typography>
              <Typography
                variant="caption"
                style={styles.cropDescription}
                numberOfLines={2}
              >
                {crop.description}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const styles = StyleSheet.create({
    content: {
      maxHeight: '80%',
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
      fontSize: 24,
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
    cropCard: {
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      backgroundColor: theme.colors.surfaceVariant,
      width: 120,
    },
    selectedCropCard: {
      backgroundColor: theme.colors.primary + '20',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    cropEmoji: {
      fontSize: 32,
      marginBottom: theme.spacing.xs,
    },
    cropName: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    selectedCropName: {
      color: theme.colors.primary,
    },
    cropDescription: {
      color: theme.colors.outline,
      textAlign: 'center',
      fontSize: 10,
    },
    previewCard: {
      backgroundColor: theme.colors.primaryContainer,
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      marginBottom: theme.spacing.md,
    },
    previewTitle: {
      color: theme.colors.onPrimaryContainer,
      marginBottom: theme.spacing.xs,
    },
    previewText: {
      color: theme.colors.onPrimaryContainer,
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

  const selectedCrop = CROP_TYPES.find(crop => crop.id === formData.cropType);
  const selectedCategory = CATEGORY_OPTIONS.find(cat => cat.value === formData.category);

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Create New Goal"
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          {renderCropSelector()}

          {formData.title && formData.targetAmount && selectedCrop && (
            <Card style={styles.previewCard}>
              <Typography variant="h5" style={styles.previewTitle}>
                Goal Preview
              </Typography>
              <Typography variant="body2" style={styles.previewText}>
                {selectedCrop.emoji} {formData.title} - {formatCurrency(parseFloat(formData.targetAmount) || 0)}
              </Typography>
              <Typography variant="caption" style={styles.previewText}>
                {selectedCategory?.label} • Due {formData.deadline.toLocaleDateString()}
              </Typography>
            </Card>
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
          title="Create Goal"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!formData.title || !formData.targetAmount}
          style={styles.actionButton}
        />
      </View>
    </Modal>
  );
};