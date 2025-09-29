import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Simplified types to avoid heavy service imports
interface OfflineStatus {
  isOnline: boolean;
  isConnected: boolean;
  type: string | null;
  details: any;
}

interface SyncStatus {
  isActive: boolean;
  pendingOperations: number;
  lastSyncTime: Date | null;
  syncErrors: string[];
}

interface PendingOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  timestamp: number;
  userId: string;
  retryCount: number;
  maxRetries: number;
}

interface ConflictData {
  id: string;
  table: string;
  localData: any;
  serverData: any;
  timestamp: number;
}

export interface SyncState {
  // Offline status
  isOnline: boolean;
  networkType: string | null;
  
  // Sync status
  isSyncing: boolean;
  pendingOperationsCount: number;
  lastSyncTime: string | null;
  syncErrors: string[];
  
  // Conflicts
  pendingConflicts: ConflictData[];
  
  // Sync statistics
  totalSynced: number;
  totalFailed: number;
  
  // User preferences
  autoSyncEnabled: boolean;
  syncOnlyOnWifi: boolean;
  
  // UI state
  showOfflineIndicator: boolean;
  showSyncStatus: boolean;
}

const initialState: SyncState = {
  isOnline: true,
  networkType: null,
  isSyncing: false,
  pendingOperationsCount: 0,
  lastSyncTime: null,
  syncErrors: [],
  pendingConflicts: [],
  totalSynced: 0,
  totalFailed: 0,
  autoSyncEnabled: true,
  syncOnlyOnWifi: false,
  showOfflineIndicator: true,
  showSyncStatus: true,
};

export const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    updateOfflineStatus: (state, action: PayloadAction<OfflineStatus>) => {
      state.isOnline = action.payload.isOnline;
      state.networkType = action.payload.type;
    },
    
    updateSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.isSyncing = action.payload.isActive;
      state.pendingOperationsCount = action.payload.pendingOperations;
      state.syncErrors = action.payload.syncErrors;
      
      if (action.payload.lastSyncTime) {
        state.lastSyncTime = action.payload.lastSyncTime.toISOString();
      }
    },
    
    addPendingOperation: (state, action: PayloadAction<PendingOperation>) => {
      state.pendingOperationsCount += 1;
    },
    
    removePendingOperation: (state, action: PayloadAction<string>) => {
      state.pendingOperationsCount = Math.max(0, state.pendingOperationsCount - 1);
      state.totalSynced += 1;
    },
    
    addSyncError: (state, action: PayloadAction<string>) => {
      state.syncErrors.push(action.payload);
      state.totalFailed += 1;
    },
    
    clearSyncErrors: (state) => {
      state.syncErrors = [];
    },
    
    updateConflicts: (state, action: PayloadAction<ConflictData[]>) => {
      state.pendingConflicts = action.payload;
    },
    
    resolveConflict: (state, action: PayloadAction<string>) => {
      state.pendingConflicts = state.pendingConflicts.filter(
        conflict => conflict.id !== action.payload
      );
    },
    
    setSyncPreferences: (state, action: PayloadAction<{
      autoSyncEnabled?: boolean;
      syncOnlyOnWifi?: boolean;
    }>) => {
      if (action.payload.autoSyncEnabled !== undefined) {
        state.autoSyncEnabled = action.payload.autoSyncEnabled;
      }
      if (action.payload.syncOnlyOnWifi !== undefined) {
        state.syncOnlyOnWifi = action.payload.syncOnlyOnWifi;
      }
    },
    
    setUIPreferences: (state, action: PayloadAction<{
      showOfflineIndicator?: boolean;
      showSyncStatus?: boolean;
    }>) => {
      if (action.payload.showOfflineIndicator !== undefined) {
        state.showOfflineIndicator = action.payload.showOfflineIndicator;
      }
      if (action.payload.showSyncStatus !== undefined) {
        state.showSyncStatus = action.payload.showSyncStatus;
      }
    },
    
    startSync: (state) => {
      state.isSyncing = true;
      state.syncErrors = [];
    },
    
    completeSync: (state, action: PayloadAction<{
      syncedCount: number;
      failedCount: number;
      errors: string[];
    }>) => {
      state.isSyncing = false;
      state.lastSyncTime = new Date().toISOString();
      state.totalSynced += action.payload.syncedCount;
      state.totalFailed += action.payload.failedCount;
      state.syncErrors = action.payload.errors;
      state.pendingOperationsCount = Math.max(0, state.pendingOperationsCount - action.payload.syncedCount);
    },
    
    resetSyncStats: (state) => {
      state.totalSynced = 0;
      state.totalFailed = 0;
      state.syncErrors = [];
    },
    
    forceOffline: (state) => {
      state.isOnline = false;
      state.networkType = null;
    },
    
    forceOnline: (state) => {
      state.isOnline = true;
    },
  },
});

export const {
  updateOfflineStatus,
  updateSyncStatus,
  addPendingOperation,
  removePendingOperation,
  addSyncError,
  clearSyncErrors,
  updateConflicts,
  resolveConflict,
  setSyncPreferences,
  setUIPreferences,
  startSync,
  completeSync,
  resetSyncStats,
  forceOffline,
  forceOnline,
} = syncSlice.actions;

// Selectors
export const selectIsOnline = (state: { sync: SyncState }) => state.sync.isOnline;
export const selectIsSyncing = (state: { sync: SyncState }) => state.sync.isSyncing;
export const selectPendingOperationsCount = (state: { sync: SyncState }) => state.sync.pendingOperationsCount;
export const selectSyncErrors = (state: { sync: SyncState }) => state.sync.syncErrors;
export const selectPendingConflicts = (state: { sync: SyncState }) => state.sync.pendingConflicts;
export const selectLastSyncTime = (state: { sync: SyncState }) => state.sync.lastSyncTime;
export const selectSyncPreferences = (state: { sync: SyncState }) => ({
  autoSyncEnabled: state.sync.autoSyncEnabled,
  syncOnlyOnWifi: state.sync.syncOnlyOnWifi,
});
export const selectSyncStats = (state: { sync: SyncState }) => ({
  totalSynced: state.sync.totalSynced,
  totalFailed: state.sync.totalFailed,
  pendingOperationsCount: state.sync.pendingOperationsCount,
});
export const selectUIPreferences = (state: { sync: SyncState }) => ({
  showOfflineIndicator: state.sync.showOfflineIndicator,
  showSyncStatus: state.sync.showSyncStatus,
});

export default syncSlice.reducer;