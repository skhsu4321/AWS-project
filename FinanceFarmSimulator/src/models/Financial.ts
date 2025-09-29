import { z } from 'zod';

// Enums and constants
export enum GoalCategory {
  EMERGENCY_FUND = 'emergency_fund',
  VACATION = 'vacation',
  EDUCATION = 'education',
  GADGET = 'gadget',
  CLOTHING = 'clothing',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  UTILITIES = 'utilities',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  OTHER = 'other',
}

export enum IncomeSource {
  SALARY = 'salary',
  ALLOWANCE = 'allowance',
  CHORES = 'chores',
  GIFT = 'gift',
  BONUS = 'bonus',
  INVESTMENT = 'investment',
  OTHER = 'other',
}

// Savings Goal Schema
export const SavingsGoalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1, 'Goal title is required').max(100),
  description: z.string().max(500).optional(),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0).default(0),
  deadline: z.date(),
  category: z.nativeEnum(GoalCategory),
  cropType: z.string(), // Will be linked to game crop types
  createdAt: z.date(),
  updatedAt: z.date(),
  status: z.nativeEnum(GoalStatus).default(GoalStatus.ACTIVE),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['weekly', 'monthly', 'yearly']).optional(),
}).refine((data) => {
  // If recurring, must have recurring period
  if (data.isRecurring && !data.recurringPeriod) {
    return false;
  }
  return true;
}, {
  message: "Recurring goals must have a recurring period",
  path: ["recurringPeriod"],
});

export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;

// Expense Schema
export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive('Expense amount must be positive'),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1, 'Description is required').max(200),
  date: z.date(),
  receiptImage: z.string().optional(), // Base64 or file path
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['daily', 'weekly', 'monthly']).optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
}).refine((data) => {
  // If recurring, must have recurring period
  if (data.isRecurring && !data.recurringPeriod) {
    return false;
  }
  return true;
}, {
  message: "Recurring expenses must have a recurring period",
  path: ["recurringPeriod"],
});

export type Expense = z.infer<typeof ExpenseSchema>;

// Income Schema
export const IncomeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive('Income amount must be positive'),
  source: z.nativeEnum(IncomeSource),
  description: z.string().min(1, 'Description is required').max(200),
  date: z.date(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['daily', 'weekly', 'monthly']).optional(),
  multiplier: z.number().min(1).max(10).default(1), // For streak bonuses
  streakCount: z.number().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
}).refine((data) => {
  // If recurring, must have recurring period
  if (data.isRecurring && !data.recurringPeriod) {
    return false;
  }
  return true;
}, {
  message: "Recurring income must have a recurring period",
  path: ["recurringPeriod"],
});

export type Income = z.infer<typeof IncomeSchema>;

// Financial Summary Schema
export const FinancialSummarySchema = z.object({
  userId: z.string().uuid(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.date(),
  endDate: z.date(),
  totalIncome: z.number().min(0),
  totalExpenses: z.number().min(0),
  netAmount: z.number(),
  savingsRate: z.number().min(0).max(100), // Percentage
  expensesByCategory: z.record(z.nativeEnum(ExpenseCategory), z.number()),
  incomeBySource: z.record(z.nativeEnum(IncomeSource), z.number()),
  activeGoalsCount: z.number().min(0),
  completedGoalsCount: z.number().min(0),
  generatedAt: z.date(),
});

export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;

// Input schemas for creating new records
export const SavingsGoalInputSchema = SavingsGoalSchema.pick({
  userId: true,
  title: true,
  description: true,
  targetAmount: true,
  deadline: true,
  category: true,
  cropType: true,
  status: true,
  isRecurring: true,
  recurringPeriod: true,
});

export type SavingsGoalInput = z.infer<typeof SavingsGoalInputSchema>;

export const ExpenseInputSchema = ExpenseSchema.pick({
  userId: true,
  amount: true,
  category: true,
  description: true,
  date: true,
  receiptImage: true,
  isRecurring: true,
  recurringPeriod: true,
  tags: true,
});

export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;

export const IncomeInputSchema = IncomeSchema.pick({
  userId: true,
  amount: true,
  source: true,
  description: true,
  date: true,
  isRecurring: true,
  recurringPeriod: true,
});

export type IncomeInput = z.infer<typeof IncomeInputSchema>;

// Validation functions
export const validateSavingsGoal = (data: unknown): SavingsGoal => {
  return SavingsGoalSchema.parse(data);
};

export const validateExpense = (data: unknown): Expense => {
  return ExpenseSchema.parse(data);
};

export const validateIncome = (data: unknown): Income => {
  return IncomeSchema.parse(data);
};

export const validateSavingsGoalInput = (data: unknown): SavingsGoalInput => {
  return SavingsGoalInputSchema.parse(data);
};

export const validateExpenseInput = (data: unknown): ExpenseInput => {
  return ExpenseInputSchema.parse(data);
};

export const validateIncomeInput = (data: unknown): IncomeInput => {
  return IncomeInputSchema.parse(data);
};