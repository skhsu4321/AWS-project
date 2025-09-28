import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppError } from '../../services/ErrorHandlingService';

interface ErrorState {
  errors: AppError[];
  currentError: AppError | null;
  isShowingError: boolean;
}

const initialState: ErrorState = {
  errors: [],
  currentError: null,
  isShowingError: false,
};

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<AppError>) => {
      state.errors.push(action.payload);
      if (!state.currentError) {
        state.currentError = action.payload;
        state.isShowingError = true;
      }
    },
    clearError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter(error => error.id !== action.payload);
      if (state.currentError?.id === action.payload) {
        state.currentError = state.errors.length > 0 ? state.errors[0] : null;
        state.isShowingError = state.currentError !== null;
      }
    },
    clearAllErrors: (state) => {
      state.errors = [];
      state.currentError = null;
      state.isShowingError = false;
    },
    dismissCurrentError: (state) => {
      state.isShowingError = false;
    },
  },
});

export const { setError, clearError, clearAllErrors, dismissCurrentError } = errorSlice.actions;
export default errorSlice.reducer;