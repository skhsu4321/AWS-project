import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Crop, GrowthStage } from '../../models/Game';

// Memoized selectors to prevent unnecessary re-renders

// Farm selectors with memoization
export const selectFarm = (state: RootState) => state.farm.currentFarm;
export const selectFarmCrops = (state: RootState) => state.farm.currentFarm?.crops || [];
export const selectFarmLayout = (state: RootState) => state.farm.currentFarm?.layout;

// Memoized crop selectors
export const selectActiveCrops = createSelector(
  [selectFarmCrops],
  (crops) => crops.filter(crop => 
    crop.growthStage !== GrowthStage.HARVESTED && 
    crop.growthStage !== GrowthStage.WITHERED
  )
);

export const selectHarvestableCrops = createSelector(
  [selectFarmCrops],
  (crops) => crops.filter(crop => crop.growthStage === GrowthStage.READY_TO_HARVEST)
);

export const selectCropsByGrowthStage = createSelector(
  [selectFarmCrops],
  (crops) => {
    const grouped: { [key in GrowthStage]?: Crop[] } = {};
    crops.forEach(crop => {
      if (!grouped[crop.growthStage]) {
        grouped[crop.growthStage] = [];
      }
      grouped[crop.growthStage]!.push(crop);
    });
    return grouped;
  }
);

// Financial selectors with memoization
export const selectGoals = (state: RootState) => state.financial.goals;
export const selectExpenses = (state: RootState) => state.financial.expenses;
export const selectIncome = (state: RootState) => state.financial.income;

export const selectActiveGoals = createSelector(
  [selectGoals],
  (goals) => goals.filter(goal => goal.status === 'active')
);

export const selectCompletedGoals = createSelector(
  [selectGoals],
  (goals) => goals.filter(goal => goal.status === 'completed')
);

export const selectTotalSavings = createSelector(
  [selectActiveGoals],
  (goals) => goals.reduce((total, goal) => total + goal.currentAmount, 0)
);

export const selectMonthlyExpenses = createSelector(
  [selectExpenses],
  (expenses) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
  }
);

export const selectExpensesByCategory = createSelector(
  [selectMonthlyExpenses],
  (expenses) => {
    const grouped: { [category: string]: number } = {};
    expenses.forEach(expense => {
      grouped[expense.category] = (grouped[expense.category] || 0) + expense.amount;
    });
    return grouped;
  }
);

// UI selectors with memoization
export const selectIsLoading = (state: RootState) => state.ui.isLoading;
export const selectActiveModals = (state: RootState) => state.ui.activeModals;
export const selectTheme = (state: RootState) => state.ui.theme;

export const selectHasActiveModals = createSelector(
  [selectActiveModals],
  (modals) => modals.length > 0
);

// Performance-critical selectors
export const selectFarmRenderData = createSelector(
  [selectFarm, selectActiveCrops],
  (farm, crops) => {
    if (!farm) return null;
    
    return {
      layout: farm.layout,
      crops: crops.map(crop => ({
        id: crop.id,
        position: crop.position,
        type: crop.type,
        growthStage: crop.growthStage,
        healthPoints: crop.healthPoints,
        fertilizerBoost: crop.fertilizerBoost || 1,
        weedPenalty: crop.weedPenalty || 0,
      })),
      healthScore: farm.healthScore,
    };
  }
);

// Selector for animation-related data only
export const selectAnimationData = createSelector(
  [selectFarmCrops],
  (crops) => crops.map(crop => ({
    id: crop.id,
    growthStage: crop.growthStage,
    healthPoints: crop.healthPoints,
    lastUpdated: crop.lastUpdated,
  }))
);

// Selector for chart data with memoization
export const selectChartData = createSelector(
  [selectExpensesByCategory, selectTotalSavings, selectActiveGoals],
  (expensesByCategory, totalSavings, goals) => ({
    expenses: Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / Object.values(expensesByCategory).reduce((a, b) => a + b, 0)) * 100,
    })),
    savings: {
      total: totalSavings,
      goals: goals.map(goal => ({
        id: goal.id,
        title: goal.title,
        progress: (goal.currentAmount / goal.targetAmount) * 100,
        amount: goal.currentAmount,
        target: goal.targetAmount,
      })),
    },
  })
);

// Selector for performance metrics
export const selectPerformanceMetrics = createSelector(
  [selectFarmCrops, selectGoals, selectExpenses],
  (crops, goals, expenses) => ({
    cropCount: crops.length,
    goalCount: goals.length,
    expenseCount: expenses.length,
    lastUpdate: Math.max(
      ...crops.map(c => new Date(c.lastUpdated || 0).getTime()),
      ...goals.map(g => new Date(g.createdAt).getTime()),
      ...expenses.map(e => new Date(e.date).getTime())
    ),
  })
);