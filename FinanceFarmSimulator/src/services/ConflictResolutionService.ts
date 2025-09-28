import { DatabaseService } from './DatabaseService';

export interface ConflictData {
  id: string;
  table: string;
  localData: any;
  remoteData: any;
  conflictType: 'UPDATE_UPDATE' | 'UPDATE_DELETE' | 'DELETE_UPDATE';
  timestamp: number;
  userId: string;
}

export interface ConflictResolution {
  action: 'USE_LOCAL' | 'USE_REMOTE' | 'MERGE' | 'MANUAL';
  resolvedData?: any;
  reason: string;
}

export interface MergeStrategy {
  field: string;
  strategy: 'LOCAL_WINS' | 'REMOTE_WINS' | 'LATEST_TIMESTAMP' | 'SUM' | 'MAX' | 'MIN' | 'MANUAL';
}

export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  private dbService: DatabaseService;
  private pendingConflicts: ConflictData[] = [];
  private conflictListeners: Array<(conflicts: ConflictData[]) => void> = [];

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }

  public async detectConflict(
    table: string,
    localData: any,
    remoteData: any,
    userId: string
  ): Promise<ConflictData | null> {
    // Check if there's actually a conflict
    if (!localData && !remoteData) {
      return null;
    }

    let conflictType: ConflictData['conflictType'];
    
    if (localData && remoteData) {
      // Both exist, check if they're different
      if (this.areDataEqual(localData, remoteData)) {
        return null; // No conflict
      }
      conflictType = 'UPDATE_UPDATE';
    } else if (localData && !remoteData) {
      conflictType = 'DELETE_UPDATE';
    } else {
      conflictType = 'UPDATE_DELETE';
    }

    const conflict: ConflictData = {
      id: `${table}_${localData?.id || remoteData?.id}_${Date.now()}`,
      table,
      localData,
      remoteData,
      conflictType,
      timestamp: Date.now(),
      userId,
    };

    this.pendingConflicts.push(conflict);
    this.notifyConflictListeners();

    return conflict;
  }

  public async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<any> {
    const conflict = this.pendingConflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    let resolvedData: any;

    switch (resolution.action) {
      case 'USE_LOCAL':
        resolvedData = conflict.localData;
        break;
      
      case 'USE_REMOTE':
        resolvedData = conflict.remoteData;
        break;
      
      case 'MERGE':
        resolvedData = resolution.resolvedData || 
          await this.autoMergeData(conflict.table, conflict.localData, conflict.remoteData);
        break;
      
      case 'MANUAL':
        if (!resolution.resolvedData) {
          throw new Error('Manual resolution requires resolved data');
        }
        resolvedData = resolution.resolvedData;
        break;
      
      default:
        throw new Error(`Unknown resolution action: ${resolution.action}`);
    }

    // Apply the resolution to the database
    await this.applyResolution(conflict, resolvedData);

    // Remove the conflict from pending list
    this.pendingConflicts = this.pendingConflicts.filter(c => c.id !== conflictId);
    this.notifyConflictListeners();

    return resolvedData;
  }

  private async autoMergeData(table: string, localData: any, remoteData: any): Promise<any> {
    const mergeStrategies = this.getMergeStrategies(table);
    const merged = { ...localData };

    for (const strategy of mergeStrategies) {
      const localValue = localData?.[strategy.field];
      const remoteValue = remoteData?.[strategy.field];

      switch (strategy.strategy) {
        case 'LOCAL_WINS':
          // Keep local value (already in merged)
          break;
        
        case 'REMOTE_WINS':
          merged[strategy.field] = remoteValue;
          break;
        
        case 'LATEST_TIMESTAMP':
          const localTimestamp = new Date(localData?.updatedAt || 0).getTime();
          const remoteTimestamp = new Date(remoteData?.updatedAt || 0).getTime();
          merged[strategy.field] = remoteTimestamp > localTimestamp ? remoteValue : localValue;
          break;
        
        case 'SUM':
          if (typeof localValue === 'number' && typeof remoteValue === 'number') {
            merged[strategy.field] = localValue + remoteValue;
          }
          break;
        
        case 'MAX':
          if (typeof localValue === 'number' && typeof remoteValue === 'number') {
            merged[strategy.field] = Math.max(localValue, remoteValue);
          }
          break;
        
        case 'MIN':
          if (typeof localValue === 'number' && typeof remoteValue === 'number') {
            merged[strategy.field] = Math.min(localValue, remoteValue);
          }
          break;
        
        case 'MANUAL':
          // This field requires manual resolution
          throw new Error(`Field ${strategy.field} requires manual resolution`);
      }
    }

    // Always use the latest timestamp for updatedAt
    merged.updatedAt = new Date();

    return merged;
  }

  private getMergeStrategies(table: string): MergeStrategy[] {
    // Define merge strategies for different tables
    const strategies: Record<string, MergeStrategy[]> = {
      savings_goals: [
        { field: 'title', strategy: 'LATEST_TIMESTAMP' },
        { field: 'description', strategy: 'LATEST_TIMESTAMP' },
        { field: 'target_amount', strategy: 'LATEST_TIMESTAMP' },
        { field: 'current_amount', strategy: 'MAX' }, // Take the higher amount
        { field: 'deadline', strategy: 'LATEST_TIMESTAMP' },
        { field: 'status', strategy: 'LATEST_TIMESTAMP' },
      ],
      
      expenses: [
        { field: 'amount', strategy: 'LATEST_TIMESTAMP' },
        { field: 'category', strategy: 'LATEST_TIMESTAMP' },
        { field: 'description', strategy: 'LATEST_TIMESTAMP' },
        { field: 'date', strategy: 'LATEST_TIMESTAMP' },
        { field: 'tags', strategy: 'LATEST_TIMESTAMP' },
      ],
      
      income: [
        { field: 'amount', strategy: 'LATEST_TIMESTAMP' },
        { field: 'source', strategy: 'LATEST_TIMESTAMP' },
        { field: 'description', strategy: 'LATEST_TIMESTAMP' },
        { field: 'date', strategy: 'LATEST_TIMESTAMP' },
        { field: 'multiplier', strategy: 'MAX' }, // Take the higher multiplier
        { field: 'streak_count', strategy: 'MAX' },
      ],
      
      farms: [
        { field: 'layout', strategy: 'LATEST_TIMESTAMP' },
        { field: 'health_score', strategy: 'MAX' },
        { field: 'level', strategy: 'MAX' },
        { field: 'experience', strategy: 'MAX' },
        { field: 'total_harvests', strategy: 'MAX' },
        { field: 'streak_days', strategy: 'MAX' },
      ],
      
      crops: [
        { field: 'growth_stage', strategy: 'LATEST_TIMESTAMP' },
        { field: 'health_points', strategy: 'MAX' },
        { field: 'growth_progress', strategy: 'MAX' },
        { field: 'fertilizer_boost', strategy: 'MAX' },
        { field: 'weed_penalty', strategy: 'MIN' },
        { field: 'streak_multiplier', strategy: 'MAX' },
      ],
    };

    return strategies[table] || [];
  }

  private async applyResolution(conflict: ConflictData, resolvedData: any): Promise<void> {
    const db = this.dbService.getDatabase();
    
    try {
      switch (conflict.table) {
        case 'savings_goals':
          await db.runAsync(
            `UPDATE savings_goals SET 
             title = ?, description = ?, target_amount = ?, current_amount = ?, 
             deadline = ?, category = ?, status = ?, updated_at = ?
             WHERE id = ?`,
            [
              resolvedData.title,
              resolvedData.description,
              resolvedData.target_amount,
              resolvedData.current_amount,
              resolvedData.deadline,
              resolvedData.category,
              resolvedData.status,
              resolvedData.updatedAt.toISOString(),
              resolvedData.id,
            ]
          );
          break;
        
        case 'expenses':
          await db.runAsync(
            `UPDATE expenses SET 
             amount = ?, category = ?, description = ?, date = ?, 
             tags = ?, updated_at = ?
             WHERE id = ?`,
            [
              resolvedData.amount,
              resolvedData.category,
              resolvedData.description,
              resolvedData.date,
              JSON.stringify(resolvedData.tags || []),
              resolvedData.updatedAt.toISOString(),
              resolvedData.id,
            ]
          );
          break;
        
        case 'income':
          await db.runAsync(
            `UPDATE income SET 
             amount = ?, source = ?, description = ?, date = ?, 
             multiplier = ?, streak_count = ?, updated_at = ?
             WHERE id = ?`,
            [
              resolvedData.amount,
              resolvedData.source,
              resolvedData.description,
              resolvedData.date,
              resolvedData.multiplier,
              resolvedData.streak_count,
              resolvedData.updatedAt.toISOString(),
              resolvedData.id,
            ]
          );
          break;
        
        // Add more cases for other tables as needed
        default:
          console.warn(`No resolution handler for table: ${conflict.table}`);
      }
    } catch (error) {
      console.error('Failed to apply conflict resolution:', error);
      throw error;
    }
  }

  private areDataEqual(data1: any, data2: any): boolean {
    // Simple deep equality check (you might want to use a library like lodash)
    if (data1 === data2) return true;
    if (!data1 || !data2) return false;
    if (typeof data1 !== 'object' || typeof data2 !== 'object') return false;

    const keys1 = Object.keys(data1);
    const keys2 = Object.keys(data2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      
      // Skip timestamp fields for comparison as they might differ slightly
      if (key.includes('_at') || key.includes('At')) continue;
      
      if (typeof data1[key] === 'object' && typeof data2[key] === 'object') {
        if (!this.areDataEqual(data1[key], data2[key])) return false;
      } else if (data1[key] !== data2[key]) {
        return false;
      }
    }

    return true;
  }

  public getPendingConflicts(): ConflictData[] {
    return [...this.pendingConflicts];
  }

  public addConflictListener(listener: (conflicts: ConflictData[]) => void): () => void {
    this.conflictListeners.push(listener);
    
    return () => {
      const index = this.conflictListeners.indexOf(listener);
      if (index > -1) {
        this.conflictListeners.splice(index, 1);
      }
    };
  }

  private notifyConflictListeners(): void {
    this.conflictListeners.forEach(listener => {
      try {
        listener([...this.pendingConflicts]);
      } catch (error) {
        console.error('Error in conflict listener:', error);
      }
    });
  }

  public async resolveAllConflicts(
    strategy: 'USE_LOCAL' | 'USE_REMOTE' | 'AUTO_MERGE' = 'AUTO_MERGE'
  ): Promise<void> {
    const conflicts = [...this.pendingConflicts];
    
    for (const conflict of conflicts) {
      try {
        let resolution: ConflictResolution;
        
        if (strategy === 'AUTO_MERGE') {
          const mergedData = await this.autoMergeData(
            conflict.table,
            conflict.localData,
            conflict.remoteData
          );
          resolution = {
            action: 'MERGE',
            resolvedData: mergedData,
            reason: 'Automatic merge using predefined strategies',
          };
        } else {
          resolution = {
            action: strategy,
            reason: `Bulk resolution using ${strategy} strategy`,
          };
        }
        
        await this.resolveConflict(conflict.id, resolution);
      } catch (error) {
        console.error(`Failed to resolve conflict ${conflict.id}:`, error);
      }
    }
  }

  public clearResolvedConflicts(): void {
    this.pendingConflicts = [];
    this.notifyConflictListeners();
  }
}