import {
  calculateGrowthRate,
  calculateFertilizerBoost,
  calculateProgressPercentage,
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
});