import { BaseDAO } from './BaseDAO';
import { 
  Chore, 
  ChoreInput,
  validateChore,
  validateChoreInput 
} from '../../models/ParentalControl';
import { generateId } from '../../utils/security';

export class ChoreDAO extends BaseDAO<Chore, ChoreInput> {
  constructor() {
    super('chores');
  }

  protected createTableQuery = `
    CREATE TABLE IF NOT EXISTS chores (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reward REAL NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      approved_at TEXT,
      due_date TEXT,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurring_period TEXT CHECK (recurring_period IN ('daily', 'weekly', 'monthly')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (child_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;

  protected mapRowToEntity(row: any): Chore {
    return {
      id: row.id,
      childId: row.child_id,
      parentId: row.parent_id,
      title: row.title,
      description: row.description || undefined,
      reward: row.reward,
      isCompleted: Boolean(row.is_completed),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      isRecurring: Boolean(row.is_recurring),
      recurringPeriod: row.recurring_period as 'daily' | 'weekly' | 'monthly' | undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(input: ChoreInput): Record<string, any> {
    const now = new Date();
    return {
      id: generateId(),
      child_id: input.childId,
      parent_id: input.parentId,
      title: input.title,
      description: input.description || null,
      reward: input.reward,
      is_completed: 0,
      completed_at: null,
      approved_at: null,
      due_date: input.dueDate?.toISOString() || null,
      is_recurring: input.isRecurring ? 1 : 0,
      recurring_period: input.recurringPeriod || null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
  }

  /**
   * Get chores assigned to a child
   */
  async getChoresByChildId(childId: string): Promise<Chore[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ?
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.getAllAsync(query, [childId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get chores created by a parent
   */
  async getChoresByParentId(parentId: string): Promise<Chore[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = ?
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.getAllAsync(query, [parentId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get pending chores for a child (not completed)
   */
  async getPendingChoresByChildId(childId: string): Promise<Chore[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ? AND is_completed = 0
      ORDER BY due_date ASC, created_at ASC
    `;
    
    const rows = await this.db.getAllAsync(query, [childId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get completed chores awaiting approval
   */
  async getChoresAwaitingApproval(parentId: string): Promise<Chore[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = ? AND is_completed = 1 AND approved_at IS NULL
      ORDER BY completed_at ASC
    `;
    
    const rows = await this.db.getAllAsync(query, [parentId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get overdue chores
   */
  async getOverdueChores(childId?: string): Promise<Chore[]> {
    const now = new Date().toISOString();
    let query = `
      SELECT * FROM ${this.tableName} 
      WHERE due_date IS NOT NULL AND due_date < ? AND is_completed = 0
    `;
    const params: any[] = [now];

    if (childId) {
      query += ' AND child_id = ?';
      params.push(childId);
    }

    query += ' ORDER BY due_date ASC';
    
    const rows = await this.db.getAllAsync(query, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Mark chore as completed by child
   */
  async markAsCompleted(choreId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_completed = 1, completed_at = ?, updated_at = ?
      WHERE id = ? AND is_completed = 0
    `;
    
    const now = new Date().toISOString();
    const result = await this.db.runAsync(query, [now, now, choreId]);
    return result.changes > 0;
  }

  /**
   * Approve completed chore by parent
   */
  async approveChore(choreId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET approved_at = ?, updated_at = ?
      WHERE id = ? AND is_completed = 1 AND approved_at IS NULL
    `;
    
    const now = new Date().toISOString();
    const result = await this.db.runAsync(query, [now, now, choreId]);
    return result.changes > 0;
  }

  /**
   * Reject completed chore (mark as not completed)
   */
  async rejectChore(choreId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_completed = 0, completed_at = NULL, updated_at = ?
      WHERE id = ? AND is_completed = 1 AND approved_at IS NULL
    `;
    
    const result = await this.db.runAsync(query, [new Date().toISOString(), choreId]);
    return result.changes > 0;
  }

  /**
   * Update chore reward amount
   */
  async updateReward(choreId: string, newReward: number): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET reward = ?, updated_at = ?
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [newReward, new Date().toISOString(), choreId]);
    return result.changes > 0;
  }

  /**
   * Update chore due date
   */
  async updateDueDate(choreId: string, newDueDate: Date): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET due_date = ?, updated_at = ?
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [
      newDueDate.toISOString(),
      new Date().toISOString(),
      choreId
    ]);
    return result.changes > 0;
  }

  /**
   * Get chore completion statistics for a child
   */
  async getCompletionStats(childId: string, days: number = 30): Promise<{
    totalChores: number;
    completedChores: number;
    approvedChores: number;
    totalRewards: number;
    completionRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT 
        COUNT(*) as total_chores,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_chores,
        SUM(CASE WHEN approved_at IS NOT NULL THEN 1 ELSE 0 END) as approved_chores,
        SUM(CASE WHEN approved_at IS NOT NULL THEN reward ELSE 0 END) as total_rewards
      FROM ${this.tableName} 
      WHERE child_id = ? AND created_at >= ?
    `;
    
    const result = await this.db.getFirstAsync(query, [childId, startDate.toISOString()]) as any;
    
    const totalChores = result?.total_chores || 0;
    const completedChores = result?.completed_chores || 0;
    const approvedChores = result?.approved_chores || 0;
    const totalRewards = result?.total_rewards || 0;
    const completionRate = totalChores > 0 ? (completedChores / totalChores) * 100 : 0;

    return {
      totalChores,
      completedChores,
      approvedChores,
      totalRewards,
      completionRate,
    };
  }

  /**
   * Create recurring chore instances
   */
  async createRecurringInstances(choreId: string): Promise<Chore[]> {
    const originalChore = await this.findById(choreId);
    if (!originalChore || !originalChore.isRecurring || !originalChore.recurringPeriod) {
      return [];
    }

    // Calculate next due date based on recurring period
    const nextDueDate = new Date();
    switch (originalChore.recurringPeriod) {
      case 'daily':
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        break;
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case 'monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
    }

    const newChoreInput: ChoreInput = {
      childId: originalChore.childId,
      parentId: originalChore.parentId,
      title: originalChore.title,
      description: originalChore.description,
      reward: originalChore.reward,
      dueDate: nextDueDate,
      isRecurring: true,
      recurringPeriod: originalChore.recurringPeriod,
    };

    const newChore = await this.create(newChoreInput);
    return [newChore];
  }

  /**
   * Get total pending reward amount for a child
   */
  async getTotalPendingRewards(childId: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(reward), 0) as total_pending
      FROM ${this.tableName} 
      WHERE child_id = ? AND is_completed = 1 AND approved_at IS NULL
    `;
    
    const result = await this.db.getFirstAsync(query, [childId]) as any;
    return result?.total_pending || 0;
  }

  /**
   * Get approved rewards for a time period
   */
  async getApprovedRewards(childId: string, startDate: Date, endDate: Date): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(reward), 0) as total_approved
      FROM ${this.tableName} 
      WHERE child_id = ? AND approved_at IS NOT NULL
      AND approved_at >= ? AND approved_at <= ?
    `;
    
    const result = await this.db.getFirstAsync(query, [
      childId,
      startDate.toISOString(),
      endDate.toISOString()
    ]) as any;
    return result?.total_approved || 0;
  }
}