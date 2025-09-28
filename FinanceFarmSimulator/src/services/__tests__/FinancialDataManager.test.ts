import { FinancialDataManager, BudgetThreshold, TimePeriod } from '../FinancialDataManager';
import { 
  SavingsGoalInput, 
  ExpenseInput, 
  IncomeInput, 
  GoalCategory, 
  GoalStatus,
  ExpenseCategory, 
  IncomeSource 
} from '../../models/Financial';
import { SavingsGoalDAO } from '../dao/SavingsGoalDAO';
import { ExpenseDAO } from '../dao/ExpenseDAO';
import { IncomeDAO } from '../dao/IncomeDAO';

// Mock the DAOs
jest.mock('../dao/SavingsGoalDAO');
jest.mock('../dao/ExpenseDAO');
jest.mock('../dao/IncomeDAO');

const MockedSavingsGoalDAO = SavingsGoalDAO as jest.MockedClass<typeof SavingsGoalDAO>;
const MockedExpenseDAO = ExpenseDAO as jest.MockedClass<typeof ExpenseDAO>;
const MockedIncomeDAO = IncomeDAO as jest.MockedClass<typeof IncomeDAO>;

describe('FinancialDataManager', () => {
  let financialManager: FinancialDataManager;
  let mockSavingsGoalDAO: jest.Mocked<SavingsGoalDAO>;
  let mockExpenseDAO: jest.Mocked<ExpenseDAO>;
  let mockIncomeDAO: jest.Mocked<IncomeDAO>;

  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const testDate = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSavingsGoalDAO = new MockedSavingsGoalDAO() as jest.Mocked<SavingsGoalDAO>;
    mockExpenseDAO = new MockedExpenseDAO() as jest.Mocked<ExpenseDAO>;
    mockIncomeDAO = new MockedIncomeDAO() as jest.Mocked<IncomeDAO>;
    
    financialManager = new FinancialDataManager();
    
    // Replace the private instances with mocks
    (financialManager as any).savingsGoalDAO = mockSavingsGoalDAO;
    (financialManager as any).expenseDAO = mockExpenseDAO;
    (financialManager as any).incomeDAO = mockIncomeDAO;
  });

  describe('Savings Goal Management', () => {
    const mockGoalInput: SavingsGoalInput = {
      userId: testUserId,
      title: 'Test Goal',
      description: 'Test Description',
      targetAmount: 1000,
      deadline: new Date('2024-12-31'),
      category: GoalCategory.VACATION,
      cropType: 'tomato',
      status: GoalStatus.ACTIVE,
      isRecurring: false,
    };

    const mockGoal = {
      ...mockGoalInput,
      id: 'goal-id',
      currentAmount: 0,
      createdAt: testDate,
      updatedAt: testDate,
    };

    it('should create a savings goal successfully', async () => {
      mockSavingsGoalDAO.create.mockResolvedValue(mockGoal);

      const result = await financialManager.createSavingsGoal(mockGoalInput);

      expect(mockSavingsGoalDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockGoalInput,
          id: expect.any(String),
          currentAmount: 0,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toEqual(mockGoal);
    });

    it('should update a savings goal successfully', async () => {
      const updates = { title: 'Updated Goal' };
      const updatedGoal = { ...mockGoal, ...updates };
      
      mockSavingsGoalDAO.update.mockResolvedValue(updatedGoal);

      const result = await financialManager.updateSavingsGoal('goal-id', updates);

      expect(mockSavingsGoalDAO.update).toHaveBeenCalledWith(
        'goal-id',
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toEqual(updatedGoal);
    });

    it('should update goal progress and mark as completed when target is reached', async () => {
      const goalWithProgress = { ...mockGoal, currentAmount: 900 };
      const completedGoal = { ...goalWithProgress, currentAmount: 1000, status: GoalStatus.COMPLETED };
      
      mockSavingsGoalDAO.updateProgress.mockResolvedValue(completedGoal);
      mockSavingsGoalDAO.markAsCompleted.mockResolvedValue(completedGoal);
      mockSavingsGoalDAO.findById.mockResolvedValue(completedGoal);

      const result = await financialManager.updateGoalProgress('goal-id', 100);

      expect(mockSavingsGoalDAO.updateProgress).toHaveBeenCalledWith('goal-id', 100);
      expect(mockSavingsGoalDAO.markAsCompleted).toHaveBeenCalledWith('goal-id');
      expect(result).toEqual(completedGoal);
    });

    it('should get user savings goals by status', async () => {
      const mockGoals = [mockGoal];
      mockSavingsGoalDAO.findByStatus.mockResolvedValue(mockGoals);

      const result = await financialManager.getUserSavingsGoals(testUserId, GoalStatus.ACTIVE);

      expect(mockSavingsGoalDAO.findByStatus).toHaveBeenCalledWith(testUserId, GoalStatus.ACTIVE);
      expect(result).toEqual(mockGoals);
    });

    it('should handle errors when creating savings goal', async () => {
      mockSavingsGoalDAO.create.mockRejectedValue(new Error('Database error'));

      await expect(financialManager.createSavingsGoal(mockGoalInput))
        .rejects.toThrow('Failed to create savings goal');
    });
  });

  describe('Expense Management', () => {
    const mockExpenseInput: ExpenseInput = {
      userId: testUserId,
      amount: 50,
      category: ExpenseCategory.FOOD,
      description: 'Lunch',
      date: testDate,
      isRecurring: false,
      tags: ['restaurant'],
    };

    const mockExpense = {
      ...mockExpenseInput,
      id: 'expense-id',
      createdAt: testDate,
      updatedAt: testDate,
    };

    it('should log an expense successfully', async () => {
      mockExpenseDAO.create.mockResolvedValue(mockExpense);

      const result = await financialManager.logExpense(mockExpenseInput);

      expect(mockExpenseDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockExpenseInput,
          id: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toEqual(mockExpense);
    });

    it('should get expenses by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockExpenses = [mockExpense];
      
      mockExpenseDAO.findByDateRange.mockResolvedValue(mockExpenses);

      const result = await financialManager.getUserExpenses(testUserId, startDate, endDate);

      expect(mockExpenseDAO.findByDateRange).toHaveBeenCalledWith(testUserId, startDate, endDate);
      expect(result).toEqual(mockExpenses);
    });

    it('should get expenses by category', async () => {
      const mockExpenses = [mockExpense];
      mockExpenseDAO.findByCategory.mockResolvedValue(mockExpenses);

      const result = await financialManager.getExpensesByCategory(testUserId, ExpenseCategory.FOOD);

      expect(mockExpenseDAO.findByCategory).toHaveBeenCalledWith(testUserId, ExpenseCategory.FOOD);
      expect(result).toEqual(mockExpenses);
    });

    it('should handle errors when logging expense', async () => {
      mockExpenseDAO.create.mockRejectedValue(new Error('Database error'));

      await expect(financialManager.logExpense(mockExpenseInput))
        .rejects.toThrow('Failed to log expense');
    });
  });

  describe('Income Management', () => {
    const mockIncomeInput: IncomeInput = {
      userId: testUserId,
      amount: 100,
      source: IncomeSource.SALARY,
      description: 'Weekly salary',
      date: testDate,
      isRecurring: true,
      recurringPeriod: 'weekly',
    };

    const mockIncome = {
      ...mockIncomeInput,
      id: 'income-id',
      multiplier: 1.5,
      streakCount: 5,
      createdAt: testDate,
      updatedAt: testDate,
    };

    it('should log income with streak calculation', async () => {
      mockIncomeDAO.getCurrentStreak.mockResolvedValue(4);
      mockIncomeDAO.create.mockResolvedValue(mockIncome);

      const result = await financialManager.logIncome(mockIncomeInput);

      expect(mockIncomeDAO.getCurrentStreak).toHaveBeenCalledWith(testUserId);
      expect(mockIncomeDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockIncomeInput,
          id: expect.any(String),
          multiplier: expect.any(Number),
          streakCount: 5,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toEqual(mockIncome);
    });

    it('should get income by source', async () => {
      const mockIncomes = [mockIncome];
      mockIncomeDAO.findBySource.mockResolvedValue(mockIncomes);

      const result = await financialManager.getIncomeBySource(testUserId, IncomeSource.SALARY);

      expect(mockIncomeDAO.findBySource).toHaveBeenCalledWith(testUserId, IncomeSource.SALARY);
      expect(result).toEqual(mockIncomes);
    });

    it('should calculate fertilizer effect based on streak', async () => {
      mockIncomeDAO.getCurrentStreak.mockResolvedValue(10);

      const result = await financialManager.calculateFertilizerEffect(testUserId, 100);

      expect(mockIncomeDAO.getCurrentStreak).toHaveBeenCalledWith(testUserId);
      expect(result).toBeGreaterThan(100); // Should be boosted by multiplier
    });
  });

  describe('Budget Threshold Management', () => {
    const mockThresholds: BudgetThreshold[] = [
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

    it('should set and get budget thresholds', () => {
      financialManager.setBudgetThresholds(testUserId, mockThresholds);
      
      const result = financialManager.getBudgetThresholds(testUserId);
      
      expect(result).toEqual(mockThresholds);
    });

    it('should generate budget alerts when thresholds are exceeded', async () => {
      financialManager.setBudgetThresholds(testUserId, mockThresholds);
      
      // Mock spending that exceeds warning threshold
      mockExpenseDAO.getTotalForPeriod.mockResolvedValue(420); // 84% of 500 limit

      const alerts = await financialManager.getBudgetAlerts(testUserId);

      expect(alerts).toHaveLength(2); // One for each category
      expect(alerts[0]).toMatchObject({
        category: ExpenseCategory.FOOD,
        currentSpending: 420,
        limit: 500,
        severity: 'warning',
      });
    });
  });

  describe('Financial Summary and Analytics', () => {
    const mockPeriod: TimePeriod = {
      type: 'monthly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should generate comprehensive financial summary', async () => {
      const mockExpenses = [
        { 
          id: '1', 
          userId: testUserId,
          amount: 100, 
          category: ExpenseCategory.FOOD,
          description: 'Test expense 1',
          date: testDate,
          isRecurring: false,
          tags: [],
          createdAt: testDate,
          updatedAt: testDate,
        },
        { 
          id: '2', 
          userId: testUserId,
          amount: 50, 
          category: ExpenseCategory.TRANSPORT,
          description: 'Test expense 2',
          date: testDate,
          isRecurring: false,
          tags: [],
          createdAt: testDate,
          updatedAt: testDate,
        },
      ];
      const mockIncomes = [
        { 
          id: '1', 
          userId: testUserId,
          amount: 200, 
          multiplier: 1.2, 
          source: IncomeSource.SALARY,
          description: 'Test income',
          date: testDate,
          isRecurring: false,
          streakCount: 1,
          createdAt: testDate,
          updatedAt: testDate,
        },
      ];
      const mockGoals = [
        { 
          id: 'goal-1',
          userId: testUserId,
          title: 'Test Goal 1',
          targetAmount: 1000,
          currentAmount: 500,
          deadline: new Date('2024-12-31'),
          category: GoalCategory.VACATION,
          cropType: 'tomato',
          status: GoalStatus.ACTIVE,
          isRecurring: false,
          createdAt: testDate,
          updatedAt: testDate,
        },
        { 
          id: 'goal-2',
          userId: testUserId,
          title: 'Test Goal 2',
          targetAmount: 500,
          currentAmount: 500,
          deadline: new Date('2024-12-31'),
          category: GoalCategory.EDUCATION,
          cropType: 'carrot',
          status: GoalStatus.COMPLETED,
          isRecurring: false,
          createdAt: testDate,
          updatedAt: testDate,
        },
      ];

      mockExpenseDAO.findByDateRange.mockResolvedValue(mockExpenses as any);
      mockIncomeDAO.findByDateRange.mockResolvedValue(mockIncomes as any);
      mockSavingsGoalDAO.findByUserId.mockResolvedValue(mockGoals as any);

      const summary = await financialManager.generateFinancialSummary(testUserId, mockPeriod);

      expect(summary).toMatchObject({
        userId: testUserId,
        period: 'monthly',
        totalExpenses: 150,
        totalIncome: 240, // 200 * 1.2
        netAmount: 90,
        activeGoalsCount: 1,
        completedGoalsCount: 1,
      });
      expect(summary.expensesByCategory[ExpenseCategory.FOOD]).toBe(100);
      expect(summary.incomeBySource[IncomeSource.SALARY]).toBe(240);
    });

    it('should generate financial insights', async () => {
      // Mock data for insights
      mockExpenseDAO.findByDateRange
        .mockResolvedValueOnce([{ amount: 300 } as any]) // Recent expenses
        .mockResolvedValueOnce([{ amount: 200 } as any]); // Older expenses
      
      mockIncomeDAO.findByDateRange.mockResolvedValue([]);
      mockIncomeDAO.getCurrentStreak.mockResolvedValue(10);
      mockSavingsGoalDAO.findActiveByUserId.mockResolvedValue([]);

      const insights = await financialManager.getFinancialInsights(testUserId);

      expect(insights).toContainEqual(
        expect.objectContaining({
          type: 'spending_trend',
          title: 'Spending Increased',
          severity: 'warning',
        })
      );
      expect(insights).toContainEqual(
        expect.objectContaining({
          type: 'income_streak',
          title: 'Great Income Streak!',
          severity: 'success',
        })
      );
    });

    it('should get top expense categories', async () => {
      const mockCategoryTotals: Record<ExpenseCategory, number> = {
        [ExpenseCategory.FOOD]: 300,
        [ExpenseCategory.TRANSPORT]: 150,
        [ExpenseCategory.ENTERTAINMENT]: 100,
        [ExpenseCategory.SHOPPING]: 0,
        [ExpenseCategory.UTILITIES]: 0,
        [ExpenseCategory.HEALTHCARE]: 0,
        [ExpenseCategory.EDUCATION]: 0,
        [ExpenseCategory.OTHER]: 0,
      };
      
      mockExpenseDAO.getTotalByCategory.mockResolvedValue(mockCategoryTotals);

      const topCategories = await financialManager.getTopExpenseCategories(testUserId, 3);

      expect(topCategories).toHaveLength(3);
      expect(topCategories[0]).toMatchObject({
        category: ExpenseCategory.FOOD,
        amount: 300,
        percentage: expect.closeTo(54.5, 1), // 300/550 * 100
      });
    });

    it('should get savings goal progress', async () => {
      const mockActiveGoals = [
        {
          id: 'goal-1',
          title: 'Vacation Fund',
          currentAmount: 500,
          targetAmount: 1000,
        },
        {
          id: 'goal-2',
          title: 'Emergency Fund',
          currentAmount: 200,
          targetAmount: 500,
        },
      ];
      
      mockSavingsGoalDAO.findActiveByUserId.mockResolvedValue(mockActiveGoals as any);

      const progress = await financialManager.getSavingsGoalProgress(testUserId);

      expect(progress).toHaveLength(2);
      expect(progress[0]).toMatchObject({
        goalId: 'goal-1',
        title: 'Vacation Fund',
        progress: 50,
        daysToGoal: expect.any(Number),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully in financial summary', async () => {
      mockExpenseDAO.findByDateRange.mockRejectedValue(new Error('Database error'));

      const mockPeriod: TimePeriod = {
        type: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      await expect(financialManager.generateFinancialSummary(testUserId, mockPeriod))
        .rejects.toThrow('Failed to generate financial summary');
    });

    it('should return empty insights array on error', async () => {
      mockExpenseDAO.findByDateRange.mockRejectedValue(new Error('Database error'));

      const insights = await financialManager.getFinancialInsights(testUserId);

      expect(insights).toEqual([]);
    });
  });

  describe('Validation', () => {
    it('should validate savings goal input', async () => {
      const invalidInput = {
        userId: testUserId,
        title: 'Test Goal',
        targetAmount: -100, // Invalid negative amount
        deadline: new Date('2024-12-31'),
        category: GoalCategory.VACATION,
        cropType: 'tomato',
        status: GoalStatus.ACTIVE,
        isRecurring: false,
      };

      await expect(financialManager.createSavingsGoal(invalidInput as any))
        .rejects.toThrow();
    });

    it('should validate expense input', async () => {
      const invalidInput = {
        userId: testUserId,
        amount: 0, // Invalid zero amount
        category: ExpenseCategory.FOOD,
        description: 'Test',
        date: testDate,
        isRecurring: false,
        tags: [],
      };

      await expect(financialManager.logExpense(invalidInput as any))
        .rejects.toThrow();
    });

    it('should validate income input', async () => {
      const invalidInput = {
        userId: testUserId,
        amount: -50, // Invalid negative amount
        source: IncomeSource.SALARY,
        description: 'Test',
        date: testDate,
        isRecurring: false,
      };

      await expect(financialManager.logIncome(invalidInput as any))
        .rejects.toThrow();
    });
  });
});