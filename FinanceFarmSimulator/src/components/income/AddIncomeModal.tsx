import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal, Button, Input, Typography } from '../common';
import { useTheme } from '../../contexts/ThemeContext';
import { IncomeSource, IncomeInput } from '../../models/Financial';
import { useAuth } from '../../hooks/useAuth';

interface AddIncomeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (income: IncomeInput) => Promise<void>;
}

const INCOME_SOURCES = [
  { value: IncomeSource.SALARY, label: 'Salary', icon: '💼' },
  { value: IncomeSource.ALLOWANCE, label: 'Allowance', icon: '💰' },
  { value: IncomeSource.CHORES, label: 'Chores', icon: '🧹' },
  { value: IncomeSource.GIFT, label: 'Gift', icon: '🎁' },
  { value: IncomeSource.BONUS, label: 'Bonus', icon: '⭐' },
  { value: IncomeSource.INVESTMENT, label: 'Investment', icon: '📈' },
  { value: IncomeSource.OTHER, label: 'Other', icon: '💵' },
];

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<IncomeInput>>({
    amount: 0,
    source: IncomeSource.OTHER,
    description: '',
    date: new Date(),
    isRecurring: false,
    recurringPeriod: undefined,
  });

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!formData.description?.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!formData.source) {
      Alert.alert('Error', 'Please select an income source');
      return;
    }

    if (formData.isRecurring && !formData.recurringPeriod) {
      Alert.alert('Error', 'Please select a recurring period');
      return;
    }

    setLoading(true);
    try {
      const incomeInput: IncomeInput = {
        userId: user.id,
        amount: formData.amount!,
        source: formData.source!,
        description: formData.description!.trim(),
        date: formData.date!,
        isRecurring: formData.isRecurring!,
        recurringPeriod: formData.recurringPeriod,
      };

      await onSubmit(incomeInput);
      
      // Reset form
      setFormData({
        amount: 0,
        source: IncomeSource.OTHER,
        description: '',
        date: new Date(),
        isRecurring: false,
        recurringPeriod: undefined,
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding income:', error);
      Alert.alert('Error', 'Failed to add income. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      amount: 0,
      source: IncomeSource.OTHER,
      description: '',
      date: new Date(),
      isRecurring: false,
      recurringPeriod: undefined,
    });
    onClose();
  };

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.lg,
    },
    sourceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginVertical: theme.spacing.md,
    },
    sourceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      minWidth: '30%',
    },
    sourceButtonSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    sourceIcon: {
      fontSize: colorScheme === 'child' ? 20 : 16,
      marginRight: theme.spacing.xs,
    },
    sourceText: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
    },
    sourceTextSelected: {
      color: theme.colors.onPrimary,
    },
    recurringSection: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.dimensions.borderRadius.md,
    },
    recurringOptions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    recurringButton: {
      flex: 1,
      padding: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
    },
    recurringButtonSelected: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    button: {
      flex: 1,
    },
  });

  return (
    <Modal
      visible={visible}
      onClose={handleCancel}
      title="Add Income"
      testID="add-income-modal"
    >
      <View style={styles.container}>
        <Input
          label="Amount"
          value={formData.amount?.toString() || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, amount: parseFloat(text) || 0 }))}
          keyboardType="numeric"
          placeholder="0.00"
          testID="income-amount-input"
        />

        <Typography variant="body1" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
          Income Source
        </Typography>
        <View style={styles.sourceGrid}>
          {INCOME_SOURCES.map((source) => (
            <Button
              key={source.value}
              variant={formData.source === source.value ? 'primary' : 'outline'}
              onPress={() => setFormData(prev => ({ ...prev, source: source.value }))}
              style={[
                styles.sourceButton,
                formData.source === source.value && styles.sourceButtonSelected,
              ]}
              testID={`income-source-${source.value}`}
            >
              <Typography
                style={[
                  styles.sourceIcon,
                  formData.source === source.value && styles.sourceTextSelected,
                ]}
              >
                {source.icon}
              </Typography>
              <Typography
                variant="body2"
                style={[
                  styles.sourceText,
                  formData.source === source.value && styles.sourceTextSelected,
                ]}
              >
                {source.label}
              </Typography>
            </Button>
          ))}
        </View>

        <Input
          label="Description"
          value={formData.description || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="What is this income for?"
          multiline
          numberOfLines={2}
          testID="income-description-input"
        />

        <View style={styles.recurringSection}>
          <Button
            variant={formData.isRecurring ? 'primary' : 'outline'}
            onPress={() => setFormData(prev => ({ 
              ...prev, 
              isRecurring: !prev.isRecurring,
              recurringPeriod: !prev.isRecurring ? 'monthly' : undefined,
            }))}
            testID="recurring-toggle"
          >
            <Typography>
              {formData.isRecurring ? '✅' : '⬜'} Recurring Income
            </Typography>
          </Button>

          {formData.isRecurring && (
            <View style={styles.recurringOptions}>
              {['daily', 'weekly', 'monthly'].map((period) => (
                <Button
                  key={period}
                  variant={formData.recurringPeriod === period ? 'secondary' : 'outline'}
                  onPress={() => setFormData(prev => ({ ...prev, recurringPeriod: period as any }))}
                  style={[
                    styles.recurringButton,
                    formData.recurringPeriod === period && styles.recurringButtonSelected,
                  ]}
                  testID={`recurring-${period}`}
                >
                  <Typography variant="caption">
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Typography>
                </Button>
              ))}
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.button}
            testID="cancel-button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
            testID="submit-button"
          >
            Add Income
          </Button>
        </View>
      </View>
    </Modal>
  );
};