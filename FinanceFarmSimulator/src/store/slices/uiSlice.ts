import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  mode: 'adult' | 'child';
  loading: boolean;
  isLoading: boolean;
  notifications: any[];
  activeModals: string[];
}

const initialState: UIState = {
  theme: 'light',
  mode: 'adult',
  loading: false,
  isLoading: false,
  notifications: [],
  activeModals: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setMode: (state, action: PayloadAction<'adult' | 'child'>) => {
      state.mode = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    addNotification: (state, action: PayloadAction<any>) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload,
      );
    },
  },
});

export const {setTheme, setMode, setLoading, addNotification, removeNotification} =
  uiSlice.actions;