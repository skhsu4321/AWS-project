// Financial and game calculation utilities

export const calculateGrowthRate = (
  savedAmount: number,
  goalAmount: number,
  timeFactor: number,
): number => {
  if (goalAmount === 0) return 0;
  return (savedAmount / goalAmount) * timeFactor;
};

export const calculateFertilizerBoost = (
  incomeAmount: number,
  multiplier: number,
): number => {
  return incomeAmount * multiplier;
};

export const calculateDailyGrowth = (
  baseRate: number,
  savingsProgress: number,
  expenseImpact: number,
): number => {
  return baseRate + savingsProgress - expenseImpact;
};

export const calculateProgressPercentage = (
  current: number,
  target: number,
): number => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

export const calculateDaysToGoal = (
  currentAmount: number,
  targetAmount: number,
  dailySavings: number,
): number => {
  if (dailySavings <= 0) return Infinity;
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / dailySavings);
};

export const calculateStreakMultiplier = (streakDays: number): number => {
  // Multiplier increases with streak: 1x, 1.1x, 1.2x, etc., capped at 2x
  // Ensure it never goes below 1x
  return Math.min(Math.max(1, 1 + streakDays * 0.1), 2);
};

export const calculateSavingsRate = (
  totalIncome: number,
  totalExpenses: number,
): number => {
  if (totalIncome === 0) return 0;
  const netSavings = totalIncome - totalExpenses;
  return Math.max(0, (netSavings / totalIncome) * 100);
};

export const calculateBudgetUtilization = (
  currentSpending: number,
  budgetLimit: number,
): number => {
  if (budgetLimit === 0) return 0;
  return (currentSpending / budgetLimit) * 100;
};

export const calculateAverageDaily = (
  totalAmount: number,
  numberOfDays: number,
): number => {
  if (numberOfDays === 0) return 0;
  return totalAmount / numberOfDays;
};

export const calculateProjectedSavings = (
  currentAmount: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  months: number,
): number => {
  const monthlySavings = monthlyIncome - monthlyExpenses;
  return currentAmount + (monthlySavings * months);
};

export const calculateGoalTimeframe = (
  currentAmount: number,
  targetAmount: number,
  monthlySavings: number,
): number => {
  if (monthlySavings <= 0) return -1; // Cannot reach goal
  const remainingAmount = targetAmount - currentAmount;
  if (remainingAmount <= 0) return 0; // Goal already reached
  return Math.ceil(remainingAmount / monthlySavings);
};

export const calculateExpenseImpact = (
  expenseAmount: number,
  budgetLimit: number,
): number => {
  // Returns a value between 0 and 1 representing the negative impact on farm health
  if (budgetLimit === 0) return 0.5; // Default moderate impact
  const utilization = expenseAmount / budgetLimit;
  return Math.min(utilization, 1);
};

export const calculateIncomeBoost = (
  incomeAmount: number,
  averageIncome: number,
): number => {
  // Returns a boost factor based on how much above average the income is
  if (averageIncome === 0) return 1;
  return Math.max(1, incomeAmount / averageIncome);
};