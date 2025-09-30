import {
  calculateStreakMultiplier,
  calculateFertilizerBoost,
} from '../calculations';

describe('Income Calculations', () => {
  describe('calculateStreakMultiplier', () => {
    it('returns 1x for zero streak', () => {
      expect(calculateStreakMultiplier(0)).toBe(1.0);
    });

    it('returns 1x for negative streak (edge case)', () => {
      expect(calculateStreakMultiplier(-1)).toBe(1.0);
    });

    it('calculates correct multiplier for low streaks', () => {
      expect(calculateStreakMultiplier(1)).toBe(1.1);
      expect(calculateStreakMultiplier(2)).toBe(1.2);
      expect(calculateStreakMultiplier(3)).toBe(1.3);
      expect(calculateStreakMultiplier(5)).toBe(1.5);
    });

    it('calculates correct multiplier for medium streaks', () => {
      expect(calculateStreakMultiplier(7)).toBeCloseTo(1.7);
      expect(calculateStreakMultiplier(10)).toBeCloseTo(2.0);
    });

    it('caps multiplier at 2x for high streaks', () => {
      expect(calculateStreakMultiplier(15)).toBe(2.0);
      expect(calculateStreakMultiplier(20)).toBe(2.0);
      expect(calculateStreakMultiplier(100)).toBe(2.0);
    });

    it('handles decimal streak values correctly', () => {
      expect(calculateStreakMultiplier(1.5)).toBe(1.15);
      expect(calculateStreakMultiplier(2.7)).toBe(1.27);
    });
  });

  describe('calculateFertilizerBoost', () => {
    it('calculates boost with 1x multiplier', () => {
      expect(calculateFertilizerBoost(100, 1.0)).toBe(100);
      expect(calculateFertilizerBoost(500, 1.0)).toBe(500);
    });

    it('calculates boost with streak multipliers', () => {
      expect(calculateFertilizerBoost(100, 1.5)).toBe(150);
      expect(calculateFertilizerBoost(200, 1.2)).toBe(240);
      expect(calculateFertilizerBoost(1000, 2.0)).toBe(2000);
    });

    it('handles zero income amount', () => {
      expect(calculateFertilizerBoost(0, 1.5)).toBe(0);
      expect(calculateFertilizerBoost(0, 2.0)).toBe(0);
    });

    it('handles decimal amounts', () => {
      expect(calculateFertilizerBoost(99.99, 1.1)).toBeCloseTo(109.989, 2);
      expect(calculateFertilizerBoost(123.45, 1.8)).toBeCloseTo(222.21, 2);
    });

    it('handles large amounts', () => {
      expect(calculateFertilizerBoost(10000, 2.0)).toBe(20000);
      expect(calculateFertilizerBoost(50000, 1.7)).toBe(85000);
    });
  });

  describe('Integrated streak and fertilizer calculations', () => {
    it('calculates realistic income scenarios', () => {
      // Day 1: First income entry
      const day1Streak = 1;
      const day1Multiplier = calculateStreakMultiplier(day1Streak);
      const day1Boost = calculateFertilizerBoost(1000, day1Multiplier);
      
      expect(day1Multiplier).toBe(1.1);
      expect(day1Boost).toBe(1100);

      // Day 7: One week streak
      const day7Streak = 7;
      const day7Multiplier = calculateStreakMultiplier(day7Streak);
      const day7Boost = calculateFertilizerBoost(1000, day7Multiplier);
      
      expect(day7Multiplier).toBeCloseTo(1.7);
      expect(day7Boost).toBeCloseTo(1700);

      // Day 10: Maximum multiplier reached
      const day10Streak = 10;
      const day10Multiplier = calculateStreakMultiplier(day10Streak);
      const day10Boost = calculateFertilizerBoost(1000, day10Multiplier);
      
      expect(day10Multiplier).toBe(2.0);
      expect(day10Boost).toBe(2000);

      // Day 30: Still at maximum
      const day30Streak = 30;
      const day30Multiplier = calculateStreakMultiplier(day30Streak);
      const day30Boost = calculateFertilizerBoost(1000, day30Multiplier);
      
      expect(day30Multiplier).toBe(2.0);
      expect(day30Boost).toBe(2000);
    });

    it('calculates different income amounts with same streak', () => {
      const streak = 5;
      const multiplier = calculateStreakMultiplier(streak);
      
      expect(multiplier).toBe(1.5);
      
      // Different income amounts
      expect(calculateFertilizerBoost(100, multiplier)).toBe(150);
      expect(calculateFertilizerBoost(500, multiplier)).toBe(750);
      expect(calculateFertilizerBoost(2000, multiplier)).toBe(3000);
      expect(calculateFertilizerBoost(10000, multiplier)).toBe(15000);
    });

    it('demonstrates progression incentive', () => {
      const incomeAmount = 1000;
      
      // Show how boost increases with streak
      const progressionData = [
        { day: 0, expectedBoost: 1000 },
        { day: 1, expectedBoost: 1100 },
        { day: 3, expectedBoost: 1300 },
        { day: 5, expectedBoost: 1500 },
        { day: 7, expectedBoost: 1700 },
        { day: 10, expectedBoost: 2000 },
        { day: 15, expectedBoost: 2000 }, // Capped
      ];

      progressionData.forEach(({ day, expectedBoost }) => {
        const multiplier = calculateStreakMultiplier(day);
        const boost = calculateFertilizerBoost(incomeAmount, multiplier);
        expect(boost).toBeCloseTo(expectedBoost);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('handles negative income amounts gracefully', () => {
      // While negative income shouldn't happen in normal flow,
      // the calculation should still work mathematically
      expect(calculateFertilizerBoost(-100, 1.5)).toBe(-150);
    });

    it('handles very small multipliers', () => {
      expect(calculateFertilizerBoost(100, 0.1)).toBe(10);
    });

    it('handles very large multipliers', () => {
      // Even though our system caps at 2x, test mathematical correctness
      expect(calculateFertilizerBoost(100, 10.0)).toBe(1000);
    });

    it('maintains precision with floating point operations', () => {
      const result = calculateFertilizerBoost(33.33, 1.5);
      expect(result).toBeCloseTo(49.995, 3);
    });
  });
});