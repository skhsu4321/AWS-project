import { BaseDAO } from './BaseDAO';
import { 
  RestrictionConfig, 
  RestrictionConfigInput,
  RestrictionType,
  validateRestrictionConfig,
  validateRestrictionConfigInput 
} from '../../models/ParentalControl';
import { generateId } from '../../utils/security';

export class RestrictionConfigDAO extends BaseDAO<RestrictionConfig, RestrictionConfigInput> {
  constructor() {
    super('restriction_configs');
  }

  protected createTableQuery = `
    CREATE TABLE IF NOT EXISTS restriction_configs (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN (
        'spending_limit', 'goal_amount_limit', 'daily_usage_limit', 'feature_restriction'
      )),
      value REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (child_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(child_id, type)
    )
  `;

  protected mapRowToEntity(row: any): RestrictionConfig {
    return {
      id: row.id,
      childId: row.child_id,
      parentId: row.parent_id,
      type: row.type as RestrictionType,
      value: row.value,
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(input: RestrictionConfigInput): Record<string, any> {
    const now = new Date();
    return {
      id: generateId(),
      child_id: input.childId,
      parent_id: input.parentId,
      type: input.type,
      value: input.value,
      is_active: input.isActive ? 1 : 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
  }

  /**
   * Get all active restrictions for a child
   */
  async getActiveRestrictionsByChildId(childId: string): Promise<RestrictionConfig[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.getAllAsync(query, [childId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get restrictions managed by a parent
   */
  async getRestrictionsByParentId(parentId: string): Promise<RestrictionConfig[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = ?
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.getAllAsync(query, [parentId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get specific restriction by child and type
   */
  async getRestrictionByType(childId: string, type: RestrictionType): Promise<RestrictionConfig | null> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ? AND type = ? AND is_active = 1
      LIMIT 1
    `;
    
    const row = await this.db.getFirstAsync(query, [childId, type]);
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Update restriction value
   */
  async updateRestrictionValue(childId: string, type: RestrictionType, newValue: number): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET value = ?, updated_at = ?
      WHERE child_id = ? AND type = ? AND is_active = 1
    `;
    
    const result = await this.db.runAsync(query, [
      newValue,
      new Date().toISOString(),
      childId,
      type
    ]);
    return result.changes > 0;
  }

  /**
   * Activate a restriction
   */
  async activateRestriction(restrictionId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_active = 1, updated_at = ?
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [new Date().toISOString(), restrictionId]);
    return result.changes > 0;
  }

  /**
   * Deactivate a restriction
   */
  async deactivateRestriction(restrictionId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_active = 0, updated_at = ?
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [new Date().toISOString(), restrictionId]);
    return result.changes > 0;
  }

  /**
   * Check if a value exceeds the restriction limit
   */
  async checkRestrictionLimit(childId: string, type: RestrictionType, value: number): Promise<{
    isViolation: boolean;
    limit?: number;
    restriction?: RestrictionConfig;
  }> {
    const restriction = await this.getRestrictionByType(childId, type);
    
    if (!restriction) {
      return { isViolation: false };
    }

    const isViolation = value > restriction.value;
    return {
      isViolation,
      limit: restriction.value,
      restriction,
    };
  }

  /**
   * Get spending limit for a child
   */
  async getSpendingLimit(childId: string): Promise<number | null> {
    const restriction = await this.getRestrictionByType(childId, RestrictionType.SPENDING_LIMIT);
    return restriction?.value || null;
  }

  /**
   * Get goal amount limit for a child
   */
  async getGoalAmountLimit(childId: string): Promise<number | null> {
    const restriction = await this.getRestrictionByType(childId, RestrictionType.GOAL_AMOUNT_LIMIT);
    return restriction?.value || null;
  }

  /**
   * Get daily usage limit for a child (in minutes)
   */
  async getDailyUsageLimit(childId: string): Promise<number | null> {
    const restriction = await this.getRestrictionByType(childId, RestrictionType.DAILY_USAGE_LIMIT);
    return restriction?.value || null;
  }

  /**
   * Set or update spending limit
   */
  async setSpendingLimit(childId: string, parentId: string, limit: number): Promise<RestrictionConfig> {
    const existing = await this.getRestrictionByType(childId, RestrictionType.SPENDING_LIMIT);
    
    if (existing) {
      await this.updateRestrictionValue(childId, RestrictionType.SPENDING_LIMIT, limit);
      return (await this.findById(existing.id))!;
    } else {
      const input: RestrictionConfigInput = {
        childId,
        parentId,
        type: RestrictionType.SPENDING_LIMIT,
        value: limit,
        isActive: true,
      };
      return await this.create(input);
    }
  }

  /**
   * Set or update goal amount limit
   */
  async setGoalAmountLimit(childId: string, parentId: string, limit: number): Promise<RestrictionConfig> {
    const existing = await this.getRestrictionByType(childId, RestrictionType.GOAL_AMOUNT_LIMIT);
    
    if (existing) {
      await this.updateRestrictionValue(childId, RestrictionType.GOAL_AMOUNT_LIMIT, limit);
      return (await this.findById(existing.id))!;
    } else {
      const input: RestrictionConfigInput = {
        childId,
        parentId,
        type: RestrictionType.GOAL_AMOUNT_LIMIT,
        value: limit,
        isActive: true,
      };
      return await this.create(input);
    }
  }

  /**
   * Set or update daily usage limit (in minutes)
   */
  async setDailyUsageLimit(childId: string, parentId: string, limitMinutes: number): Promise<RestrictionConfig> {
    const existing = await this.getRestrictionByType(childId, RestrictionType.DAILY_USAGE_LIMIT);
    
    if (existing) {
      await this.updateRestrictionValue(childId, RestrictionType.DAILY_USAGE_LIMIT, limitMinutes);
      return (await this.findById(existing.id))!;
    } else {
      const input: RestrictionConfigInput = {
        childId,
        parentId,
        type: RestrictionType.DAILY_USAGE_LIMIT,
        value: limitMinutes,
        isActive: true,
      };
      return await this.create(input);
    }
  }

  /**
   * Remove all restrictions for a child
   */
  async removeAllRestrictions(childId: string): Promise<number> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_active = 0, updated_at = ?
      WHERE child_id = ? AND is_active = 1
    `;
    
    const result = await this.db.runAsync(query, [new Date().toISOString(), childId]);
    return result.changes;
  }
}