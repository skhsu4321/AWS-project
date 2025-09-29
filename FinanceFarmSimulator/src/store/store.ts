import {configureStore} from '@reduxjs/toolkit';
import {authSlice} from './slices/authSlice';
import {farmSlice} from './slices/farmSlice';
import {financialSlice} from './slices/financialSlice';
import {uiSlice} from './slices/uiSlice';
import {syncSlice} from './slices/syncSlice';
import errorReducer from './slices/errorSlice';

// Simple network slice to prevent errors
const networkSlice = {
  name: 'network',
  reducer: (state = { isOnline: true }, action: any) => {
    switch (action.type) {
      case 'network/setOffline':
        return { ...state, isOnline: false };
      case 'network/setOnline':
        return { ...state, isOnline: true };
      default:
        return state;
    }
  }
};

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    farm: farmSlice.reducer,
    financial: financialSlice.reducer,
    ui: uiSlice.reducer,
    sync: syncSlice.reducer,
    error: errorReducer,
    network: networkSlice.reducer,
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