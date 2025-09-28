import {
  validateEmail,
  validatePassword,
  validateAge,
  validateAmount,
  validateDate,
  validateUUID,
  validateGoalTitle,
  validateExpenseDescription,
  createValidationError,
  safeValidate,
} from '../validation';
import { UserSchema } from '../../models/User';
import { z } from 'zod';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const shortPassword = validatePassword('weak');
      expect(shortPassword.isValid).toBe(false);
      expect(shortPassword.errors).toContain('Password must be at least 8 characters long');

      const noUppercase = validatePassword('lowercase123');
      expect(noUppercase.isValid).toBe(false);
      expect(noUppercase.errors).toContain('Password must contain at least one uppercase letter');

      const noLowercase = validatePassword('UPPERCASE123');
      expect(noLowercase.isValid).toBe(false);
      expect(noLowercase.errors).toContain('Password must contain at least one lowercase letter');

      const noNumber = validatePassword('NoNumbers');
      expect(noNumber.isValid).toBe(false);
      expect(noNumber.errors).toContain('Password must contain at least one number');
    });
  });

  describe('validateAge', () => {
    it('should validate adult ages', () => {
      expect(validateAge(25, 'adult')).toBe(true);
      expect(validateAge(18, 'adult')).toBe(true);
      expect(validateAge(65, 'adult')).toBe(true);
    });

    it('should validate child ages', () => {
      expect(validateAge(8, 'child')).toBe(true);
      expect(validateAge(12, 'child')).toBe(true);
      expect(validateAge(17, 'child')).toBe(true);
    });

    it('should reject invalid ages', () => {
      expect(validateAge(5, 'child')).toBe(false);
      expect(validateAge(18, 'child')).toBe(false);
      expect(validateAge(17, 'adult')).toBe(false);
      expect(validateAge(121, 'adult')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
      expect(validateAmount(999999.99)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(-50)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
      expect(validateAmount(NaN)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate valid dates', () => {
      expect(validateDate(new Date())).toBe(true);
      expect(validateDate(new Date('2024-01-01'))).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate(new Date('invalid'))).toBe(false);
      expect(validateDate(new Date(''))).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUID formats', () => {
      expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(validateUUID('invalid-uuid')).toBe(false);
      expect(validateUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(validateUUID('')).toBe(false);
    });
  });

  describe('validateGoalTitle', () => {
    it('should validate proper goal titles', () => {
      expect(validateGoalTitle('Emergency Fund')).toBe(true);
      expect(validateGoalTitle('Save for vacation')).toBe(true);
    });

    it('should reject invalid goal titles', () => {
      expect(validateGoalTitle('ab')).toBe(false); // Too short
      expect(validateGoalTitle('a'.repeat(51))).toBe(false); // Too long
      expect(validateGoalTitle('   ')).toBe(false); // Only whitespace
    });
  });

  describe('validateExpenseDescription', () => {
    it('should validate proper expense descriptions', () => {
      expect(validateExpenseDescription('Lunch')).toBe(true);
      expect(validateExpenseDescription('Coffee at Starbucks')).toBe(true);
    });

    it('should reject invalid expense descriptions', () => {
      expect(validateExpenseDescription('')).toBe(false); // Empty
      expect(validateExpenseDescription('a'.repeat(101))).toBe(false); // Too long
      expect(validateExpenseDescription('   ')).toBe(false); // Only whitespace
    });
  });

  describe('createValidationError', () => {
    it('should format Zod errors properly', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(18),
      });

      try {
        schema.parse({ name: '', age: 15 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = createValidationError(error);
          expect(formatted).toContain('name:');
          expect(formatted).toContain('age:');
        }
      }
    });
  });

  describe('safeValidate', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(18),
    });

    it('should return success for valid data', () => {
      const result = safeValidate(testSchema, { name: 'John', age: 25 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.age).toBe(25);
      }
    });

    it('should return error for invalid data', () => {
      const result = safeValidate(testSchema, { name: '', age: 15 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('name:');
        expect(result.error).toContain('age:');
      }
    });
  });
});