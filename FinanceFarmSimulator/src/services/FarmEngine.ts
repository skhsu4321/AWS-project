import { v4 as uuidv4 } from 'uuid';
import {
  Farm,
  Crop,
  CropType,
  GrowthStage,
  Reward,
  RewardType,
  FarmInput,
  CropInput,
} from '../models/Game';
import { SavingsGoal, Expense } from '../models/Financial';
import { FarmDAO, CropDAO } from './dao';
import {
  calculateGrowthRate,
  calculateFertilizerBoost,
  calculateExpenseImpact,
  calculateProgressPercentage,
} from '../utils/calculations';

export interface FarmEngineInterface {
  initializeFarm(userId: string): Promise<Farm>;
  updateFarmState(userId: string): Promise<Farm>;
  calculateGrowthRate(goal: SavingsGoal): number;
  applyFertilizer(cropId: string, incomeAmount: number, streakMultiplier: number): Promise<void>;
  processWeeds(userId: string, expenses: Expense[]): Promise<void>;
  triggerHarvest(goalId: string): Promise<Reward[]>;
  plantCrop(userId: string, goal: SavingsGoal): Promise<Crop>;
  updateCropGrowth(crop: Crop, goal: SavingsGoal): Promise<Crop>;
  calculateFarmHealth(farm: Farm): number;
}

export class FarmEngine implements FarmEngineInterface {
  private farmDAO: FarmDAO;
  private cropDAO: CropDAO;

  constructor(farmDAO: FarmDAO, cropDAO: CropDAO) {
    this.farmDAO = farmDAO;
    this.cropDAO = cropDAO;
  }

  /**
   * Initialize a new farm for a user
   */
  async initializeFarm(userId: string): Promise<Farm> {
    const existingFarm = await this.farmDAO.findFarmByUserId(userId);
    if (existingFarm) {
      return existingFarm;
    }

    const farmInput: FarmInput = {
      userId,
      layout: {
        width: 10,
        height: 10,
        theme: 'classic',
      },
    };

    const now = new Date();
    const farm: Farm = {
      id: uuidv4(),
      userId: farmInput.userId,
      layout: farmInput.layout,
      crops: [],
      decorations: [],
      healthScore: 100,
      level: 1,
      experience: 0,
      totalHarvests: 0,
      streakDays: 0,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    };

    return await this.farmDAO.create(farm);
  }

  /**
   * Update farm state including crop growth and health calculations
   */
  async updateFarmState(userId: string): Promise<Farm> {
    const farm = await this.farmDAO.findFarmByUserId(userId);
    if (!farm) {
      throw new Error('Farm not found for user');
    }

    // Update all crops in the farm
    const updatedCrops: Crop[] = [];
    for (const crop of farm.crops) {
      // Note: In a real implementation, we'd need to get the associated SavingsGoal
      // For now, we'll update the crop based on its current state
      const updatedCrop = await this.updateCropFromState(crop);
      updatedCrops.push(updatedCrop);
    }

    // Calculate new farm health based on crops
    const newHealthScore = this.calculateFarmHealth({ ...farm, crops: updatedCrops });

    // Update farm with new data
    const updatedFarm: Farm = {
      ...farm,
      crops: updatedCrops,
      healthScore: newHealthScore,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.farmDAO.update(updatedFarm.id, updatedFarm);
    if (!result) {
      throw new Error('Failed to update farm state');
    }
    return result;
  }

  /**
   * Calculate growth rate for a crop based on its associated savings goal
   * Formula: Growth Rate = (Saved Amount / Goal Amount) * Time Factor
   */
  calculateGrowthRate(goal: SavingsGoal): number {
    const now = new Date();
    const daysToDeadline = Math.max(1, Math.ceil((goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const timeFactor = Math.max(0.1, 1 / daysToDeadline); // Slower growth for longer deadlines
    
    return calculateGrowthRate(goal.currentAmount, goal.targetAmount, timeFactor);
  }

  /**
   * Apply fertilizer boost to a crop based on income logging
   * Formula: Fertilizer Boost = Income Amount * Multiplier
   */
  async applyFertilizer(cropId: string, incomeAmount: number, streakMultiplier: number): Promise<void> {
    const crop = await this.cropDAO.findById(cropId);
    if (!crop) {
      throw new Error('Crop not found');
    }

    const boostAmount = calculateFertilizerBoost(incomeAmount, streakMultiplier);
    const newFertilizerBoost = Math.min(5, crop.fertilizerBoost + (boostAmount / 1000)); // Scale down for reasonable boost
    const newStreakMultiplier = Math.min(10, streakMultiplier);

    const updatedCrop: Crop = {
      ...crop,
      fertilizerBoost: newFertilizerBoost,
      streakMultiplier: newStreakMultiplier,
      lastFertilizedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.cropDAO.update(cropId, updatedCrop);
  }

  /**
   * Process weeds (expenses) that negatively impact farm health
   */
  async processWeeds(userId: string, expenses: Expense[]): Promise<void> {
    const farm = await this.farmDAO.findFarmByUserId(userId);
    if (!farm) {
      throw new Error('Farm not found for user');
    }

    // Calculate total expense impact
    let totalExpenseImpact = 0;
    for (const expense of expenses) {
      // Assume a monthly budget of 10000 for impact calculation
      const monthlyBudget = 10000; // This should come from user settings
      const impact = calculateExpenseImpact(expense.amount, monthlyBudget);
      totalExpenseImpact += impact;
    }

    // Apply weed penalty to all crops
    const updatedCrops: Crop[] = [];
    for (const crop of farm.crops) {
      const weedPenalty = Math.min(0.5, totalExpenseImpact * 0.1); // Cap penalty at 50%
      const updatedCrop: Crop = {
        ...crop,
        weedPenalty: Math.min(1, crop.weedPenalty + weedPenalty),
        healthPoints: Math.max(0, crop.healthPoints - (weedPenalty * 20)),
        updatedAt: new Date(),
      };
      updatedCrops.push(updatedCrop);
      await this.cropDAO.update(crop.id, updatedCrop);
    }

    // Update farm health
    const newHealthScore = this.calculateFarmHealth({ ...farm, crops: updatedCrops });
    await this.farmDAO.update(farm.id, {
      ...farm,
      healthScore: newHealthScore,
      updatedAt: new Date(),
    });
  }

  /**
   * Trigger harvest when a savings goal is completed
   */
  async triggerHarvest(goalId: string): Promise<Reward[]> {
    const crops = await this.cropDAO.findByGoalId(goalId);
    if (crops.length === 0) {
      throw new Error('Crop not found for goal');
    }
    
    const crop = crops[0]; // Use the first crop for this goal

    // Update crop to harvested state
    const harvestedCrop: Crop = {
      ...crop,
      growthStage: GrowthStage.HARVESTED,
      harvestedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.cropDAO.update(crop.id, harvestedCrop);

    // Generate rewards based on crop performance
    const rewards = this.generateHarvestRewards(crop);

    // Update farm statistics
    const farm = await this.farmDAO.findFarmByUserId(crop.userId);
    if (farm) {
      const updatedFarm: Farm = {
        ...farm,
        totalHarvests: farm.totalHarvests + 1,
        experience: farm.experience + this.calculateExperienceGain(crop),
        level: this.calculateLevel(farm.experience + this.calculateExperienceGain(crop)),
        updatedAt: new Date(),
      };
      await this.farmDAO.update(farm.id, updatedFarm);
    }

    return rewards;
  }

  /**
   * Plant a new crop for a savings goal
   */
  async plantCrop(userId: string, goal: SavingsGoal): Promise<Crop> {
    const farm = await this.farmDAO.findFarmByUserId(userId);
    if (!farm) {
      throw new Error('Farm not found for user');
    }

    // Find available position in farm
    const position = this.findAvailablePosition(farm);
    
    const cropInput: CropInput = {
      goalId: goal.id,
      userId,
      type: this.getCropTypeFromGoal(goal),
      position,
      plantedAt: new Date(),
    };

    const now = new Date();
    const crop: Crop = {
      id: uuidv4(),
      ...cropInput,
      growthStage: GrowthStage.SEED,
      healthPoints: 100,
      growthProgress: 0,
      fertilizerBoost: 1,
      weedPenalty: 0,
      streakMultiplier: 1,
      createdAt: now,
      updatedAt: now,
    };

    const createdCrop = await this.cropDAO.create(crop);

    // Update farm with new crop
    const updatedFarm: Farm = {
      ...farm,
      crops: [...farm.crops, createdCrop],
      updatedAt: new Date(),
    };
    await this.farmDAO.update(farm.id, updatedFarm);

    return createdCrop;
  }

  /**
   * Update crop growth based on associated savings goal progress
   */
  async updateCropGrowth(crop: Crop, goal: SavingsGoal): Promise<Crop> {
    const growthRate = this.calculateGrowthRate(goal);
    const progressPercentage = calculateProgressPercentage(goal.currentAmount, goal.targetAmount);
    
    // Apply fertilizer boost and weed penalty (for future use in animations/effects)
    // const effectiveGrowthRate = growthRate * crop.fertilizerBoost * (1 - crop.weedPenalty) * crop.streakMultiplier;
    
    const newGrowthProgress = Math.min(100, progressPercentage);
    const newGrowthStage = this.calculateGrowthStage(newGrowthProgress);
    
    // Calculate harvestable date if crop is ready
    let harvestableAt = crop.harvestableAt;
    if (newGrowthStage === GrowthStage.READY_TO_HARVEST && !harvestableAt) {
      harvestableAt = new Date();
    }

    const updatedCrop: Crop = {
      ...crop,
      growthProgress: newGrowthProgress,
      growthStage: newGrowthStage,
      harvestableAt,
      updatedAt: new Date(),
    };

    const result = await this.cropDAO.update(crop.id, updatedCrop);
    if (!result) {
      throw new Error('Failed to update crop growth');
    }
    return result;
  }

  /**
   * Calculate farm health based on crop conditions
   */
  calculateFarmHealth(farm: Farm): number {
    if (farm.crops.length === 0) {
      return 100; // Perfect health for empty farm
    }

    const totalHealth = farm.crops.reduce((sum, crop) => sum + crop.healthPoints, 0);
    const averageHealth = totalHealth / farm.crops.length;
    
    // Factor in weed penalties
    const totalWeedPenalty = farm.crops.reduce((sum, crop) => sum + crop.weedPenalty, 0);
    const averageWeedPenalty = totalWeedPenalty / farm.crops.length;
    
    return Math.max(0, Math.min(100, averageHealth * (1 - averageWeedPenalty * 0.5)));
  }

  // Private helper methods

  private async updateCropFromState(crop: Crop): Promise<Crop> {
    // This would normally fetch the associated SavingsGoal and update accordingly
    // For now, we'll just update the timestamp and return the crop
    return {
      ...crop,
      updatedAt: new Date(),
    };
  }

  private findAvailablePosition(farm: Farm): { x: number; y: number } {
    const occupiedPositions = new Set(
      farm.crops.map(crop => `${crop.position.x},${crop.position.y}`)
    );

    for (let y = 0; y < farm.layout.height; y++) {
      for (let x = 0; x < farm.layout.width; x++) {
        if (!occupiedPositions.has(`${x},${y}`)) {
          return { x, y };
        }
      }
    }

    // If no space available, expand farm or use default position
    return { x: 0, y: 0 };
  }

  private getCropTypeFromGoal(goal: SavingsGoal): CropType {
    // Map goal categories to crop types
    const categoryToCropMap: Record<string, CropType> = {
      emergency_fund: CropType.WHEAT,
      vacation: CropType.APPLE,
      education: CropType.CORN,
      gadget: CropType.TOMATO,
      clothing: CropType.STRAWBERRY,
      entertainment: CropType.ORANGE,
      other: CropType.CARROT,
    };

    return categoryToCropMap[goal.category] || CropType.CARROT;
  }

  private calculateGrowthStage(progressPercentage: number): GrowthStage {
    if (progressPercentage >= 100) return GrowthStage.READY_TO_HARVEST;
    if (progressPercentage >= 80) return GrowthStage.MATURE;
    if (progressPercentage >= 50) return GrowthStage.GROWING;
    if (progressPercentage >= 20) return GrowthStage.SPROUT;
    return GrowthStage.SEED;
  }

  private generateHarvestRewards(crop: Crop): Reward[] {
    const rewards: Reward[] = [];
    const now = new Date();

    // Base reward for completing goal
    const baseReward: Reward = {
      id: uuidv4(),
      userId: crop.userId,
      type: RewardType.CURRENCY,
      title: 'Goal Completed!',
      description: `Congratulations on harvesting your ${crop.type}!`,
      value: 100 * crop.fertilizerBoost,
      unlockedAt: now,
      category: 'harvest',
      isCollected: false,
    };
    rewards.push(baseReward);

    // Bonus rewards for high performance
    if (crop.fertilizerBoost > 2) {
      const bonusReward: Reward = {
        id: uuidv4(),
        userId: crop.userId,
        type: RewardType.BADGE,
        title: 'Super Farmer',
        description: 'Achieved exceptional growth through consistent income logging!',
        value: 50,
        unlockedAt: now,
        category: 'achievement',
        isCollected: false,
      };
      rewards.push(bonusReward);
    }

    return rewards;
  }

  private calculateExperienceGain(crop: Crop): number {
    const baseExperience = 50;
    const boostMultiplier = crop.fertilizerBoost;
    const penaltyReduction = crop.weedPenalty * 0.5;
    
    return Math.floor(baseExperience * boostMultiplier * (1 - penaltyReduction));
  }

  private calculateLevel(experience: number): number {
    // Simple level calculation: every 1000 XP = 1 level
    return Math.floor(experience / 1000) + 1;
  }
}