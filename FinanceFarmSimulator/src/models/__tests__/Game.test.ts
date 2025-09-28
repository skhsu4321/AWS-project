import {
  Crop,
  Farm,
  Decoration,
  Reward,
  Achievement,
  CropType,
  GrowthStage,
  RewardType,
  DecorationCategory,
  validateCrop,
  validateFarm,
  validateDecoration,
  validateReward,
  validateAchievement,
  validateCropInput,
  validateFarmInput,
  CropSchema,
  FarmSchema,
  Position,
} from '../Game';

describe('Game Models', () => {
  describe('Position', () => {
    it('should validate valid positions', () => {
      const validPosition: Position = { x: 5, y: 3 };
      expect(() => validateCrop({ 
        id: '123e4567-e89b-12d3-a456-426614174000',
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        type: CropType.TOMATO,
        position: validPosition,
        plantedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })).not.toThrow();
    });

    it('should require non-negative coordinates', () => {
      const invalidPosition = { x: -1, y: 5 };
      expect(() => validateCrop({
        id: '123e4567-e89b-12d3-a456-426614174000',
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        type: CropType.TOMATO,
        position: invalidPosition,
        plantedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })).toThrow();
    });
  });

  describe('Crop', () => {
    const validCrop: Crop = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      goalId: '123e4567-e89b-12d3-a456-426614174001',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      type: CropType.TOMATO,
      growthStage: GrowthStage.GROWING,
      healthPoints: 85,
      position: { x: 3, y: 4 },
      plantedAt: new Date(),
      lastWateredAt: new Date(),
      lastFertilizedAt: new Date(),
      harvestableAt: new Date(Date.now() + 86400000), // Tomorrow
      growthProgress: 65,
      fertilizerBoost: 2.5,
      weedPenalty: 0.1,
      streakMultiplier: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate a valid crop', () => {
      expect(() => validateCrop(validCrop)).not.toThrow();
    });

    it('should validate health points range', () => {
      const lowHealth = { ...validCrop, healthPoints: -10 };
      const highHealth = { ...validCrop, healthPoints: 150 };
      
      expect(() => validateCrop(lowHealth)).toThrow();
      expect(() => validateCrop(highHealth)).toThrow();
    });

    it('should validate growth progress range', () => {
      const negativeProgress = { ...validCrop, growthProgress: -5 };
      const excessiveProgress = { ...validCrop, growthProgress: 105 };
      
      expect(() => validateCrop(negativeProgress)).toThrow();
      expect(() => validateCrop(excessiveProgress)).toThrow();
    });

    it('should validate fertilizer boost range', () => {
      const lowBoost = { ...validCrop, fertilizerBoost: 0.5 };
      const highBoost = { ...validCrop, fertilizerBoost: 6 };
      
      expect(() => validateCrop(lowBoost)).toThrow();
      expect(() => validateCrop(highBoost)).toThrow();
    });

    it('should validate weed penalty range', () => {
      const negativePenalty = { ...validCrop, weedPenalty: -0.1 };
      const excessivePenalty = { ...validCrop, weedPenalty: 1.5 };
      
      expect(() => validateCrop(negativePenalty)).toThrow();
      expect(() => validateCrop(excessivePenalty)).toThrow();
    });

    it('should set default values', () => {
      const minimalCrop = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        type: CropType.CARROT,
        position: { x: 2, y: 3 },
        plantedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = CropSchema.parse(minimalCrop);
      expect(result.growthStage).toBe(GrowthStage.SEED);
      expect(result.healthPoints).toBe(100);
      expect(result.growthProgress).toBe(0);
      expect(result.fertilizerBoost).toBe(1);
      expect(result.weedPenalty).toBe(0);
      expect(result.streakMultiplier).toBe(1);
    });
  });

  describe('Decoration', () => {
    const validDecoration: Decoration = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      category: DecorationCategory.FENCE,
      name: 'Wooden Fence',
      description: 'A rustic wooden fence',
      position: { x: 0, y: 0 },
      isUnlocked: true,
      purchasedAt: new Date(),
      cost: 100,
      createdAt: new Date(),
    };

    it('should validate a valid decoration', () => {
      expect(() => validateDecoration(validDecoration)).not.toThrow();
    });

    it('should require name', () => {
      const invalidDecoration = { ...validDecoration, name: '' };
      expect(() => validateDecoration(invalidDecoration)).toThrow();
    });

    it('should validate cost is non-negative', () => {
      const invalidDecoration = { ...validDecoration, cost: -50 };
      expect(() => validateDecoration(invalidDecoration)).toThrow();
    });

    it('should set default values', () => {
      const minimalDecoration = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        category: DecorationCategory.TREE,
        name: 'Oak Tree',
        position: { x: 5, y: 5 },
        createdAt: new Date(),
      };
      
      const result = validateDecoration(minimalDecoration);
      expect(result.isUnlocked).toBe(false);
      expect(result.cost).toBe(0);
    });
  });

  describe('Farm', () => {
    const validFarm: Farm = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      layout: {
        width: 10,
        height: 8,
        theme: 'spring',
        backgroundImage: 'farm_bg.png',
      },
      crops: [],
      decorations: [],
      healthScore: 95,
      level: 5,
      experience: 2500,
      totalHarvests: 25,
      streakDays: 7,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate a valid farm', () => {
      expect(() => validateFarm(validFarm)).not.toThrow();
    });

    it('should validate layout dimensions', () => {
      const smallFarm = { 
        ...validFarm, 
        layout: { ...validFarm.layout, width: 3, height: 3 } 
      };
      const largeFarm = { 
        ...validFarm, 
        layout: { ...validFarm.layout, width: 25, height: 25 } 
      };
      
      expect(() => validateFarm(smallFarm)).toThrow();
      expect(() => validateFarm(largeFarm)).toThrow();
    });

    it('should validate health score range', () => {
      const negativeHealth = { ...validFarm, healthScore: -10 };
      const excessiveHealth = { ...validFarm, healthScore: 150 };
      
      expect(() => validateFarm(negativeHealth)).toThrow();
      expect(() => validateFarm(excessiveHealth)).toThrow();
    });

    it('should validate minimum level', () => {
      const invalidLevel = { ...validFarm, level: 0 };
      expect(() => validateFarm(invalidLevel)).toThrow();
    });

    it('should set default values', () => {
      const minimalFarm = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        layout: {},
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = FarmSchema.parse(minimalFarm);
      expect(result.layout.width).toBe(10);
      expect(result.layout.height).toBe(10);
      expect(result.layout.theme).toBe('classic');
      expect(result.crops).toEqual([]);
      expect(result.decorations).toEqual([]);
      expect(result.healthScore).toBe(100);
      expect(result.level).toBe(1);
      expect(result.experience).toBe(0);
    });
  });

  describe('Reward', () => {
    const validReward: Reward = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      type: RewardType.BADGE,
      title: 'First Harvest',
      description: 'Congratulations on your first successful harvest!',
      value: 100,
      iconUrl: 'badge_first_harvest.png',
      unlockedAt: new Date(),
      category: 'achievement',
      isCollected: true,
      collectedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000 * 30), // 30 days
    };

    it('should validate a valid reward', () => {
      expect(() => validateReward(validReward)).not.toThrow();
    });

    it('should require title', () => {
      const invalidReward = { ...validReward, title: '' };
      expect(() => validateReward(invalidReward)).toThrow();
    });

    it('should validate non-negative value', () => {
      const invalidReward = { ...validReward, value: -50 };
      expect(() => validateReward(invalidReward)).toThrow();
    });

    it('should set default values', () => {
      const minimalReward = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: RewardType.CURRENCY,
        title: 'Daily Bonus',
        description: 'Daily login bonus',
        value: 50,
        unlockedAt: new Date(),
      };
      
      const result = validateReward(minimalReward);
      expect(result.category).toBe('general');
      expect(result.isCollected).toBe(false);
    });
  });

  describe('Achievement', () => {
    const validAchievement: Achievement = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Green Thumb',
      description: 'Plant 10 different types of crops',
      category: 'farming',
      progress: 7,
      target: 10,
      isCompleted: false,
      createdAt: new Date(),
    };

    it('should validate a valid achievement', () => {
      expect(() => validateAchievement(validAchievement)).not.toThrow();
    });

    it('should require name', () => {
      const invalidAchievement = { ...validAchievement, name: '' };
      expect(() => validateAchievement(invalidAchievement)).toThrow();
    });

    it('should validate progress is non-negative', () => {
      const invalidAchievement = { ...validAchievement, progress: -1 };
      expect(() => validateAchievement(invalidAchievement)).toThrow();
    });

    it('should validate target is positive', () => {
      const invalidAchievement = { ...validAchievement, target: 0 };
      expect(() => validateAchievement(invalidAchievement)).toThrow();
    });

    it('should set default values', () => {
      const minimalAchievement = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'First Steps',
        description: 'Complete your first goal',
        category: 'beginner',
        target: 1,
        createdAt: new Date(),
      };
      
      const result = validateAchievement(minimalAchievement);
      expect(result.progress).toBe(0);
      expect(result.isCompleted).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate crop input', () => {
      const cropInput = {
        goalId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        type: CropType.WHEAT,
        position: { x: 4, y: 6 },
        plantedAt: new Date(),
      };
      
      expect(() => validateCropInput(cropInput)).not.toThrow();
    });

    it('should validate farm input', () => {
      const farmInput = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        layout: {
          width: 12,
          height: 10,
          theme: 'autumn',
        },
      };
      
      expect(() => validateFarmInput(farmInput)).not.toThrow();
    });
  });
});