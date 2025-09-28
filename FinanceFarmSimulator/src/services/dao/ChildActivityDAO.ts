import { BaseDAO } from './BaseDAO';
import { 
  ChildActivity, 
  ChildActivityInput,
  ActivityType,
  validateChildActivity,
  validateChildActivityInput 
} from '../../models/ParentalControl';
import { generateId } from '../../utils/security';

export class ChildActivityDAO extends BaseDAO<ChildActivity, ChildActivityInput> {
  constructor() {
    super('child_activities');
  }

  protected createTableQuery = `
    CREATE TABLE IF NOT EXISTS child_activities (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN (
        'goal_created', 'goal_completed', 'expense_logged', 
        'income_logged', 'reward_claimed', 'allowance_received', 'chore_completed'
      )),
      description TEXT NOT NULL,
      amount REAL,
      metadata TEXT,
      timestamp TEXT NOT NULL,
      is_visible INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (child_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;

  protected mapRowToEntity(row: any): ChildActivity {
    return {
      id: row.id,
      childId: row.child_id,
      type: row.type as ActivityType,
      description: row.description,
      amount: row.amount || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      timestamp: new Date(row.timestamp),
      isVisible: Boolean(row.is_visible),
    };
  }

  protected mapEntityToRow(input: ChildActivityInput): Record<string, any> {
    return {
      id: generateId(),
      child_id: input.childId,
      type: input.type,
      description: input.description,
      amount: input.amount || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      timestamp: new Date().toISOString(),
      is_visible: input.isVisible ? 1 : 0,
    };
  }

  /**
   * Get activities for a child with pagination
   */
  async getActivitiesByChildId(
    childId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ChildActivity[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ? AND is_visible = 1
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;
    
    const rows = await this.db.getAllAsync(query, [childId, limit, offset]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get activities by type for a child
   */
  async getActivitiesByType(
    childId: string, 
    type: ActivityType,
    limit: number = 50
  ): Promise<ChildActivity[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ? AND type = ? AND is_visible = 1
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    
    const rows = await this.db.getAllAsync(query, [childId, type, limit]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get activities within a date range
   */
  async getActivitiesByDateRange(
    childId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ChildActivity[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ? AND is_visible = 1
      AND timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
    `;
    
    const rows = await this.db.getAllAsync(query, [
      childId,
      startDate.toISOString(),
      endDate.toISOString()
    ]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get financial activities (with amounts) for a child
   */
  async getFinancialActivities(childId: string, limit: number = 50): Promise<ChildActivity[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ? AND amount IS NOT NULL AND is_visible = 1
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    
    const rows = await this.db.getAllAsync(query, [childId, limit]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get activity summary for a child (count by type)
   */
  async getActivitySummary(childId: string, days: number = 30): Promise<Record<ActivityType, number>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT type, COUNT(*) as count FROM ${this.tableName} 
      WHERE child_id = ? AND is_visible = 1 AND timestamp >= ?
      GROUP BY type
    `;
    
    const rows = await this.db.getAllAsync(query, [childId, startDate.toISOString()]);
    
    const summary: Record<string, number> = {};
    rows.forEach((row: any) => {
      summary[row.type] = row.count;
    });
    
    return summary as Record<ActivityType, number>;
  }

  /**
   * Hide an activity from parent view
   */
  async hideActivity(activityId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_visible = 0
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [activityId]);
    return result.changes > 0;
  }

  /**
   * Show a hidden activity
   */
  async showActivity(activityId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_visible = 1
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [activityId]);
    return result.changes > 0;
  }

  /**
   * Delete old activities (cleanup)
   */
  async deleteOldActivities(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = `
      DELETE FROM ${this.tableName} 
      WHERE timestamp < ?
    `;
    
    const result = await this.db.runAsync(query, [cutoffDate.toISOString()]);
    return result.changes;
  }

  /**
   * Get total financial activity amount for a child in a period
   */
  async getTotalFinancialActivity(
    childId: string,
    activityTypes: ActivityType[],
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const placeholders = activityTypes.map(() => '?').join(',');
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total FROM ${this.tableName} 
      WHERE child_id = ? AND type IN (${placeholders})
      AND amount IS NOT NULL AND is_visible = 1
      AND timestamp >= ? AND timestamp <= ?
    `;
    
    const params = [childId, ...activityTypes, startDate.toISOString(), endDate.toISOString()];
    const result = await this.db.getFirstAsync(query, params) as any;
    return result?.total || 0;
  }

  /**
   * Log a financial activity (helper method)
   */
  async logFinancialActivity(
    childId: string,
    type: ActivityType,
    description: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<ChildActivity> {
    const input: ChildActivityInput = {
      childId,
      type,
      description,
      amount,
      metadata,
      isVisible: true,
    };

    return await this.create(input);
  }

  /**
   * Log a non-financial activity (helper method)
   */
  async logActivity(
    childId: string,
    type: ActivityType,
    description: string,
    metadata?: Record<string, any>
  ): Promise<ChildActivity> {
    const input: ChildActivityInput = {
      childId,
      type,
      description,
      metadata,
      isVisible: true,
    };

    return await this.create(input);
  }
}