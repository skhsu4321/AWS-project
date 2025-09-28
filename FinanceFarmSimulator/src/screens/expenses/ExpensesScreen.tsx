import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Vibration,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Screen, Typography, Button } from '../../components/common';
import { ExpenseCard } from '../../components/expenses/ExpenseCard';
import { AddExpenseModal } from '../../components/expenses/AddExpenseModal';
import { ExpenseFilters } from '../../components/expenses/ExpenseFilters';
import { WeedPullingInterface } from '../../components/expenses/WeedPullingInterface';
import { BudgetAlertBanner } from '../../components/expenses/BudgetAlertBanner';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { FinancialDataManager, BudgetAlert } from '../../services/FinancialDataManager';
import { Expense, ExpenseCategory } from '../../models/Financial';
import { setExpenses, setLoading, setError } from '../../store/slices/financialSlice';

export const ExpensesScreen: React.FC = () => {
  const { theme, colorScheme } = useTheme();
  const dispatch = useDispatch();
  const { expenses, loading } = useSelector((state: RootState) => state.financial);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWeedPulling, setShowWeedPulling] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [activeFilters, setActiveFilters] = useState<{
    category?: ExpenseCategory;
    dateRange?: { start: Date; end: Date };
    searchText?: string;
  }>({});

  const financialManager = new FinancialDataManager();

  useEffect(() => {
    if (user) {
      loadExpenses();
      loadBudgetAlerts();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [expenses, activeFilters]);

  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      dispatch(setLoading(true));
      const userExpenses = await financialManager.getUserExpenses(user.id);
      dispatch(setExpenses(userExpenses));
    } catch (error) {
      console.error('Error loading expenses:', error);
      dispatch(setError('Failed to load expenses'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadBudgetAlerts = async () => {
    if (!user) return;
    
    try {
      const alerts = await financialManager.getBudgetAlerts(user.id);
      setBudgetAlerts(alerts);
    } catch (error) {
      console.error('Error loading budget alerts:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    if (activeFilters.category) {
      filtered = filtered.filter(expense => expense.category === activeFilters.category);
    }

    if (activeFilters.dateRange) {
      filtered = filtered.filter(expense => 
        expense.date >= activeFilters.dateRange!.start && 
        expense.date <= activeFilters.dateRange!.end
      );
    }

    if (activeFilters.searchText) {
      const searchLower = activeFilters.searchText.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchLower) ||
        expense.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleAddExpense = async (expense: Expense) => {
    try {
      await loadExpenses(); // Reload to get updated data
      await loadBudgetAlerts(); // Check for new budget alerts
      
      // Show weed pulling animation for new expenses
      if (colorScheme === 'child' || Math.random() > 0.5) {
        setShowWeedPulling(true);
        setTimeout(() => setShowWeedPulling(false), 3000);
      }
      
      // Haptic feedback for successful expense logging
      Vibration.vibrate(100);
    } catch (error) {
      console.error('Error after adding expense:', error);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowAddModal(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await financialManager.deleteExpense(expense.id);
              await loadExpenses();
              Vibration.vibrate(50);
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const handleBulkDelete = (expenseIds: string[]) => {
    Alert.alert(
      'Delete Multiple Expenses',
      `Are you sure you want to delete ${expenseIds.length} expenses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                expenseIds.map(id => financialManager.deleteExpense(id))
              );
              await loadExpenses();
              Vibration.vibrate([100, 50, 100]);
            } catch (error) {
              console.error('Error bulk deleting expenses:', error);
              Alert.alert('Error', 'Failed to delete some expenses');
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    title: {
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      color: theme.colors.outline,
    },
    addButton: {
      margin: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyIcon: {
      fontSize: colorScheme === 'child' ? 64 : 48,
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyDescription: {
      textAlign: 'center',
      color: theme.colors.outline,
    },
  });

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <ExpenseCard
      expense={item}
      onEdit={() => handleEditExpense(item)}
      onDelete={() => handleDeleteExpense(item)}
      showWeedAnimation={showWeedPulling}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Typography style={styles.emptyIcon}>🌿</Typography>
      <Typography variant="h3" style={styles.emptyTitle}>
        No Weeds in Your Garden!
      </Typography>
      <Typography variant="body1" style={styles.emptyDescription}>
        Start tracking your expenses to keep your financial garden healthy. 
        Each expense you log helps you pull weeds and grow your savings!
      </Typography>
    </View>
  );

  return (
    <Screen style={styles.container} testID="expenses-screen">
      {/* Budget Alert Banner */}
      {budgetAlerts.length > 0 && (
        <BudgetAlertBanner 
          alerts={budgetAlerts}
          onDismiss={loadBudgetAlerts}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h1" style={styles.title}>
          {colorScheme === 'child' ? '🌿 Weed Pulling' : '💰 Expense Tracking'}
        </Typography>
        <Typography variant="body2" style={styles.subtitle}>
          {colorScheme === 'child' 
            ? 'Pull weeds to keep your garden healthy!'
            : 'Track your spending and manage your budget'
          }
        </Typography>
      </View>

      {/* Filters */}
      <ExpenseFilters
        onFiltersChange={setActiveFilters}
        totalExpenses={filteredExpenses.length}
      />

      {/* Add Expense Button */}
      <Button
        title={colorScheme === 'child' ? '🌿 Pull a Weed' : '+ Add Expense'}
        onPress={() => setShowAddModal(true)}
        style={styles.addButton}
        variant="primary"
      />

      {/* Expense List */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshing={loading}
          onRefresh={loadExpenses}
        />
      </View>

      {/* Add/Edit Expense Modal */}
      <AddExpenseModal
        visible={showAddModal}
        expense={selectedExpense}
        onClose={() => {
          setShowAddModal(false);
          setSelectedExpense(null);
        }}
        onSave={handleAddExpense}
        onBulkDelete={handleBulkDelete}
      />

      {/* Weed Pulling Animation Overlay */}
      {showWeedPulling && (
        <WeedPullingInterface
          onComplete={() => setShowWeedPulling(false)}
        />
      )}
    </Screen>
  );
};