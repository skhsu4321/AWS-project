import {
  calculateGrowthRate,
  calculateFertilizerBoost,
  calculateProgressPercentage,
  calculateDailyGrowth,
  calculateDaysToGoal,
  calculateStreakMultiplier,
  calculateSavingsRate,
  calculateBudgetUtilization,
  calculateAverageDaily,
  calculateProjectedSavings,
  calculateGoalTimeframe,
  calculateExpenseImpact,
  calculateIncomeBoost,
} from '../calculations';

describe('Calculation utilities', () => {
  describe('calculateGrowthRate', () => {
    it('should calculate growth rate correctly', () => {
      const result = calculateGrowthRate(50, 100, 1);
      expect(result).toBe(0.5);
    });

    it('should return 0 when goal amount is 0', () => {
      const result = calculateGrowthRate(50, 0, 1);
      expect(result).toBe(0);
    });
  });

  describe('calculateFertilizerBoost', () => {
    it('should calculate fertilizer boost correctly', () => {
      const result = calculateFertilizerBoost(100, 1.5);
      expect(result).toBe(150);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('should calculate progress percentage correctly', () => {
      const result = calculateProgressPercentage(25, 100);
      expect(result).toBe(25);
    });

    it('should cap at 100%', () => {
      const result = calculateProgressPercentage(150, 100);
      expect(result).toBe(100);
    });

    it('should return 0 when target is 0', () => {
      const result = calculateProgressPercentage(50, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateDailyGrowth', () => {
    it('should calculate daily growth correctly', () => {
      const result = calculateDailyGrowth(0.1, 0.5, 0.2);
      expect(result).toBeCloseTo(0.4);
    });

    it('should handle negative growth', () => {
      const result = calculateDailyGrowth(0.1, 0.2, 0.5);
      expect(result).toBeCloseTo(-0.2);
    });
  });

  describe('calculateDaysToGoal', () => {
    it('should calculate days to goal correctly', () => {
      const result = calculateDaysToGoal(500, 1000, 50);
      expect(result).toBe(10);
    });

    it('should return 0 when goal is already reached', () => {
      const result = calculateDaysToGoal(1000, 1000, 50);
      expect(result).toBe(0);
    });

    it('should return Infinity when daily savings is 0 or negative', () => {
      expect(calculateDaysToGoal(500, 1000, 0)).toBe(Infinity);
      expect(calculateDaysToGoal(500, 1000, -10)).toBe(Infinity);
    });
  });

  describe('calculateStreakMultiplier', () => {
    it('should return 1 for 0 streak days', () => {
      expect(calculateStreakMultiplier(0)).toBe(1);
    });

    it('should increase multiplier with streak days', () => {
      expect(calculateStreakMultiplier(1)).toBe(1.1);
      expect(calculateStreakMultiplier(5)).toBe(1.5);
    });

    it('should cap multiplier at 2x', () => {
      expect(calculateStreakMultiplier(15)).toBe(2);
      expect(calculateStreakMultiplier(100)).toBe(2);
    });
  });

  describe('calculateSavingsRate', () => {
    it('should return 0 when income is 0', () => {
      expect(calculateSavingsRate(0, 100)).toBe(0);
    });

    it('should calculate correct savings rate', () => {
      expect(calculateSavingsRate(1000, 800)).toBe(20);
      expect(calculateSavingsRate(1000, 600)).toBe(40);
    });

    it('should return 0 when expenses exceed income', () => {
      expect(calculateSavingsRate(800, 1000)).toBe(0);
    });
  });

  describe('calculateBudgetUtilization', () => {
    it('should return 0 when budget limit is 0', () => {
      expect(calculateBudgetUtilization(100, 0)).toBe(0);
    });

    it('should calculate correct utilization percentage', () => {
      expect(calculateBudgetUtilization(250, 1000)).toBe(25);
      expect(calculateBudgetUtilization(800, 1000)).toBe(80);
    });

    it('should handle over-budget scenarios', () => {
      expect(calculateBudgetUtilization(1200, 1000)).toBe(120);
    });
  });

  describe('calculateAverageDaily', () => {
    it('should return 0 when number of days is 0', () => {
      expect(calculateAverageDaily(1000, 0)).toBe(0);
    });

    it('should calculate correct daily average', () => {
      expect(calculateAverageDaily(3000, 30)).toBe(100);
      expect(calculateAverageDaily(700, 7)).toBe(100);
    });
  });

  describe('calculateProjectedSavings', () => {
    it('should project savings correctly', () => {
      expect(calculateProjectedSavings(1000, 3000, 2500, 6)).toBe(4000);
      expect(calculateProjectedSavings(500, 2000, 1800, 12)).toBe(2900);
    });

    it('should handle negative monthly savings', () => {
      expect(calculateProjectedSavings(1000, 2000, 2500, 6)).toBe(-2000);
    });
  });

  describe('calculateGoalTimeframe', () => {
    it('should return -1 when monthly savings is 0 or negative', () => {
      expect(calculateGoalTimeframe(500, 1000, 0)).toBe(-1);
      expect(calculateGoalTimeframe(500, 1000, -100)).toBe(-1);
    });

    it('should return 0 when goal is already reached', () => {
      expect(calculateGoalTimeframe(1000, 1000, 200)).toBe(0);
      expect(calculateGoalTimeframe(1200, 1000, 200)).toBe(0);
    });

    it('should calculate correct timeframe in months', () => {
      expect(calculateGoalTimeframe(500, 1000, 100)).toBe(5);
      expect(calculateGoalTimeframe(200, 1000, 150)).toBe(6);
    });
  });

  describe('calculateExpenseImpact', () => {
    it('should return default impact when budget limit is 0', () => {
      expect(calculateExpenseImpact(100, 0)).toBe(0.5);
    });

    it('should calculate impact based on budget utilization', () => {
      expect(calculateExpenseImpact(250, 1000)).toBe(0.25);
      expect(calculateExpenseImpact(800, 1000)).toBe(0.8);
    });

    it('should cap impact at 1', () => {
      expect(calculateExpenseImpact(1500, 1000)).toBe(1);
    });
  });

  describe('calculateIncomeBoost', () => {
    it('should return 1 when average income is 0', () => {
      expect(calculateIncomeBoost(500, 0)).toBe(1);
    });

    it('should calculate boost factor correctly', () => {
      expect(calculateIncomeBoost(1200, 1000)).toBe(1.2);
      expect(calculateIncomeBoost(1500, 1000)).toBe(1.5);
    });

    it('should return at least 1 for below-average income', () => {
      expect(calculateIncomeBoost(800, 1000)).toBe(1);
    });
  });
});