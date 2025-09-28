import { v4 as uuidv4 } from 'uuid';
import { 
  SavingsGoal, 
  SavingsGoalInput, 
  Expense, 
  ExpenseInput, 
  Income, 
  IncomeInput,
  FinancialSummary,
  GoalStatus,
  ExpenseCategory,
  IncomeSource,
  validateSavingsGoalInput,
  validateExpenseInput,
  validateIncomeInput
} from '../models/Financial';
import { SavingsGoalDAO } from './dao/SavingsGoalDAO';
import { ExpenseDAO } from './dao/ExpenseDAO';
import { IncomeDAO } from './dao/IncomeDAO';
import { 
  calculateProgressPercentage, 
  calculateStreakMultiplier, 
  calculateFertilizerBoost,
  calculateDaysToGoal
} from '../utils/calculations';

export interface BudgetThreshold {
  category: ExpenseCategory;
  monthlyLimit: number;
  warningPercentage: number; // Alert when spending reaches this % of limit
}

export interface BudgetAlert {
  category: ExpenseCategory;
  currentSpending: number;
  limit: number;
  percentage: number;
  severity: 'warning' | 'danger' | 'exceeded';
  message: string;
}

export interface TimePeriod {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
}

export interface FinancialInsight {
  type: 'spending_trend' | 'savings_progress' | 'income_streak' | 'budget_alert';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
  actionable: boolean;
  recommendation?: string;
}

export class FinancialDataManager {
  private savingsGoalDAO: SavingsGoalDAO;
  private expenseDAO: ExpenseDAO;
  private incomeDAO: IncomeDAO;
  private budgetThresholds: Map<string, BudgetThreshold[]> = new Map();

  constructor() {
    this.savingsGoalDAO = new SavingsGoalDAO();
    this.expenseDAO = new ExpenseDAO();
    this.incomeDAO = new IncomeDAO();
  }

  // Savings Goal Management
  public async createSavingsGoal(input: SavingsGoalInput): Promise<SavingsGoal> {
    try {
      const validatedInput = validateSavingsGoalInput(input);
      
      const goal: SavingsGoal = {
        ...validatedInput,
        id: uuidv4(),
        currentAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return await this.savingsGoalDAO.create(goal);
    } catch (error) {
      console.error('Error creating savings goal:', error);
      throw new Error('Failed to create savings goal');
    }
  }

  public async updateSavingsGoal(goalId: string, updates: Partial<SavingsGoalInput>): Promise<SavingsGoal | null> {
    try {
      const updatedGoal = {
        ...updates,
        updatedAt: new Date(),
      };

      return await this.savingsGoalDAO.update(goalId, updatedGoal);
    } catch (error) {
      console.error('Error updating savings goal:', error);
      throw new Error('Failed to update savings goal');
    }
  }

  public async deleteSavingsGoal(goalId: string): Promise<boolean> {
    try {
      return await this.savingsGoalDAO.delete(goalId);
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      throw new Error('Failed to delete savings goal');
    }
  }

  public async getSavingsGoalById(goalId: string): Promise<SavingsGoal | null> {
    return await this.savingsGoalDAO.findById(goalId);
  }

  public async getUserSavingsGoals(userId: string, status?: GoalStatus): Promise<SavingsGoal[]> {
    if (status) {
      return await this.savingsGoalDAO.findByStatus(userId, status);
    }
    return await this.savingsGoalDAO.findByUserId(userId);
  }

  public async updateGoalProgress(goalId: string, amount: number): Promise<SavingsGoal | null> {
    try {
      const updatedGoal = await this.savingsGoalDAO.updateProgress(goalId, amount);
      
      // Check if goal is completed
      if (updatedGoal && updatedGoal.currentAmount >= updatedGoal.targetAmount) {
        await this.savingsGoalDAO.markAsCompleted(goalId);
        return await this.savingsGoalDAO.findById(goalId);
      }
      
      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw new Error('Failed to update goal progress');
    }
  }

  // Expense Management
  public async logExpense(input: ExpenseInput): Promise<Expense> {
    try {
      const validatedInput = validateExpenseInput(input);
      
      const expense: Expense = {
        ...validatedInput,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdExpense = await this.expenseDAO.create(expense);
      
      // Check budget thresholds after logging expense
      await this.checkBudgetThresholds(input.userId, input.category);
      
      return createdExpense;
    } catch (error) {
      console.error('Error logging expense:', error);
      throw new Error('Failed to log expense');
    }
  }

  public async updateExpense(expenseId: string, updates: Partial<ExpenseInput>): Promise<Expense | null> {
    try {
      const updatedExpense = {
        ...updates,
        updatedAt: new Date(),
      };

      return await this.expenseDAO.update(expenseId, updatedExpense);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw new Error('Failed to update expense');
    }
  }

  public async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      return await this.expenseDAO.delete(expenseId);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw new Error('Failed to delete expense');
    }
  }

  public async getUserExpenses(userId: string, startDate?: Date, endDate?: Date): Promise<Expense[]> {
    if (startDate && endDate) {
      return await this.expenseDAO.findByDateRange(userId, startDate, endDate);
    }
    return await this.expenseDAO.findByUserId(userId);
  }

  public async getExpensesByCategory(userId: string, category: ExpenseCategory): Promise<Expense[]> {
    return await this.expenseDAO.findByCategory(userId, category);
  }

  // Income Management
  public async logIncome(input: IncomeInput): Promise<Income> {
    try {
      const validatedInput = validateIncomeInput(input);
      
      // Calculate streak and multiplier
      const currentStreak = await this.incomeDAO.getCurrentStreak(input.userId);
      const newStreakCount = currentStreak + 1;
      const multiplier = calculateStreakMultiplier(newStreakCount);
      
      const income: Income = {
        ...validatedInput,
        id: uuidv4(),
        multiplier,
        streakCount: newStreakCount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return await this.incomeDAO.create(income);
    } catch (error) {
      console.error('Error logging income:', error);
      throw new Error('Failed to log income');
    }
  }

  public async updateIncome(incomeId: string, updates: Partial<IncomeInput>): Promise<Income | null> {
    try {
      const updatedIncome = {
        ...updates,
        updatedAt: new Date(),
      };

      return await this.incomeDAO.update(incomeId, updatedIncome);
    } catch (error) {
      console.error('Error updating income:', error);
      throw new Error('Failed to update income');
    }
  }

  public async deleteIncome(incomeId: string): Promise<boolean> {
    try {
      return await this.incomeDAO.delete(incomeId);
    } catch (error) {
      console.error('Error deleting income:', error);
      throw new Error('Failed to delete income');
    }
  }

  public async getUserIncome(userId: string, startDate?: Date, endDate?: Date): Promise<Income[]> {
    if (startDate && endDate) {
      return await this.incomeDAO.findByDateRange(userId, startDate, endDate);
    }
    return await this.incomeDAO.findByUserId(userId);
  }

  public async getIncomeBySource(userId: string, source: IncomeSource): Promise<Income[]> {
    return await this.incomeDAO.findBySource(userId, source);
  }

  // Budget Threshold Management
  public setBudgetThresholds(userId: string, thresholds: BudgetThreshold[]): void {
    this.budgetThresholds.set(userId, thresholds);
  }

  public getBudgetThresholds(userId: string): BudgetThreshold[] {
    return this.budgetThresholds.get(userId) || [];
  }

  private async checkBudgetThresholds(userId: string, category: ExpenseCategory): Promise<BudgetAlert[]> {
    const thresholds = this.getBudgetThresholds(userId);
    const categoryThreshold = thresholds.find(t => t.category === category);
    
    if (!categoryThreshold) {
      return [];
    }

    // Get current month spending for this category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlySpending = await this.expenseDAO.getTotalForPeriod(userId, startOfMonth, endOfMonth);
    const percentage = (monthlySpending / categoryThreshold.monthlyLimit) * 100;
    
    const alerts: BudgetAlert[] = [];
    
    if (percentage >= 100) {
      alerts.push({
        category,
        currentSpending: monthlySpending,
        limit: categoryThreshold.monthlyLimit,
        percentage,
        severity: 'exceeded',
        message: `You have exceeded your ${category} budget by ${(percentage - 100).toFixed(1)}%`,
      });
    } else if (percentage >= categoryThreshold.warningPercentage) {
      alerts.push({
        category,
        currentSpending: monthlySpending,
        limit: categoryThreshold.monthlyLimit,
        percentage,
        severity: percentage >= 90 ? 'danger' : 'warning',
        message: `You have used ${percentage.toFixed(1)}% of your ${category} budget`,
      });
    }
    
    return alerts;
  }

  public async getBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
    const thresholds = this.getBudgetThresholds(userId);
    const alerts: BudgetAlert[] = [];
    
    for (const threshold of thresholds) {
      const categoryAlerts = await this.checkBudgetThresholds(userId, threshold.category);
      alerts.push(...categoryAlerts);
    }
    
    return alerts;
  } 
 // Financial Summary and Analytics
  public async generateFinancialSummary(userId: string, period: TimePeriod): Promise<FinancialSummary> {
    try {
      const { startDate, endDate } = period;
      
      // Get financial data for the period
      const [expenses, income, goals] = await Promise.all([
        this.expenseDAO.findByDateRange(userId, startDate, endDate),
        this.incomeDAO.findByDateRange(userId, startDate, endDate),
        this.savingsGoalDAO.findByUserId(userId),
      ]);

      // Calculate totals
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalIncome = income.reduce((sum, inc) => sum + (inc.amount * inc.multiplier), 0);
      const netAmount = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((netAmount / totalIncome) * 100) : 0;

      // Group expenses by category
      const expensesByCategory: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
      Object.values(ExpenseCategory).forEach(category => {
        expensesByCategory[category] = 0;
      });
      expenses.forEach(expense => {
        expensesByCategory[expense.category] += expense.amount;
      });

      // Group income by source
      const incomeBySource: Record<IncomeSource, number> = {} as Record<IncomeSource, number>;
      Object.values(IncomeSource).forEach(source => {
        incomeBySource[source] = 0;
      });
      income.forEach(inc => {
        incomeBySource[inc.source] += (inc.amount * inc.multiplier);
      });

      // Count goals
      const activeGoalsCount = goals.filter(goal => goal.status === GoalStatus.ACTIVE).length;
      const completedGoalsCount = goals.filter(goal => goal.status === GoalStatus.COMPLETED).length;

      return {
        userId,
        period: period.type,
        startDate,
        endDate,
        totalIncome,
        totalExpenses,
        netAmount,
        savingsRate: Math.max(0, Math.min(100, savingsRate)),
        expensesByCategory,
        incomeBySource,
        activeGoalsCount,
        completedGoalsCount,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating financial summary:', error);
      throw new Error('Failed to generate financial summary');
    }
  }

  public async getFinancialInsights(userId: string): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    
    try {
      // Get data for analysis
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
      
      const [
        recentExpenses,
        olderExpenses,
        recentIncome,
        currentStreak,
        budgetAlerts,
        activeGoals
      ] = await Promise.all([
        this.expenseDAO.findByDateRange(userId, thirtyDaysAgo, now),
        this.expenseDAO.findByDateRange(userId, sixtyDaysAgo, thirtyDaysAgo),
        this.incomeDAO.findByDateRange(userId, thirtyDaysAgo, now),
        this.incomeDAO.getCurrentStreak(userId),
        this.getBudgetAlerts(userId),
        this.savingsGoalDAO.findActiveByUserId(userId),
      ]);

      // Spending trend analysis
      const recentSpending = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const olderSpending = olderExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const spendingChange = ((recentSpending - olderSpending) / olderSpending) * 100;

      if (Math.abs(spendingChange) > 10) {
        insights.push({
          type: 'spending_trend',
          title: spendingChange > 0 ? 'Spending Increased' : 'Spending Decreased',
          description: `Your spending has ${spendingChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendingChange).toFixed(1)}% compared to last month`,
          severity: spendingChange > 20 ? 'warning' : spendingChange < -10 ? 'success' : 'info',
          actionable: spendingChange > 0,
          recommendation: spendingChange > 0 ? 'Consider reviewing your recent expenses to identify areas where you can cut back' : undefined,
        });
      }

      // Income streak analysis
      if (currentStreak >= 7) {
        insights.push({
          type: 'income_streak',
          title: 'Great Income Streak!',
          description: `You've been consistently logging income for ${currentStreak} days`,
          severity: 'success',
          actionable: false,
        });
      } else if (currentStreak === 0) {
        insights.push({
          type: 'income_streak',
          title: 'Start Your Income Streak',
          description: 'Log your income regularly to build streaks and earn multiplier bonuses',
          severity: 'info',
          actionable: true,
          recommendation: 'Try to log any income you receive to start building your streak',
        });
      }

      // Savings progress analysis
      for (const goal of activeGoals) {
        const progress = calculateProgressPercentage(goal.currentAmount, goal.targetAmount);
        const daysLeft = Math.ceil((goal.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysLeft <= 7 && progress < 90) {
          insights.push({
            type: 'savings_progress',
            title: `${goal.title} Deadline Approaching`,
            description: `Only ${daysLeft} days left and you're ${progress.toFixed(1)}% complete`,
            severity: 'warning',
            actionable: true,
            recommendation: `You need to save $${(goal.targetAmount - goal.currentAmount).toFixed(2)} more to reach your goal`,
          });
        } else if (progress >= 90) {
          insights.push({
            type: 'savings_progress',
            title: `Almost There: ${goal.title}`,
            description: `You're ${progress.toFixed(1)}% complete with your savings goal`,
            severity: 'success',
            actionable: false,
          });
        }
      }

      // Budget alerts
      budgetAlerts.forEach(alert => {
        insights.push({
          type: 'budget_alert',
          title: `Budget Alert: ${alert.category}`,
          description: alert.message,
          severity: alert.severity === 'exceeded' ? 'danger' : alert.severity,
          actionable: true,
          recommendation: alert.severity === 'exceeded' 
            ? `Consider reducing spending in ${alert.category} category`
            : `Monitor your ${alert.category} spending to stay within budget`,
        });
      });

      return insights;
    } catch (error) {
      console.error('Error generating financial insights:', error);
      return [];
    }
  }

  // Utility methods for analytics
  public async getSpendingTrends(userId: string, months: number = 6): Promise<Array<{ month: string; amount: number }>> {
    const trends = await this.expenseDAO.getMonthlyTrend(userId, months);
    return trends.map(trend => ({
      month: trend.month,
      amount: trend.total,
    }));
  }

  public async getIncomeTrends(userId: string, months: number = 6): Promise<Array<{ month: string; amount: number; averageMultiplier: number }>> {
    const trends = await this.incomeDAO.getMonthlyTrend(userId, months);
    return trends.map(trend => ({
      month: trend.month,
      amount: trend.total,
      averageMultiplier: trend.averageMultiplier,
    }));
  }

  public async getSavingsGoalProgress(userId: string): Promise<Array<{ goalId: string; title: string; progress: number; daysToGoal: number }>> {
    const goals = await this.savingsGoalDAO.findActiveByUserId(userId);
    
    return goals.map(goal => {
      const progress = calculateProgressPercentage(goal.currentAmount, goal.targetAmount);
      const dailySavings = 10; // This should be calculated based on user's saving pattern
      const daysToGoal = calculateDaysToGoal(goal.currentAmount, goal.targetAmount, dailySavings);
      
      return {
        goalId: goal.id,
        title: goal.title,
        progress,
        daysToGoal: daysToGoal === Infinity ? -1 : daysToGoal,
      };
    });
  }

  public async getTopExpenseCategories(userId: string, limit: number = 5): Promise<Array<{ category: ExpenseCategory; amount: number; percentage: number }>> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const categoryTotals = await this.expenseDAO.getTotalByCategory(userId, startOfMonth, now);
    const totalSpending = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    const sortedCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category: category as ExpenseCategory,
        amount,
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
    
    return sortedCategories;
  }

  // Streak and multiplier utilities
  public async resetIncomeStreak(userId: string): Promise<void> {
    // This would be called if user misses logging income for too long
    const recentIncome = await this.incomeDAO.findByUserId(userId);
    if (recentIncome.length > 0) {
      const latestIncome = recentIncome[0];
      await this.incomeDAO.updateStreak(userId, latestIncome.id, 0, 1);
    }
  }

  public async calculateFertilizerEffect(userId: string, incomeAmount: number): Promise<number> {
    const currentStreak = await this.incomeDAO.getCurrentStreak(userId);
    const multiplier = calculateStreakMultiplier(currentStreak);
    return calculateFertilizerBoost(incomeAmount, multiplier);
  }
}