import {configureStore} from '@reduxjs/toolkit';
import {authSlice} from './slices/authSlice';
import {farmSlice} from './slices/farmSlice';
import {financialSlice} from './slices/financialSlice';
import {uiSlice} from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    farm: farmSlice.reducer,
    financial: financialSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;