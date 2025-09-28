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
  return Math.min(1 + streakDays * 0.1, 2);
};