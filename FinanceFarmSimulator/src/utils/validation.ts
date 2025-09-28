// Validation utility functions

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateAge = (age: number): boolean => {
  return age >= 6 && age <= 100;
};

export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000;
};

export const validateGoalTitle = (title: string): boolean => {
  return title.trim().length >= 3 && title.trim().length <= 50;
};

export const validateExpenseDescription = (description: string): boolean => {
  return description.trim().length >= 1 && description.trim().length <= 100;
};