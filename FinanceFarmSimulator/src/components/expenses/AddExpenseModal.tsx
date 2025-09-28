import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal, Typography, Button, Input } from '../common';
import { ReceiptScanner } from './ReceiptScanner';
import { CategorySelector } from './CategorySelector';
import { TagInput } from './TagInput';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { FinancialDataManager } from '../../services/FinancialDataManager';
import { 
  Expense, 
  ExpenseInput, 
  ExpenseCategory,
  validateExpenseInput 
} from '../../models/Financial';
import { formatCurrency } from '../../utils/formatting';

interface AddExpenseModalProps {
  visible: boolean;
  expense?: Expense | null;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  onBulkDelete?: (expenseIds: string[]) => void;
}

interface FormData {
  amount: string;
  category: ExpenseCategory;
  description: string;
  date: Date;
  receiptImage?: string;
  isRecurring: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly';
  tags: string[];
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  expense,
  onClose,
  onSave,
  onBulkDelete,
}) => {
  const { theme, colorScheme } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const financialManager = new FinancialDataManager();

  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: ExpenseCategory.OTHER,
    description: '',
    date: new Date(),
    isRecurring: false,
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [scannedData, setScannedData] = useState<{
    amount?: number;
    description?: string;
    category?: ExpenseCategory;
  } | null>(null);

  useEffect(() => {
    if (expense) {
      // Editing existing expense
      setFormData({
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description,
        date: expense.date,
        receiptImage: expense.receiptImage,
        isRecurring: expense.isRecurring,
        recurringPeriod: expense.recurringPeriod,
        tags: expense.tags,
      });
    } else {
      // Creating new expense
      resetForm();
    }
  }, [expense, visible]);

  useEffect(() => {
    if (scannedData) {
      setFormData(prev => ({
        ...prev,
        amount: scannedData.amount?.toString() || prev.amount,
        description: scannedData.description || prev.description,
        category: scannedData.category || prev.category,
      }));
      setScannedData(null);
    }
  }, [scannedData]);

  const resetForm = () => {
    setFormData({
      amount: '',
      category: ExpenseCategory.OTHER,
      description: '',
      date: new Date(),
      isRecurring: false,
      tags: [],
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description';
    }

    if (formData.isRecurring && !formData.recurringPeriod) {
      newErrors.recurringPeriod = 'Please select a recurring period';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    try {
      setLoading(true);

      const expenseInput: ExpenseInput = {
        userId: user.id,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description.trim(),
        date: formData.date,
        receiptImage: formData.receiptImage,
        isRecurring: formData.isRecurring,
        recurringPeriod: formData.recurringPeriod,
        tags: formData.tags,
      };

      // Validate the input
      validateExpenseInput(expenseInput);

      let savedExpense: Expense;

      if (expense) {
        // Update existing expense
        const updated = await financialManager.updateExpense(expense.id, expenseInput);
        if (!updated) throw new Error('Failed to update expense');
        savedExpense = updated;
      } else {
        // Create new expense
        savedExpense = await financialManager.logExpense(expenseInput);
      }

      onSave(savedExpense);
      onClose();
      resetForm();

      // Show success message
      Alert.alert(
        'Success',
        expense ? 'Expense updated successfully!' : 
        colorScheme === 'child' ? 'Weed pulled successfully! 🌿' : 'Expense logged successfully!'
      );

    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save expense'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptScan = (data: { amount?: number; description?: string; category?: ExpenseCategory }) => {
    setScannedData(data);
    setShowReceiptScanner(false);
  };

  const handleQuickAdd = (category: ExpenseCategory, amount: number, description: string) => {
    setFormData(prev => ({
      ...prev,
      category,
      amount: amount.toString(),
      description,
    }));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    title: {
      flex: 1,
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      marginBottom: theme.spacing.md,
      color: theme.colors.primary,
    },
    receiptSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    receiptImage: {
      width: 200,
      height: 150,
      borderRadius: theme.dimensions.borderRadius.medium,
      marginBottom: theme.spacing.md,
    },
    receiptButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    receiptButton: {
      marginHorizontal: theme.spacing.sm,
      minWidth: 120,
    },
    quickAddSection: {
      marginBottom: theme.spacing.lg,
    },
    quickAddGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickAddItem: {
      width: '48%',
      backgroundColor: theme.colors.surfaceVariant,
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      marginBottom: theme.spacing.sm,
      alignItems: 'center',
    },
    quickAddEmoji: {
      fontSize: colorScheme === 'child' ? 32 : 24,
      marginBottom: theme.spacing.xs,
    },
    quickAddText: {
      textAlign: 'center',
      fontSize: 12,
    },
    formRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    formRowLabel: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    switch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    footer: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    footerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footerButton: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
    },
  });

  const quickAddItems = [
    { category: ExpenseCategory.FOOD, amount: 50, description: 'Lunch', emoji: '🍔' },
    { category: ExpenseCategory.TRANSPORT, amount: 20, description: 'Bus fare', emoji: '🚌' },
    { category: ExpenseCategory.ENTERTAINMENT, amount: 100, description: 'Movie', emoji: '🎬' },
    { category: ExpenseCategory.SHOPPING, amount: 200, description: 'Clothes', emoji: '👕' },
  ];

  return (
    <Modal visible={visible} onClose={onClose} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h2" style={styles.title}>
            {expense ? 'Edit Expense' : 
             colorScheme === 'child' ? '🌿 Pull a Weed' : 'Add Expense'}
          </Typography>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Typography variant="h3">✕</Typography>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Receipt Scanner Section */}
          {!expense && (
            <View style={styles.section}>
              <Typography variant="h3" style={styles.sectionTitle}>
                📸 Receipt Scanner
              </Typography>
              
              {formData.receiptImage && (
                <View style={styles.receiptSection}>
                  <Image source={{ uri: formData.receiptImage }} style={styles.receiptImage} />
                </View>
              )}

              <View style={styles.receiptButtons}>
                <Button
                  title="📷 Scan Receipt"
                  onPress={() => setShowReceiptScanner(true)}
                  variant="outline"
                  style={styles.receiptButton}
                />
                {formData.receiptImage && (
                  <Button
                    title="Remove"
                    onPress={() => setFormData(prev => ({ ...prev, receiptImage: undefined }))}
                    variant="outline"
                    style={styles.receiptButton}
                  />
                )}
              </View>
            </View>
          )}

          {/* Quick Add Section */}
          {!expense && colorScheme === 'child' && (
            <View style={styles.section}>
              <Typography variant="h3" style={styles.sectionTitle}>
                🌿 Common Weeds
              </Typography>
              <View style={styles.quickAddGrid}>
                {quickAddItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickAddItem}
                    onPress={() => handleQuickAdd(item.category, item.amount, item.description)}
                  >
                    <Typography style={styles.quickAddEmoji}>{item.emoji}</Typography>
                    <Typography style={styles.quickAddText}>
                      {item.description} - {formatCurrency(item.amount)}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              💰 Expense Details
            </Typography>

            <Input
              label={colorScheme === 'child' ? 'How much did you spend?' : 'Amount'}
              value={formData.amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
              keyboardType="numeric"
              placeholder="0.00"
              error={errors.amount}
              required
            />

            <Input
              label={colorScheme === 'child' ? 'What did you buy?' : 'Description'}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter description..."
              error={errors.description}
              required
            />

            <CategorySelector
              selectedCategory={formData.category}
              onCategoryChange={(category) => setFormData(prev => ({ ...prev, category }))}
              childMode={colorScheme === 'child'}
            />

            <TagInput
              tags={formData.tags}
              onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              placeholder="Add tags (optional)"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.footerButton}
            />
            <Button
              title={loading ? 'Saving...' : expense ? 'Update' : 'Save'}
              onPress={handleSave}
              variant="primary"
              style={styles.footerButton}
              disabled={loading}
            />
          </View>
        </View>

        {/* Receipt Scanner Modal */}
        <ReceiptScanner
          visible={showReceiptScanner}
          onClose={() => setShowReceiptScanner(false)}
          onScan={handleReceiptScan}
        />
      </View>
    </Modal>
  );
};