import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { OfflineService } from '../services/OfflineService';
import { ConflictResolutionService } from '../services/ConflictResolutionService';
import { 
  updateOfflineStatus, 
  updateSyncStatus, 
  updateConflicts,
  addPendingOperation,
  removePendingOperation,
  addSyncError,
  selectSyncPreferences,
  selectIsOnline
} from '../store/slices/syncSlice';

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperationsCount: number;
  queueOperation: (type: 'CREATE' | 'UPDATE' | 'DELETE', table: string, data: any, userId: string) => Promise<string>;
  forceSync: () => Promise<void>;
  clearPendingOperations: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: any) => Promise<void>;
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const dispatch = useDispatch();
  const syncPreferences = useSelector(selectSyncPreferences);
  const isOnline = useSelector(selectIsOnline);
  
  const offlineService = OfflineService.getInstance();
  const conflictService = ConflictResolutionService.getInstance();

  useEffect(() => {
    // Set up offline status listener
    const unsubscribeOffline = offlineService.addOfflineListener((status) => {
      dispatch(updateOfflineStatus(status));
    });

    // Set up sync status listener
    const unsubscribeSync = offlineService.addSyncListener((status) => {
      dispatch(updateSyncStatus(status));
    });

    // Set up conflict listener
    const unsubscribeConflicts = conflictService.addConflictListener((conflicts) => {
      dispatch(updateConflicts(conflicts));
    });

    return () => {
      unsubscribeOffline();
      unsubscribeSync();
      unsubscribeConflicts();
    };
  }, [dispatch]);

  const queueOperation = useCallback(async (
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    table: string,
    data: any,
    userId: string
  ): Promise<string> => {
    try {
      const operationId = await offlineService.queueOperation(type, table, data, userId);
      dispatch(addPendingOperation({
        id: operationId,
        type,
        table,
        data,
        timestamp: Date.now(),
        userId,
        retryCount: 0,
        maxRetries: 3,
      }));
      return operationId;
    } catch (error) {
      console.error('Failed to queue operation:', error);
      dispatch(addSyncError(`Failed to queue ${type} operation for ${table}`));
      throw error;
    }
  }, [dispatch]);

  const forceSync = useCallback(async (): Promise<void> => {
    try {
      await offlineService.forcSync();
    } catch (error) {
      console.error('Force sync failed:', error);
      dispatch(addSyncError('Manual sync failed'));
      throw error;
    }
  }, [dispatch]);

  const clearPendingOperations = useCallback(async (): Promise<void> => {
    try {
      await offlineService.clearPendingOperations();
    } catch (error) {
      console.error('Failed to clear pending operations:', error);
      dispatch(addSyncError('Failed to clear pending operations'));
      throw error;
    }
  }, [dispatch]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: any
  ): Promise<void> => {
    try {
      await conflictService.resolveConflict(conflictId, resolution);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      dispatch(addSyncError(`Failed to resolve conflict ${conflictId}`));
      throw error;
    }
  }, [dispatch]);

  // Auto-sync when coming back online (if enabled)
  useEffect(() => {
    if (isOnline && syncPreferences.autoSyncEnabled) {
      const syncStatus = offlineService.getSyncStatus();
      if (syncStatus.pendingOperations > 0 && !syncStatus.isActive) {
        offlineService.startBackgroundSync().catch(error => {
          console.error('Auto-sync failed:', error);
          dispatch(addSyncError('Auto-sync failed'));
        });
      }
    }
  }, [isOnline, syncPreferences.autoSyncEnabled, dispatch]);

  return {
    isOnline,
    isSyncing: offlineService.getSyncStatus().isActive,
    pendingOperationsCount: offlineService.getSyncStatus().pendingOperations,
    queueOperation,
    forceSync,
    clearPendingOperations,
    resolveConflict,
  };
};

export default useOfflineSync;