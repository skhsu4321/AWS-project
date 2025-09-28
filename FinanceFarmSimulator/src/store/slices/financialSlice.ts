import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import { SavingsGoal, Expense, Income } from '../../models/Financial';

interface FinancialState {
  goals: SavingsGoal[];
  expenses: Expense[];
  income: Income[];
  loading: boolean;
  error: string | null;
}

const initialState: FinancialState = {
  goals: [],
  expenses: [],
  income: [],
  loading: false,
  error: null,
};

export const financialSlice = createSlice({
  name: 'financial',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setGoals: (state, action: PayloadAction<SavingsGoal[]>) => {
      state.goals = action.payload;
    },
    addGoal: (state, action: PayloadAction<SavingsGoal>) => {
      state.goals.push(action.payload);
    },
    updateGoal: (state, action: PayloadAction<SavingsGoal>) => {
      const index = state.goals.findIndex(goal => goal.id === action.payload.id);
      if (index !== -1) {
        state.goals[index] = action.payload;
      }
    },
    removeGoal: (state, action: PayloadAction<string>) => {
      state.goals = state.goals.filter(goal => goal.id !== action.payload);
    },
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
    },
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.unshift(action.payload); // Add to beginning for chronological order
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex(expense => expense.id === action.payload.id);
      if (index !== -1) {
        state.expenses[index] = action.payload;
      }
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
    },
    setIncome: (state, action: PayloadAction<Income[]>) => {
      state.income = action.payload;
    },
    addIncome: (state, action: PayloadAction<Income>) => {
      state.income.unshift(action.payload);
    },
    updateIncome: (state, action: PayloadAction<Income>) => {
      const index = state.income.findIndex(income => income.id === action.payload.id);
      if (index !== -1) {
        state.income[index] = action.payload;
      }
    },
    removeIncome: (state, action: PayloadAction<string>) => {
      state.income = state.income.filter(income => income.id !== action.payload);
    },
  },
});

export const {
  setLoading, 
  setError, 
  setGoals, 
  addGoal, 
  updateGoal, 
  removeGoal,
  setExpenses, 
  addExpense, 
  updateExpense, 
  removeExpense,
  setIncome,
  addIncome,
  updateIncome,
  removeIncome
} = financialSlice.actions;