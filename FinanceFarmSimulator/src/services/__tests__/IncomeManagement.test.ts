import { FinancialDataManager } from '../FinancialDataManager';
import { IncomeDAO } from '../dao/IncomeDAO';
import { IncomeSource, IncomeInput, Income } from '../../models/Financial';
import { calculateStreakMultiplier } from '../../utils/calculations';

// Mock the DAO
jest.mock('../dao/IncomeDAO');

const MockedIncomeDAO = IncomeDAO as jest.MockedClass<typeof IncomeDAO>;

describe('FinancialDataManager - Income Management', () => {
  let financialDataManager: FinancialDataManager;
  let mockIncomeDAO: jest.Mocked<IncomeDAO>;

  const mockUserId = 'user-123';
  
  const mockIncomeInput: IncomeInput = {
    userId: mockUserId,
    amount: 1000,
    source: IncomeSource.SALARY,
    description: 'Monthly salary',
    date: new Date('2024-01-15'),
    isRecurring: true,
    recurringPeriod: 'monthly',
  };

  const mockIncome: Income = {
    id: 'income-1',
    ...mockIncomeInput,
    multiplier: 1.5,
    streakCount: 5,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockIncomeDAO = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByDateRange: jest.fn(),
      findBySource: jest.fn(),
      getCurrentStreak: jest.fn(),
      updateStreak: jest.fn(),
      getHighestMultiplier: jest.fn(),
      getTotalForPeriod: jest.fn(),
      findRecurring: jest.fn(),
      getMonthlyTrend: jest.fn(),
      getTotalBySource: jest.fn(),
      getStreakHistory: jest.fn(),
    } as any;

    MockedIncomeDAO.mockImplementation(() => mockIncomeDAO);
    financialDataManager = new FinancialDataManager();
  });

  describe('logIncome', () => {
    it('creates income with calculated streak and multiplier', async () => {
      const currentStreak = 4;
      const expectedMultiplier = calculateStreakMultiplier(currentStreak + 1);
      
      mockIncomeDAO.getCurrentStreak.mockResolvedValue(currentStreak);
      mockIncomeDAO.create.mockResolvedValue({
        ...mockIncome,
        multiplier: expectedMultiplier,
        streakCount: currentStreak + 1,
      });

      const result = await financialDataManager.logIncome(mockIncomeInput);

      expect(mockIncomeDAO.getCurrentStreak).toHaveBeenCalledWith(mockUserId);
      expect(mockIncomeDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockIncomeInput,
          id: expect.any(String),
          multiplier: expectedMultiplier,
          streakCount: currentStreak + 1,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(result.multiplier).toBe(expectedMultiplier);
      expect(result.streakCount).toBe(currentStreak + 1);
    });

    it('handles first income entry (zero streak)', async () => {
      mockIncomeDAO.getCurrentStreak.mockResolvedValue(0);
      mockIncomeDAO.create.mockResolvedValue({
        ...mockIncome,
        multiplier: 1.1,
        streakCount: 1,
      });

      const result = await financialDataManager.logIncome(mockIncomeInput);

      expect(result.multiplier).toBe(1.1);
      expect(result.streakCount).toBe(1);
    });

    it('validates input before processing', async () => {
      const invalidInput = {
        ...mockIncomeInput,
        amount: -100, // Invalid negative amount
      };

      await expect(financialDataManager.logIncome(invalidInput))
        .rejects.toThrow('Failed to log income');
    });

    it('handles DAO errors gracefully', async () => {
      mockIncomeDAO.getCurrentStreak.mockRejectedValue(new Error('Database error'));

      await expect(financialDataManager.logIncome(mockIncomeInput))
        .rejects.toThrow('Failed to log income');
    });
  });

  describe('updateIncome', () => {
    it('updates income successfully', async () => {
      const updates = { description: 'Updated description' };
      const updatedIncome = { ...mockIncome, ...updates, updatedAt: new Date() };
      
      mockIncomeDAO.update.mockResolvedValue(updatedIncome);

      const result = await financialDataManager.updateIncome('income-1', updates);

      expect(mockIncomeDAO.update).toHaveBeenCalledWith('income-1', {
        ...updates,
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(updatedIncome);
    });

    it('handles update errors', async () => {
      mockIncomeDAO.update.mockRejectedValue(new Error('Update failed'));

      await expect(financialDataManager.updateIncome('income-1', {}))
        .rejects.toThrow('Failed to update income');
    });
  });

  describe('deleteIncome', () => {
    it('deletes income successfully', async () => {
      mockIncomeDAO.delete.mockResolvedValue(true);

      const result = await financialDataManager.deleteIncome('income-1');

      expect(mockIncomeDAO.delete).toHaveBeenCalledWith('income-1');
      expect(result).toBe(true);
    });

    it('handles deletion errors', async () => {
      mockIncomeDAO.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(financialDataManager.deleteIncome('income-1'))
        .rejects.toThrow('Failed to delete income');
    });
  });

  describe('getUserIncome', () => {
    it('retrieves all user income when no date range specified', async () => {
      const mockIncomeList = [mockIncome];
      mockIncomeDAO.findByUserId.mockResolvedValue(mockIncomeList);

      const result = await financialDataManager.getUserIncome(mockUserId);

      expect(mockIncomeDAO.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockIncomeList);
    });

    it('retrieves income for date range when specified', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockIncomeList = [mockIncome];
      
      mockIncomeDAO.findByDateRange.mockResolvedValue(mockIncomeList);

      const result = await financialDataManager.getUserIncome(mockUserId, startDate, endDate);

      expect(mockIncomeDAO.findByDateRange).toHaveBeenCalledWith(mockUserId, startDate, endDate);
      expect(result).toEqual(mockIncomeList);
    });
  });

  describe('getIncomeBySource', () => {
    it('retrieves income filtered by source', async () => {
      const mockIncomeList = [mockIncome];
      mockIncomeDAO.findBySource.mockResolvedValue(mockIncomeList);

      const result = await financialDataManager.getIncomeBySource(mockUserId, IncomeSource.SALARY);

      expect(mockIncomeDAO.findBySource).toHaveBeenCalledWith(mockUserId, IncomeSource.SALARY);
      expect(result).toEqual(mockIncomeList);
    });
  });

  describe('calculateFertilizerEffect', () => {
    it('calculates fertilizer effect based on current streak', async () => {
      const currentStreak = 7;
      const incomeAmount = 1000;
      const expectedMultiplier = calculateStreakMultiplier(currentStreak);
      const expectedBoost = incomeAmount * expectedMultiplier;

      mockIncomeDAO.getCurrentStreak.mockResolvedValue(currentStreak);

      const result = await financialDataManager.calculateFertilizerEffect(mockUserId, incomeAmount);

      expect(mockIncomeDAO.getCurrentStreak).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(expectedBoost);
    });

    it('handles zero streak correctly', async () => {
      mockIncomeDAO.getCurrentStreak.mockResolvedValue(0);

      const result = await financialDataManager.calculateFertilizerEffect(mockUserId, 1000);

      expect(result).toBe(1000); // 1x multiplier for zero streak
    });
  });

  describe('resetIncomeStreak', () => {
    it('resets streak for user with existing income', async () => {
      const mockIncomeList = [mockIncome];
      mockIncomeDAO.findByUserId.mockResolvedValue(mockIncomeList);
      mockIncomeDAO.updateStreak.mockResolvedValue(mockIncome);

      await financialDataManager.resetIncomeStreak(mockUserId);

      expect(mockIncomeDAO.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockIncomeDAO.updateStreak).toHaveBeenCalledWith(mockUserId, mockIncome.id, 0, 1);
    });

    it('handles user with no income gracefully', async () => {
      mockIncomeDAO.findByUserId.mockResolvedValue([]);

      await expect(financialDataManager.resetIncomeStreak(mockUserId))
        .resolves.not.toThrow();

      expect(mockIncomeDAO.updateStreak).not.toHaveBeenCalled();
    });
  });

  describe('Income analytics and trends', () => {
    it('calculates income trends correctly', async () => {
      const mockTrends = [
        { month: '2024-01', total: 5000, averageMultiplier: 1.3 },
        { month: '2024-02', total: 5500, averageMultiplier: 1.5 },
      ];
      
      mockIncomeDAO.getMonthlyTrend.mockResolvedValue(mockTrends);

      const result = await financialDataManager.getIncomeTrends(mockUserId, 6);

      expect(mockIncomeDAO.getMonthlyTrend).toHaveBeenCalledWith(mockUserId, 6);
      expect(result).toEqual([
        { month: '2024-01', amount: 5000, averageMultiplier: 1.3 },
        { month: '2024-02', amount: 5500, averageMultiplier: 1.5 },
      ]);
    });
  });

  describe('Recurring income management', () => {
    it('validates recurring income input', async () => {
      const recurringInput: IncomeInput = {
        ...mockIncomeInput,
        isRecurring: true,
        recurringPeriod: undefined, // Invalid: missing period
      };

      await expect(financialDataManager.logIncome(recurringInput))
        .rejects.toThrow();
    });

    it('creates valid recurring income', async () => {
      const recurringInput: IncomeInput = {
        ...mockIncomeInput,
        isRecurring: true,
        recurringPeriod: 'weekly',
      };

      mockIncomeDAO.getCurrentStreak.mockResolvedValue(0);
      mockIncomeDAO.create.mockResolvedValue({
        ...mockIncome,
        isRecurring: true,
        recurringPeriod: 'weekly',
        multiplier: 1.1,
        streakCount: 1,
      });

      const result = await financialDataManager.logIncome(recurringInput);

      expect(result.isRecurring).toBe(true);
      expect(result.recurringPeriod).toBe('weekly');
    });
  });

  describe('Streak multiplier progression', () => {
    it('demonstrates realistic streak progression', async () => {
      const progressionTests = [
        { currentStreak: 0, expectedNewStreak: 1, expectedMultiplier: 1.1 },
        { currentStreak: 3, expectedNewStreak: 4, expectedMultiplier: 1.4 },
        { currentStreak: 6, expectedNewStreak: 7, expectedMultiplier: 1.7 },
        { currentStreak: 9, expectedNewStreak: 10, expectedMultiplier: 2.0 },
        { currentStreak: 15, expectedNewStreak: 16, expectedMultiplier: 2.0 }, // Capped
      ];

      for (const test of progressionTests) {
        mockIncomeDAO.getCurrentStreak.mockResolvedValue(test.currentStreak);
        mockIncomeDAO.create.mockResolvedValue({
          ...mockIncome,
          multiplier: test.expectedMultiplier,
          streakCount: test.expectedNewStreak,
        });

        const result = await financialDataManager.logIncome(mockIncomeInput);

        expect(result.streakCount).toBe(test.expectedNewStreak);
        expect(result.multiplier).toBe(test.expectedMultiplier);
      }
    });
  });
});