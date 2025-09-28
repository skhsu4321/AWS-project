import { DatabaseService } from '../DatabaseService';
import { UserDAO, SavingsGoalDAO, ExpenseDAO } from '../dao';
import { UserMode, Currency } from '../../models/User';
import { GoalCategory, GoalStatus, ExpenseCategory } from '../../models/Financial';

describe('DAO Tests', () => {
  let databaseService: DatabaseService;
  let userDAO: UserDAO;
  let savingsGoalDAO: SavingsGoalDAO;
  let expenseDAO: ExpenseDAO;

  beforeAll(async () => {
    databaseService = DatabaseService.getInstance();
    await databaseService.initialize();
    
    userDAO = new UserDAO();
    savingsGoalDAO = new SavingsGoalDAO();
    expenseDAO = new ExpenseDAO();
  });

  afterAll(async () => {
    // Skip close in tests since we're using mocks
  });

  describe('UserDAO', () => {
    it('should have proper mapping methods', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        profile: {
          displayName: 'Test User',
          age: 25,
          mode: UserMode.ADULT,
          currency: Currency.HKD,
          timezone: 'Asia/Hong_Kong',
          preferences: {
            theme: 'auto' as const,
            notifications: true,
            language: 'en',
            soundEnabled: true,
            hapticFeedback: true,
          },
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: false,
        isActive: true,
      };

      // Test mapEntityToRow
      const row = (userDAO as any).mapEntityToRow(mockUser);
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('email');
      expect(row).toHaveProperty('profile');
      expect(row.id).toBe(mockUser.id);
      expect(row.email).toBe(mockUser.email);
    });
  });

  describe('SavingsGoalDAO', () => {
    it('should have proper mapping methods', () => {
      const mockGoal = {
        id: 'goal-123',
        userId: 'user-123',
        title: 'Vacation Fund',
        description: 'Save for summer vacation',
        targetAmount: 5000,
        currentAmount: 1000,
        deadline: new Date('2024-12-31'),
        category: GoalCategory.VACATION,
        cropType: 'tomato',
        status: GoalStatus.ACTIVE,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test mapEntityToRow
      const row = (savingsGoalDAO as any).mapEntityToRow(mockGoal);
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('user_id');
      expect(row).toHaveProperty('title');
      expect(row).toHaveProperty('target_amount');
      expect(row.id).toBe(mockGoal.id);
      expect(row.user_id).toBe(mockGoal.userId);
      expect(row.title).toBe(mockGoal.title);
      expect(row.target_amount).toBe(mockGoal.targetAmount);
    });
  });

  describe('ExpenseDAO', () => {
    it('should have proper mapping methods', () => {
      const mockExpense = {
        id: 'expense-123',
        userId: 'user-123',
        amount: 50.00,
        category: ExpenseCategory.FOOD,
        description: 'Lunch at restaurant',
        date: new Date(),
        tags: ['restaurant', 'lunch'],
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test mapEntityToRow
      const row = (expenseDAO as any).mapEntityToRow(mockExpense);
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('user_id');
      expect(row).toHaveProperty('amount');
      expect(row).toHaveProperty('category');
      expect(row).toHaveProperty('tags');
      expect(row.id).toBe(mockExpense.id);
      expect(row.user_id).toBe(mockExpense.userId);
      expect(row.amount).toBe(mockExpense.amount);
      expect(row.category).toBe(mockExpense.category);
      expect(row.tags).toBe(JSON.stringify(mockExpense.tags));
    });
  });

  describe('BaseDAO functionality', () => {
    it('should have common CRUD methods', () => {
      // Check that all DAOs inherit from BaseDAO and have common methods
      expect(typeof userDAO.create).toBe('function');
      expect(typeof userDAO.findById).toBe('function');
      expect(typeof userDAO.findAll).toBe('function');
      expect(typeof userDAO.update).toBe('function');
      expect(typeof userDAO.delete).toBe('function');
      expect(typeof userDAO.count).toBe('function');

      expect(typeof savingsGoalDAO.create).toBe('function');
      expect(typeof savingsGoalDAO.findById).toBe('function');
      expect(typeof savingsGoalDAO.findAll).toBe('function');
      expect(typeof savingsGoalDAO.update).toBe('function');
      expect(typeof savingsGoalDAO.delete).toBe('function');
      expect(typeof savingsGoalDAO.count).toBe('function');

      expect(typeof expenseDAO.create).toBe('function');
      expect(typeof expenseDAO.findById).toBe('function');
      expect(typeof expenseDAO.findAll).toBe('function');
      expect(typeof expenseDAO.update).toBe('function');
      expect(typeof expenseDAO.delete).toBe('function');
      expect(typeof expenseDAO.count).toBe('function');
    });

    it('should have specialized methods for each DAO', () => {
      // UserDAO specific methods
      expect(typeof userDAO.findByEmail).toBe('function');
      expect(typeof userDAO.updateLastLogin).toBe('function');
      expect(typeof userDAO.updateEmailVerification).toBe('function');

      // SavingsGoalDAO specific methods
      expect(typeof savingsGoalDAO.findActiveByUserId).toBe('function');
      expect(typeof savingsGoalDAO.updateProgress).toBe('function');
      expect(typeof savingsGoalDAO.markAsCompleted).toBe('function');

      // ExpenseDAO specific methods
      expect(typeof expenseDAO.findByDateRange).toBe('function');
      expect(typeof expenseDAO.findByCategory).toBe('function');
      expect(typeof expenseDAO.getTotalByCategory).toBe('function');
    });
  });

  describe('Data validation', () => {
    it('should handle date formatting correctly', () => {
      const testDate = new Date('2024-01-15T10:30:00.000Z');
      
      // Test date parsing and formatting in BaseDAO
      const parsedDate = (userDAO as any).parseDate(testDate.toISOString());
      const formattedDate = (userDAO as any).formatDate(testDate);
      
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.getTime()).toBe(testDate.getTime());
      expect(formattedDate).toBe(testDate.toISOString());
    });

    it('should handle JSON parsing correctly', () => {
      const testObject = { key: 'value', number: 42, array: [1, 2, 3] };
      const jsonString = JSON.stringify(testObject);
      
      // Test JSON parsing and stringifying in BaseDAO
      const parsedObject = (userDAO as any).parseJSON(jsonString);
      const stringifiedObject = (userDAO as any).stringifyJSON(testObject);
      
      expect(parsedObject).toEqual(testObject);
      expect(stringifiedObject).toBe(jsonString);
    });

    it('should handle null and undefined values gracefully', () => {
      // Test null handling
      const parsedNull = (userDAO as any).parseDate(null);
      const formattedUndefined = (userDAO as any).formatDate(undefined);
      const parsedNullJSON = (userDAO as any).parseJSON(null);
      const stringifiedUndefined = (userDAO as any).stringifyJSON(undefined);
      
      expect(parsedNull).toBeUndefined();
      expect(formattedUndefined).toBeUndefined();
      expect(parsedNullJSON).toBeUndefined();
      expect(stringifiedUndefined).toBeUndefined();
    });
  });
});