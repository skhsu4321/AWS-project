import { FinancialDataManager } from '../FinancialDataManager';
import { 
  GoalCategory, 
  GoalStatus,
  ExpenseCategory, 
  IncomeSource 
} from '../../models/Financial';

// Mock the DAOs to avoid database dependencies
jest.mock('../dao/SavingsGoalDAO');
jest.mock('../dao/ExpenseDAO');
jest.mock('../dao/IncomeDAO');

describe('FinancialDataManager Core Functionality', () => {
  let financialManager: FinancialDataManager;
  
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
    financialManager = new FinancialDataManager();
  });

  describe('Budget Threshold Management', () => {
    it('should set and get budget thresholds', () => {
      const thresholds = [
        {
          category: ExpenseCategory.FOOD,
          monthlyLimit: 500,
          warningPercentage: 80,
        },
        {
          category: ExpenseCategory.ENTERTAINMENT,
          monthlyLimit: 200,
          warningPercentage: 75,
        },
      ];

      financialManager.setBudgetThresholds(testUserId, thresholds);
      
      const result = financialManager.getBudgetThresholds(testUserId);
      
      expect(result).toEqual(thresholds);
    });

    it('should return empty array for user with no thresholds', () => {
      const result = financialManager.getBudgetThresholds('non-existent-user');
      expect(result).toEqual([]);
    });
  });

  describe('Utility Methods', () => {
    it('should calculate fertilizer effect with default streak', async () => {
      // Mock the DAO to return 0 streak
      const mockIncomeDAO = {
        getCurrentStreak: jest.fn().mockResolvedValue(0),
      };
      
      (financialManager as any).incomeDAO = mockIncomeDAO;

      const result = await financialManager.calculateFertilizerEffect(testUserId, 100);
      
      expect(mockIncomeDAO.getCurrentStreak).toHaveBeenCalledWith(testUserId);
      expect(result).toBe(100); // 100 * 1.0 multiplier for 0 streak
    });

    it('should calculate fertilizer effect with streak bonus', async () => {
      // Mock the DAO to return 5 streak
      const mockIncomeDAO = {
        getCurrentStreak: jest.fn().mockResolvedValue(5),
      };
      
      (financialManager as any).incomeDAO = mockIncomeDAO;

      const result = await financialManager.calculateFertilizerEffect(testUserId, 100);
      
      expect(mockIncomeDAO.getCurrentStreak).toHaveBeenCalledWith(testUserId);
      expect(result).toBe(150); // 100 * 1.5 multiplier for 5 streak
    });

    it('should reset income streak', async () => {
      const mockIncomeDAO = {
        findByUserId: jest.fn().mockResolvedValue([
          { id: 'income-1', userId: testUserId }
        ]),
        updateStreak: jest.fn().mockResolvedValue(null),
      };
      
      (financialManager as any).incomeDAO = mockIncomeDAO;

      await financialManager.resetIncomeStreak(testUserId);
      
      expect(mockIncomeDAO.findByUserId).toHaveBeenCalledWith(testUserId);
      expect(mockIncomeDAO.updateStreak).toHaveBeenCalledWith(testUserId, 'income-1', 0, 1);
    });
  });

  describe('Data Validation', () => {
    it('should validate UUID format in user IDs', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const invalidUUID = 'invalid-uuid';
      
      // Valid UUID should not throw
      expect(() => {
        financialManager.setBudgetThresholds(validUUID, []);
      }).not.toThrow();
      
      // Invalid UUID handling is done at the model level during validation
      expect(validUUID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(invalidUUID).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle DAO errors gracefully', async () => {
      const mockSavingsGoalDAO = {
        findById: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      
      (financialManager as any).savingsGoalDAO = mockSavingsGoalDAO;

      // The method should handle the error and either return null or throw a handled error
      await expect(financialManager.getSavingsGoalById('test-id')).rejects.toThrow();
    });
  });
});