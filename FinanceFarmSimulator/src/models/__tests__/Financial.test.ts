import {
  SavingsGoal,
  Expense,
  Income,
  GoalCategory,
  GoalStatus,
  ExpenseCategory,
  IncomeSource,
  validateSavingsGoal,
  validateExpense,
  validateIncome,
  validateSavingsGoalInput,
  validateExpenseInput,
  validateIncomeInput,
  SavingsGoalSchema,
  ExpenseSchema,
  IncomeSchema,
} from '../Financial';

describe('Financial Models', () => {
  describe('SavingsGoal', () => {
    const validSavingsGoal: SavingsGoal = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Emergency Fund',
      description: 'Save for unexpected expenses',
      targetAmount: 10000,
      currentAmount: 2500,
      deadline: new Date('2024-12-31'),
      category: GoalCategory.EMERGENCY_FUND,
      cropType: 'tomato',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: GoalStatus.ACTIVE,
      isRecurring: false,
    };

    it('should validate a valid savings goal', () => {
      expect(() => validateSavingsGoal(validSavingsGoal)).not.toThrow();
    });

    it('should require positive target amount', () => {
      const invalidGoal = { ...validSavingsGoal, targetAmount: -100 };
      expect(() => validateSavingsGoal(invalidGoal)).toThrow('Target amount must be positive');
    });

    it('should require non-negative current amount', () => {
      const invalidGoal = { ...validSavingsGoal, currentAmount: -50 };
      expect(() => validateSavingsGoal(invalidGoal)).toThrow();
    });

    it('should require title', () => {
      const invalidGoal = { ...validSavingsGoal, title: '' };
      expect(() => validateSavingsGoal(invalidGoal)).toThrow('Goal title is required');
    });

    it('should limit title length', () => {
      const longTitle = 'a'.repeat(101);
      const invalidGoal = { ...validSavingsGoal, title: longTitle };
      expect(() => validateSavingsGoal(invalidGoal)).toThrow();
    });

    it('should set default values', () => {
      const minimalGoal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test Goal',
        targetAmount: 1000,
        deadline: new Date('2024-12-31'),
        category: GoalCategory.OTHER,
        cropType: 'carrot',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = SavingsGoalSchema.parse(minimalGoal);
      expect(result.currentAmount).toBe(0);
      expect(result.status).toBe(GoalStatus.ACTIVE);
      expect(result.isRecurring).toBe(false);
    });

    it('should validate recurring goals have period', () => {
      const recurringGoal = {
        ...validSavingsGoal,
        isRecurring: true,
        // Missing recurringPeriod
      };
      expect(() => validateSavingsGoal(recurringGoal)).toThrow('Recurring goals must have a recurring period');
    });

    it('should allow recurring goals with period', () => {
      const recurringGoal = {
        ...validSavingsGoal,
        isRecurring: true,
        recurringPeriod: 'monthly' as const,
      };
      expect(() => validateSavingsGoal(recurringGoal)).not.toThrow();
    });
  });

  describe('Expense', () => {
    const validExpense: Expense = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 50.75,
      category: ExpenseCategory.FOOD,
      description: 'Lunch at restaurant',
      date: new Date(),
      isRecurring: false,
      tags: ['restaurant', 'lunch'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate a valid expense', () => {
      expect(() => validateExpense(validExpense)).not.toThrow();
    });

    it('should require positive amount', () => {
      const invalidExpense = { ...validExpense, amount: -10 };
      expect(() => validateExpense(invalidExpense)).toThrow('Expense amount must be positive');
    });

    it('should require description', () => {
      const invalidExpense = { ...validExpense, description: '' };
      expect(() => validateExpense(invalidExpense)).toThrow('Description is required');
    });

    it('should limit description length', () => {
      const longDescription = 'a'.repeat(201);
      const invalidExpense = { ...validExpense, description: longDescription };
      expect(() => validateExpense(invalidExpense)).toThrow();
    });

    it('should set default values', () => {
      const minimalExpense = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 25.50,
        category: ExpenseCategory.TRANSPORT,
        description: 'Bus fare',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = ExpenseSchema.parse(minimalExpense);
      expect(result.isRecurring).toBe(false);
      expect(result.tags).toEqual([]);
    });

    it('should validate recurring expenses have period', () => {
      const recurringExpense = {
        ...validExpense,
        isRecurring: true,
        // Missing recurringPeriod
      };
      expect(() => validateExpense(recurringExpense)).toThrow('Recurring expenses must have a recurring period');
    });
  });

  describe('Income', () => {
    const validIncome: Income = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 5000,
      source: IncomeSource.SALARY,
      description: 'Monthly salary',
      date: new Date(),
      isRecurring: true,
      recurringPeriod: 'monthly',
      multiplier: 1.5,
      streakCount: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate a valid income', () => {
      expect(() => validateIncome(validIncome)).not.toThrow();
    });

    it('should require positive amount', () => {
      const invalidIncome = { ...validIncome, amount: -100 };
      expect(() => validateIncome(invalidIncome)).toThrow('Income amount must be positive');
    });

    it('should require description', () => {
      const invalidIncome = { ...validIncome, description: '' };
      expect(() => validateIncome(invalidIncome)).toThrow('Description is required');
    });

    it('should validate multiplier range', () => {
      const lowMultiplier = { ...validIncome, multiplier: 0.5 };
      const highMultiplier = { ...validIncome, multiplier: 15 };
      
      expect(() => validateIncome(lowMultiplier)).toThrow();
      expect(() => validateIncome(highMultiplier)).toThrow();
    });

    it('should set default values', () => {
      const minimalIncome = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000,
        source: IncomeSource.ALLOWANCE,
        description: 'Weekly allowance',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = IncomeSchema.parse(minimalIncome);
      expect(result.isRecurring).toBe(false);
      expect(result.multiplier).toBe(1);
      expect(result.streakCount).toBe(0);
    });

    it('should validate recurring income has period', () => {
      const recurringIncome = {
        ...validIncome,
        isRecurring: true,
        recurringPeriod: undefined,
      };
      expect(() => validateIncome(recurringIncome)).toThrow('Recurring income must have a recurring period');
    });
  });

  describe('Input Validation', () => {
    it('should validate savings goal input', () => {
      const goalInput = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'New Goal',
        targetAmount: 1000,
        deadline: new Date('2024-12-31'),
        category: GoalCategory.VACATION,
        cropType: 'corn',
      };
      
      expect(() => validateSavingsGoalInput(goalInput)).not.toThrow();
    });

    it('should validate expense input', () => {
      const expenseInput = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 25.50,
        category: ExpenseCategory.FOOD,
        description: 'Coffee',
        date: new Date(),
        isRecurring: false,
        tags: ['coffee'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(() => validateExpenseInput(expenseInput)).not.toThrow();
    });

    it('should validate income input', () => {
      const incomeInput = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 500,
        source: IncomeSource.CHORES,
        description: 'Weekly chores',
        date: new Date(),
        isRecurring: true,
        recurringPeriod: 'weekly' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(() => validateIncomeInput(incomeInput)).not.toThrow();
    });
  });
});