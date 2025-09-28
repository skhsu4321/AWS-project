import { AnalyticsService } from '../AnalyticsService';
import { FinancialDataManager } from '../FinancialDataManager';
import { ExpenseCategory, IncomeSource, GoalStatus } from '../../models/Financial';

// Mock the FinancialDataManager
jest.mock('../FinancialDataManager');

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockFinancialDataManager: jest.Mocked<FinancialDataManager>;

  const mockUserId = 'test-user-id';
  const mockDate = new Date('2024-01-15');

  beforeEach(() => {
    mockFinancialDataManager = new FinancialDataManager() as jest.Mocked<FinancialDataManager>;
    analyticsService = new AnalyticsService(mockFinancialDataManager);
    
    // Mock Date.now to return consistent date
    jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateFinancialTrends', () => {
    it('should generate monthly financial trends', async () => {
      // Mock financial summary data
      const mockSummary = {
        userId: mockUserId,
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalIncome: 5000,
        totalExpenses: 3000,
        netAmount: 2000,
        savingsRate: 40,
        expensesByCategory: {} as any,
        incomeBySource: {} as any,
        activeGoalsCount: 2,
        completedGoalsCount: 1,
        generatedAt: mockDate,
      };

      mockFinancialDataManager.generateFinancialSummary.mockResolvedValue(mockSummary);

      const trends = await analyticsService.generateFinancialTrends(mockUserId, 3, 'monthly');

      expect(trends).toHaveProperty('income');
      expect(trends).toHaveProperty('expenses');
      expect(trends).toHaveProperty('netAmount');
      expect(trends).toHaveProperty('savingsRate');
      
      expect(trends.income).toHaveLength(3);
      expect(trends.expenses).toHaveLength(3);
      expect(trends.netAmount).toHaveLength(3);
      expect(trends.savingsRate).toHaveLength(3);

      // Verify the data structure
      expect(trends.income[0]).toHaveProperty('period');
      expect(trends.income[0]).toHaveProperty('value');
      expect(trends.income[0]).toHaveProperty('label');
      
      expect(mockFinancialDataManager.generateFinancialSummary).toHaveBeenCalledTimes(3);
    });

    it('should generate weekly financial trends', async () => {
      const mockSummary = {
        userId: mockUserId,
        period: 'weekly' as const,
        startDate: new Date('2024-01-08'),
        endDate: new Date('2024-01-14'),
        totalIncome: 1200,
        totalExpenses: 800,
        netAmount: 400,
        savingsRate: 33.33,
        expensesByCategory: {} as any,
        incomeBySource: {} as any,
        activeGoalsCount: 1,
        completedGoalsCount: 0,
        generatedAt: mockDate,
      };

      mockFinancialDataManager.generateFinancialSummary.mockResolvedValue(mockSummary);

      const trends = await analyticsService.generateFinancialTrends(mockUserId, 4, 'weekly');

      expect(trends.income).toHaveLength(4);
      expect(trends.savingsRate[0].value).toBe(33.33);
      expect(mockFinancialDataManager.generateFinancialSummary).toHaveBeenCalledTimes(4);
    });
  });

  describe('analyzeSpendingPatterns', () => {
    it('should analyze spending patterns correctly', async () => {
      const mockExpenses = [
        {
          id: '1',
          userId: mockUserId,
          amount: 100,
          category: ExpenseCategory.FOOD,
          description: 'Groceries',
          date: new Date('2024-01-01'),
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '2',
          userId: mockUserId,
          amount: 150,
          category: ExpenseCategory.FOOD,
          description: 'Restaurant',
          date: new Date('2024-01-05'),
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '3',
          userId: mockUserId,
          amount: 200,
          category: ExpenseCategory.TRANSPORT,
          description: 'Gas',
          date: new Date('2024-01-10'),
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockFinancialDataManager.getUserExpenses.mockResolvedValue(mockExpenses);

      const patterns = await analyticsService.analyzeSpendingPatterns(mockUserId, 3);

      expect(patterns).toHaveLength(2); // Only categories with expenses
      expect(patterns[0].category).toBe(ExpenseCategory.TRANSPORT); // Highest average
      expect(patterns[0].averageAmount).toBe(200);
      expect(patterns[0].frequency).toBe(1);
      
      expect(patterns[1].category).toBe(ExpenseCategory.FOOD);
      expect(patterns[1].averageAmount).toBe(125); // (100 + 150) / 2
      expect(patterns[1].frequency).toBe(2);
      
      expect(patterns[0]).toHaveProperty('trend');
      expect(patterns[0]).toHaveProperty('recommendation');
    });

    it('should calculate trends correctly', async () => {
      // Create expenses with increasing amounts to test trend calculation
      const mockExpenses = [
        {
          id: '1',
          userId: mockUserId,
          amount: 100,
          category: ExpenseCategory.FOOD,
          description: 'Food 1',
          date: new Date('2024-01-01'),
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '2',
          userId: mockUserId,
          amount: 120,
          category: ExpenseCategory.FOOD,
          description: 'Food 2',
          date: new Date('2024-01-05'),
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '3',
          userId: mockUserId,
          amount: 140,
          category: ExpenseCategory.FOOD,
          description: 'Food 3',
          date: new Date('2024-01-10'),
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '4',
          userId: mockUserId,
          amount: 160,
          category: ExpenseCategory.FOOD,
          description: 'Food 4',
          date: new Date('2024-01-15'),
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockFinancialDataManager.getUserExpenses.mockResolvedValue(mockExpenses);

      const patterns = await analyticsService.analyzeSpendingPatterns(mockUserId, 3);

      expect(patterns[0].trend).toBe('increasing');
    });
  });

  describe('analyzeIncomePatterns', () => {
    it('should analyze income patterns correctly', async () => {
      const mockIncomes = [
        {
          id: '1',
          userId: mockUserId,
          amount: 2000,
          source: IncomeSource.SALARY,
          description: 'Monthly salary',
          date: new Date('2024-01-01'),
          isRecurring: true,
          recurringPeriod: 'monthly' as const,
          multiplier: 1.2,
          streakCount: 10,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '2',
          userId: mockUserId,
          amount: 500,
          source: IncomeSource.BONUS,
          description: 'Performance bonus',
          date: new Date('2024-01-05'),
          isRecurring: false,
          multiplier: 1.0,
          streakCount: 5,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockFinancialDataManager.getUserIncome.mockResolvedValue(mockIncomes);

      const patterns = await analyticsService.analyzeIncomePatterns(mockUserId, 3);

      expect(patterns).toHaveLength(2);
      expect(patterns[0].source).toBe(IncomeSource.SALARY); // Higher average amount
      expect(patterns[0].averageAmount).toBe(2000);
      expect(patterns[0].averageMultiplier).toBe(1.2);
      expect(patterns[0].streakPerformance).toBe('good'); // 10 days streak
      
      expect(patterns[1].source).toBe(IncomeSource.BONUS);
      expect(patterns[1].streakPerformance).toBe('needs_improvement'); // 5 days streak
    });

    it('should categorize streak performance correctly', async () => {
      const mockIncomes = [
        {
          id: '1',
          userId: mockUserId,
          amount: 1000,
          source: IncomeSource.SALARY,
          description: 'Salary',
          date: mockDate,
          isRecurring: false,
          multiplier: 1.0,
          streakCount: 15, // Excellent
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '2',
          userId: mockUserId,
          amount: 1000,
          source: IncomeSource.ALLOWANCE,
          description: 'Allowance',
          date: mockDate,
          isRecurring: false,
          multiplier: 1.0,
          streakCount: 8, // Good
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '3',
          userId: mockUserId,
          amount: 1000,
          source: IncomeSource.CHORES,
          description: 'Chores',
          date: mockDate,
          isRecurring: false,
          multiplier: 1.0,
          streakCount: 2, // Needs improvement
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockFinancialDataManager.getUserIncome.mockResolvedValue(mockIncomes);

      const patterns = await analyticsService.analyzeIncomePatterns(mockUserId, 3);

      expect(patterns.find(p => p.source === IncomeSource.SALARY)?.streakPerformance).toBe('excellent');
      expect(patterns.find(p => p.source === IncomeSource.ALLOWANCE)?.streakPerformance).toBe('good');
      expect(patterns.find(p => p.source === IncomeSource.CHORES)?.streakPerformance).toBe('needs_improvement');
    });
  });

  describe('generateExpenseBreakdown', () => {
    it('should generate expense breakdown correctly', async () => {
      const mockExpenses = [
        {
          id: '1',
          userId: mockUserId,
          amount: 300,
          category: ExpenseCategory.FOOD,
          description: 'Food',
          date: mockDate,
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '2',
          userId: mockUserId,
          amount: 200,
          category: ExpenseCategory.TRANSPORT,
          description: 'Transport',
          date: mockDate,
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: '3',
          userId: mockUserId,
          amount: 100,
          category: ExpenseCategory.ENTERTAINMENT,
          description: 'Entertainment',
          date: mockDate,
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockFinancialDataManager.getUserExpenses.mockResolvedValue(mockExpenses);

      const breakdown = await analyticsService.generateExpenseBreakdown(mockUserId);

      expect(breakdown).toHaveLength(3);
      expect(breakdown[0].category).toBe('FOOD'); // Highest amount
      expect(breakdown[0].amount).toBe(300);
      expect(breakdown[0].percentage).toBe(50); // 300/600 * 100
      
      expect(breakdown[1].category).toBe('TRANSPORT');
      expect(breakdown[1].percentage).toBeCloseTo(33.33, 1);
      
      expect(breakdown[2].category).toBe('ENTERTAINMENT');
      expect(breakdown[2].percentage).toBeCloseTo(16.67, 1);
      
      // Check that all items have colors
      breakdown.forEach(item => {
        expect(item.color).toBeDefined();
        expect(item.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should handle empty expenses', async () => {
      mockFinancialDataManager.getUserExpenses.mockResolvedValue([]);

      const breakdown = await analyticsService.generateExpenseBreakdown(mockUserId);

      expect(breakdown).toHaveLength(0);
    });
  });

  describe('calculateFinancialHealthScore', () => {
    beforeEach(() => {
      // Mock all required methods
      mockFinancialDataManager.getUserExpenses.mockResolvedValue([]);
      mockFinancialDataManager.getUserIncome.mockResolvedValue([]);
      mockFinancialDataManager.getUserSavingsGoals.mockResolvedValue([]);
      mockFinancialDataManager.getBudgetAlerts.mockResolvedValue([]);
    });

    it('should calculate health score correctly', async () => {
      const mockExpenses = [
        {
          id: '1',
          userId: mockUserId,
          amount: 1000,
          category: ExpenseCategory.FOOD,
          description: 'Food',
          date: mockDate,
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      const mockIncomes = [
        {
          id: '1',
          userId: mockUserId,
          amount: 2000,
          source: IncomeSource.SALARY,
          description: 'Salary',
          date: mockDate,
          isRecurring: false,
          multiplier: 1.5,
          streakCount: 15,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      const mockGoals = [
        {
          id: '1',
          userId: mockUserId,
          title: 'Emergency Fund',
          targetAmount: 10000,
          currentAmount: 8000, // 80% progress
          deadline: new Date('2024-12-31'),
          category: 'emergency_fund' as any,
          cropType: 'wheat',
          createdAt: mockDate,
          updatedAt: mockDate,
          status: GoalStatus.ACTIVE,
          isRecurring: false,
        },
      ];

      mockFinancialDataManager.getUserExpenses.mockResolvedValue(mockExpenses);
      mockFinancialDataManager.getUserIncome.mockResolvedValue(mockIncomes);
      mockFinancialDataManager.getUserSavingsGoals.mockResolvedValue(mockGoals);
      mockFinancialDataManager.getBudgetAlerts.mockResolvedValue([]);

      const healthScore = await analyticsService.calculateFinancialHealthScore(mockUserId);

      expect(healthScore.overall).toBeGreaterThan(0);
      expect(healthScore.overall).toBeLessThanOrEqual(100);
      
      expect(healthScore.savingsRate).toBeGreaterThan(0); // Good savings rate (50%)
      expect(healthScore.budgetAdherence).toBe(100); // No budget alerts
      expect(healthScore.goalProgress).toBeGreaterThan(0); // Good goal progress
      expect(healthScore.incomeConsistency).toBeGreaterThan(0); // Good streak
      
      expect(healthScore.breakdown).toHaveLength(4);
      expect(healthScore.breakdown[0].category).toBe('Savings Rate');
      expect(healthScore.breakdown[1].category).toBe('Budget Adherence');
      expect(healthScore.breakdown[2].category).toBe('Goal Progress');
      expect(healthScore.breakdown[3].category).toBe('Income Consistency');
    });

    it('should handle zero income correctly', async () => {
      mockFinancialDataManager.getUserExpenses.mockResolvedValue([]);
      mockFinancialDataManager.getUserIncome.mockResolvedValue([]);
      mockFinancialDataManager.getUserSavingsGoals.mockResolvedValue([]);
      mockFinancialDataManager.getBudgetAlerts.mockResolvedValue([]);

      const healthScore = await analyticsService.calculateFinancialHealthScore(mockUserId);

      expect(healthScore.savingsRate).toBe(0);
      expect(healthScore.incomeConsistency).toBe(0);
      expect(healthScore.overall).toBeLessThan(50); // Should be low with no income
    });
  });

  describe('generateInsights', () => {
    beforeEach(() => {
      // Mock all required methods for insights
      mockFinancialDataManager.getUserExpenses.mockResolvedValue([]);
      mockFinancialDataManager.getUserIncome.mockResolvedValue([]);
      mockFinancialDataManager.getUserSavingsGoals.mockResolvedValue([]);
      mockFinancialDataManager.getBudgetAlerts.mockResolvedValue([]);
    });

    it('should generate spending trend insights', async () => {
      // Mock expenses with increasing trend
      const recentExpenses = [
        {
          id: '1',
          userId: mockUserId,
          amount: 1500,
          category: ExpenseCategory.FOOD,
          description: 'Recent food',
          date: new Date('2024-01-10'),
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      const olderExpenses = [
        {
          id: '2',
          userId: mockUserId,
          amount: 1000,
          category: ExpenseCategory.FOOD,
          description: 'Older food',
          date: new Date('2023-12-10'),
          isRecurring: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      // Mock the method to return different results based on date range
      mockFinancialDataManager.getUserExpenses
        .mockResolvedValueOnce(recentExpenses) // First call for recent expenses
        .mockResolvedValueOnce(olderExpenses); // Second call for older expenses

      mockFinancialDataManager.getUserIncome.mockResolvedValue([]);
      mockFinancialDataManager.getUserSavingsGoals.mockResolvedValue([]);
      mockFinancialDataManager.getBudgetAlerts.mockResolvedValue([]);

      const insights = await analyticsService.generateInsights(mockUserId);

      const spendingInsight = insights.find(insight => insight.type === 'spending_trend');
      expect(spendingInsight).toBeDefined();
      expect(spendingInsight?.title).toContain('Spending Increased');
      expect(spendingInsight?.severity).toBe('warning');
    });

    it('should generate income streak insights', async () => {
      mockFinancialDataManager.getUserExpenses.mockResolvedValue([]);
      mockFinancialDataManager.getUserIncome.mockResolvedValue([]);
      mockFinancialDataManager.getUserSavingsGoals.mockResolvedValue([]);
      mockFinancialDataManager.getBudgetAlerts.mockResolvedValue([]);

      // Mock current streak method
      (mockFinancialDataManager as any).incomeDAO = {
        getCurrentStreak: jest.fn().mockResolvedValue(0),
      };

      const insights = await analyticsService.generateInsights(mockUserId);

      const streakInsight = insights.find(insight => insight.type === 'income_streak');
      expect(streakInsight).toBeDefined();
      expect(streakInsight?.title).toContain('Start Your Income Streak');
      expect(streakInsight?.actionable).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockFinancialDataManager.getUserExpenses.mockRejectedValue(new Error('Database error'));

      const insights = await analyticsService.generateInsights(mockUserId);

      expect(insights).toEqual([]);
    });
  });
});