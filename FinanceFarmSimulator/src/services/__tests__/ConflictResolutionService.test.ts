import { ConflictResolutionService, ConflictData, ConflictResolution } from '../ConflictResolutionService';
import { DatabaseService } from '../DatabaseService';

// Mock DatabaseService
jest.mock('../DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      getDatabase: jest.fn(() => ({
        runAsync: jest.fn(),
      })),
    })),
  },
}));

describe('ConflictResolutionService', () => {
  let conflictService: ConflictResolutionService;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (ConflictResolutionService as any).instance = undefined;
    conflictService = ConflictResolutionService.getInstance();
    
    mockDb = {
      runAsync: jest.fn(),
    };
    (DatabaseService.getInstance as jest.Mock).mockReturnValue({
      getDatabase: () => mockDb,
    });
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConflictResolutionService.getInstance();
      const instance2 = ConflictResolutionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('detectConflict', () => {
    it('should return null when no conflict exists', async () => {
      const localData = { id: '1', name: 'Test', updatedAt: '2023-01-01' };
      const remoteData = { id: '1', name: 'Test', updatedAt: '2023-01-01' };

      const conflict = await conflictService.detectConflict(
        'savings_goals',
        localData,
        remoteData,
        'user1'
      );

      expect(conflict).toBeNull();
    });

    it('should detect UPDATE_UPDATE conflict', async () => {
      const localData = { id: '1', name: 'Local Test', updatedAt: '2023-01-01' };
      const remoteData = { id: '1', name: 'Remote Test', updatedAt: '2023-01-02' };

      const conflict = await conflictService.detectConflict(
        'savings_goals',
        localData,
        remoteData,
        'user1'
      );

      expect(conflict).not.toBeNull();
      expect(conflict!.conflictType).toBe('UPDATE_UPDATE');
      expect(conflict!.table).toBe('savings_goals');
      expect(conflict!.localData).toEqual(localData);
      expect(conflict!.remoteData).toEqual(remoteData);
    });

    it('should detect DELETE_UPDATE conflict', async () => {
      const localData = { id: '1', name: 'Test' };
      const remoteData = null;

      const conflict = await conflictService.detectConflict(
        'savings_goals',
        localData,
        remoteData,
        'user1'
      );

      expect(conflict).not.toBeNull();
      expect(conflict!.conflictType).toBe('DELETE_UPDATE');
    });

    it('should detect UPDATE_DELETE conflict', async () => {
      const localData = null;
      const remoteData = { id: '1', name: 'Test' };

      const conflict = await conflictService.detectConflict(
        'savings_goals',
        localData,
        remoteData,
        'user1'
      );

      expect(conflict).not.toBeNull();
      expect(conflict!.conflictType).toBe('UPDATE_DELETE');
    });
  });

  describe('resolveConflict', () => {
    let testConflict: ConflictData;

    beforeEach(async () => {
      const localData = { id: '1', name: 'Local Test', amount: 100 };
      const remoteData = { id: '1', name: 'Remote Test', amount: 200 };

      testConflict = (await conflictService.detectConflict(
        'savings_goals',
        localData,
        remoteData,
        'user1'
      ))!;
    });

    it('should resolve conflict using local data', async () => {
      const resolution: ConflictResolution = {
        action: 'USE_LOCAL',
        reason: 'User chose local data',
      };

      const result = await conflictService.resolveConflict(testConflict.id, resolution);

      expect(result).toEqual(testConflict.localData);
      expect(conflictService.getPendingConflicts()).toHaveLength(0);
    });

    it('should resolve conflict using remote data', async () => {
      const resolution: ConflictResolution = {
        action: 'USE_REMOTE',
        reason: 'User chose remote data',
      };

      const result = await conflictService.resolveConflict(testConflict.id, resolution);

      expect(result).toEqual(testConflict.remoteData);
      expect(conflictService.getPendingConflicts()).toHaveLength(0);
    });

    it('should resolve conflict using manual data', async () => {
      const manualData = { id: '1', name: 'Manual Test', amount: 150 };
      const resolution: ConflictResolution = {
        action: 'MANUAL',
        resolvedData: manualData,
        reason: 'User provided manual resolution',
      };

      const result = await conflictService.resolveConflict(testConflict.id, resolution);

      expect(result).toEqual(manualData);
      expect(conflictService.getPendingConflicts()).toHaveLength(0);
    });

    it('should throw error for non-existent conflict', async () => {
      const resolution: ConflictResolution = {
        action: 'USE_LOCAL',
        reason: 'Test',
      };

      await expect(
        conflictService.resolveConflict('non-existent', resolution)
      ).rejects.toThrow('Conflict non-existent not found');
    });

    it('should throw error for manual resolution without data', async () => {
      const resolution: ConflictResolution = {
        action: 'MANUAL',
        reason: 'Test',
      };

      await expect(
        conflictService.resolveConflict(testConflict.id, resolution)
      ).rejects.toThrow('Manual resolution requires resolved data');
    });
  });

  describe('autoMergeData', () => {
    it('should merge savings_goals data correctly', async () => {
      const localData = {
        id: '1',
        title: 'Local Goal',
        current_amount: 100,
        target_amount: 500,
        updatedAt: '2023-01-01T10:00:00Z',
      };

      const remoteData = {
        id: '1',
        title: 'Remote Goal',
        current_amount: 150,
        target_amount: 600,
        updatedAt: '2023-01-02T10:00:00Z',
      };

      const conflict = (await conflictService.detectConflict(
        'savings_goals',
        localData,
        remoteData,
        'user1'
      ))!;

      const resolution: ConflictResolution = {
        action: 'MERGE',
        reason: 'Auto merge test',
      };

      const result = await conflictService.resolveConflict(conflict.id, resolution);

      // Should use latest timestamp for most fields
      expect(result.title).toBe('Remote Goal');
      expect(result.target_amount).toBe(600);
      // Should use MAX for current_amount
      expect(result.current_amount).toBe(150);
    });

    it('should merge income data with streak handling', async () => {
      const localData = {
        id: '1',
        amount: 100,
        multiplier: 1.2,
        streak_count: 5,
        updatedAt: '2023-01-01T10:00:00Z',
      };

      const remoteData = {
        id: '1',
        amount: 120,
        multiplier: 1.5,
        streak_count: 3,
        updatedAt: '2023-01-02T10:00:00Z',
      };

      const conflict = (await conflictService.detectConflict(
        'income',
        localData,
        remoteData,
        'user1'
      ))!;

      const resolution: ConflictResolution = {
        action: 'MERGE',
        reason: 'Auto merge test',
      };

      const result = await conflictService.resolveConflict(conflict.id, resolution);

      // Should use latest timestamp for amount
      expect(result.amount).toBe(120);
      // Should use MAX for multiplier and streak_count
      expect(result.multiplier).toBe(1.5);
      expect(result.streak_count).toBe(5);
    });
  });

  describe('resolveAllConflicts', () => {
    beforeEach(async () => {
      // Create multiple conflicts
      await conflictService.detectConflict(
        'savings_goals',
        { id: '1', name: 'Local 1' },
        { id: '1', name: 'Remote 1' },
        'user1'
      );

      await conflictService.detectConflict(
        'expenses',
        { id: '2', amount: 100 },
        { id: '2', amount: 200 },
        'user1'
      );
    });

    it('should resolve all conflicts using USE_LOCAL strategy', async () => {
      expect(conflictService.getPendingConflicts()).toHaveLength(2);

      await conflictService.resolveAllConflicts('USE_LOCAL');

      expect(conflictService.getPendingConflicts()).toHaveLength(0);
    });

    it('should resolve all conflicts using USE_REMOTE strategy', async () => {
      expect(conflictService.getPendingConflicts()).toHaveLength(2);

      await conflictService.resolveAllConflicts('USE_REMOTE');

      expect(conflictService.getPendingConflicts()).toHaveLength(0);
    });

    it('should resolve all conflicts using AUTO_MERGE strategy', async () => {
      expect(conflictService.getPendingConflicts()).toHaveLength(2);

      await conflictService.resolveAllConflicts('AUTO_MERGE');

      expect(conflictService.getPendingConflicts()).toHaveLength(0);
    });
  });

  describe('listeners', () => {
    it('should add and remove conflict listeners', () => {
      const mockListener = jest.fn();
      const unsubscribe = conflictService.addConflictListener(mockListener);

      expect(typeof unsubscribe).toBe('function');

      // Trigger notification by adding a conflict
      conflictService.detectConflict(
        'savings_goals',
        { id: '1', name: 'Local' },
        { id: '1', name: 'Remote' },
        'user1'
      );

      expect(mockListener).toHaveBeenCalled();

      // Unsubscribe
      unsubscribe();
      mockListener.mockClear();

      // Should not be called after unsubscribe
      (conflictService as any).notifyConflictListeners();
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('data equality check', () => {
    it('should detect equal objects', () => {
      const data1 = { id: '1', name: 'Test', amount: 100 };
      const data2 = { id: '1', name: 'Test', amount: 100 };

      const areEqual = (conflictService as any).areDataEqual(data1, data2);
      expect(areEqual).toBe(true);
    });

    it('should detect different objects', () => {
      const data1 = { id: '1', name: 'Test', amount: 100 };
      const data2 = { id: '1', name: 'Test', amount: 200 };

      const areEqual = (conflictService as any).areDataEqual(data1, data2);
      expect(areEqual).toBe(false);
    });

    it('should ignore timestamp fields', () => {
      const data1 = { id: '1', name: 'Test', updatedAt: '2023-01-01' };
      const data2 = { id: '1', name: 'Test', updatedAt: '2023-01-02' };

      const areEqual = (conflictService as any).areDataEqual(data1, data2);
      expect(areEqual).toBe(true);
    });

    it('should handle nested objects', () => {
      const data1 = { id: '1', meta: { tags: ['a', 'b'] } };
      const data2 = { id: '1', meta: { tags: ['a', 'b'] } };

      const areEqual = (conflictService as any).areDataEqual(data1, data2);
      expect(areEqual).toBe(true);
    });
  });

  describe('database operations', () => {
    it('should update savings_goals table correctly', async () => {
      const localData = { id: '1', title: 'Test Goal', current_amount: 100 };
      const remoteData = { id: '1', title: 'Updated Goal', current_amount: 150 };

      const conflict = (await conflictService.detectConflict(
        'savings_goals',
        localData,
        remoteData,
        'user1'
      ))!;

      const resolution: ConflictResolution = {
        action: 'USE_REMOTE',
        reason: 'Test resolution',
      };

      await conflictService.resolveConflict(conflict.id, resolution);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE savings_goals SET'),
        expect.arrayContaining([
          'Updated Goal',
          expect.anything(), // description
          expect.anything(), // target_amount
          150, // current_amount
          expect.anything(), // deadline
          expect.anything(), // category
          expect.anything(), // status
          expect.anything(), // updatedAt
          '1', // id
        ])
      );
    });
  });
});