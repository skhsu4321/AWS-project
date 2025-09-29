import { z } from 'zod';

// Enums and constants
export enum CropType {
  TOMATO = 'tomato',
  CARROT = 'carrot',
  CORN = 'corn',
  WHEAT = 'wheat',
  RICE = 'rice',
  APPLE = 'apple',
  ORANGE = 'orange',
  STRAWBERRY = 'strawberry',
}

export enum GrowthStage {
  SEED = 'seed',
  SPROUT = 'sprout',
  GROWING = 'growing',
  MATURE = 'mature',
  READY_TO_HARVEST = 'ready_to_harvest',
  HARVESTED = 'harvested',
  WITHERED = 'withered',
}

export enum RewardType {
  BADGE = 'badge',
  DECORATION = 'decoration',
  BOOST = 'boost',
  CUSTOMIZATION = 'customization',
  CURRENCY = 'currency',
}

export enum DecorationCategory {
  FENCE = 'fence',
  BUILDING = 'building',
  ANIMAL = 'animal',
  TREE = 'tree',
  FLOWER = 'flower',
  PATH = 'path',
}

// Position Schema
export const PositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
});

export type Position = z.infer<typeof PositionSchema>;

// Crop Schema
export const CropSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(), // Links to SavingsGoal
  userId: z.string().uuid(),
  type: z.nativeEnum(CropType),
  growthStage: z.nativeEnum(GrowthStage).default(GrowthStage.SEED),
  healthPoints: z.number().min(0).max(100).default(100),
  position: PositionSchema,
  plantedAt: z.date(),
  lastWateredAt: z.date().optional(),
  lastFertilizedAt: z.date().optional(),
  harvestableAt: z.date().optional(),
  harvestedAt: z.date().optional(),
  growthProgress: z.number().min(0).max(100).default(0), // Percentage
  fertilizerBoost: z.number().min(1).max(5).default(1), // Multiplier
  weedPenalty: z.number().min(0).max(1).default(0), // Reduction factor
  streakMultiplier: z.number().min(1).max(10).default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Crop = z.infer<typeof CropSchema>;

// Decoration Schema
export const DecorationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  category: z.nativeEnum(DecorationCategory),
  name: z.string().min(1),
  description: z.string().optional(),
  position: PositionSchema,
  isUnlocked: z.boolean().default(false),
  purchasedAt: z.date().optional(),
  cost: z.number().min(0).default(0),
  createdAt: z.date(),
});

export type Decoration = z.infer<typeof DecorationSchema>;

// Farm Layout Schema
export const FarmLayoutSchema = z.object({
  width: z.number().min(5).max(20).default(10),
  height: z.number().min(5).max(20).default(10),
  theme: z.string().default('classic'),
  backgroundImage: z.string().optional(),
});

export type FarmLayout = z.infer<typeof FarmLayoutSchema>;

// Farm Schema
export const FarmSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  layout: FarmLayoutSchema,
  crops: z.array(CropSchema).default([]),
  decorations: z.array(DecorationSchema).default([]),
  healthScore: z.number().min(0).max(100).default(100),
  level: z.number().min(1).default(1),
  experience: z.number().min(0).default(0),
  totalHarvests: z.number().min(0).default(0),
  streakDays: z.number().min(0).default(0),
  lastActiveAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Farm = z.infer<typeof FarmSchema>;

// Reward Schema
export const RewardSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(RewardType),
  title: z.string().min(1),
  description: z.string().max(500),
  value: z.number().min(0), // Points, coins, or other numeric value
  iconUrl: z.string().optional(),
  unlockedAt: z.date(),
  category: z.string().default('general'),
  isCollected: z.boolean().default(false),
  collectedAt: z.date().optional(),
  expiresAt: z.date().optional(),
});

export type Reward = z.infer<typeof RewardSchema>;

// Achievement Schema
export const AchievementSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  category: z.string(),
  progress: z.number().min(0).default(0),
  target: z.number().min(1),
  isCompleted: z.boolean().default(false),
  completedAt: z.date().optional(),
  reward: RewardSchema.optional(),
  createdAt: z.date(),
});

export type Achievement = z.infer<typeof AchievementSchema>;

// Game Statistics Schema
export const GameStatisticsSchema = z.object({
  userId: z.string().uuid(),
  totalPlayTime: z.number().min(0).default(0), // in minutes
  cropsPlanted: z.number().min(0).default(0),
  cropsHarvested: z.number().min(0).default(0),
  totalFertilizerUsed: z.number().min(0).default(0),
  weedsPulled: z.number().min(0).default(0),
  longestStreak: z.number().min(0).default(0),
  currentStreak: z.number().min(0).default(0),
  achievementsUnlocked: z.number().min(0).default(0),
  lastUpdated: z.date(),
});

export type GameStatistics = z.infer<typeof GameStatisticsSchema>;

// Input schemas for creating new records - simplified to avoid omit() issues
export const CropInputSchema = z.object({
  goalId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(CropType),
  position: PositionSchema,
  plantedAt: z.date(),
});

export type CropInput = z.infer<typeof CropInputSchema>;

export const DecorationInputSchema = z.object({
  userId: z.string().uuid(),
  category: z.nativeEnum(DecorationCategory),
  name: z.string().min(1),
  description: z.string().optional(),
  position: PositionSchema,
  cost: z.number().min(0),
});

export type DecorationInput = z.infer<typeof DecorationInputSchema>;

export const FarmInputSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  level: z.number().min(1).default(1),
  experience: z.number().min(0).default(0),
  level: true,
  experience: true,
  totalHarvests: true,
  streakDays: true,
  lastActiveAt: true,
});

export type FarmInput = z.infer<typeof FarmInputSchema>;

// Validation functions
export const validateCrop = (data: unknown): Crop => {
  return CropSchema.parse(data);
};

export const validateFarm = (data: unknown): Farm => {
  return FarmSchema.parse(data);
};

export const validateDecoration = (data: unknown): Decoration => {
  return DecorationSchema.parse(data);
};

export const validateReward = (data: unknown): Reward => {
  return RewardSchema.parse(data);
};

export const validateAchievement = (data: unknown): Achievement => {
  return AchievementSchema.parse(data);
};

export const validateCropInput = (data: unknown): CropInput => {
  return CropInputSchema.parse(data);
};

export const validateFarmInput = (data: unknown): FarmInput => {
  return FarmInputSchema.parse(data);
};

export const validateDecorationInput = (data: unknown): DecorationInput => {
  return DecorationInputSchema.parse(data);
};