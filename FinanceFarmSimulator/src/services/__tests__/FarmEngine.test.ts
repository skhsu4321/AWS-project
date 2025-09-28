import { FarmEngine } from '../FarmEngine';
import { FarmDAO, CropDAO } from '../dao';
import {
  Farm,
  Crop,
  CropType,
  GrowthStage,
  RewardType,
} from '../../models/Game';
import {
  SavingsGoal,
  GoalCategory,
  GoalStatus,
  Expense,
  ExpenseCategory,
} from '../../models/Financial';

// Mock the DAOs
jest.mock('../dao/FarmDAO');
jest.mock('../dao/CropDAO');

describe('FarmEngine', () => {
  let farmEngine: FarmEngine;
  let mockFarmDAO: jest.Mocked<FarmDAO>;
  let mockCropDAO: jest.Mocked<CropDAO>;

  const mockUserId = 'user-123';
  const mockFarmId = 'farm-123';
  const mockCropId = 'crop-123';
  const mockGoalId = 'goal-123';

  const mockFarm: Farm = {
    id: mockFarmId,
    userId: mockUserId,
    layout: { width: 10, height: 10, theme: 'classic' },
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

  const mockCrop: Crop = {
    id: mockCropId,
    goalId: mockGoalId,
    userId: mockUserId,
    type: CropType.TOMATO,
    growthStage: GrowthStage.GROWING,
    healthPoints: 80,
    position: { x: 1, y: 1 },
    plantedAt: new Date(),
    growthProgress: 50,
    fertilizerBoost: 1.5,
    weedPenalty: 0.1,
    streakMultiplier: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSavingsGoal: SavingsGoal = {
    id: mockGoalId,
    userId: mockUserId,
    title: 'Test Goal',
    description: 'Test savings goal',
    targetAmount: 1000,
    currentAmount: 500,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    category: GoalCategory.GADGET,
    cropType: CropType.TOMATO,
    status: GoalStatus.ACTIVE,
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockFarmDAO = new FarmDAO() as jest.Mocked<FarmDAO>;
    mockCropDAO = new CropDAO() as jest.Mocked<CropDAO>;
    farmEngine = new FarmEngine(mockFarmDAO, mockCropDAO);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('initializeFarm', () => {
    it('should return existing farm if found', async () => {
      mockFarmDAO.findFarmByUserId.mockResolvedValue(mockFarm);

      const result = await farmEngine.initializeFarm(mockUserId);

      expect(result).toEqual(mockFarm);
      expect(mockFarmDAO.findFarmByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockFarmDAO.create).not.toHaveBeenCalled();
    });

    it('should create new farm if none exists', async () => {
      mockFarmDAO.findFarmByUserId.mockResolvedValue(null);
      mockFarmDAO.create.mockResolvedValue(mockFarm);

      const result = await farmEngine.initializeFarm(mockUserId);

      expect(result).toEqual(mockFarm);
      expect(mockFarmDAO.findFarmByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockFarmDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          healthScore: 100,
          level: 1,
          experience: 0,
        })
      );
    });
  });

  describe('calculateGrowthRate', () => {
    it('should calculate growth rate based on savings progress and time factor', () => {
      const result = farmEngine.calculateGrowthRate(mockSavingsGoal);

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should handle zero target amount', () => {
      const goalWithZeroTarget = { ...mockSavingsGoal, targetAmount: 0 };
      const result = farmEngine.calculateGrowthRate(goalWithZeroTarget);

      expect(result).toBe(0);
    });

    it('should adjust for deadline proximity', () => {
      const nearDeadlineGoal = {
        ...mockSavingsGoal,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      };
      const farDeadlineGoal = {
        ...mockSavingsGoal,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };

      const nearResult = farmEngine.calculateGrowthRate(nearDeadlineGoal);
      const farResult = farmEngine.calculateGrowthRate(farDeadlineGoal);

      expect(nearResult).toBeGreaterThan(farResult);
    });
  });

  describe('applyFertilizer', () => {
    it('should apply fertilizer boost to crop', async () => {
      mockCropDAO.findById.mockResolvedValue(mockCrop);
      mockCropDAO.update.mockResolvedValue(mockCrop);

      await farmEngine.applyFertilizer(mockCropId, 100, 2);

      expect(mockCropDAO.findById).toHaveBeenCalledWith(mockCropId);
      expect(mockCropDAO.update).toHaveBeenCalledWith(
        mockCropId,
        expect.objectContaining({
          fertilizerBoost: expect.any(Number),
          streakMultiplier: 2,
          lastFertilizedAt: expect.any(Date),
        })
      );
    });

    it('should cap fertilizer boost at maximum value', async () => {
      const highBoostCrop = { ...mockCrop, fertilizerBoost: 4.8 };
      mockCropDAO.findById.mockResolvedValue(highBoostCrop);
      mockCropDAO.update.mockResolvedValue(highBoostCrop);

      await farmEngine.applyFertilizer(mockCropId, 1000, 2);

      expect(mockCropDAO.update).toHaveBeenCalledWith(
        mockCropId,
        expect.objectContaining({
          fertilizerBoost: 5, // Should be capped at 5
        })
      );
    });

    it('should throw error if crop not found', async () => {
      mockCropDAO.findById.mockResolvedValue(null);

      await expect(farmEngine.applyFertilizer(mockCropId, 100, 2)).rejects.toThrow(
        'Crop not found'
      );
    });
  });

  describe('processWeeds', () => {
    const mockExpenses: Expense[] = [
      {
        id: 'expense-1',
        userId: mockUserId,
        amount: 200,
        category: ExpenseCategory.FOOD,
        description: 'Groceries',
        date: new Date(),
        isRecurring: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'expense-2',
        userId: mockUserId,
        amount: 150,
        category: ExpenseCategory.ENTERTAINMENT,
        description: 'Movie tickets',
        date: new Date(),
        isRecurring: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should apply weed penalties to crops based on expenses', async () => {
      const farmWithCrops = { ...mockFarm, crops: [mockCrop] };
      mockFarmDAO.findFarmByUserId.mockResolvedValue(farmWithCrops);
      mockCropDAO.update.mockResolvedValue(mockCrop);
      mockFarmDAO.update.mockResolvedValue(farmWithCrops);

      await farmEngine.processWeeds(mockUserId, mockExpenses);

      expect(mockCropDAO.update).toHaveBeenCalledWith(
        mockCropId,
        expect.objectContaining({
          weedPenalty: expect.any(Number),
          healthPoints: expect.any(Number),
        })
      );
      expect(mockFarmDAO.update).toHaveBeenCalled();
    });

    it('should throw error if farm not found', async () => {
      mockFarmDAO.findFarmByUserId.mockResolvedValue(null);

      await expect(farmEngine.processWeeds(mockUserId, mockExpenses)).rejects.toThrow(
        'Farm not found for user'
      );
    });

    it('should handle empty expenses array', async () => {
      mockFarmDAO.findFarmByUserId.mockResolvedValue(mockFarm);
      mockFarmDAO.update.mockResolvedValue(mockFarm);

      await farmEngine.processWeeds(mockUserId, []);

      expect(mockFarmDAO.update).toHaveBeenCalled();
    });
  });

  describe('triggerHarvest', () => {
    it('should harvest crop and generate rewards', async () => {
      mockCropDAO.findByGoalId.mockResolvedValue([mockCrop]);
      mockCropDAO.update.mockResolvedValue({ ...mockCrop, growthStage: GrowthStage.HARVESTED });
      mockFarmDAO.findFarmByUserId.mockResolvedValue(mockFarm);
      mockFarmDAO.update.mockResolvedValue(mockFarm);

      const rewards = await farmEngine.triggerHarvest(mockGoalId);

      expect(mockCropDAO.findByGoalId).toHaveBeenCalledWith(mockGoalId);
      expect(mockCropDAO.update).toHaveBeenCalledWith(
        mockCropId,
        expect.objectContaining({
          growthStage: GrowthStage.HARVESTED,
          harvestedAt: expect.any(Date),
        })
      );
      expect(rewards.length).toBeGreaterThan(0);
      expect(rewards[0]).toMatchObject({
        type: RewardType.CURRENCY,
        title: 'Goal Completed!',
        userId: mockUserId,
      });
    });

    it('should generate bonus rewards for high performance crops', async () => {
      const highPerformanceCrop = { ...mockCrop, fertilizerBoost: 3 };
      mockCropDAO.findByGoalId.mockResolvedValue([highPerformanceCrop]);
      mockCropDAO.update.mockResolvedValue(highPerformanceCrop);
      mockFarmDAO.findFarmByUserId.mockResolvedValue(mockFarm);
      mockFarmDAO.update.mockResolvedValue(mockFarm);

      const rewards = await farmEngine.triggerHarvest(mockGoalId);

      expect(rewards.length).toBeGreaterThan(1);
      expect(rewards.some(r => r.type === RewardType.BADGE)).toBe(true);
    });

    it('should throw error if no crop found for goal', async () => {
      mockCropDAO.findByGoalId.mockResolvedValue([]);

      await expect(farmEngine.triggerHarvest(mockGoalId)).rejects.toThrow(
        'Crop not found for goal'
      );
    });

    it('should update farm statistics after harvest', async () => {
      mockCropDAO.findByGoalId.mockResolvedValue([mockCrop]);
      mockCropDAO.update.mockResolvedValue(mockCrop);
      mockFarmDAO.findFarmByUserId.mockResolvedValue(mockFarm);
      mockFarmDAO.update.mockResolvedValue(mockFarm);

      await farmEngine.triggerHarvest(mockGoalId);

      expect(mockFarmDAO.update).toHaveBeenCalledWith(
        mockFarmId,
        expect.objectContaining({
          totalHarvests: 1,
          experience: expect.any(Number),
          level: expect.any(Number),
        })
      );
    });
  });

  describe('plantCrop', () => {
    it('should plant new crop for savings goal', async () => {
      mockFarmDAO.findFarmByUserId.mockResolvedValue(mockFarm);
      mockCropDAO.create.mockResolvedValue(mockCrop);
      mockFarmDAO.update.mockResolvedValue(mockFarm);

      const result = await farmEngine.plantCrop(mockUserId, mockSavingsGoal);

      expect(mockCropDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: mockGoalId,
          userId: mockUserId,
          type: expect.any(String),
          growthStage: GrowthStage.SEED,
          healthPoints: 100,
        })
      );
      expect(result).toEqual(mockCrop);
    });

    it('should map goal category to appropriate crop type', async () => {
      mockFarmDAO.findFarmByUserId.mockResolvedValue(mockFarm);
      mockCropDAO.create.mockResolvedValue(mockCrop);
      mockFarmDAO.update.mockResolvedValue(mockFarm);

      const vacationGoal = { ...mockSavingsGoal, category: GoalCategory.VACATION };
      await farmEngine.plantCrop(mockUserId, vacationGoal);

      expect(mockCropDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CropType.APPLE, // Vacation should map to apple
        })
      );
    });

    it('should throw error if farm not found', async () => {
      mockFarmDAO.findFarmByUserId.mockResolvedValue(null);

      await expect(farmEngine.plantCrop(mockUserId, mockSavingsGoal)).rejects.toThrow(
        'Farm not found for user'
      );
    });
  });

  describe('updateCropGrowth', () => {
    it('should update crop growth based on savings goal progress', async () => {
      mockCropDAO.update.mockResolvedValue(mockCrop);

      const result = await farmEngine.updateCropGrowth(mockCrop, mockSavingsGoal);

      expect(mockCropDAO.update).toHaveBeenCalledWith(
        mockCropId,
        expect.objectContaining({
          growthProgress: expect.any(Number),
          growthStage: expect.any(String),
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toEqual(mockCrop);
    });

    it('should set harvestable date when crop reaches ready stage', async () => {
      const completedGoal = { ...mockSavingsGoal, currentAmount: 1000 };
      mockCropDAO.update.mockResolvedValue(mockCrop);

      await farmEngine.updateCropGrowth(mockCrop, completedGoal);

      expect(mockCropDAO.update).toHaveBeenCalledWith(
        mockCropId,
        expect.objectContaining({
          growthStage: GrowthStage.READY_TO_HARVEST,
          harvestableAt: expect.any(Date),
        })
      );
    });

    it('should apply fertilizer boost and weed penalty to growth rate', async () => {
      const boostedCrop = { ...mockCrop, fertilizerBoost: 2, weedPenalty: 0.2 };
      mockCropDAO.update.mockResolvedValue(boostedCrop);

      await farmEngine.updateCropGrowth(boostedCrop, mockSavingsGoal);

      expect(mockCropDAO.update).toHaveBeenCalled();
    });
  });

  describe('calculateFarmHealth', () => {
    it('should return 100 for empty farm', () => {
      const emptyFarm = { ...mockFarm, crops: [] };
      const health = farmEngine.calculateFarmHealth(emptyFarm);

      expect(health).toBe(100);
    });

    it('should calculate average health of all crops', () => {
      const crops = [
        { ...mockCrop, healthPoints: 80, weedPenalty: 0 },
        { ...mockCrop, id: 'crop-2', healthPoints: 60, weedPenalty: 0 },
      ];
      const farmWithCrops = { ...mockFarm, crops };

      const health = farmEngine.calculateFarmHealth(farmWithCrops);

      expect(health).toBe(70); // Average of 80 and 60
    });

    it('should factor in weed penalties', () => {
      const crops = [
        { ...mockCrop, healthPoints: 100, weedPenalty: 0.5 },
      ];
      const farmWithCrops = { ...mockFarm, crops };

      const health = farmEngine.calculateFarmHealth(farmWithCrops);

      expect(health).toBeLessThan(100);
    });

    it('should not return negative health', () => {
      const crops = [
        { ...mockCrop, healthPoints: 0, weedPenalty: 1 },
      ];
      const farmWithCrops = { ...mockFarm, crops };

      const health = farmEngine.calculateFarmHealth(farmWithCrops);

      expect(health).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updateFarmState', () => {
    it('should update all crops and farm health', async () => {
      const farmWithCrops = { ...mockFarm, crops: [mockCrop] };
      mockFarmDAO.findFarmByUserId.mockResolvedValue(farmWithCrops);
      mockFarmDAO.update.mockResolvedValue(farmWithCrops);

      const result = await farmEngine.updateFarmState(mockUserId);

      expect(mockFarmDAO.findFarmByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockFarmDAO.update).toHaveBeenCalledWith(
        mockFarmId,
        expect.objectContaining({
          healthScore: expect.any(Number),
          lastActiveAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toEqual(farmWithCrops);
    });

    it('should throw error if farm not found', async () => {
      mockFarmDAO.findFarmByUserId.mockResolvedValue(null);

      await expect(farmEngine.updateFarmState(mockUserId)).rejects.toThrow(
        'Farm not found for user'
      );
    });
  });
});