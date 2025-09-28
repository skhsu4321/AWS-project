import {
  formatChildFriendlyNumber,
  getCurrencySymbol,
  createSimplifiedMathOperation,
  calculateChildFriendlyProgress,
  getChildFriendlyTerm,
  generateChildExplanation,
  isChildAppropriateAmount,
  suggestChildFriendlyAmount,
  generateEncouragementMessage,
  validateChildInput,
} from '../childModeHelpers';

describe('childModeHelpers', () => {
  describe('formatChildFriendlyNumber', () => {
    it('formats whole numbers without decimals', () => {
      expect(formatChildFriendlyNumber(10, 'HKD', false)).toBe('HK$10');
      expect(formatChildFriendlyNumber(100, 'USD', false)).toBe('$100');
    });

    it('formats decimal numbers with appropriate precision', () => {
      expect(formatChildFriendlyNumber(10.50, 'HKD', true)).toBe('HK$10.50');
      expect(formatChildFriendlyNumber(10.00, 'HKD', true)).toBe('HK$10');
    });

    it('uses correct currency symbols', () => {
      expect(formatChildFriendlyNumber(10, 'HKD')).toBe('HK$10');
      expect(formatChildFriendlyNumber(10, 'USD')).toBe('$10');
      expect(formatChildFriendlyNumber(10, 'CNY')).toBe('¥10');
    });
  });

  describe('getCurrencySymbol', () => {
    it('returns correct symbols for supported currencies', () => {
      expect(getCurrencySymbol('HKD')).toBe('HK$');
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('CNY')).toBe('¥');
    });

    it('returns default symbol for unsupported currencies', () => {
      expect(getCurrencySymbol('EUR')).toBe('$');
      expect(getCurrencySymbol('GBP')).toBe('$');
    });

    it('handles case insensitive input', () => {
      expect(getCurrencySymbol('hkd')).toBe('HK$');
      expect(getCurrencySymbol('usd')).toBe('$');
    });
  });

  describe('createSimplifiedMathOperation', () => {
    it('performs addition correctly', () => {
      const result = createSimplifiedMathOperation('add', 5, 3);
      expect(result.result).toBe(8);
      expect(result.explanation).toBe('5 + 3 = 8');
    });

    it('performs subtraction correctly', () => {
      const result = createSimplifiedMathOperation('subtract', 10, 4);
      expect(result.result).toBe(6);
      expect(result.explanation).toBe('10 - 4 = 6');
    });

    it('performs multiplication correctly', () => {
      const result = createSimplifiedMathOperation('multiply', 6, 7);
      expect(result.result).toBe(42);
      expect(result.explanation).toBe('6 × 7 = 42');
    });

    it('performs division correctly', () => {
      const result = createSimplifiedMathOperation('divide', 15, 3);
      expect(result.result).toBe(5);
      expect(result.explanation).toBe('15 ÷ 3 = 5');
    });

    it('handles division by zero', () => {
      const result = createSimplifiedMathOperation('divide', 10, 0);
      expect(result.result).toBe(0);
      expect(result.explanation).toBe('Cannot divide by zero');
    });
  });

  describe('calculateChildFriendlyProgress', () => {
    it('calculates progress percentage correctly', () => {
      const result = calculateChildFriendlyProgress(25, 100);
      expect(result.percentage).toBe(25);
      expect(result.emoji).toBe('🌱');
      expect(result.description).toContain('Good start');
    });

    it('handles completed goals', () => {
      const result = calculateChildFriendlyProgress(100, 100);
      expect(result.percentage).toBe(100);
      expect(result.emoji).toBe('🎉');
      expect(result.description).toContain('You did it');
    });

    it('handles over-completion', () => {
      const result = calculateChildFriendlyProgress(150, 100);
      expect(result.percentage).toBe(100);
      expect(result.emoji).toBe('🎉');
    });

    it('handles zero target', () => {
      const result = calculateChildFriendlyProgress(50, 0);
      expect(result.percentage).toBe(0);
    });

    it('provides appropriate encouragement for different progress levels', () => {
      expect(calculateChildFriendlyProgress(0, 100).emoji).toBe('🚀');
      expect(calculateChildFriendlyProgress(10, 100).emoji).toBe('⭐');
      expect(calculateChildFriendlyProgress(30, 100).emoji).toBe('🌱');
      expect(calculateChildFriendlyProgress(60, 100).emoji).toBe('👍');
      expect(calculateChildFriendlyProgress(80, 100).emoji).toBe('💪');
      expect(calculateChildFriendlyProgress(100, 100).emoji).toBe('🎉');
    });
  });

  describe('getChildFriendlyTerm', () => {
    it('converts adult terms to child-friendly language', () => {
      expect(getChildFriendlyTerm('savings')).toBe('money you keep safe');
      expect(getChildFriendlyTerm('expenses')).toBe('money you spend');
      expect(getChildFriendlyTerm('income')).toBe('money you earn');
      expect(getChildFriendlyTerm('budget')).toBe('your money plan');
    });

    it('handles case insensitive input', () => {
      expect(getChildFriendlyTerm('SAVINGS')).toBe('money you keep safe');
      expect(getChildFriendlyTerm('Expenses')).toBe('money you spend');
    });

    it('returns original term if no mapping exists', () => {
      expect(getChildFriendlyTerm('cryptocurrency')).toBe('cryptocurrency');
    });
  });

  describe('generateChildExplanation', () => {
    it('generates explanations with amounts', () => {
      const explanation = generateChildExplanation('savings', 50);
      expect(explanation).toContain('$50');
      expect(explanation).toContain('saved up');
    });

    it('generates explanations without amounts', () => {
      const explanation = generateChildExplanation('savings');
      expect(explanation).toContain('Saving means');
      expect(explanation).toContain('piggy bank');
    });

    it('includes context when provided', () => {
      const explanation = generateChildExplanation('expenses', 20, 'toys');
      expect(explanation).toContain('$20');
      expect(explanation).toContain('on toys');
    });

    it('handles unknown concepts gracefully', () => {
      const explanation = generateChildExplanation('unknown');
      expect(explanation).toContain('unknown is an important part');
    });
  });

  describe('isChildAppropriateAmount', () => {
    it('accepts reasonable amounts', () => {
      expect(isChildAppropriateAmount(10)).toBe(true);
      expect(isChildAppropriateAmount(100.50)).toBe(true);
      expect(isChildAppropriateAmount(1000)).toBe(true);
    });

    it('rejects very large amounts', () => {
      expect(isChildAppropriateAmount(50000)).toBe(false);
    });

    it('accepts amounts with up to 2 decimal places', () => {
      expect(isChildAppropriateAmount(10.99)).toBe(true);
      expect(isChildAppropriateAmount(10.5)).toBe(true);
    });
  });

  describe('suggestChildFriendlyAmount', () => {
    it('rounds large amounts to nearest dollar', () => {
      expect(suggestChildFriendlyAmount(15.67)).toBe(16);
      expect(suggestChildFriendlyAmount(99.23)).toBe(99);
    });

    it('rounds small amounts to nearest 50 cents', () => {
      expect(suggestChildFriendlyAmount(5.23)).toBe(5);
      expect(suggestChildFriendlyAmount(7.67)).toBe(7.5);
      expect(suggestChildFriendlyAmount(3.25)).toBe(3.5);
    });
  });

  describe('generateEncouragementMessage', () => {
    it('returns appropriate messages for different contexts', () => {
      const goalMessage = generateEncouragementMessage(50, 'goal');
      const choreMessage = generateEncouragementMessage(50, 'chore');
      const savingMessage = generateEncouragementMessage(50, 'saving');
      const generalMessage = generateEncouragementMessage(50, 'general');

      expect(typeof goalMessage).toBe('string');
      expect(typeof choreMessage).toBe('string');
      expect(typeof savingMessage).toBe('string');
      expect(typeof generalMessage).toBe('string');

      expect(goalMessage.length).toBeGreaterThan(0);
      expect(choreMessage.length).toBeGreaterThan(0);
      expect(savingMessage.length).toBeGreaterThan(0);
      expect(generalMessage.length).toBeGreaterThan(0);
    });
  });

  describe('validateChildInput', () => {
    describe('amount validation', () => {
      it('accepts valid amounts', () => {
        const result = validateChildInput('10.50', 'amount');
        expect(result.isValid).toBe(true);
      });

      it('rejects non-numeric input', () => {
        const result = validateChildInput('abc', 'amount');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('number');
      });

      it('rejects negative amounts', () => {
        const result = validateChildInput('-10', 'amount');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('negative');
      });

      it('rejects very large amounts', () => {
        const result = validateChildInput('50000', 'amount');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('big number');
      });

      it('suggests simplified amounts', () => {
        const result = validateChildInput('10.67', 'amount');
        expect(result.isValid).toBe(true);
        expect(result.suggestion).toContain('$11');
      });
    });

    describe('text validation', () => {
      it('accepts reasonable text length', () => {
        const result = validateChildInput('This is a reasonable text', 'text');
        expect(result.isValid).toBe(true);
      });

      it('rejects very long text', () => {
        const longText = 'a'.repeat(150);
        const result = validateChildInput(longText, 'text');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('too long');
      });
    });

    describe('age validation', () => {
      it('accepts valid ages', () => {
        expect(validateChildInput('8', 'age').isValid).toBe(true);
        expect(validateChildInput('12', 'age').isValid).toBe(true);
        expect(validateChildInput('16', 'age').isValid).toBe(true);
      });

      it('rejects invalid ages', () => {
        expect(validateChildInput('5', 'age').isValid).toBe(false);
        expect(validateChildInput('18', 'age').isValid).toBe(false);
        expect(validateChildInput('abc', 'age').isValid).toBe(false);
      });
    });
  });
});