import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { Typography } from '../../components/common/Typography';
import { GoalCard } from '../../components/goals/GoalCard';
import { GoalFilters } from '../../components/goals/GoalFilters';
import { CreateGoalModal } from '../../components/goals/CreateGoalModal';
import { EditGoalModal } from '../../components/goals/EditGoalModal';
import { GoalCompletionModal } from '../../components/goals/GoalCompletionModal';
import { useTheme } from '../../contexts/ThemeContext';
import { SavingsGoal, GoalStatus, GoalCategory } from '../../models/Financial';
import { FinancialDataManager } from '../../services/FinancialDataManager';
import { useAuth } from '../../hooks/useAuth';

interface GoalFiltersState {
  status: GoalStatus | 'all';
  category: GoalCategory | 'all';
  sortBy: 'deadline' | 'progress' | 'amount' | 'created';
  sortOrder: 'asc' | 'desc';
}

export const GoalsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [completedGoal, setCompletedGoal] = useState<SavingsGoal | null>(null);
  const [filters, setFilters] = useState<GoalFiltersState>({
    status: 'all',
    category: 'all',
    sortBy: 'deadline',
    sortOrder: 'asc',
  });

  const financialManager = new FinancialDataManager();

  const loadGoals = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userGoals = await financialManager.getUserSavingsGoals(user.id);
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  }, [loadGoals]);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...goals];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(goal => goal.status === filters.status);
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(goal => goal.category === filters.category);
    }

    // Sort goals
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'deadline':
          comparison = a.deadline.getTime() - b.deadline.getTime();
          break;
        case 'progress':
          const progressA = (a.currentAmount / a.targetAmount) * 100;
          const progressB = (b.currentAmount / b.targetAmount) * 100;
          comparison = progressA - progressB;
          break;
        case 'amount':
          comparison = a.targetAmount - b.targetAmount;
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredGoals(filtered);
  }, [goals, filters]);

  const handleCreateGoal = async (goalData: any) => {
    try {
      const newGoal = await financialManager.createSavingsGoal({
        ...goalData,
        userId: user!.id,
      });
      setGoals(prev => [...prev, newGoal]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    }
  };

  const handleEditGoal = async (goalId: string, updates: any) => {
    try {
      const updatedGoal = await financialManager.updateSavingsGoal(goalId, updates);
      if (updatedGoal) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? updatedGoal : goal
        ));
        setEditingGoal(null);
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await financialManager.deleteSavingsGoal(goalId);
              setGoals(prev => prev.filter(goal => goal.id !== goalId));
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleGoalProgress = async (goalId: string, amount: number) => {
    try {
      const updatedGoal = await financialManager.updateGoalProgress(goalId, amount);
      if (updatedGoal) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? updatedGoal : goal
        ));
        
        // Check if goal was completed
        if (updatedGoal.status === GoalStatus.COMPLETED) {
          setCompletedGoal(updatedGoal);
        }
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
      Alert.alert('Error', 'Failed to update goal progress. Please try again.');
    }
  };

  const renderGoalItem = ({ item }: { item: SavingsGoal }) => (
    <GoalCard
      goal={item}
      onEdit={() => setEditingGoal(item)}
      onDelete={() => handleDeleteGoal(item.id)}
      onProgressUpdate={(amount) => handleGoalProgress(item.id, amount)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Typography variant="h3" style={styles.emptyTitle}>
        No Goals Yet
      </Typography>
      <Typography variant="body1" style={styles.emptyDescription}>
        Create your first savings goal to start growing your financial farm!
      </Typography>
      <Button
        title="Create Your First Goal"
        onPress={() => setShowCreateModal(true)}
        style={styles.emptyButton}
      />
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    title: {
      color: theme.colors.onBackground,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    list: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyTitle: {
      color: theme.colors.onBackground,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyDescription: {
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    emptyButton: {
      minWidth: 200,
    },
  });

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" style={styles.title}>
          My Goals
        </Typography>
        <Button
          title="New Goal"
          onPress={() => setShowCreateModal(true)}
          size="small"
        />
      </View>

      <View style={styles.content}>
        <GoalFilters
          filters={filters}
          onFiltersChange={setFilters}
          goalCount={filteredGoals.length}
        />

        <FlatList
          style={styles.list}
          data={filteredGoals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState : null}
          contentContainerStyle={
            filteredGoals.length === 0 ? { flex: 1 } : undefined
          }
        />
      </View>

      <CreateGoalModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGoal}
      />

      {editingGoal && (
        <EditGoalModal
          visible={true}
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSubmit={(updates) => handleEditGoal(editingGoal.id, updates)}
        />
      )}

      {completedGoal && (
        <GoalCompletionModal
          visible={true}
          goal={completedGoal}
          onClose={() => setCompletedGoal(null)}
        />
      )}
    </Screen>
  );
};