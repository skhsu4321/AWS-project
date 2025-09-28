import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface FarmState {
  farm: null | {
    id: string;
    userId: string;
    crops: any[];
    healthScore: number;
    level: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: FarmState = {
  farm: null,
  loading: false,
  error: null,
};

export const farmSlice = createSlice({
  name: 'farm',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFarm: (state, action: PayloadAction<FarmState['farm']>) => {
      state.farm = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateFarmHealth: (state, action: PayloadAction<number>) => {
      if (state.farm) {
        state.farm.healthScore = action.payload;
      }
    },
  },
});

export const {setLoading, setError, setFarm, updateFarmHealth} =
  farmSlice.actions;