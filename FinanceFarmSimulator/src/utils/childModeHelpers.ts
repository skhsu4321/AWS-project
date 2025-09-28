/**
 * Utility functions for child mode interface and calculations
 */

export interface SimplifiedMathOperation {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  operand1: number;
  operand2: number;
  result: number;
  explanation: string;
}

/**
 * Formats numbers in a child-friendly way with appropriate precision
 */
export const formatChildFriendlyNumber = (
  amount: number,
  currency: string = 'HKD',
  showDecimals: boolean = true
): string => {
  // For children, we typically want to avoid too many decimal places
  const precision = showDecimals && amount % 1 !== 0 ? 2 : 0;
  const formatted = amount.toFixed(precision);
  
  // Add currency symbol based on currency type
  const currencySymbol = getCurrencySymbol(currency);
  
  return `${currencySymbol}${formatted}`;
};

/**
 * Gets appropriate currency symbol for display
 */
export const getCurrencySymbol = (currency: string): string => {
  switch (currency.toUpperCase()) {
    case 'HKD':
      return 'HK$';
    case 'USD':
      return '$';
    case 'CNY':
      return '¥';
    default:
      return '$';
  }
};

/**
 * Simplifies mathematical operations for child understanding
 */
export const createSimplifiedMathOperation = (
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
  operand1: number,
  operand2: number
): SimplifiedMathOperation => {
  let result: number;
  let explanation: string;

  switch (operation) {
    case 'add':
      result = operand1 + operand2;
      explanation = `${operand1} + ${operand2} = ${result}`;
      break;
    case 'subtract':
      result = operand1 - operand2;
      explanation = `${operand1} - ${operand2} = ${result}`;
      break;
    case 'multiply':
      result = operand1 * operand2;
      explanation = `${operand1} × ${operand2} = ${result}`;
      break;
    case 'divide':
      result = operand2 !== 0 ? operand1 / operand2 : 0;
      explanation = operand2 !== 0 
        ? `${operand1} ÷ ${operand2} = ${result}`
        : 'Cannot divide by zero';
      break;
    default:
      result = operand1;
      explanation = `${operand1}`;
  }

  return {
    operation,
    operand1,
    operand2,
    result,
    explanation,
  };
};

/**
 * Calculates progress percentage in a child-friendly way
 */
export const calculateChildFriendlyProgress = (
  current: number,
  target: number
): {
  percentage: number;
  description: string;
  emoji: string;
} => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  let description: string;
  let emoji: string;

  if (percentage >= 100) {
    description = "You did it! Goal complete! 🎉";
    emoji = "🎉";
  } else if (percentage >= 75) {
    description = "Almost there! You're so close! 💪";
    emoji = "💪";
  } else if (percentage >= 50) {
    description = "Great job! You're halfway there! 👍";
    emoji = "👍";
  } else if (percentage >= 25) {
    description = "Good start! Keep going! 🌱";
    emoji = "🌱";
  } else if (percentage > 0) {
    description = "Nice beginning! Every bit counts! ⭐";
    emoji = "⭐";
  } else {
    description = "Ready to start? Let's go! 🚀";
    emoji = "🚀";
  }

  return {
    percentage: Math.round(percentage),
    description,
    emoji,
  };
};

/**
 * Converts adult financial terms to child-friendly language
 */
export const getChildFriendlyTerm = (adultTerm: string): string => {
  const termMap: Record<string, string> = {
    'savings': 'money you keep safe',
    'expenses': 'money you spend',
    'income': 'money you earn',
    'budget': 'your money plan',
    'interest': 'extra money for saving',
    'goal': 'something you want to buy',
    'allowance': 'weekly money from parents',
    'chore': 'helpful task',
    'reward': 'prize for good work',
    'deposit': 'putting money in',
    'withdrawal': 'taking money out',
    'balance': 'how much money you have',
    'transaction': 'money moving',
    'investment': 'money that grows',
    'debt': 'money you owe',
    'credit': 'borrowed money',
    'debit': 'your own money',
  };

  return termMap[adultTerm.toLowerCase()] || adultTerm;
};

/**
 * Generates age-appropriate explanations for financial concepts
 */
export const generateChildExplanation = (
  concept: string,
  amount?: number,
  context?: string
): string => {
  const explanations: Record<string, (amount?: number, context?: string) => string> = {
    savings: (amount, context) => 
      amount 
        ? `You have ${formatChildFriendlyNumber(amount)} saved up! That's money you're keeping safe for something special.`
        : "Saving means keeping some of your money instead of spending it all. It's like putting money in a piggy bank!",
    
    expenses: (amount, context) =>
      amount
        ? `You spent ${formatChildFriendlyNumber(amount)}${context ? ` on ${context}` : ''}. That's money that went out of your piggy bank.`
        : "Expenses are things you buy with your money, like toys, snacks, or clothes.",
    
    income: (amount, context) =>
      amount
        ? `You earned ${formatChildFriendlyNumber(amount)}${context ? ` from ${context}` : ''}! That's new money coming into your piggy bank.`
        : "Income is money that comes to you, like allowance or money from doing chores.",
    
    goal: (amount, context) =>
      amount
        ? `Your goal is to save ${formatChildFriendlyNumber(amount)}${context ? ` for ${context}` : ''}. That's what you're working towards!`
        : "A goal is something special you want to buy or save for in the future.",
    
    budget: () =>
      "A budget is like a plan for your money. It helps you decide how much to spend on different things and how much to save.",
    
    chore: (amount, context) =>
      amount
        ? `This chore will earn you ${formatChildFriendlyNumber(amount)}! That's your reward for helping out.`
        : "Chores are helpful tasks you can do to earn money and help your family.",
  };

  const explainer = explanations[concept.toLowerCase()];
  return explainer ? explainer(amount, context) : `${concept} is an important part of managing your money!`;
};

/**
 * Determines if an amount is appropriate for child mode (not too complex)
 */
export const isChildAppropriateAmount = (amount: number): boolean => {
  // Avoid very large numbers or too many decimal places for children
  return amount <= 10000 && (amount % 0.01 === 0); // Max $10,000 and max 2 decimal places
};

/**
 * Suggests simplified amounts for child mode
 */
export const suggestChildFriendlyAmount = (amount: number): number => {
  // Round to nearest dollar for simplicity if over $10
  if (amount > 10) {
    return Math.round(amount);
  }
  
  // Round to nearest 50 cents if under $10
  return Math.round(amount * 2) / 2;
};

/**
 * Creates encouraging messages for child progress
 */
export const generateEncouragementMessage = (
  progressPercentage: number,
  context: 'goal' | 'chore' | 'saving' | 'general' = 'general'
): string => {
  const messages: Record<string, string[]> = {
    goal: [
      "You're doing amazing! Keep saving! 🌟",
      "Every dollar gets you closer to your goal! 💪",
      "You're such a good saver! 🏆",
      "Your goal is getting closer! 🎯",
    ],
    chore: [
      "Great job helping out! 👏",
      "You're such a good helper! ⭐",
      "Your hard work is paying off! 💪",
      "Keep up the awesome work! 🌟",
    ],
    saving: [
      "Your piggy bank is growing! 🐷",
      "You're becoming a saving superstar! ⭐",
      "Every bit you save counts! 💰",
      "You're learning to be smart with money! 🧠",
    ],
    general: [
      "You're doing great! 🎉",
      "Keep up the good work! 👍",
      "You should be proud! 🌟",
      "You're learning so much! 📚",
    ],
  };

  const contextMessages = messages[context] || messages.general;
  const randomIndex = Math.floor(Math.random() * contextMessages.length);
  
  return contextMessages[randomIndex];
};

/**
 * Validates input for child mode (prevents inappropriate values)
 */
export const validateChildInput = (
  value: string,
  type: 'amount' | 'text' | 'age'
): {
  isValid: boolean;
  error?: string;
  suggestion?: string;
} => {
  switch (type) {
    case 'amount':
      const amount = parseFloat(value);
      if (isNaN(amount)) {
        return {
          isValid: false,
          error: "Please enter a number",
          suggestion: "Try typing just numbers, like 5 or 10.50",
        };
      }
      if (amount < 0) {
        return {
          isValid: false,
          error: "Amount can't be negative",
          suggestion: "Enter a positive number like 5 or 10",
        };
      }
      if (amount > 10000) {
        return {
          isValid: false,
          error: "That's a very big number!",
          suggestion: "Try a smaller amount, like under $1000",
        };
      }
      if (!isChildAppropriateAmount(amount)) {
        return {
          isValid: true,
          suggestion: `How about ${formatChildFriendlyNumber(suggestChildFriendlyAmount(amount))} instead?`,
        };
      }
      return { isValid: true };
      
    case 'text':
      if (value.length > 100) {
        return {
          isValid: false,
          error: "That's too long!",
          suggestion: "Try to keep it shorter, like a sentence or two",
        };
      }
      return { isValid: true };
      
    case 'age':
      const age = parseInt(value);
      if (isNaN(age) || age < 6 || age > 17) {
        return {
          isValid: false,
          error: "Please enter an age between 6 and 17",
        };
      }
      return { isValid: true };
      
    default:
      return { isValid: true };
  }
};