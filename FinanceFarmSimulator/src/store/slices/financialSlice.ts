import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface FinancialState {
  goals: any[];
  expenses: any[];
  income: any[];
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
    setGoals: (state, action: PayloadAction<any[]>) => {
      state.goals = action.payload;
    },
    addGoal: (state, action: PayloadAction<any>) => {
      state.goals.push(action.payload);
    },
    setExpenses: (state, action: PayloadAction<any[]>) => {
      state.expenses = action.payload;
    },
    addExpense: (state, action: PayloadAction<any>) => {
      state.expenses.push(action.payload);
    },
  },
});

export const {setLoading, setError, setGoals, addGoal, setExpenses, addExpense} =
  financialSlice.actions;