import { BaseDAO } from './BaseDAO';
import { 
  AllowanceConfig, 
  AllowanceConfigInput,
  validateAllowanceConfig,
  validateAllowanceConfigInput 
} from '../../models/ParentalControl';
import { generateId } from '../../utils/security';

export class AllowanceConfigDAO extends BaseDAO<AllowanceConfig, AllowanceConfigInput> {
  constructor() {
    super('allowance_configs');
  }

  protected createTableQuery = `
    CREATE TABLE IF NOT EXISTS allowance_configs (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
      day_of_week INTEGER,
      day_of_month INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      start_date TEXT NOT NULL,
      end_date TEXT,
      last_paid_at TEXT,
      next_payment_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (child_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(child_id, parent_id)
    )
  `;

  protected mapRowToEntity(row: any): AllowanceConfig {
    return {
      id: row.id,
      childId: row.child_id,
      parentId: row.parent_id,
      amount: row.amount,
      frequency: row.frequency as 'daily' | 'weekly' | 'monthly',
      dayOfWeek: row.day_of_week || undefined,
      dayOfMonth: row.day_of_month || undefined,
      isActive: Boolean(row.is_active),
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      lastPaidAt: row.last_paid_at ? new Date(row.last_paid_at) : undefined,
      nextPaymentAt: new Date(row.next_payment_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(input: AllowanceConfigInput): Record<string, any> {
    const now = new Date();
    const nextPayment = this.calculateNextPayment(input.startDate, input.frequency, input.dayOfWeek, input.dayOfMonth);
    
    return {
      id: generateId(),
      child_id: input.childId,
      parent_id: input.parentId,
      amount: input.amount,
      frequency: input.frequency,
      day_of_week: input.dayOfWeek || null,
      day_of_month: input.dayOfMonth || null,
      is_active: input.isActive ? 1 : 0,
      start_date: input.startDate.toISOString(),
      end_date: input.endDate?.toISOString() || null,
      last_paid_at: null,
      next_payment_at: nextPayment.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
  }

  /**
   * Calculate next payment date based on frequency and configuration
   */
  private calculateNextPayment(
    startDate: Date, 
    frequency: 'daily' | 'weekly' | 'monthly',
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date {
    const now = new Date();
    const start = new Date(startDate);
    
    switch (frequency) {
      case 'daily':
        const nextDaily = new Date(Math.max(now.getTime(), start.getTime()));
        nextDaily.setDate(nextDaily.getDate() + 1);
        return nextDaily;
        
      case 'weekly':
        const nextWeekly = new Date(Math.max(now.getTime(), start.getTime()));
        const currentDay = nextWeekly.getDay();
        const targetDay = dayOfWeek || 0;
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        nextWeekly.setDate(nextWeekly.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        return nextWeekly;
        
      case 'monthly':
        const nextMonthly = new Date(Math.max(now.getTime(), start.getTime()));
        const targetDate = dayOfMonth || 1;
        nextMonthly.setDate(targetDate);
        if (nextMonthly <= now) {
          nextMonthly.setMonth(nextMonthly.getMonth() + 1);
        }
        return nextMonthly;
        
      default:
        return new Date(start.getTime() + 24 * 60 * 60 * 1000); // Default to next day
    }
  }

  /**
   * Get active allowance configuration for a child
   */
  async getActiveAllowanceByChildId(childId: string): Promise<AllowanceConfig | null> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ? AND is_active = 1
      LIMIT 1
    `;
    
    const row = await this.db.getFirstAsync(query, [childId]);
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Get all allowance configurations managed by a parent
   */
  async getAllowancesByParentId(parentId: string): Promise<AllowanceConfig[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = ?
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.getAllAsync(query, [parentId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get allowances that are due for payment
   */
  async getDueAllowances(): Promise<AllowanceConfig[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE is_active = 1 AND next_payment_at <= ?
      AND (end_date IS NULL OR end_date > ?)
    `;
    
    const now = new Date().toISOString();
    const rows = await this.db.getAllAsync(query, [now, now]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Mark allowance as paid and calculate next payment
   */
  async markAsPaid(allowanceId: string): Promise<boolean> {
    // First get the current allowance config
    const current = await this.findById(allowanceId);
    if (!current) return false;

    const now = new Date();
    const nextPayment = this.calculateNextPayment(
      now, 
      current.frequency, 
      current.dayOfWeek, 
      current.dayOfMonth
    );

    const query = `
      UPDATE ${this.tableName} 
      SET last_paid_at = ?, next_payment_at = ?, updated_at = ?
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [
      now.toISOString(),
      nextPayment.toISOString(),
      now.toISOString(),
      allowanceId
    ]);
    
    return result.changes > 0;
  }

  /**
   * Deactivate an allowance configuration
   */
  async deactivateAllowance(allowanceId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_active = 0, updated_at = ?
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [new Date().toISOString(), allowanceId]);
    return result.changes > 0;
  }

  /**
   * Update allowance amount
   */
  async updateAmount(allowanceId: string, newAmount: number): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET amount = ?, updated_at = ?
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [newAmount, new Date().toISOString(), allowanceId]);
    return result.changes > 0;
  }

  /**
   * Update allowance frequency and recalculate next payment
   */
  async updateFrequency(
    allowanceId: string, 
    frequency: 'daily' | 'weekly' | 'monthly',
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Promise<boolean> {
    const now = new Date();
    const nextPayment = this.calculateNextPayment(now, frequency, dayOfWeek, dayOfMonth);

    const query = `
      UPDATE ${this.tableName} 
      SET frequency = ?, day_of_week = ?, day_of_month = ?, 
          next_payment_at = ?, updated_at = ?
      WHERE id = ?
    `;
    
    const result = await this.db.runAsync(query, [
      frequency,
      dayOfWeek || null,
      dayOfMonth || null,
      nextPayment.toISOString(),
      now.toISOString(),
      allowanceId
    ]);
    
    return result.changes > 0;
  }
}