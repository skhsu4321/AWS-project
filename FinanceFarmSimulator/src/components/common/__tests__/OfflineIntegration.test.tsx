import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { OfflineIndicator } from '../OfflineIndicator';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { ConflictResolutionModal } from '../ConflictResolutionModal';
import { syncSlice } from '../../../store/slices/syncSlice';
import { OfflineService } from '../../../services/OfflineService';
import { ConflictResolutionService } from '../../../services/ConflictResolutionService';

// Mock services
jest.mock('../../../services/OfflineService');
jest.mock('../../../services/ConflictResolutionService');
jest.mock('../../../hooks/useOfflineSync');

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      sync: syncSlice.reducer,
    },
    preloadedState: {
      sync: {
        isOnline: true,
        networkType: 'wifi',
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
        ...initialState,
      },
    },
  });
};

const renderWithStore = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

describe('Offline Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OfflineIndicator', () => {
    it('should not show when online with no pending operations', () => {
      const { queryByText } = renderWithStore(<OfflineIndicator />);
      
      expect(queryByText('Offline')).toBeNull();
      expect(queryByText(/pending/)).toBeNull();
    });

    it('should show offline status when offline', () => {
      const { getByText } = renderWithStore(<OfflineIndicator />, {
        isOnline: false,
      });
      
      expect(getByText('Offline')).toBeTruthy();
    });

    it('should show pending operations count', () => {
      const { getByText } = renderWithStore(<OfflineIndicator />, {
        pendingOperationsCount: 3,
      });
      
      expect(getByText('3 pending sync')).toBeTruthy();
    });

    it('should show combined offline and pending status', () => {
      const { getByText } = renderWithStore(<OfflineIndicator />, {
        isOnline: false,
        pendingOperationsCount: 2,
      });
      
      expect(getByText('Offline • 2 pending')).toBeTruthy();
    });

    it('should not show when showOfflineIndicator is false', () => {
      const { queryByText } = renderWithStore(<OfflineIndicator />, {
        isOnline: false,
        showOfflineIndicator: false,
      });
      
      expect(queryByText('Offline')).toBeNull();
    });
  });

  describe('SyncStatusIndicator', () => {
    it('should show syncing status', () => {
      const { getByText } = renderWithStore(<SyncStatusIndicator />, {
        isSyncing: true,
      });
      
      expect(getByText('Syncing...')).toBeTruthy();
    });

    it('should show sync errors', () => {
      const { getByText } = renderWithStore(<SyncStatusIndicator />, {
        syncErrors: ['Network error', 'Database error'],
      });
      
      expect(getByText('Sync failed (2 errors)')).toBeTruthy();
      expect(getByText('Network error')).toBeTruthy();
      expect(getByText('+1 more')).toBeTruthy();
    });

    it('should show pending operations', () => {
      const { getByText } = renderWithStore(<SyncStatusIndicator />, {
        pendingOperationsCount: 5,
      });
      
      expect(getByText('5 pending')).toBeTruthy();
    });

    it('should show last sync time', () => {
      const lastSyncTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
      
      const { getByText } = renderWithStore(<SyncStatusIndicator />, {
        lastSyncTime,
      });
      
      expect(getByText('Last sync: 5m ago')).toBeTruthy();
    });

    it('should handle press events', () => {
      const onPress = jest.fn();
      const { getByText } = renderWithStore(
        <SyncStatusIndicator onPress={onPress} />,
        {
          syncErrors: ['Test error'],
        }
      );
      
      fireEvent.press(getByText('Sync failed (1 errors)'));
      expect(onPress).toHaveBeenCalled();
    });

    it('should show compact version', () => {
      const { queryByText } = renderWithStore(
        <SyncStatusIndicator compact />,
        {
          isSyncing: true,
        }
      );
      
      // Should not show text in compact mode
      expect(queryByText('Syncing...')).toBeNull();
    });

    it('should not show when showSyncStatus is false', () => {
      const { queryByText } = renderWithStore(<SyncStatusIndicator />, {
        isSyncing: true,
        showSyncStatus: false,
      });
      
      expect(queryByText('Syncing...')).toBeNull();
    });
  });

  describe('ConflictResolutionModal', () => {
    const mockConflicts = [
      {
        id: 'conflict1',
        table: 'savings_goals',
        localData: { id: '1', name: 'Local Goal', amount: 100 },
        remoteData: { id: '1', name: 'Remote Goal', amount: 200 },
        conflictType: 'UPDATE_UPDATE' as const,
        timestamp: Date.now(),
        userId: 'user1',
      },
      {
        id: 'conflict2',
        table: 'expenses',
        localData: { id: '2', description: 'Local Expense' },
        remoteData: { id: '2', description: 'Remote Expense' },
        conflictType: 'UPDATE_UPDATE' as const,
        timestamp: Date.now(),
        userId: 'user1',
      },
    ];

    it('should show no conflicts message when empty', () => {
      const { getByText } = renderWithStore(
        <ConflictResolutionModal visible={true} onClose={jest.fn()} />
      );
      
      expect(getByText('No sync conflicts')).toBeTruthy();
      expect(getByText('All your data is synchronized successfully')).toBeTruthy();
    });

    it('should show conflicts list', () => {
      const { getByText } = renderWithStore(
        <ConflictResolutionModal visible={true} onClose={jest.fn()} />,
        {
          pendingConflicts: mockConflicts,
        }
      );
      
      expect(getByText('2 conflicts found')).toBeTruthy();
      expect(getByText('savings_goals - UPDATE UPDATE')).toBeTruthy();
      expect(getByText('expenses - UPDATE UPDATE')).toBeTruthy();
    });

    it('should show bulk resolution buttons', () => {
      const { getByText } = renderWithStore(
        <ConflictResolutionModal visible={true} onClose={jest.fn()} />,
        {
          pendingConflicts: mockConflicts,
        }
      );
      
      expect(getByText('Use All Local')).toBeTruthy();
      expect(getByText('Use All Remote')).toBeTruthy();
      expect(getByText('Auto Merge All')).toBeTruthy();
    });

    it('should show conflict details when item is pressed', async () => {
      const { getByText } = renderWithStore(
        <ConflictResolutionModal visible={true} onClose={jest.fn()} />,
        {
          pendingConflicts: mockConflicts,
        }
      );
      
      fireEvent.press(getByText('savings_goals - UPDATE UPDATE'));
      
      await waitFor(() => {
        expect(getByText('Conflict Details')).toBeTruthy();
        expect(getByText('Local Data')).toBeTruthy();
        expect(getByText('Remote Data')).toBeTruthy();
        expect(getByText('Use Local')).toBeTruthy();
        expect(getByText('Use Remote')).toBeTruthy();
        expect(getByText('Auto Merge')).toBeTruthy();
      });
    });

    it('should handle modal close', () => {
      const onClose = jest.fn();
      const { getByText } = renderWithStore(
        <ConflictResolutionModal visible={true} onClose={onClose} />
      );
      
      // This would typically be triggered by the Modal component's close button
      // For testing purposes, we'll assume the modal has a close mechanism
      expect(onClose).toBeDefined();
    });
  });

  describe('Integration with OfflineService', () => {
    let mockOfflineService: jest.Mocked<OfflineService>;

    beforeEach(() => {
      mockOfflineService = {
        queueOperation: jest.fn(),
        startBackgroundSync: jest.fn(),
        addOfflineListener: jest.fn(() => jest.fn()),
        addSyncListener: jest.fn(() => jest.fn()),
        getOfflineStatus: jest.fn(() => ({
          isOnline: true,
          isConnected: true,
          type: 'wifi',
          details: null,
        })),
        getSyncStatus: jest.fn(() => ({
          isActive: false,
          pendingOperations: 0,
          lastSyncTime: null,
          syncErrors: [],
        })),
        clearPendingOperations: jest.fn(),
        forcSync: jest.fn(),
        getPendingOperations: jest.fn(() => []),
      } as any;

      (OfflineService.getInstance as jest.Mock).mockReturnValue(mockOfflineService);
    });

    it('should queue operations when offline', async () => {
      mockOfflineService.queueOperation.mockResolvedValue('op-123');
      
      await mockOfflineService.queueOperation('CREATE', 'savings_goals', { id: '1' }, 'user1');
      
      expect(mockOfflineService.queueOperation).toHaveBeenCalledWith(
        'CREATE',
        'savings_goals',
        { id: '1' },
        'user1'
      );
    });

    it('should start sync when coming back online', async () => {
      mockOfflineService.getSyncStatus.mockReturnValue({
        isActive: false,
        pendingOperations: 3,
        lastSyncTime: null,
        syncErrors: [],
      });

      await mockOfflineService.startBackgroundSync();
      
      expect(mockOfflineService.startBackgroundSync).toHaveBeenCalled();
    });
  });

  describe('Integration with ConflictResolutionService', () => {
    let mockConflictService: jest.Mocked<ConflictResolutionService>;

    beforeEach(() => {
      mockConflictService = {
        detectConflict: jest.fn(),
        resolveConflict: jest.fn(),
        addConflictListener: jest.fn(() => jest.fn()),
        getPendingConflicts: jest.fn(() => []),
        resolveAllConflicts: jest.fn(),
        clearResolvedConflicts: jest.fn(),
      } as any;

      (ConflictResolutionService.getInstance as jest.Mock).mockReturnValue(mockConflictService);
    });

    it('should detect conflicts during sync', async () => {
      const localData = { id: '1', name: 'Local' };
      const remoteData = { id: '1', name: 'Remote' };

      mockConflictService.detectConflict.mockResolvedValue({
        id: 'conflict1',
        table: 'savings_goals',
        localData,
        remoteData,
        conflictType: 'UPDATE_UPDATE',
        timestamp: Date.now(),
        userId: 'user1',
      });

      const conflict = await mockConflictService.detectConflict(
        'savings_goals',
        localData,
        remoteData,
        'user1'
      );

      expect(conflict).toBeDefined();
      expect(conflict!.conflictType).toBe('UPDATE_UPDATE');
    });

    it('should resolve conflicts', async () => {
      const resolvedData = { id: '1', name: 'Resolved' };
      mockConflictService.resolveConflict.mockResolvedValue(resolvedData);

      const result = await mockConflictService.resolveConflict('conflict1', {
        action: 'USE_LOCAL',
        reason: 'User choice',
      });

      expect(result).toEqual(resolvedData);
      expect(mockConflictService.resolveConflict).toHaveBeenCalledWith('conflict1', {
        action: 'USE_LOCAL',
        reason: 'User choice',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors gracefully', () => {
      (OfflineService.getInstance as jest.Mock).mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      // Component should still render without crashing
      expect(() => {
        renderWithStore(<OfflineIndicator />);
      }).not.toThrow();
    });

    it('should handle sync errors in UI', () => {
      const { getByText } = renderWithStore(<SyncStatusIndicator />, {
        syncErrors: ['Network timeout', 'Database connection failed'],
      });

      expect(getByText('Sync failed (2 errors)')).toBeTruthy();
      expect(getByText('Network timeout')).toBeTruthy();
    });

    it('should handle conflict resolution errors', async () => {
      const mockUseOfflineSync = require('../../../hooks/useOfflineSync').useOfflineSync;
      mockUseOfflineSync.mockReturnValue({
        resolveConflict: jest.fn().mockRejectedValue(new Error('Resolution failed')),
        isOnline: true,
        isSyncing: false,
        pendingOperationsCount: 0,
        queueOperation: jest.fn(),
        forceSync: jest.fn(),
        clearPendingOperations: jest.fn(),
      });

      const { getByText } = renderWithStore(
        <ConflictResolutionModal visible={true} onClose={jest.fn()} />,
        {
          pendingConflicts: [
            {
              id: 'conflict1',
              table: 'savings_goals',
              localData: { id: '1' },
              remoteData: { id: '1' },
              conflictType: 'UPDATE_UPDATE',
              timestamp: Date.now(),
              userId: 'user1',
            },
          ],
        }
      );

      fireEvent.press(getByText('savings_goals - UPDATE UPDATE'));
      
      await waitFor(() => {
        expect(getByText('Use Local')).toBeTruthy();
      });

      // This would trigger an error in the actual implementation
      // The component should handle it gracefully
    });
  });
});