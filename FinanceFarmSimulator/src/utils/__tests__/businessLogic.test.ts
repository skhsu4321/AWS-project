import { 
  calculateGrowthRate, 
  calculateFertilizerBoost, 
  calculateWeedPenalty,
  calculateStreakMultiplier,
  calculateBudgetThreshold,
  calculateRewardValue
} from '../calculations';

describe('Business Logic Calculations', () => {
  describe('calculateGrowthRate', () => {
    it('should calculate correct growth rate for savings goal', () => {
      const goal = {
        targetAmount: 10000,
        currentAmount: 2500,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      };

      const growthRate = calculateGrowthRate(goal);
      expect(growthRate).toBeGreaterThan(0);
      expect(growthRate).toBeLessThan(1);
    });

    it('should handle edge case of zero target amount', () => {
      const goal = {
        targetAmount: 0,
        currentAmount: 0,
        deadline: new Date(),
        createdAt: new Date(),
      };

      const growthRate = calculateGrowthRate(goal);
      expect(growthRate).toBe(0);
    });

    it('should handle overdue goals', () => {
      const goal = {
        targetAmount: 10000,
        currentAmount: 5000,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };

      const growthRate = calculateGrowthRate(goal);
      expect(growthRate).toBeDefined();
    });
  });

  describe('calculateFertilizerBoost', () => {
    it('should apply correct fertilizer boost formula', () => {
      const incomeAmount = 1000;
      const multiplier = 1.5;
      
      const boost = calculateFertilizerBoost(incomeAmount, multiplier);
      expect(boost).toBe(1500);
    });

    it('should handle zero income', () => {
      const boost = calculateFertilizerBoost(0, 1.5);
      expect(boost).toBe(0);
    });

    it('should handle zero multiplier', () => {
      const boost = calculateFertilizerBoost(1000, 0);
      expect(boost).toBe(0);
    });
  });

  describe('calculateWeedPenalty', () => {
    it('should calculate penalty for budget overrun', () => {
      const expenses = [
        { amount: 500, category: 'food' },
        { amount: 300, category: 'transport' },
        { amount: 200, category: 'entertainment' },
      ];
      const budgetLimit = 800;

      const penalty = calculateWeedPenalty(expenses, budgetLimit);
      expect(penalty).toBeGreaterThan(0);
    });

    it('should return zero penalty when under budget', () => {
      const expenses = [
        { amount: 200, category: 'food' },
        { amount: 150, category: 'transport' },
      ];
      const budgetLimit = 500;

      const penalty = calculateWeedPenalty(expenses, budgetLimit);
      expect(penalty).toBe(0);
    });
  });

  describe('calculateStreakMultiplier', () => {
    it('should increase multiplier with consecutive days', () => {
      const consecutiveDays = 7;
      const multiplier = calculateStreakMultiplier(consecutiveDays);
      
      expect(multiplier).toBeGreaterThan(1);
      expect(multiplier).toBeLessThanOrEqual(3); // Max multiplier cap
    });

    it('should return base multiplier for no streak', () => {
      const multiplier = calculateStreakMultiplier(0);
      expect(multiplier).toBe(1);
    });

    it('should cap multiplier at maximum value', () => {
      const multiplier = calculateStreakMultiplier(100);
      expect(multiplier).toBeLessThanOrEqual(3);
    });
  });

  describe('calculateBudgetThreshold', () => {
    it('should calculate appropriate budget threshold', () => {
      const income = 10000;
      const savingsGoals = [
        { targetAmount: 5000, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        { targetAmount: 3000, deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
      ];

      const threshold = calculateBudgetThreshold(income, savingsGoals);
      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThan(income);
    });
  });

  describe('calculateRewardValue', () => {
    it('should calculate reward based on goal completion', () => {
      const goal = {
        targetAmount: 10000,
        category: 'electronics',
        completionTime: 25, // days
        streakBonus: 1.2,
      };

      const reward = calculateRewardValue(goal);
      expect(reward).toBeGreaterThan(0);
    });

    it('should apply streak bonus correctly', () => {
      const baseGoal = {
        targetAmount: 1000,
        category: 'general',
        completionTime: 30,
        streakBonus: 1,
      };

      const streakGoal = {
        ...baseGoal,
        streakBonus: 1.5,
      };

      const baseReward = calculateRewardValue(baseGoal);
      const streakReward = calculateRewardValue(streakGoal);
      
      expect(streakReward).toBeGreaterThan(baseReward);
    });
  });
});