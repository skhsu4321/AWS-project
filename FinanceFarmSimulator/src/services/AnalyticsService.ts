import { 
  FinancialSummary, 
  Expense, 
  Income, 
  SavingsGoal, 
  ExpenseCategory, 
  IncomeSource,
  TimePeriod 
} from '../models/Financial';
import { FinancialDataManager } from './FinancialDataManager';

export interface TrendData {
  period: string;
  value: number;
  label: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface FinancialTrend {
  income: TrendData[];
  expenses: TrendData[];
  netAmount: TrendData[];
  savingsRate: TrendData[];
}

export interface SpendingPattern {
  category: ExpenseCategory;
  averageAmount: number;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

export interface IncomePattern {
  source: IncomeSource;
  averageAmount: number;
  frequency: number;
  averageMultiplier: number;
  streakPerformance: 'excellent' | 'good' | 'needs_improvement';
}

export interface AnalyticsInsight {
  id: string;
  type: 'spending' | 'income' | 'savings' | 'goal' | 'streak';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
  actionable: boolean;
  recommendation?: string;
  data?: any;
  generatedAt: Date;
}

export interface FinancialHealthScore {
  overall: number;
  savingsRate: number;
  budgetAdherence: number;
  goalProgress: number;
  incomeConsistency: number;
  breakdown: {
    category: string;
    score: number;
    weight: number;
    description: string;
  }[];
}

export class AnalyticsService {
  private financialDataManager: FinancialDataManager;

  constructor(financialDataManager: FinancialDataManager) {
    this.financialDataManager = financialDataManager;
  }

  /**
   * Generate comprehensive financial trends over specified periods
   */
  public async generateFinancialTrends(
    userId: string, 
    periods: number = 6,
    periodType: 'monthly' | 'weekly' = 'monthly'
  ): Promise<FinancialTrend> {
    const trends: FinancialTrend = {
      income: [],
      expenses: [],
      netAmount: [],
      savingsRate: []
    };

    const now = new Date();
    
    for (let i = periods - 1; i >= 0; i--) {
      let startDate: Date;
      let endDate: Date;
      let label: string;

      if (periodType === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        label = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        startDate = weekStart;
        endDate = new Date(weekStart);
        endDate.setDate(weekStart.getDate() + 6);
        label = `Week ${Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      }

      const summary = await this.financialDataManager.generateFinancialSummary(userId, {
        type: periodType,
        startDate,
        endDate
      });

      trends.income.push({
        period: startDate.toISOString(),
        value: summary.totalIncome,
        label
      });

      trends.expenses.push({
        period: startDate.toISOString(),
        value: summary.totalExpenses,
        label
      });

      trends.netAmount.push({
        period: startDate.toISOString(),
        value: summary.netAmount,
        label
      });

      trends.savingsRate.push({
        period: startDate.toISOString(),
        value: summary.savingsRate,
        label
      });
    }

    return trends;
  }

  /**
   * Analyze spending patterns and provide insights
   */
  public async analyzeSpendingPatterns(userId: string, months: number = 3): Promise<SpendingPattern[]> {
    const patterns: SpendingPattern[] = [];
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const expenses = await this.financialDataManager.getUserExpenses(userId, startDate, now);
    
    // Group by category
    const categoryData: Record<ExpenseCategory, { amounts: number[]; dates: Date[] }> = {} as any;
    
    Object.values(ExpenseCategory).forEach(category => {
      categoryData[category] = { amounts: [], dates: [] };
    });

    expenses.forEach(expense => {
      categoryData[expense.category].amounts.push(expense.amount);
      categoryData[expense.category].dates.push(expense.date);
    });

    // Analyze each category
    Object.entries(categoryData).forEach(([category, data]) => {
      if (data.amounts.length === 0) return;

      const averageAmount = data.amounts.reduce((sum, amount) => sum + amount, 0) / data.amounts.length;
      const frequency = data.amounts.length;
      
      // Calculate trend (simple linear regression)
      const trend = this.calculateTrend(data.amounts);
      
      // Generate recommendation
      const recommendation = this.generateSpendingRecommendation(
        category as ExpenseCategory, 
        averageAmount, 
        frequency, 
        trend
      );

      patterns.push({
        category: category as ExpenseCategory,
        averageAmount,
        frequency,
        trend,
        recommendation
      });
    });

    return patterns.sort((a, b) => b.averageAmount - a.averageAmount);
  }

  /**
   * Analyze income patterns and streak performance
   */
  public async analyzeIncomePatterns(userId: string, months: number = 3): Promise<IncomePattern[]> {
    const patterns: IncomePattern[] = [];
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const incomes = await this.financialDataManager.getUserIncome(userId, startDate, now);
    
    // Group by source
    const sourceData: Record<IncomeSource, { amounts: number[]; multipliers: number[]; streaks: number[] }> = {} as any;
    
    Object.values(IncomeSource).forEach(source => {
      sourceData[source] = { amounts: [], multipliers: [], streaks: [] };
    });

    incomes.forEach(income => {
      sourceData[income.source].amounts.push(income.amount);
      sourceData[income.source].multipliers.push(income.multiplier);
      sourceData[income.source].streaks.push(income.streakCount);
    });

    // Analyze each source
    Object.entries(sourceData).forEach(([source, data]) => {
      if (data.amounts.length === 0) return;

      const averageAmount = data.amounts.reduce((sum, amount) => sum + amount, 0) / data.amounts.length;
      const frequency = data.amounts.length;
      const averageMultiplier = data.multipliers.reduce((sum, mult) => sum + mult, 0) / data.multipliers.length;
      const maxStreak = Math.max(...data.streaks);
      
      // Determine streak performance
      let streakPerformance: 'excellent' | 'good' | 'needs_improvement';
      if (maxStreak >= 14) {
        streakPerformance = 'excellent';
      } else if (maxStreak >= 7) {
        streakPerformance = 'good';
      } else {
        streakPerformance = 'needs_improvement';
      }

      patterns.push({
        source: source as IncomeSource,
        averageAmount,
        frequency,
        averageMultiplier,
        streakPerformance
      });
    });

    return patterns.sort((a, b) => b.averageAmount - a.averageAmount);
  }

  /**
   * Generate category breakdown for expenses
   */
  public async generateExpenseBreakdown(userId: string, period?: { startDate: Date; endDate: Date }): Promise<CategoryBreakdown[]> {
    const now = new Date();
    const startDate = period?.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = period?.endDate || now;

    const expenses = await this.financialDataManager.getUserExpenses(userId, startDate, endDate);
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const categoryTotals: Record<ExpenseCategory, number> = {} as any;
    Object.values(ExpenseCategory).forEach(category => {
      categoryTotals[category] = 0;
    });

    expenses.forEach(expense => {
      categoryTotals[expense.category] += expense.amount;
    });

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    const breakdown: CategoryBreakdown[] = Object.entries(categoryTotals)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount], index) => ({
        category: category.replace('_', ' ').toUpperCase(),
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);

    return breakdown;
  }

  /**
   * Calculate financial health score
   */
  public async calculateFinancialHealthScore(userId: string): Promise<FinancialHealthScore> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [
      monthlyExpenses,
      monthlyIncome,
      activeGoals,
      budgetAlerts
    ] = await Promise.all([
      this.financialDataManager.getUserExpenses(userId, startOfMonth, now),
      this.financialDataManager.getUserIncome(userId, startOfMonth, now),
      this.financialDataManager.getUserSavingsGoals(userId, 'active'),
      this.financialDataManager.getBudgetAlerts(userId)
    ]);

    const totalIncome = monthlyIncome.reduce((sum, income) => sum + (income.amount * income.multiplier), 0);
    const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netAmount = totalIncome - totalExpenses;
    
    // Calculate individual scores
    const savingsRateScore = this.calculateSavingsRateScore(totalIncome, netAmount);
    const budgetAdherenceScore = this.calculateBudgetAdherenceScore(budgetAlerts);
    const goalProgressScore = this.calculateGoalProgressScore(activeGoals);
    const incomeConsistencyScore = this.calculateIncomeConsistencyScore(monthlyIncome);

    const breakdown = [
      {
        category: 'Savings Rate',
        score: savingsRateScore,
        weight: 0.3,
        description: 'How much of your income you save'
      },
      {
        category: 'Budget Adherence',
        score: budgetAdherenceScore,
        weight: 0.25,
        description: 'How well you stick to your budget'
      },
      {
        category: 'Goal Progress',
        score: goalProgressScore,
        weight: 0.25,
        description: 'Progress towards your savings goals'
      },
      {
        category: 'Income Consistency',
        score: incomeConsistencyScore,
        weight: 0.2,
        description: 'Regularity of income logging'
      }
    ];

    const overall = breakdown.reduce((sum, item) => sum + (item.score * item.weight), 0);

    return {
      overall: Math.round(overall),
      savingsRate: savingsRateScore,
      budgetAdherence: budgetAdherenceScore,
      goalProgress: goalProgressScore,
      incomeConsistency: incomeConsistencyScore,
      breakdown
    };
  }

  /**
   * Generate actionable insights based on financial data
   */
  public async generateInsights(userId: string): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];
    
    const [
      spendingPatterns,
      incomePatterns,
      healthScore,
      trends
    ] = await Promise.all([
      this.analyzeSpendingPatterns(userId),
      this.analyzeIncomePatterns(userId),
      this.calculateFinancialHealthScore(userId),
      this.generateFinancialTrends(userId, 3)
    ]);

    // Spending insights
    const highestSpendingCategory = spendingPatterns[0];
    if (highestSpendingCategory && highestSpendingCategory.trend === 'increasing') {
      insights.push({
        id: `spending-${Date.now()}`,
        type: 'spending',
        title: `${highestSpendingCategory.category} Spending Increasing`,
        description: `Your ${highestSpendingCategory.category.toLowerCase()} expenses have been trending upward`,
        severity: 'warning',
        actionable: true,
        recommendation: highestSpendingCategory.recommendation,
        data: { category: highestSpendingCategory.category, amount: highestSpendingCategory.averageAmount },
        generatedAt: new Date()
      });
    }

    // Income insights
    const inconsistentIncome = incomePatterns.find(pattern => pattern.streakPerformance === 'needs_improvement');
    if (inconsistentIncome) {
      insights.push({
        id: `income-${Date.now()}`,
        type: 'income',
        title: 'Improve Income Logging Consistency',
        description: `Your ${inconsistentIncome.source.toLowerCase()} logging could be more consistent`,
        severity: 'info',
        actionable: true,
        recommendation: 'Try to log income regularly to build streaks and earn multiplier bonuses',
        data: { source: inconsistentIncome.source },
        generatedAt: new Date()
      });
    }

    // Health score insights
    if (healthScore.overall < 60) {
      insights.push({
        id: `health-${Date.now()}`,
        type: 'savings',
        title: 'Financial Health Needs Attention',
        description: `Your financial health score is ${healthScore.overall}/100`,
        severity: 'warning',
        actionable: true,
        recommendation: 'Focus on improving your lowest scoring areas',
        data: { score: healthScore.overall, breakdown: healthScore.breakdown },
        generatedAt: new Date()
      });
    }

    // Trend insights
    const recentSavingsRate = trends.savingsRate[trends.savingsRate.length - 1];
    const previousSavingsRate = trends.savingsRate[trends.savingsRate.length - 2];
    
    if (recentSavingsRate && previousSavingsRate && recentSavingsRate.value < previousSavingsRate.value) {
      insights.push({
        id: `trend-${Date.now()}`,
        type: 'savings',
        title: 'Savings Rate Declining',
        description: `Your savings rate dropped from ${previousSavingsRate.value.toFixed(1)}% to ${recentSavingsRate.value.toFixed(1)}%`,
        severity: 'warning',
        actionable: true,
        recommendation: 'Review your recent expenses and look for areas to cut back',
        data: { current: recentSavingsRate.value, previous: previousSavingsRate.value },
        generatedAt: new Date()
      });
    }

    return insights;
  }

  // Private helper methods
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  private generateSpendingRecommendation(
    category: ExpenseCategory, 
    averageAmount: number, 
    frequency: number, 
    trend: 'increasing' | 'decreasing' | 'stable'
  ): string {
    const categoryName = category.toLowerCase().replace('_', ' ');
    
    if (trend === 'increasing') {
      return `Consider setting a budget limit for ${categoryName} expenses to control spending growth`;
    } else if (frequency > 20) {
      return `You spend frequently on ${categoryName}. Look for bulk purchase opportunities to save money`;
    } else if (averageAmount > 100) {
      return `Your average ${categoryName} expense is high. Consider comparing prices or finding alternatives`;
    } else {
      return `Your ${categoryName} spending looks healthy. Keep monitoring to maintain good habits`;
    }
  }

  private calculateSavingsRateScore(totalIncome: number, netAmount: number): number {
    if (totalIncome === 0) return 0;
    const savingsRate = (netAmount / totalIncome) * 100;
    
    if (savingsRate >= 20) return 100;
    if (savingsRate >= 15) return 80;
    if (savingsRate >= 10) return 60;
    if (savingsRate >= 5) return 40;
    if (savingsRate >= 0) return 20;
    return 0;
  }

  private calculateBudgetAdherenceScore(budgetAlerts: any[]): number {
    const exceededAlerts = budgetAlerts.filter(alert => alert.severity === 'exceeded').length;
    const warningAlerts = budgetAlerts.filter(alert => alert.severity === 'warning').length;
    
    if (exceededAlerts === 0 && warningAlerts === 0) return 100;
    if (exceededAlerts === 0 && warningAlerts <= 2) return 80;
    if (exceededAlerts <= 1 && warningAlerts <= 3) return 60;
    if (exceededAlerts <= 2) return 40;
    return 20;
  }

  private calculateGoalProgressScore(activeGoals: SavingsGoal[]): number {
    if (activeGoals.length === 0) return 50; // Neutral score for no goals
    
    const progressScores = activeGoals.map(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const daysLeft = Math.ceil((goal.deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      
      if (progress >= 90) return 100;
      if (progress >= 70) return 80;
      if (progress >= 50) return 60;
      if (progress >= 25) return 40;
      if (daysLeft > 0) return 20;
      return 0;
    });
    
    return progressScores.reduce((sum, score) => sum + score, 0) / progressScores.length;
  }

  private calculateIncomeConsistencyScore(monthlyIncome: Income[]): number {
    if (monthlyIncome.length === 0) return 0;
    
    const maxStreak = Math.max(...monthlyIncome.map(income => income.streakCount));
    const avgMultiplier = monthlyIncome.reduce((sum, income) => sum + income.multiplier, 0) / monthlyIncome.length;
    
    let streakScore = 0;
    if (maxStreak >= 14) streakScore = 100;
    else if (maxStreak >= 7) streakScore = 80;
    else if (maxStreak >= 3) streakScore = 60;
    else if (maxStreak >= 1) streakScore = 40;
    else streakScore = 20;
    
    const multiplierScore = Math.min(100, (avgMultiplier - 1) * 25);
    
    return (streakScore + multiplierScore) / 2;
  }
}