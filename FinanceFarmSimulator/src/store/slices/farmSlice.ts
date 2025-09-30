import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import { Farm, Crop } from '../../models/Game';

interface FarmState {
  farm: Farm | null;
  currentFarm: Farm | null;
  loading: boolean;
  error: string | null;
}

const initialState: FarmState = {
  farm: null,
  currentFarm: null,
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
    setFarm: (state, action: PayloadAction<Farm | null>) => {
      state.farm = action.payload;
      state.currentFarm = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateFarm: (state, action: PayloadAction<Farm>) => {
      state.farm = action.payload;
      state.currentFarm = action.payload;
      state.error = null;
    },
    updateFarmHealth: (state, action: PayloadAction<number>) => {
      if (state.farm) {
        state.farm.healthScore = action.payload;
      }
    },
    updateCrop: (state, action: PayloadAction<Crop>) => {
      if (state.farm) {
        const cropIndex = state.farm.crops.findIndex(crop => crop.id === action.payload.id);
        if (cropIndex !== -1) {
          state.farm.crops[cropIndex] = action.payload;
        } else {
          state.farm.crops.push(action.payload);
        }
      }
    },
    removeCrop: (state, action: PayloadAction<string>) => {
      if (state.farm) {
        state.farm.crops = state.farm.crops.filter(crop => crop.id !== action.payload);
      }
    },
  },
});

export const {
  setLoading, 
  setError, 
  setFarm, 
  updateFarm,
  updateFarmHealth,
  updateCrop,
  removeCrop
} = farmSlice.actions;

// Alias for backward compatibility
export const updateFarmState = updateFarm;
export const updateCropGrowth = updateCrop;