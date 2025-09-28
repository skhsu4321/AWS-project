import { z } from 'zod';

// Import all validation functions from models
export {
  validateUser,
  validateUserProfile,
  validateLoginCredentials,
  validateRegisterCredentials,
} from '../models/User';

export {
  validateSavingsGoal,
  validateExpense,
  validateIncome,
  validateSavingsGoalInput,
  validateExpenseInput,
  validateIncomeInput,
} from '../models/Financial';

export {
  validateCrop,
  validateFarm,
  validateDecoration,
  validateReward,
  validateAchievement,
  validateCropInput,
  validateFarmInput,
  validateDecorationInput,
} from '../models/Game';

// Common validation utilities
export const validateRequired = (value: unknown, fieldName: string): void => {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldName} is required`);
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateAge = (age: number, mode: 'adult' | 'child'): boolean => {
  if (mode === 'child') {
    return age >= 6 && age <= 17;
  }
  return age >= 18 && age <= 120;
};

export const validateAmount = (amount: number): boolean => {
  return amount > 0 && Number.isFinite(amount);
};

export const validateDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateGoalTitle = (title: string): boolean => {
  return title.trim().length >= 3 && title.trim().length <= 50;
};

export const validateExpenseDescription = (description: string): boolean => {
  return description.trim().length >= 1 && description.trim().length <= 100;
};

// Zod-based validation helpers
export const createValidationError = (error: z.ZodError): string => {
  return error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`).join(', ');
};

export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: createValidationError(error) };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};