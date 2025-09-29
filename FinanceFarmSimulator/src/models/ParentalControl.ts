import { z } from 'zod';

// Enums and constants
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ActivityType {
  GOAL_CREATED = 'goal_created',
  GOAL_COMPLETED = 'goal_completed',
  EXPENSE_LOGGED = 'expense_logged',
  INCOME_LOGGED = 'income_logged',
  REWARD_CLAIMED = 'reward_claimed',
  ALLOWANCE_RECEIVED = 'allowance_received',
  CHORE_COMPLETED = 'chore_completed',
}

export enum RestrictionType {
  SPENDING_LIMIT = 'spending_limit',
  GOAL_AMOUNT_LIMIT = 'goal_amount_limit',
  DAILY_USAGE_LIMIT = 'daily_usage_limit',
  FEATURE_RESTRICTION = 'feature_restriction',
}

// Parent-Child Link Schema
export const ParentChildLinkSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid(),
  childId: z.string().uuid(),
  createdAt: z.date(),
  isActive: z.boolean().default(true),
  nickname: z.string().optional(), // Parent's nickname for the child
});

export type ParentChildLink = z.infer<typeof ParentChildLinkSchema>;

// Approval Request Schema
export const ApprovalRequestSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  parentId: z.string().uuid(),
  type: z.enum(['goal', 'reward', 'expense']),
  itemId: z.string().uuid(), // ID of the goal, reward, or expense
  requestData: z.record(z.string(), z.any()), // Flexible data for the request
  status: z.nativeEnum(ApprovalStatus).default(ApprovalStatus.PENDING),
  requestedAt: z.date(),
  respondedAt: z.date().optional(),
  parentResponse: z.string().optional(), // Optional message from parent
  expiresAt: z.date().optional(), // Auto-reject after this date
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

// Allowance Configuration Schema
export const AllowanceConfigSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  parentId: z.string().uuid(),
  amount: z.number().positive('Allowance amount must be positive'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  dayOfWeek: z.number().min(0).max(6).optional(), // For weekly allowances (0 = Sunday)
  dayOfMonth: z.number().min(1).max(31).optional(), // For monthly allowances
  isActive: z.boolean().default(true),
  startDate: z.date(),
  endDate: z.date().optional(),
  lastPaidAt: z.date().optional(),
  nextPaymentAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).refine((data) => {
  // Weekly allowances should have dayOfWeek
  if (data.frequency === 'weekly' && data.dayOfWeek === undefined) {
    return false;
  }
  // Monthly allowances should have dayOfMonth
  if (data.frequency === 'monthly' && data.dayOfMonth === undefined) {
    return false;
  }
  return true;
}, {
  message: "Weekly allowances need dayOfWeek, monthly allowances need dayOfMonth",
  path: ["frequency"],
});

export type AllowanceConfig = z.infer<typeof AllowanceConfigSchema>;

// Child Activity Schema
export const ChildActivitySchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  type: z.nativeEnum(ActivityType),
  description: z.string(),
  amount: z.number().optional(), // For financial activities
  metadata: z.record(z.string(), z.any()).optional(), // Additional activity data
  timestamp: z.date(),
  isVisible: z.boolean().default(true), // Parent can hide certain activities
});

export type ChildActivity = z.infer<typeof ChildActivitySchema>;

// Restriction Configuration Schema
export const RestrictionConfigSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  parentId: z.string().uuid(),
  type: z.nativeEnum(RestrictionType),
  value: z.number().positive(), // Limit amount or duration
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RestrictionConfig = z.infer<typeof RestrictionConfigSchema>;

// Chore Schema
export const ChoreSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  parentId: z.string().uuid(),
  title: z.string().min(1, 'Chore title is required').max(100),
  description: z.string().max(500).optional(),
  reward: z.number().positive('Chore reward must be positive'),
  isCompleted: z.boolean().default(false),
  completedAt: z.date().optional(),
  approvedAt: z.date().optional(),
  dueDate: z.date().optional(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['daily', 'weekly', 'monthly']).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).refine((data) => {
  // If recurring, must have recurring period
  if (data.isRecurring && !data.recurringPeriod) {
    return false;
  }
  return true;
}, {
  message: "Recurring chores must have a recurring period",
  path: ["recurringPeriod"],
});

export type Chore = z.infer<typeof ChoreSchema>;

// Input schemas for creating new records - simplified to avoid omit() issues
export const ParentChildLinkInputSchema = z.object({
  parentId: z.string().uuid(),
  childId: z.string().uuid(),
  relationshipType: z.enum(['parent', 'guardian', 'family_member']).default('parent'),
  permissions: z.array(z.string()).default([]),
});

export type ParentChildLinkInput = z.infer<typeof ParentChildLinkInputSchema>;

export const ApprovalRequestInputSchema = z.object({
  childId: z.string().uuid(),
  parentId: z.string().uuid(),
  requestType: z.enum(['expense', 'goal', 'purchase', 'allowance_increase']),
  amount: z.number().positive().optional(),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export type ApprovalRequestInput = z.infer<typeof ApprovalRequestInputSchema>;

export const AllowanceConfigInputSchema = z.object({
  childId: z.string().uuid(),
  parentId: z.string().uuid(),
  amount: z.number().positive(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  isActive: z.boolean().default(true),
});

export type AllowanceConfigInput = z.infer<typeof AllowanceConfigInputSchema>;

export const ChildActivityInputSchema = z.object({
  childId: z.string().uuid(),
  activityType: z.enum(['login', 'expense_added', 'goal_created', 'income_added', 'chore_completed']),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type ChildActivityInput = z.infer<typeof ChildActivityInputSchema>;

export const RestrictionConfigInputSchema = z.object({
  childId: z.string().uuid(),
  parentId: z.string().uuid(),
  maxDailySpending: z.number().min(0).optional(),
  maxWeeklySpending: z.number().min(0).optional(),
  maxMonthlySpending: z.number().min(0).optional(),
  blockedCategories: z.array(z.string()).default([]),
  requiresApproval: z.boolean().default(false),
  approvalThreshold: z.number().min(0).optional(),
});

export type RestrictionConfigInput = z.infer<typeof RestrictionConfigInputSchema>;

export const ChoreInputSchema = z.object({
  childId: z.string().uuid(),
  parentId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  reward: z.number().positive(),
  dueDate: z.date().optional(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export type ChoreInput = z.infer<typeof ChoreInputSchema>;

// Validation functions
export const validateParentChildLink = (data: unknown): ParentChildLink => {
  return ParentChildLinkSchema.parse(data);
};

export const validateApprovalRequest = (data: unknown): ApprovalRequest => {
  return ApprovalRequestSchema.parse(data);
};

export const validateAllowanceConfig = (data: unknown): AllowanceConfig => {
  return AllowanceConfigSchema.parse(data);
};

export const validateChildActivity = (data: unknown): ChildActivity => {
  return ChildActivitySchema.parse(data);
};

export const validateRestrictionConfig = (data: unknown): RestrictionConfig => {
  return RestrictionConfigSchema.parse(data);
};

export const validateChore = (data: unknown): Chore => {
  return ChoreSchema.parse(data);
};

export const validateParentChildLinkInput = (data: unknown): ParentChildLinkInput => {
  return ParentChildLinkInputSchema.parse(data);
};

export const validateApprovalRequestInput = (data: unknown): ApprovalRequestInput => {
  return ApprovalRequestInputSchema.parse(data);
};

export const validateAllowanceConfigInput = (data: unknown): AllowanceConfigInput => {
  return AllowanceConfigInputSchema.parse(data);
};

export const validateChildActivityInput = (data: unknown): ChildActivityInput => {
  return ChildActivityInputSchema.parse(data);
};

export const validateRestrictionConfigInput = (data: unknown): RestrictionConfigInput => {
  return RestrictionConfigInputSchema.parse(data);
};

export const validateChoreInput = (data: unknown): ChoreInput => {
  return ChoreInputSchema.parse(data);
};