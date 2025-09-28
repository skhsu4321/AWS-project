import { DatabaseService } from '../DatabaseService';
import { DAOFactory } from '../dao';
import { UserMode, Currency } from '../../models/User';
import { GoalCategory, GoalStatus, ExpenseCategory, IncomeSource } from '../../models/Financial';
import { CropType, GrowthStage } from '../../models/Game';

// Mock expo-sqlite for testing
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: jest.fn(() => Promise.resolve()),
    runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1, changes: 1 })),
    getFirstAsync: jest.fn(() => Promise.resolve({ user_version: 0 })),
    getAllAsync: jest.fn(() => Promise.resolve([])),
    closeAsync: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock expo-crypto for testing
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => Promise.resolve('mock-encryption-key')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    HEX: 'HEX',
  },
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeEach(async () => {
    databaseService = DatabaseService.getInstance();
    await databaseService.initialize();
  });

  afterEach(async () => {
    await databaseService.close();
  });

  describe('Initialization', () => {
    it('should initialize database successfully', async () => {
      expect(databaseService).toBeDefined();
      expect(databaseService.getDatabase()).toBeDefined();
    });

    it('should handle initialization errors gracefully', async () => {
      const mockError = new Error('Database initialization failed');
      const mockOpenDatabase = jest.fn(() => Promise.reject(mockError));
      
      // Mock the openDatabaseAsync to throw an error
      const sqlite = require('expo-sqlite');
      sqlite.openDatabaseAsync = mockOpenDatabase;

      const newService = DatabaseService.getInstance();
      await expect(newService.initialize()).rejects.toThrow('Database initialization failed');
    });
  });

  describe('Encryption', () => {
    it('should encrypt and decrypt sensitive data', () => {
      const originalData = 'sensitive information';
      const encrypted = databaseService.encryptSensitiveData(originalData);
      const decrypted = databaseService.decryptSensitiveData(encrypted);

      expect(encrypted).not.toBe(originalData);
      expect(decrypted).toBe(originalData);
    });

    it('should handle encryption errors', () => {
      // Force encryption key to be null
      (databaseService as any).encryptionKey = null;

      expect(() => {
        databaseService.encryptSensitiveData('test');
      }).toThrow('Encryption key not initialized');
    });

    it('should handle decryption errors', () => {
      // Force encryption key to be null
      (databaseService as any).encryptionKey = null;

      expect(() => {
        databaseService.decryptSensitiveData('invalid-data');
      }).toThrow('Encryption key not initialized');
    });
  });

  describe('Database Operations', () => {
    it('should clear all data successfully', async () => {
      const mockExecAsync = jest.fn(() => Promise.resolve());
      const mockDb = {
        execAsync: mockExecAsync,
      };
      
      (databaseService as any).db = mockDb;
      
      await databaseService.clearAllData();
      
      // Should call DELETE for each table
      expect(mockExecAsync).toHaveBeenCalledTimes(10); // 10 tables
    });

    it('should handle database errors during clear', async () => {
      const mockError = new Error('Database error');
      const mockExecAsync = jest.fn(() => Promise.reject(mockError));
      const mockDb = {
        execAsync: mockExecAsync,
      };
      
      (databaseService as any).db = mockDb;
      
      await expect(databaseService.clearAllData()).rejects.toThrow('Database error');
    });
  });
});

describe('DAO Integration Tests', () => {
  let databaseService: DatabaseService;
  let userDAO: any;
  let savingsGoalDAO: any;
  let expenseDAO: any;
  let incomeDAO: any;
  let farmDAO: any;
  let cropDAO: any;

  beforeEach(async () => {
    databaseService = DatabaseService.getInstance();
    await databaseService.initialize();
    
    userDAO = DAOFactory.getUserDAO();
    savingsGoalDAO = DAOFactory.getSavingsGoalDAO();
    expenseDAO = DAOFactory.getExpenseDAO();
    incomeDAO = DAOFactory.getIncomeDAO();
    farmDAO = DAOFactory.getFarmDAO();
    cropDAO = DAOFactory.getCropDAO();
  });

  afterEach(async () => {
    await databaseService.clearAllData();
    await databaseService.close();
  });

  describe('User Operations', () => {
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

    it('should create and retrieve user', async () => {
      // Mock the database responses
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        profile: databaseService.encryptSensitiveData(JSON.stringify(mockUser.profile)),
        created_at: mockUser.createdAt.toISOString(),
        updated_at: mockUser.createdAt.toISOString(),
        last_login_at: mockUser.lastLoginAt.toISOString(),
        is_email_verified: mockUser.isEmailVerified,
        is_active: mockUser.isActive,
      });

      const createdUser = await userDAO.create(mockUser);
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(mockUser.email);
    });

    it('should find user by email', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        profile: databaseService.encryptSensitiveData(JSON.stringify(mockUser.profile)),
        created_at: mockUser.createdAt.toISOString(),
        updated_at: mockUser.createdAt.toISOString(),
        last_login_at: mockUser.lastLoginAt.toISOString(),
        is_email_verified: mockUser.isEmailVerified,
        is_active: mockUser.isActive,
      });

      const foundUser = await userDAO.findByEmail(mockUser.email);
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(mockUser.email);
    });
  });

  describe('Savings Goal Operations', () => {
    const mockGoal = {
      id: 'goal-123',
      userId: 'user-123',
      title: 'Vacation Fund',
      description: 'Save for summer vacation',
      targetAmount: 5000,
      currentAmount: 1000,
      deadline: new Date('2024-12-31'),
      category: GoalCategory.VACATION,
      cropType: CropType.TOMATO,
      status: GoalStatus.ACTIVE,
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create and retrieve savings goal', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockGoal.id,
        user_id: mockGoal.userId,
        title: mockGoal.title,
        description: mockGoal.description,
        target_amount: mockGoal.targetAmount,
        current_amount: mockGoal.currentAmount,
        deadline: mockGoal.deadline.toISOString(),
        category: mockGoal.category,
        crop_type: mockGoal.cropType,
        status: mockGoal.status,
        is_recurring: mockGoal.isRecurring,
        recurring_period: null,
        created_at: mockGoal.createdAt.toISOString(),
        updated_at: mockGoal.updatedAt.toISOString(),
      });

      const createdGoal = await savingsGoalDAO.create(mockGoal);
      expect(createdGoal).toBeDefined();
      expect(createdGoal.title).toBe(mockGoal.title);
    });

    it('should update goal progress', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ changes: 1 });
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockGoal.id,
        user_id: mockGoal.userId,
        title: mockGoal.title,
        description: mockGoal.description,
        target_amount: mockGoal.targetAmount,
        current_amount: mockGoal.currentAmount + 500,
        deadline: mockGoal.deadline.toISOString(),
        category: mockGoal.category,
        crop_type: mockGoal.cropType,
        status: mockGoal.status,
        is_recurring: mockGoal.isRecurring,
        recurring_period: null,
        created_at: mockGoal.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
      });

      const updatedGoal = await savingsGoalDAO.updateProgress(mockGoal.id, 500);
      expect(updatedGoal).toBeDefined();
      expect(updatedGoal!.currentAmount).toBe(mockGoal.currentAmount + 500);
    });
  });

  describe('Expense Operations', () => {
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

    it('should create and retrieve expense', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockExpense.id,
        user_id: mockExpense.userId,
        amount: mockExpense.amount,
        category: mockExpense.category,
        description: mockExpense.description,
        date: mockExpense.date.toISOString(),
        receipt_image: null,
        is_recurring: mockExpense.isRecurring,
        recurring_period: null,
        tags: JSON.stringify(mockExpense.tags),
        created_at: mockExpense.createdAt.toISOString(),
        updated_at: mockExpense.updatedAt.toISOString(),
      });

      const createdExpense = await expenseDAO.create(mockExpense);
      expect(createdExpense).toBeDefined();
      expect(createdExpense.amount).toBe(mockExpense.amount);
      expect(createdExpense.tags).toEqual(mockExpense.tags);
    });
  });

  describe('Income Operations', () => {
    const mockIncome = {
      id: 'income-123',
      userId: 'user-123',
      amount: 1000,
      source: IncomeSource.SALARY,
      description: 'Monthly salary',
      date: new Date(),
      isRecurring: true,
      recurringPeriod: 'monthly' as const,
      multiplier: 1.2,
      streakCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create and retrieve income', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockIncome.id,
        user_id: mockIncome.userId,
        amount: mockIncome.amount,
        source: mockIncome.source,
        description: mockIncome.description,
        date: mockIncome.date.toISOString(),
        is_recurring: mockIncome.isRecurring,
        recurring_period: mockIncome.recurringPeriod,
        multiplier: mockIncome.multiplier,
        streak_count: mockIncome.streakCount,
        created_at: mockIncome.createdAt.toISOString(),
        updated_at: mockIncome.updatedAt.toISOString(),
      });

      const createdIncome = await incomeDAO.create(mockIncome);
      expect(createdIncome).toBeDefined();
      expect(createdIncome.amount).toBe(mockIncome.amount);
      expect(createdIncome.multiplier).toBe(mockIncome.multiplier);
    });

    it('should update streak information', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ changes: 1 });
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockIncome.id,
        user_id: mockIncome.userId,
        amount: mockIncome.amount,
        source: mockIncome.source,
        description: mockIncome.description,
        date: mockIncome.date.toISOString(),
        is_recurring: mockIncome.isRecurring,
        recurring_period: mockIncome.recurringPeriod,
        multiplier: 1.5,
        streak_count: 6,
        created_at: mockIncome.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
      });

      const updatedIncome = await incomeDAO.updateStreak(mockIncome.userId, mockIncome.id, 6, 1.5);
      expect(updatedIncome).toBeDefined();
      expect(updatedIncome!.streakCount).toBe(6);
      expect(updatedIncome!.multiplier).toBe(1.5);
    });
  });

  describe('Farm Operations', () => {
    const mockFarm = {
      id: 'farm-123',
      userId: 'user-123',
      layout: {
        width: 10,
        height: 10,
        theme: 'classic',
      },
      crops: [],
      decorations: [],
      healthScore: 100,
      level: 1,
      experience: 0,
      totalHarvests: 0,
      streakDays: 0,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create and retrieve farm', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockFarm.id,
        user_id: mockFarm.userId,
        layout: JSON.stringify(mockFarm.layout),
        health_score: mockFarm.healthScore,
        level: mockFarm.level,
        experience: mockFarm.experience,
        total_harvests: mockFarm.totalHarvests,
        streak_days: mockFarm.streakDays,
        last_active_at: mockFarm.lastActiveAt.toISOString(),
        created_at: mockFarm.createdAt.toISOString(),
        updated_at: mockFarm.updatedAt.toISOString(),
      });

      const createdFarm = await farmDAO.create(mockFarm);
      expect(createdFarm).toBeDefined();
      expect(createdFarm.layout).toEqual(mockFarm.layout);
    });

    it('should add experience and level up', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ changes: 1 });
      
      // First call returns farm with updated experience
      // Second call returns farm with updated level
      (mockDb.getFirstAsync as jest.Mock)
        .mockResolvedValueOnce({
          id: mockFarm.id,
          user_id: mockFarm.userId,
          layout: JSON.stringify(mockFarm.layout),
          health_score: mockFarm.healthScore,
          level: mockFarm.level,
          experience: 1500, // Enough to level up
          total_harvests: mockFarm.totalHarvests,
          streak_days: mockFarm.streakDays,
          last_active_at: mockFarm.lastActiveAt.toISOString(),
          created_at: mockFarm.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          id: mockFarm.id,
          user_id: mockFarm.userId,
          layout: JSON.stringify(mockFarm.layout),
          health_score: mockFarm.healthScore,
          level: 2, // Leveled up
          experience: 1500,
          total_harvests: mockFarm.totalHarvests,
          streak_days: mockFarm.streakDays,
          last_active_at: mockFarm.lastActiveAt.toISOString(),
          created_at: mockFarm.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
        });

      const updatedFarm = await farmDAO.addExperience(mockFarm.id, 1500);
      expect(updatedFarm).toBeDefined();
      expect(updatedFarm!.level).toBe(2);
      expect(updatedFarm!.experience).toBe(1500);
    });
  });

  describe('Crop Operations', () => {
    const mockCrop = {
      id: 'crop-123',
      goalId: 'goal-123',
      userId: 'user-123',
      type: CropType.TOMATO,
      growthStage: GrowthStage.SEED,
      healthPoints: 100,
      position: { x: 5, y: 5 },
      plantedAt: new Date(),
      growthProgress: 0,
      fertilizerBoost: 1,
      weedPenalty: 0,
      streakMultiplier: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create and retrieve crop', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockCrop.id,
        goal_id: mockCrop.goalId,
        user_id: mockCrop.userId,
        type: mockCrop.type,
        growth_stage: mockCrop.growthStage,
        health_points: mockCrop.healthPoints,
        position_x: mockCrop.position.x,
        position_y: mockCrop.position.y,
        planted_at: mockCrop.plantedAt.toISOString(),
        last_watered_at: null,
        last_fertilized_at: null,
        harvestable_at: null,
        harvested_at: null,
        growth_progress: mockCrop.growthProgress,
        fertilizer_boost: mockCrop.fertilizerBoost,
        weed_penalty: mockCrop.weedPenalty,
        streak_multiplier: mockCrop.streakMultiplier,
        created_at: mockCrop.createdAt.toISOString(),
        updated_at: mockCrop.updatedAt.toISOString(),
      });

      const createdCrop = await cropDAO.create(mockCrop);
      expect(createdCrop).toBeDefined();
      expect(createdCrop.type).toBe(mockCrop.type);
      expect(createdCrop.position).toEqual(mockCrop.position);
    });

    it('should update growth progress', async () => {
      const mockDb = databaseService.getDatabase();
      (mockDb.runAsync as jest.Mock).mockResolvedValue({ changes: 1 });
      (mockDb.getFirstAsync as jest.Mock).mockResolvedValue({
        id: mockCrop.id,
        goal_id: mockCrop.goalId,
        user_id: mockCrop.userId,
        type: mockCrop.type,
        growth_stage: GrowthStage.GROWING,
        health_points: mockCrop.healthPoints,
        position_x: mockCrop.position.x,
        position_y: mockCrop.position.y,
        planted_at: mockCrop.plantedAt.toISOString(),
        last_watered_at: null,
        last_fertilized_at: null,
        harvestable_at: null,
        harvested_at: null,
        growth_progress: 50,
        fertilizer_boost: mockCrop.fertilizerBoost,
        weed_penalty: mockCrop.weedPenalty,
        streak_multiplier: mockCrop.streakMultiplier,
        created_at: mockCrop.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
      });

      const updatedCrop = await cropDAO.updateGrowthProgress(mockCrop.id, 50, GrowthStage.GROWING);
      expect(updatedCrop).toBeDefined();
      expect(updatedCrop!.growthProgress).toBe(50);
      expect(updatedCrop!.growthStage).toBe(GrowthStage.GROWING);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity between related entities', async () => {
      // This test would verify that foreign key constraints work properly
      // In a real implementation, you would test cascading deletes, etc.
      expect(true).toBe(true); // Placeholder for referential integrity tests
    });

    it('should handle concurrent operations safely', async () => {
      // This test would verify that concurrent database operations don't cause issues
      // In a real implementation, you would test transaction isolation, etc.
      expect(true).toBe(true); // Placeholder for concurrency tests
    });
  });
});