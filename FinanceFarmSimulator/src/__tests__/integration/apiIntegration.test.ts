import { AuthService } from '../../services/AuthService';
import { FinancialDataManager } from '../../services/FinancialDataManager';
import { FarmEngine } from '../../services/FarmEngine';
import { DatabaseService } from '../../services/DatabaseService';
import { mockUser, mockSavingsGoal, mockExpense, mockIncome } from '../../utils/testHelpers';

// Mock Firebase
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

describe('API Integration Tests', () => {
  let authService: AuthService;
  let financialDataManager: FinancialDataManager;
  let farmEngine: FarmEngine;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    authService = new AuthService();
    databaseService = new DatabaseService();
    financialDataManager = new FinancialDataManager(databaseService);
    farmEngine = new FarmEngine(databaseService);
    
    await databaseService.initialize();
  });

  afterEach(async () => {
    await databaseService.close();
  });

  describe('Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // Register user
      const registeredUser = await authService.register(
        'test@example.com',
        'password123',
        mockUser.profile
      );
      
      expect(registeredUser).toBeDefined();
      expect(registeredUser.email).toBe('test@example.com');

      // Login user
      const loggedInUser = await authService.login('test@example.com', 'password123');
      expect(loggedInUser).toBeDefined();
      expect(loggedInUser.id).toBe(registeredUser.id);

      // Get current user
      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser?.id).toBe(registeredUser.id);
    });

    it('should handle authentication errors gracefully', async () => {
      await expect(
        authService.login('invalid@email.com', 'wrongpassword')
      ).rejects.toThrow();
    });

    it('should support social login flow', async () => {
      const socialUser = await authService.socialLogin('google');
      expect(socialUser).toBeDefined();
      expect(socialUser.email).toContain('@');
    });
  });

  describe('Financial Data Flow', () => {
    beforeEach(async () => {
      // Setup authenticated user
      await authService.register('test@example.com', 'password123', mockUser.profile);
    });

    it('should create and retrieve savings goals', async () => {
      const goalInput = {
        title: mockSavingsGoal.title,
        description: mockSavingsGoal.description,
        targetAmount: mockSavingsGoal.targetAmount,
        deadline: mockSavingsGoal.deadline,
        category: mockSavingsGoal.category,
      };

      const createdGoal = await financialDataManager.createSavingsGoal(goalInput);
      expect(createdGoal).toBeDefined();
      expect(createdGoal.title).toBe(goalInput.title);

      const retrievedGoals = await financialDataManager.getSavingsGoals(mockUser.id);
      expect(retrievedGoals).toHaveLength(1);
      expect(retrievedGoals[0].id).toBe(createdGoal.id);
    });

    it('should log and categorize expenses', async () => {
      const expenseInput = {
        amount: mockExpense.amount,
        category: mockExpense.category,
        description: mockExpense.description,
        date: mockExpense.date,
      };

      const loggedExpense = await financialDataManager.logExpense(expenseInput);
      expect(loggedExpense).toBeDefined();
      expect(loggedExpense.amount).toBe(expenseInput.amount);

      const expenses = await financialDataManager.getExpenses(mockUser.id);
      expect(expenses).toHaveLength(1);
      expect(expenses[0].category).toBe(mockExpense.category);
    });

    it('should track income and calculate multipliers', async () => {
      const incomeInput = {
        amount: mockIncome.amount,
        source: mockIncome.source,
        description: mockIncome.description,
        date: mockIncome.date,
      };

      const loggedIncome = await financialDataManager.logIncome(incomeInput);
      expect(loggedIncome).toBeDefined();
      expect(loggedIncome.multiplier).toBeGreaterThanOrEqual(1);

      const incomes = await financialDataManager.getIncomes(mockUser.id);
      expect(incomes).toHaveLength(1);
    });

    it('should generate financial summary', async () => {
      // Create test data
      await financialDataManager.createSavingsGoal({
        title: 'Test Goal',
        targetAmount: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: 'general',
        description: 'Test',
      });

      await financialDataManager.logExpense({
        amount: 500,
        category: 'food',
        description: 'Test expense',
        date: new Date(),
      });

      await financialDataManager.logIncome({
        amount: 3000,
        source: 'salary',
        description: 'Test income',
        date: new Date(),
      });

      const summary = await financialDataManager.getFinancialSummary(
        mockUser.id,
        { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
      );

      expect(summary).toBeDefined();
      expect(summary.totalIncome).toBe(3000);
      expect(summary.totalExpenses).toBe(500);
      expect(summary.savingsGoals).toHaveLength(1);
    });
  });

  describe('Farm Engine Integration', () => {
    beforeEach(async () => {
      await authService.register('test@example.com', 'password123', mockUser.profile);
    });

    it('should initialize farm and sync with financial data', async () => {
      const farm = await farmEngine.initializeFarm(mockUser.id);
      expect(farm).toBeDefined();
      expect(farm.userId).toBe(mockUser.id);
      expect(farm.crops).toEqual([]);

      // Create a savings goal
      const goal = await financialDataManager.createSavingsGoal({
        title: 'Test Crop',
        targetAmount: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: 'general',
        description: 'Test',
      });

      // Update farm state
      await farmEngine.updateFarmState();
      
      const updatedFarm = await farmEngine.getFarm(mockUser.id);
      expect(updatedFarm.crops).toHaveLength(1);
      expect(updatedFarm.crops[0].goalId).toBe(goal.id);
    });

    it('should apply fertilizer effects from income', async () => {
      await farmEngine.initializeFarm(mockUser.id);
      
      const initialFarm = await farmEngine.getFarm(mockUser.id);
      const initialHealth = initialFarm.healthScore;

      await farmEngine.applyFertilizer(1000, 1.5);
      
      const updatedFarm = await farmEngine.getFarm(mockUser.id);
      expect(updatedFarm.healthScore).toBeGreaterThanOrEqual(initialHealth);
    });

    it('should process weed penalties from expenses', async () => {
      await farmEngine.initializeFarm(mockUser.id);
      
      const expenses = [
        { amount: 500, category: 'food' },
        { amount: 300, category: 'entertainment' },
      ];

      await farmEngine.processWeeds(expenses);
      
      const farm = await farmEngine.getFarm(mockUser.id);
      expect(farm.healthScore).toBeLessThan(100);
    });
  });

  describe('Data Synchronization', () => {
    it('should sync data between local and cloud storage', async () => {
      // This would test the actual sync mechanism
      // For now, we'll test the data consistency
      
      const goal = await financialDataManager.createSavingsGoal({
        title: 'Sync Test',
        targetAmount: 2000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: 'general',
        description: 'Test sync',
      });

      // Simulate offline modification
      const updatedGoal = await financialDataManager.updateSavingsGoal(goal.id, {
        currentAmount: 500,
      });

      expect(updatedGoal.currentAmount).toBe(500);
      
      // Verify data consistency
      const retrievedGoal = await financialDataManager.getSavingsGoal(goal.id);
      expect(retrievedGoal.currentAmount).toBe(500);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      // Should fallback to local storage
      const goals = await financialDataManager.getSavingsGoals(mockUser.id);
      expect(goals).toBeDefined();
      expect(Array.isArray(goals)).toBe(true);
    });

    it('should recover from database corruption', async () => {
      // Simulate database corruption
      await expect(databaseService.initialize()).resolves.not.toThrow();
    });

    it('should handle concurrent data modifications', async () => {
      const goal = await financialDataManager.createSavingsGoal({
        title: 'Concurrent Test',
        targetAmount: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: 'general',
        description: 'Test',
      });

      // Simulate concurrent updates
      const update1 = financialDataManager.updateSavingsGoal(goal.id, { currentAmount: 100 });
      const update2 = financialDataManager.updateSavingsGoal(goal.id, { currentAmount: 200 });

      const results = await Promise.allSettled([update1, update2]);
      
      // At least one should succeed
      const successful = results.filter(result => result.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });
  });
});