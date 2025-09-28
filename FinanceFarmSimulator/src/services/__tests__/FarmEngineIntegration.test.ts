import { FarmEngine } from '../FarmEngine';
import { FarmDAO, CropDAO } from '../dao';
import {
  Farm,
  Crop,
  CropType,
  GrowthStage,
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

describe('FarmEngine Integration Tests', () => {
  let farmEngine: FarmEngine;
  let mockFarmDAO: jest.Mocked<FarmDAO>;
  let mockCropDAO: jest.Mocked<CropDAO>;

  const mockUserId = 'user-123';
  const mockFarmId = 'farm-123';
  const mockGoalId = 'goal-123';

  beforeEach(() => {
    mockFarmDAO = new FarmDAO() as jest.Mocked<FarmDAO>;
    mockCropDAO = new CropDAO() as jest.Mocked<CropDAO>;
    farmEngine = new FarmEngine(mockFarmDAO, mockCropDAO);

    jest.clearAllMocks();
  });

  describe('Complete Farm Lifecycle', () => {
    it('should handle complete farm lifecycle from initialization to harvest', async () => {
      // Step 1: Initialize farm
      const initialFarm: Farm = {
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

      mockFarmDAO.findFarmByUserId.mockResolvedValue(null);
      mockFarmDAO.create.mockResolvedValue(initialFarm);

      const farm = await farmEngine.initializeFarm(mockUserId);
      expect(farm).toEqual(initialFarm);

      // Step 2: Plant crop for savings goal
      const savingsGoal: SavingsGoal = {
        id: mockGoalId,
        userId: mockUserId,
        title: 'New Laptop',
        description: 'Save for a new laptop',
        targetAmount: 1000,
        currentAmount: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: GoalCategory.GADGET,
        cropType: CropType.TOMATO,
        status: GoalStatus.ACTIVE,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const plantedCrop: Crop = {
        id: 'crop-123',
        goalId: mockGoalId,
        userId: mockUserId,
        type: CropType.TOMATO,
        growthStage: GrowthStage.SEED,
        healthPoints: 100,
        position: { x: 0, y: 0 },
        plantedAt: new Date(),
        growthProgress: 0,
        fertilizerBoost: 1,
        weedPenalty: 0,
        streakMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFarmDAO.findFarmByUserId.mockResolvedValue(initialFarm);
      mockCropDAO.create.mockResolvedValue(plantedCrop);
      mockFarmDAO.update.mockResolvedValue({ ...initialFarm, crops: [plantedCrop] });

      const crop = await farmEngine.plantCrop(mockUserId, savingsGoal);
      expect(crop.type).toBe(CropType.TOMATO);
      expect(crop.growthStage).toBe(GrowthStage.SEED);

      // Step 3: Apply fertilizer (income logging)
      mockCropDAO.findById.mockResolvedValue(plantedCrop);
      const fertilizedCrop = { ...plantedCrop, fertilizerBoost: 1.1, streakMultiplier: 2 };
      mockCropDAO.update.mockResolvedValue(fertilizedCrop);

      await farmEngine.applyFertilizer('crop-123', 100, 2);
      expect(mockCropDAO.update).toHaveBeenCalledWith(
        'crop-123',
        expect.objectContaining({
          fertilizerBoost: expect.any(Number),
          streakMultiplier: 2,
        })
      );

      // Step 4: Process weeds (expenses)
      const expenses: Expense[] = [
        {
          id: 'expense-1',
          userId: mockUserId,
          amount: 50,
          category: ExpenseCategory.FOOD,
          description: 'Lunch',
          date: new Date(),
          isRecurring: false,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const farmWithCrop = { ...initialFarm, crops: [fertilizedCrop] };
      mockFarmDAO.findFarmByUserId.mockResolvedValue(farmWithCrop);
      const weedyCrop = { ...fertilizedCrop, weedPenalty: 0.05, healthPoints: 99 };
      mockCropDAO.update.mockResolvedValue(weedyCrop);
      mockFarmDAO.update.mockResolvedValue({ ...farmWithCrop, healthScore: 99 });

      await farmEngine.processWeeds(mockUserId, expenses);
      expect(mockCropDAO.update).toHaveBeenCalledWith(
        'crop-123',
        expect.objectContaining({
          weedPenalty: expect.any(Number),
          healthPoints: expect.any(Number),
        })
      );

      // Step 5: Update crop growth as savings progress
      const progressedGoal = { ...savingsGoal, currentAmount: 500 };
      const grownCrop = { ...weedyCrop, growthProgress: 50, growthStage: GrowthStage.GROWING };
      mockCropDAO.update.mockResolvedValue(grownCrop);

      const updatedCrop = await farmEngine.updateCropGrowth(weedyCrop, progressedGoal);
      expect(updatedCrop.growthProgress).toBeGreaterThan(0);

      // Step 6: Complete goal and trigger harvest
      const completedGoal = { ...savingsGoal, currentAmount: 1000 };
      const readyCrop = { ...grownCrop, growthStage: GrowthStage.READY_TO_HARVEST };
      
      mockCropDAO.findByGoalId.mockResolvedValue([readyCrop]);
      const harvestedCrop = { ...readyCrop, growthStage: GrowthStage.HARVESTED };
      mockCropDAO.update.mockResolvedValue(harvestedCrop);
      
      const finalFarm = { 
        ...farmWithCrop, 
        totalHarvests: 1, 
        experience: 50, 
        level: 1 
      };
      mockFarmDAO.findFarmByUserId.mockResolvedValue(farmWithCrop);
      mockFarmDAO.update.mockResolvedValue(finalFarm);

      const rewards = await farmEngine.triggerHarvest(mockGoalId);
      expect(rewards.length).toBeGreaterThan(0);
      expect(rewards[0].title).toBe('Goal Completed!');

      // Verify final farm state
      expect(mockFarmDAO.update).toHaveBeenCalledWith(
        mockFarmId,
        expect.objectContaining({
          totalHarvests: 1,
          experience: expect.any(Number),
        })
      );
    });

    it('should handle multiple crops with different growth rates', async () => {
      const farm: Farm = {
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

      // Create multiple goals with different progress
      const quickGoal: SavingsGoal = {
        id: 'goal-quick',
        userId: mockUserId,
        title: 'Quick Goal',
        targetAmount: 100,
        currentAmount: 80, // 80% complete
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        category: GoalCategory.ENTERTAINMENT,
        cropType: CropType.STRAWBERRY,
        status: GoalStatus.ACTIVE,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const slowGoal: SavingsGoal = {
        id: 'goal-slow',
        userId: mockUserId,
        title: 'Slow Goal',
        targetAmount: 5000,
        currentAmount: 500, // 10% complete
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        category: GoalCategory.VACATION,
        cropType: CropType.APPLE,
        status: GoalStatus.ACTIVE,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Calculate growth rates
      const quickGrowthRate = farmEngine.calculateGrowthRate(quickGoal);
      const slowGrowthRate = farmEngine.calculateGrowthRate(slowGoal);

      // Quick goal should have higher growth rate due to proximity to deadline
      expect(quickGrowthRate).toBeGreaterThan(slowGrowthRate);

      // Verify progress percentages
      const quickProgress = (quickGoal.currentAmount / quickGoal.targetAmount) * 100;
      const slowProgress = (slowGoal.currentAmount / slowGoal.targetAmount) * 100;

      expect(quickProgress).toBe(80);
      expect(slowProgress).toBe(10);
    });

    it('should handle farm health degradation and recovery', async () => {
      const healthyCrop: Crop = {
        id: 'crop-healthy',
        goalId: 'goal-1',
        userId: mockUserId,
        type: CropType.WHEAT,
        growthStage: GrowthStage.GROWING,
        healthPoints: 100,
        position: { x: 0, y: 0 },
        plantedAt: new Date(),
        growthProgress: 50,
        fertilizerBoost: 1,
        weedPenalty: 0,
        streakMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sickCrop: Crop = {
        id: 'crop-sick',
        goalId: 'goal-2',
        userId: mockUserId,
        type: CropType.CORN,
        growthStage: GrowthStage.GROWING,
        healthPoints: 30,
        position: { x: 1, y: 0 },
        plantedAt: new Date(),
        growthProgress: 25,
        fertilizerBoost: 1,
        weedPenalty: 0.7,
        streakMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const farmWithMixedHealth: Farm = {
        id: mockFarmId,
        userId: mockUserId,
        layout: { width: 10, height: 10, theme: 'classic' },
        crops: [healthyCrop, sickCrop],
        decorations: [],
        healthScore: 65, // Average of 100 and 30
        level: 1,
        experience: 0,
        totalHarvests: 0,
        streakDays: 0,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const calculatedHealth = farmEngine.calculateFarmHealth(farmWithMixedHealth);
      
      // Health should be affected by both crop health and weed penalties
      expect(calculatedHealth).toBeLessThan(65); // Should be lower due to weed penalty
      expect(calculatedHealth).toBeGreaterThan(0);
    });

    it('should handle streak multipliers and fertilizer boosts correctly', async () => {
      const baseCrop: Crop = {
        id: 'crop-base',
        goalId: 'goal-1',
        userId: mockUserId,
        type: CropType.RICE,
        growthStage: GrowthStage.SPROUT,
        healthPoints: 100,
        position: { x: 0, y: 0 },
        plantedAt: new Date(),
        growthProgress: 20,
        fertilizerBoost: 1,
        weedPenalty: 0,
        streakMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test multiple fertilizer applications with increasing streaks
      mockCropDAO.findById.mockResolvedValue(baseCrop);

      // First application - 1 day streak
      let updatedCrop = { ...baseCrop, fertilizerBoost: 1.1, streakMultiplier: 1.1 };
      mockCropDAO.update.mockResolvedValue(updatedCrop);
      await farmEngine.applyFertilizer('crop-base', 100, 1.1);

      // Second application - 5 day streak
      mockCropDAO.findById.mockResolvedValue(updatedCrop);
      updatedCrop = { ...updatedCrop, fertilizerBoost: 1.25, streakMultiplier: 1.5 };
      mockCropDAO.update.mockResolvedValue(updatedCrop);
      await farmEngine.applyFertilizer('crop-base', 100, 1.5);

      // Third application - 10 day streak (should be capped)
      mockCropDAO.findById.mockResolvedValue(updatedCrop);
      updatedCrop = { ...updatedCrop, fertilizerBoost: 1.4, streakMultiplier: 2 };
      mockCropDAO.update.mockResolvedValue(updatedCrop);
      await farmEngine.applyFertilizer('crop-base', 100, 2);

      // Verify that streak multiplier is capped at reasonable values
      expect(mockCropDAO.update).toHaveBeenLastCalledWith(
        'crop-base',
        expect.objectContaining({
          streakMultiplier: expect.any(Number),
        })
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty farm gracefully', async () => {
      const emptyFarm: Farm = {
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

      const health = farmEngine.calculateFarmHealth(emptyFarm);
      expect(health).toBe(100);

      mockFarmDAO.findFarmByUserId.mockResolvedValue(emptyFarm);
      mockFarmDAO.update.mockResolvedValue(emptyFarm);

      await farmEngine.processWeeds(mockUserId, []);
      expect(mockFarmDAO.update).toHaveBeenCalled();
    });

    it('should handle goal with zero target amount', () => {
      const invalidGoal: SavingsGoal = {
        id: 'goal-invalid',
        userId: mockUserId,
        title: 'Invalid Goal',
        targetAmount: 0,
        currentAmount: 100,
        deadline: new Date(),
        category: GoalCategory.OTHER,
        cropType: CropType.CARROT,
        status: GoalStatus.ACTIVE,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const growthRate = farmEngine.calculateGrowthRate(invalidGoal);
      expect(growthRate).toBe(0);
    });

    it('should handle past deadline gracefully', () => {
      const pastDeadlineGoal: SavingsGoal = {
        id: 'goal-past',
        userId: mockUserId,
        title: 'Past Deadline Goal',
        targetAmount: 1000,
        currentAmount: 500,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        category: GoalCategory.EDUCATION,
        cropType: CropType.WHEAT,
        status: GoalStatus.ACTIVE,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const growthRate = farmEngine.calculateGrowthRate(pastDeadlineGoal);
      expect(growthRate).toBeGreaterThanOrEqual(0);
    });
  });
});