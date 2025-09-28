import {configureStore} from '@reduxjs/toolkit';
import {authSlice} from './slices/authSlice';
import {farmSlice} from './slices/farmSlice';
import {financialSlice} from './slices/financialSlice';
import {uiSlice} from './slices/uiSlice';
import {syncSlice} from './slices/syncSlice';
import errorReducer from './slices/errorSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    farm: farmSlice.reducer,
    financial: financialSlice.reducer,
    ui: uiSlice.reducer,
    sync: syncSlice.reducer,
    error: errorReducer,
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