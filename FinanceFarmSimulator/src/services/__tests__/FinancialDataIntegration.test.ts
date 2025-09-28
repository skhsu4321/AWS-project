import { FinancialDataManager, BudgetThreshold, TimePeriod } from '../FinancialDataManager';
import { DatabaseService } from '../DatabaseService';
import { 
  SavingsGoalInput, 
  ExpenseInput, 
  IncomeInput, 
  GoalCategory, 
  GoalStatus,
  ExpenseCategory, 
  IncomeSource 
} from '../../models/Financial';

describe('FinancialDataManager Integration Tests', () => {
  let financialManager: FinancialDataManager;
  let dbService: DatabaseService;
  
  const testUserId = 'integration-test-user';

  beforeAll(async () => {
    // Initialize database service for testing
    dbService = DatabaseService.getInstance();
    await dbService.initializeDatabase();
    
    financialManager = new FinancialDataManager();
  });

  afterAll(async () => {
    // Clean up test data
    await dbService.closeDatabase();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await dbService.runQuery('DELETE FROM savings_goals WHERE user_id = ?', [testUserId]);
    await dbService.runQuery('DELETE FROM expenses WHERE user_id = ?', [testUserId]);
    await dbService.runQuery('DELETE FROM income WHERE user_id = ?', [testUserId]);
  });

  describe('End-to-End Financial Workflow', () => {
    it('should handle complete financial management workflow', async () => {
      // Step 1: Create savings goals
      const goalInput: SavingsGoalInput = {
        userId: testUserId,
        title: 'Vacation Fund',
        description: 'Save for summer vacation',
        targetAmount: 2000,
        deadline: new Date('2024-12-31'),
        category: GoalCategory.VACATION,
        cropType: 'sunflower',
        status: GoalStatus.ACTIVE,
        isRecurring: false,
      };

      const createdGoal = await financialManager.createSavingsGoal(goalInput);
      expect(createdGoal.id).toBeDefined();
      expect(createdGoal.currentAmount).toBe(0);

      // Step 2: Log income with streak building
      const incomeInput: IncomeInput = {
        userId: testUserId,
        amount: 500,
        source: IncomeSource.SALARY,
        description: 'Weekly salary',
        date: new Date(),
        isRecurring: true,
        recurringPeriod: 'weekly',
      };

      const income1 = await financialManager.logIncome(incomeInput);
      expect(income1.streakCount).toBe(1);
      expect(income1.multiplier).toBeCloseTo(1.1);

      // Log another income to build streak
      const income2 = await financialManager.logIncome({
        ...incomeInput,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
      });
      expect(income2.streakCount).toBe(2);
      expect(income2.multiplier).toBeCloseTo(1.2);

      // Step 3: Log expenses
      const expenseInput: ExpenseInput = {
        userId: testUserId,
        amount: 150,
        category: ExpenseCategory.FOOD,
        description: 'Groceries',
        date: new Date(),
        isRecurring: false,
        tags: ['grocery', 'weekly'],
      };

      const expense = await financialManager.logExpense(expenseInput);
      expect(expense.id).toBeDefined();

      // Step 4: Update goal progress
      const updatedGoal = await financialManager.updateGoalProgress(createdGoal.id, 300);
      expect(updatedGoal?.currentAmount).toBe(300);

      // Step 5: Generate financial summary
      const period: TimePeriod = {
        type: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 0, 31),
      };

      const summary = await financialManager.generateFinancialSummary(testUserId, period);
      expect(summary.totalIncome).toBeGreaterThan(0);
      expect(summary.totalExpenses).toBe(150);
      expect(summary.activeGoalsCount).toBe(1);
      expect(summary.expensesByCategory[ExpenseCategory.FOOD]).toBe(150);

      // Step 6: Get financial insights
      const insights = await financialManager.getFinancialInsights(testUserId);
      expect(insights.length).toBeGreaterThan(0);
      
      // Should have income streak insight
      const streakInsight = insights.find(i => i.type === 'income_streak');
      expect(streakInsight).toBeDefined();
    });

    it('should handle budget threshold monitoring', async () => {
      // Set budget thresholds
      const thresholds: BudgetThreshold[] = [
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

      // Log expenses that approach threshold
      await financialManager.logExpense({
        userId: testUserId,
        amount: 200,
        category: ExpenseCategory.FOOD,
        description: 'Groceries week 1',
        date: new Date(),
        isRecurring: false,
        tags: [],
      });

      await financialManager.logExpense({
        userId: testUserId,
        amount: 220,
        category: ExpenseCategory.FOOD,
        description: 'Groceries week 2',
        date: new Date(),
        isRecurring: false,
        tags: [],
      });

      // Check budget alerts
      const alerts = await financialManager.getBudgetAlerts(testUserId);
      expect(alerts.length).toBeGreaterThan(0);
      
      const foodAlert = alerts.find(a => a.category === ExpenseCategory.FOOD);
      expect(foodAlert).toBeDefined();
      expect(foodAlert?.currentSpending).toBe(420);
      expect(foodAlert?.percentage).toBeCloseTo(84);
      expect(foodAlert?.severity).toBe('warning');
    });

    it('should complete goal when target is reached', async () => {
      // Create a small goal for easy completion
      const goalInput: SavingsGoalInput = {
        userId: testUserId,
        title: 'Small Goal',
        targetAmount: 100,
        deadline: new Date('2024-12-31'),
        category: GoalCategory.OTHER,
        cropType: 'carrot',
        status: GoalStatus.ACTIVE,
        isRecurring: false,
      };

      const goal = await financialManager.createSavingsGoal(goalInput);

      // Add progress that reaches the target
      const updatedGoal = await financialManager.updateGoalProgress(goal.id, 100);
      
      expect(updatedGoal?.currentAmount).toBe(100);
      expect(updatedGoal?.status).toBe(GoalStatus.COMPLETED);
    });

    it('should calculate fertilizer effects correctly', async () => {
      // Log income to build streak
      await financialManager.logIncome({
        userId: testUserId,
        amount: 100,
        source: IncomeSource.SALARY,
        description: 'Day 1',
        date: new Date(),
        isRecurring: false,
      });

      await financialManager.logIncome({
        userId: testUserId,
        amount: 100,
        source: IncomeSource.SALARY,
        description: 'Day 2',
        date: new Date(),
        isRecurring: false,
      });

      // Calculate fertilizer effect
      const fertilizerEffect = await financialManager.calculateFertilizerEffect(testUserId, 100);
      
      // Should be boosted by streak multiplier
      expect(fertilizerEffect).toBeGreaterThan(100);
      expect(fertilizerEffect).toBeCloseTo(120); // 100 * 1.2 multiplier
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate input data and reject invalid entries', async () => {
      // Test invalid savings goal
      const invalidGoal = {
        userId: testUserId,
        title: '', // Empty title should fail
        targetAmount: -100, // Negative amount should fail
        deadline: new Date('2024-12-31'),
        category: GoalCategory.VACATION,
        cropType: 'sunflower',
        status: GoalStatus.ACTIVE,
        isRecurring: false,
      };

      await expect(financialManager.createSavingsGoal(invalidGoal as any))
        .rejects.toThrow();

      // Test invalid expense
      const invalidExpense = {
        userId: testUserId,
        amount: 0, // Zero amount should fail
        category: ExpenseCategory.FOOD,
        description: 'Test',
        date: new Date(),
        isRecurring: false,
        tags: [],
      };

      await expect(financialManager.logExpense(invalidExpense as any))
        .rejects.toThrow();

      // Test invalid income
      const invalidIncome = {
        userId: testUserId,
        amount: -50, // Negative amount should fail
        source: IncomeSource.SALARY,
        description: 'Test',
        date: new Date(),
        isRecurring: false,
      };

      await expect(financialManager.logIncome(invalidIncome as any))
        .rejects.toThrow();
    });

    it('should maintain data consistency across operations', async () => {
      // Create goal
      const goal = await financialManager.createSavingsGoal({
        userId: testUserId,
        title: 'Consistency Test',
        targetAmount: 1000,
        deadline: new Date('2024-12-31'),
        category: GoalCategory.EDUCATION,
        cropType: 'wheat',
        status: GoalStatus.ACTIVE,
        isRecurring: false,
      });

      // Update progress multiple times
      await financialManager.updateGoalProgress(goal.id, 100);
      await financialManager.updateGoalProgress(goal.id, 200);
      await financialManager.updateGoalProgress(goal.id, 150);

      // Verify final state
      const finalGoal = await financialManager.getSavingsGoalById(goal.id);
      expect(finalGoal?.currentAmount).toBe(450);
      expect(finalGoal?.status).toBe(GoalStatus.ACTIVE);
    });
  });

  describe('Analytics and Reporting', () => {
    it('should generate accurate analytics over time', async () => {
      // Create test data spanning multiple months
      const baseDate = new Date('2024-01-01');
      
      // January data
      await financialManager.logIncome({
        userId: testUserId,
        amount: 1000,
        source: IncomeSource.SALARY,
        description: 'January salary',
        date: new Date('2024-01-15'),
        isRecurring: false,
      });

      await financialManager.logExpense({
        userId: testUserId,
        amount: 300,
        category: ExpenseCategory.FOOD,
        description: 'January groceries',
        date: new Date('2024-01-10'),
        isRecurring: false,
        tags: [],
      });

      // February data
      await financialManager.logIncome({
        userId: testUserId,
        amount: 1200,
        source: IncomeSource.SALARY,
        description: 'February salary',
        date: new Date('2024-02-15'),
        isRecurring: false,
      });

      await financialManager.logExpense({
        userId: testUserId,
        amount: 400,
        category: ExpenseCategory.FOOD,
        description: 'February groceries',
        date: new Date('2024-02-10'),
        isRecurring: false,
        tags: [],
      });

      // Get spending trends
      const spendingTrends = await financialManager.getSpendingTrends(testUserId, 6);
      expect(spendingTrends.length).toBeGreaterThan(0);

      // Get income trends
      const incomeTrends = await financialManager.getIncomeTrends(testUserId, 6);
      expect(incomeTrends.length).toBeGreaterThan(0);

      // Get top expense categories
      const topCategories = await financialManager.getTopExpenseCategories(testUserId, 5);
      expect(topCategories.length).toBeGreaterThan(0);
      expect(topCategories[0].category).toBe(ExpenseCategory.FOOD);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database errors gracefully', async () => {
      // Test with non-existent goal ID
      const result = await financialManager.updateGoalProgress('non-existent-id', 100);
      expect(result).toBeNull();

      // Test deleting non-existent records
      const deleteResult = await financialManager.deleteSavingsGoal('non-existent-id');
      expect(deleteResult).toBe(false);
    });

    it('should maintain streak consistency', async () => {
      // Log income entries
      const income1 = await financialManager.logIncome({
        userId: testUserId,
        amount: 100,
        source: IncomeSource.SALARY,
        description: 'Day 1',
        date: new Date('2024-01-01'),
        isRecurring: false,
      });

      const income2 = await financialManager.logIncome({
        userId: testUserId,
        amount: 100,
        source: IncomeSource.SALARY,
        description: 'Day 2',
        date: new Date('2024-01-02'),
        isRecurring: false,
      });

      expect(income1.streakCount).toBe(1);
      expect(income2.streakCount).toBe(2);

      // Reset streak
      await financialManager.resetIncomeStreak(testUserId);

      // Next income should start fresh
      const income3 = await financialManager.logIncome({
        userId: testUserId,
        amount: 100,
        source: IncomeSource.SALARY,
        description: 'After reset',
        date: new Date('2024-01-03'),
        isRecurring: false,
      });

      expect(income3.streakCount).toBe(1);
    });
  });
});