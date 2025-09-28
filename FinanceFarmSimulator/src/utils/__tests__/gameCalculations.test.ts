import {
  calculateGrowthRate,
  calculateFertilizerBoost,
  calculateDailyGrowth,
  calculateStreakMultiplier,
  calculateExpenseImpact,
  calculateProgressPercentage,
} from '../calculations';

describe('Game Calculations', () => {
  describe('calculateGrowthRate', () => {
    it('should calculate growth rate correctly', () => {
      const result = calculateGrowthRate(500, 1000, 0.5);
      expect(result).toBe(0.25); // (500/1000) * 0.5
    });

    it('should return 0 for zero goal amount', () => {
      const result = calculateGrowthRate(500, 0, 0.5);
      expect(result).toBe(0);
    });

    it('should handle zero saved amount', () => {
      const result = calculateGrowthRate(0, 1000, 0.5);
      expect(result).toBe(0);
    });

    it('should handle zero time factor', () => {
      const result = calculateGrowthRate(500, 1000, 0);
      expect(result).toBe(0);
    });

    it('should handle values greater than goal', () => {
      const result = calculateGrowthRate(1500, 1000, 1);
      expect(result).toBe(1.5); // Can exceed 100%
    });
  });

  describe('calculateFertilizerBoost', () => {
    it('should calculate fertilizer boost correctly', () => {
      const result = calculateFertilizerBoost(100, 2);
      expect(result).toBe(200);
    });

    it('should handle zero income', () => {
      const result = calculateFertilizerBoost(0, 2);
      expect(result).toBe(0);
    });

    it('should handle multiplier of 1', () => {
      const result = calculateFertilizerBoost(100, 1);
      expect(result).toBe(100);
    });

    it('should handle decimal multipliers', () => {
      const result = calculateFertilizerBoost(100, 1.5);
      expect(result).toBe(150);
    });

    it('should handle large multipliers', () => {
      const result = calculateFertilizerBoost(100, 10);
      expect(result).toBe(1000);
    });
  });

  describe('calculateDailyGrowth', () => {
    it('should calculate daily growth correctly', () => {
      const result = calculateDailyGrowth(1, 0.5, 0.2);
      expect(result).toBe(1.3); // 1 + 0.5 - 0.2
    });

    it('should handle negative expense impact', () => {
      const result = calculateDailyGrowth(1, 0.5, 1.8);
      expect(result).toBeCloseTo(-0.3); // Can be negative
    });

    it('should handle zero base rate', () => {
      const result = calculateDailyGrowth(0, 0.5, 0.2);
      expect(result).toBe(0.3);
    });

    it('should handle all zero values', () => {
      const result = calculateDailyGrowth(0, 0, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateStreakMultiplier', () => {
    it('should calculate streak multiplier correctly', () => {
      const result = calculateStreakMultiplier(5);
      expect(result).toBe(1.5); // 1 + 5 * 0.1
    });

    it('should handle zero streak', () => {
      const result = calculateStreakMultiplier(0);
      expect(result).toBe(1);
    });

    it('should cap at maximum multiplier', () => {
      const result = calculateStreakMultiplier(20);
      expect(result).toBe(2); // Capped at 2x
    });

    it('should handle negative streak (edge case)', () => {
      const result = calculateStreakMultiplier(-5);
      expect(result).toBe(1); // Should not go below 1
    });

    it('should handle decimal streaks', () => {
      const result = calculateStreakMultiplier(2.5);
      expect(result).toBe(1.25);
    });
  });

  describe('calculateExpenseImpact', () => {
    it('should calculate expense impact correctly', () => {
      const result = calculateExpenseImpact(200, 1000);
      expect(result).toBe(0.2); // 200/1000
    });

    it('should handle zero budget limit', () => {
      const result = calculateExpenseImpact(200, 0);
      expect(result).toBe(0.5); // Default moderate impact
    });

    it('should cap impact at 1', () => {
      const result = calculateExpenseImpact(1500, 1000);
      expect(result).toBe(1); // Capped at 1
    });

    it('should handle zero expense', () => {
      const result = calculateExpenseImpact(0, 1000);
      expect(result).toBe(0);
    });

    it('should handle expense equal to budget', () => {
      const result = calculateExpenseImpact(1000, 1000);
      expect(result).toBe(1);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('should calculate progress percentage correctly', () => {
      const result = calculateProgressPercentage(250, 1000);
      expect(result).toBe(25);
    });

    it('should handle zero target', () => {
      const result = calculateProgressPercentage(250, 0);
      expect(result).toBe(0);
    });

    it('should cap at 100%', () => {
      const result = calculateProgressPercentage(1500, 1000);
      expect(result).toBe(100);
    });

    it('should handle zero current', () => {
      const result = calculateProgressPercentage(0, 1000);
      expect(result).toBe(0);
    });

    it('should handle exact target match', () => {
      const result = calculateProgressPercentage(1000, 1000);
      expect(result).toBe(100);
    });

    it('should handle decimal values', () => {
      const result = calculateProgressPercentage(333.33, 1000);
      expect(result).toBeCloseTo(33.333);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for realistic farm scenario', () => {
      // Scenario: User has saved $500 towards $1000 goal, logged $100 income with 3-day streak
      const savedAmount = 500;
      const goalAmount = 1000;
      const timeFactor = 0.8; // Close to deadline
      const incomeAmount = 100;
      const streakDays = 3;
      const expenseAmount = 50;
      const budgetLimit = 800;

      const growthRate = calculateGrowthRate(savedAmount, goalAmount, timeFactor);
      const fertilizerBoost = calculateFertilizerBoost(incomeAmount, calculateStreakMultiplier(streakDays));
      const expenseImpact = calculateExpenseImpact(expenseAmount, budgetLimit);
      const dailyGrowth = calculateDailyGrowth(growthRate, fertilizerBoost / 1000, expenseImpact);
      const progressPercentage = calculateProgressPercentage(savedAmount, goalAmount);

      expect(growthRate).toBe(0.4); // (500/1000) * 0.8
      expect(fertilizerBoost).toBe(130); // 100 * 1.3 (streak multiplier)
      expect(expenseImpact).toBeCloseTo(0.0625); // 50/800
      expect(dailyGrowth).toBeCloseTo(0.4 + 0.13 - 0.0625); // Growth + boost - impact
      expect(progressPercentage).toBe(50);
    });

    it('should handle extreme values gracefully', () => {
      // Test with very large numbers
      const largeAmount = 1000000;
      const largeGoal = 2000000;
      const largeIncome = 50000;
      const largeStreak = 100;

      const growthRate = calculateGrowthRate(largeAmount, largeGoal, 1);
      const streakMultiplier = calculateStreakMultiplier(largeStreak);
      const fertilizerBoost = calculateFertilizerBoost(largeIncome, streakMultiplier);

      expect(growthRate).toBe(0.5);
      expect(streakMultiplier).toBe(2); // Capped at 2
      expect(fertilizerBoost).toBe(100000); // 50000 * 2
    });

    it('should handle edge case of completed goal', () => {
      const savedAmount = 1000;
      const goalAmount = 1000;
      const progressPercentage = calculateProgressPercentage(savedAmount, goalAmount);
      const growthRate = calculateGrowthRate(savedAmount, goalAmount, 1);

      expect(progressPercentage).toBe(100);
      expect(growthRate).toBe(1); // 100% progress
    });
  });
});