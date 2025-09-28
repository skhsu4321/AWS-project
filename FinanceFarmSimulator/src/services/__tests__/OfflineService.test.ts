import { OfflineService, PendingOperation } from '../OfflineService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('OfflineService', () => {
  let offlineService: OfflineService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (OfflineService as any).instance = undefined;
    offlineService = OfflineService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = OfflineService.getInstance();
      const instance2 = OfflineService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('queueOperation', () => {
    it('should queue operation successfully', async () => {
      const testData = { id: '1', name: 'Test Goal', amount: 100 };
      const operationId = await offlineService.queueOperation(
        'CREATE',
        'savings_goals',
        testData,
        'user123'
      );

      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle multiple operations', async () => {
      const operations = [
        { type: 'CREATE' as const, table: 'savings_goals', data: { id: '1' }, userId: 'user1' },
        { type: 'UPDATE' as const, table: 'expenses', data: { id: '2' }, userId: 'user1' },
        { type: 'DELETE' as const, table: 'income', data: { id: '3' }, userId: 'user1' },
      ];

      const operationIds = await Promise.all(
        operations.map(op => 
          offlineService.queueOperation(op.type, op.table, op.data, op.userId)
        )
      );

      expect(operationIds).toHaveLength(3);
      expect(operationIds.every(id => typeof id === 'string')).toBe(true);
    });
  });

  describe('loadPendingOperations', () => {
    it('should load pending operations from storage', async () => {
      const mockOperations: PendingOperation[] = [
        {
          id: 'op1',
          type: 'CREATE',
          table: 'savings_goals',
          data: { id: '1' },
          timestamp: Date.now(),
          userId: 'user1',
          retryCount: 0,
          maxRetries: 3,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockOperations));

      // Create new instance to trigger loading
      (OfflineService as any).instance = undefined;
      const newService = OfflineService.getInstance();

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const pendingOps = newService.getPendingOperations();
      expect(pendingOps).toHaveLength(1);
      expect(pendingOps[0].id).toBe('op1');
    });

    it('should handle empty storage gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      (OfflineService as any).instance = undefined;
      const newService = OfflineService.getInstance();

      await new Promise(resolve => setTimeout(resolve, 100));

      const pendingOps = newService.getPendingOperations();
      expect(pendingOps).toHaveLength(0);
    });

    it('should handle corrupted storage data', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json');

      (OfflineService as any).instance = undefined;
      const newService = OfflineService.getInstance();

      await new Promise(resolve => setTimeout(resolve, 100));

      const pendingOps = newService.getPendingOperations();
      expect(pendingOps).toHaveLength(0);
    });
  });

  describe('startBackgroundSync', () => {
    it('should not sync when offline', async () => {
      // Force offline state
      (offlineService as any).isOnline = false;

      await offlineService.startBackgroundSync();

      const syncStatus = offlineService.getSyncStatus();
      expect(syncStatus.isActive).toBe(false);
    });

    it('should not sync when already syncing', async () => {
      (offlineService as any).isOnline = true;
      (offlineService as any).syncInProgress = true;

      await offlineService.startBackgroundSync();

      // Should remain in sync state
      expect((offlineService as any).syncInProgress).toBe(true);
    });

    it('should process operations in chronological order', async () => {
      (offlineService as any).isOnline = true;
      
      // Add operations with different timestamps
      const op1 = await offlineService.queueOperation('CREATE', 'table1', { id: '1' }, 'user1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const op2 = await offlineService.queueOperation('UPDATE', 'table2', { id: '2' }, 'user1');

      const pendingOps = offlineService.getPendingOperations();
      expect(pendingOps).toHaveLength(2);
      expect(pendingOps[0].timestamp).toBeLessThan(pendingOps[1].timestamp);
    });
  });

  describe('clearPendingOperations', () => {
    it('should clear all pending operations', async () => {
      await offlineService.queueOperation('CREATE', 'table1', { id: '1' }, 'user1');
      await offlineService.queueOperation('UPDATE', 'table2', { id: '2' }, 'user1');

      expect(offlineService.getPendingOperations()).toHaveLength(2);

      await offlineService.clearPendingOperations();

      expect(offlineService.getPendingOperations()).toHaveLength(0);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_operations',
        JSON.stringify([])
      );
    });
  });

  describe('listeners', () => {
    it('should add and remove sync listeners', () => {
      const mockListener = jest.fn();
      const unsubscribe = offlineService.addSyncListener(mockListener);

      expect(typeof unsubscribe).toBe('function');

      // Trigger notification
      (offlineService as any).notifySyncListeners();
      expect(mockListener).toHaveBeenCalled();

      // Unsubscribe
      unsubscribe();
      mockListener.mockClear();

      // Should not be called after unsubscribe
      (offlineService as any).notifySyncListeners();
      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should add and remove offline listeners', () => {
      const mockListener = jest.fn();
      const unsubscribe = offlineService.addOfflineListener(mockListener);

      expect(typeof unsubscribe).toBe('function');

      // Trigger notification
      const mockStatus = { isOnline: false, isConnected: false, type: null, details: null };
      (offlineService as any).notifyOfflineListeners(mockStatus);
      expect(mockListener).toHaveBeenCalledWith(mockStatus);

      // Unsubscribe
      unsubscribe();
      mockListener.mockClear();

      // Should not be called after unsubscribe
      (offlineService as any).notifyOfflineListeners(mockStatus);
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('getOfflineStatus', () => {
    it('should return current offline status', () => {
      const status = offlineService.getOfflineStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('type');
      expect(status).toHaveProperty('details');
    });
  });

  describe('getSyncStatus', () => {
    it('should return current sync status', () => {
      const status = offlineService.getSyncStatus();
      
      expect(status).toHaveProperty('isActive');
      expect(status).toHaveProperty('pendingOperations');
      expect(status).toHaveProperty('lastSyncTime');
      expect(status).toHaveProperty('syncErrors');
    });
  });

  describe('forcSync', () => {
    it('should throw error when offline', async () => {
      (offlineService as any).isOnline = false;

      await expect(offlineService.forcSync()).rejects.toThrow('Cannot sync while offline');
    });

    it('should start sync when online', async () => {
      (offlineService as any).isOnline = true;
      const startSyncSpy = jest.spyOn(offlineService, 'startBackgroundSync');

      await offlineService.forcSync();

      expect(startSyncSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw
      await expect(
        offlineService.queueOperation('CREATE', 'table1', { id: '1' }, 'user1')
      ).resolves.toBeDefined();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      offlineService.addSyncListener(errorListener);

      // Should not throw
      expect(() => {
        (offlineService as any).notifySyncListeners();
      }).not.toThrow();
    });
  });
});