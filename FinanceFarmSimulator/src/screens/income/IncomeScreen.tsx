import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Screen, Typography, Button, LoadingSpinner } from '../../components/common';
import { 
  AddIncomeModal, 
  IncomeCard, 
  IncomeFilters, 
  StreakDisplay, 
  FertilizerAnimation,
  RecurringIncomeManager,
  IncomeFilterOptions 
} from '../../components/income';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { Income, IncomeInput, IncomeSource } from '../../models/Financial';
import { FinancialDataManager } from '../../services/FinancialDataManager';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addIncome, setIncome, setLoading, setError } from '../../store/slices/financialSlice';

const financialDataManager = new FinancialDataManager();

export const IncomeScreen: React.FC = () => {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const dispatch = useDispatch();
  
  const { income, loading, error } = useSelector((state: RootState) => state.financial);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [showFertilizerAnimation, setShowFertilizerAnimation] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filters, setFilters] = useState<IncomeFilterOptions>({
    source: 'all',
    period: 'all',
    recurring: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  useEffect(() => {
    if (user) {
      loadIncomeData();
      loadStreakData();
    }
  }, [user]);

  const loadIncomeData = async () => {
    if (!user) return;

    try {
      dispatch(setLoading(true));
      const incomeData = await financialDataManager.getUserIncome(user.id);
      dispatch(setIncome(incomeData));
    } catch (err) {
      console.error('Error loading income:', err);
      dispatch(setError('Failed to load income data'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadStreakData = async () => {
    if (!user) return;

    try {
      // Create IncomeDAO instance to access streak methods
      const { IncomeDAO } = await import('../../services/dao/IncomeDAO');
      const incomeDAO = new IncomeDAO();
      
      const [current, highest] = await Promise.all([
        incomeDAO.getCurrentStreak(user.id),
        incomeDAO.getHighestMultiplier(user.id),
      ]);
      
      setCurrentStreak(current);
      setHighestStreak(Math.floor((highest - 1) * 10)); // Convert multiplier back to streak days
    } catch (err) {
      console.error('Error loading streak data:', err);
    }
  };

  const handleAddIncome = async (incomeInput: IncomeInput) => {
    try {
      const newIncome = await financialDataManager.logIncome(incomeInput);
      dispatch(addIncome(newIncome));
      
      // Show fertilizer animation for income logging
      setShowFertilizerAnimation(true);
      
      // Update streak data
      await loadStreakData();
      
      // Show success message
      Alert.alert(
        'Income Added! 🌱',
        `Your ${newIncome.source} of ${newIncome.amount} has been logged with a ${newIncome.multiplier.toFixed(1)}x multiplier!`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (err) {
      console.error('Error adding income:', err);
      Alert.alert('Error', 'Failed to add income. Please try again.');
    }
  };

  const handleEditIncome = (income: Income) => {
    // TODO: Implement edit functionality
    Alert.alert('Edit Income', 'Edit functionality will be implemented in a future update.');
  };

  const handleDeleteIncome = async (incomeId: string) => {
    try {
      await financialDataManager.deleteIncome(incomeId);
      await loadIncomeData();
      Alert.alert('Success', 'Income deleted successfully.');
    } catch (err) {
      console.error('Error deleting income:', err);
      Alert.alert('Error', 'Failed to delete income. Please try again.');
    }
  };

  const handleToggleRecurring = async (incomeId: string, isActive: boolean) => {
    try {
      await financialDataManager.updateIncome(incomeId, { isRecurring: isActive });
      await loadIncomeData();
      Alert.alert('Success', `Recurring income ${isActive ? 'activated' : 'paused'}.`);
    } catch (err) {
      console.error('Error toggling recurring income:', err);
      Alert.alert('Error', 'Failed to update recurring income. Please try again.');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadIncomeData(), loadStreakData()]);
    setRefreshing(false);
  }, [user]);

  const getFilteredIncome = (): Income[] => {
    let filtered = [...income];

    // Filter by source
    if (filters.source && filters.source !== 'all') {
      filtered = filtered.filter(item => item.source === filters.source);
    }

    // Filter by period
    if (filters.period && filters.period !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(item => new Date(item.date) >= startDate);
    }

    // Filter by recurring
    if (filters.recurring !== 'all') {
      filtered = filtered.filter(item => item.isRecurring === filters.recurring);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = (a.amount * a.multiplier) - (b.amount * b.multiplier);
          break;
        case 'streak':
          comparison = a.streakCount - b.streakCount;
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const filteredIncome = getFilteredIncome();
  const recurringIncome = income.filter(item => item.isRecurring);

  const renderIncomeItem = ({ item }: { item: Income }) => (
    <IncomeCard
      income={item}
      onEdit={() => handleEditIncome(item)}
      onDelete={() => handleDeleteIncome(item.id)}
    />
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    headerTitle: {
      ...theme.typography.h2,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
    headerActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    list: {
      padding: theme.spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      fontSize: colorScheme === 'child' ? 64 : 48,
      marginBottom: theme.spacing.md,
    },
    emptyTitle: {
      ...theme.typography.h3,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyDescription: {
      ...theme.typography.body2,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: theme.spacing.lg,
    },
    emptyButton: {
      minWidth: 200,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      ...theme.typography.body1,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
  });

  if (loading && income.length === 0) {
    return (
      <Screen testID="income-screen">
        <View style={styles.container}>
          <LoadingSpinner />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen testID="income-screen">
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Typography style={styles.errorText}>{error}</Typography>
            <Button variant="primary" onPress={loadIncomeData}>
              Retry
            </Button>
          </View>
        </View>
      </Screen>
    );
  }

  if (showRecurringManager) {
    return (
      <Screen testID="income-screen">
        <View style={styles.container}>
          <RecurringIncomeManager
            recurringIncome={recurringIncome}
            onEdit={handleEditIncome}
            onDelete={handleDeleteIncome}
            onToggleActive={handleToggleRecurring}
          />
          <View style={styles.header}>
            <Button
              variant="outline"
              onPress={() => setShowRecurringManager(false)}
            >
              Back to Income
            </Button>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="income-screen">
      <View style={styles.container}>
        <View style={styles.header}>
          <Typography style={styles.headerTitle}>💰 Income & Fertilizer</Typography>
          <View style={styles.headerActions}>
            <Button
              variant="primary"
              onPress={() => setShowAddModal(true)}
              style={styles.actionButton}
              testID="add-income-button"
            >
              Add Income
            </Button>
            <Button
              variant="outline"
              onPress={() => setShowRecurringManager(true)}
              style={styles.actionButton}
              testID="manage-recurring-button"
            >
              Recurring ({recurringIncome.length})
            </Button>
          </View>
        </View>

        <StreakDisplay
          currentStreak={currentStreak}
          highestStreak={highestStreak}
        />

        <IncomeFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        <View style={styles.content}>
          {filteredIncome.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Typography style={styles.emptyIcon}>🌱</Typography>
              <Typography style={styles.emptyTitle}>
                {income.length === 0 ? 'No Income Yet' : 'No Income Found'}
              </Typography>
              <Typography style={styles.emptyDescription}>
                {income.length === 0
                  ? 'Start logging your income to grow your savings goals! Each income entry acts like fertilizer, boosting your farm\'s growth with streak multipliers.'
                  : 'No income matches your current filters. Try adjusting the filters or add new income entries.'
                }
              </Typography>
              <Button
                variant="primary"
                onPress={() => setShowAddModal(true)}
                style={styles.emptyButton}
                testID="empty-add-income-button"
              >
                Add Your First Income
              </Button>
            </View>
          ) : (
            <FlatList
              data={filteredIncome}
              renderItem={renderIncomeItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <AddIncomeModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddIncome}
        />

        <FertilizerAnimation
          isVisible={showFertilizerAnimation}
          onAnimationComplete={() => setShowFertilizerAnimation(false)}
          intensity={Math.min(currentStreak / 3, 5)}
        />
      </View>
    </Screen>
  );
};