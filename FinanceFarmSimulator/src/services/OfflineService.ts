import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './DatabaseService';

export interface PendingOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  timestamp: number;
  userId: string;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  isConnected: boolean;
  type: string | null;
  details: any;
}

export interface SyncStatus {
  isActive: boolean;
  pendingOperations: number;
  lastSyncTime: Date | null;
  syncErrors: string[];
}

export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private pendingOperations: PendingOperation[] = [];
  private syncInProgress: boolean = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];
  private offlineListeners: Array<(status: OfflineStatus) => void> = [];
  private dbService: DatabaseService;
  private readonly PENDING_OPERATIONS_KEY = 'pending_operations';
  private readonly LAST_SYNC_KEY = 'last_sync_time';

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.initializeNetworkListener();
    this.loadPendingOperations();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private async initializeNetworkListener(): Promise<void> {
    // Listen for network state changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      const offlineStatus: OfflineStatus = {
        isOnline: this.isOnline,
        isConnected: state.isConnected ?? false,
        type: state.type,
        details: state.details,
      };

      // Notify offline status listeners
      this.notifyOfflineListeners(offlineStatus);

      // If we just came back online, start sync
      if (!wasOnline && this.isOnline && this.pendingOperations.length > 0) {
        this.startBackgroundSync();
      }
    });

    // Get initial network state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
  }

  private async loadPendingOperations(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.PENDING_OPERATIONS_KEY);
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
      this.pendingOperations = [];
    }
  }

  private async savePendingOperations(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.PENDING_OPERATIONS_KEY,
        JSON.stringify(this.pendingOperations)
      );
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  }

  public async queueOperation(
    type: PendingOperation['type'],
    table: string,
    data: any,
    userId: string,
    maxRetries: number = 3
  ): Promise<string> {
    const operation: PendingOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      table,
      data,
      timestamp: Date.now(),
      userId,
      retryCount: 0,
      maxRetries,
    };

    this.pendingOperations.push(operation);
    await this.savePendingOperations();
    
    // Notify sync status listeners
    this.notifySyncListeners();

    // If online, try to sync immediately
    if (this.isOnline && !this.syncInProgress) {
      this.startBackgroundSync();
    }

    return operation.id;
  }

  public async startBackgroundSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.pendingOperations.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.notifySyncListeners();

    const syncErrors: string[] = [];
    const operationsToRemove: string[] = [];

    try {
      // Process operations in chronological order
      const sortedOperations = [...this.pendingOperations].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      for (const operation of sortedOperations) {
        try {
          await this.executeOperation(operation);
          operationsToRemove.push(operation.id);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          
          // Increment retry count
          operation.retryCount++;
          
          if (operation.retryCount >= operation.maxRetries) {
            // Max retries reached, remove operation and log error
            operationsToRemove.push(operation.id);
            syncErrors.push(`Operation ${operation.id} failed after ${operation.maxRetries} retries`);
          }
        }
      }

      // Remove completed/failed operations
      this.pendingOperations = this.pendingOperations.filter(
        op => !operationsToRemove.includes(op.id)
      );

      await this.savePendingOperations();
      
      // Update last sync time
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());

    } catch (error) {
      console.error('Background sync failed:', error);
      syncErrors.push('Background sync process failed');
    } finally {
      this.syncInProgress = false;
      this.notifySyncListeners(syncErrors);
    }
  }

  private async executeOperation(operation: PendingOperation): Promise<void> {
    // This would integrate with your cloud sync service (Firebase, etc.)
    // For now, we'll simulate the operation
    
    switch (operation.type) {
      case 'CREATE':
        await this.syncCreateOperation(operation);
        break;
      case 'UPDATE':
        await this.syncUpdateOperation(operation);
        break;
      case 'DELETE':
        await this.syncDeleteOperation(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async syncCreateOperation(operation: PendingOperation): Promise<void> {
    // Simulate cloud sync for create operation
    // In real implementation, this would call your cloud service API
    console.log(`Syncing CREATE operation for ${operation.table}:`, operation.data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // For demo purposes, we'll just log success
    // In real implementation, you'd make API calls to your backend
  }

  private async syncUpdateOperation(operation: PendingOperation): Promise<void> {
    // Simulate cloud sync for update operation
    console.log(`Syncing UPDATE operation for ${operation.table}:`, operation.data);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async syncDeleteOperation(operation: PendingOperation): Promise<void> {
    // Simulate cloud sync for delete operation
    console.log(`Syncing DELETE operation for ${operation.table}:`, operation.data);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  public getOfflineStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      isConnected: this.isOnline,
      type: null, // Would be populated by NetInfo
      details: null,
    };
  }

  public getSyncStatus(): SyncStatus {
    return {
      isActive: this.syncInProgress,
      pendingOperations: this.pendingOperations.length,
      lastSyncTime: null, // Would be loaded from AsyncStorage
      syncErrors: [],
    };
  }

  public addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  public addOfflineListener(listener: (status: OfflineStatus) => void): () => void {
    this.offlineListeners.push(listener);
    
    return () => {
      const index = this.offlineListeners.indexOf(listener);
      if (index > -1) {
        this.offlineListeners.splice(index, 1);
      }
    };
  }

  private notifySyncListeners(errors: string[] = []): void {
    const status: SyncStatus = {
      isActive: this.syncInProgress,
      pendingOperations: this.pendingOperations.length,
      lastSyncTime: null, // Would be loaded from AsyncStorage
      syncErrors: errors,
    };

    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  private notifyOfflineListeners(status: OfflineStatus): void {
    this.offlineListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in offline listener:', error);
      }
    });
  }

  public async clearPendingOperations(): Promise<void> {
    this.pendingOperations = [];
    await this.savePendingOperations();
    this.notifySyncListeners();
  }

  public getPendingOperations(): PendingOperation[] {
    return [...this.pendingOperations];
  }

  public async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.startBackgroundSync();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }
}