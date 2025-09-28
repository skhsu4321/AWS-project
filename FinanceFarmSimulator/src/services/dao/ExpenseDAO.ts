import { BaseDAO } from './BaseDAO';
import { Expense, ExpenseCategory } from '../../models/Financial';

interface ExpenseRow {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  receipt_image: string | null;
  is_recurring: boolean;
  recurring_period: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export class ExpenseDAO extends BaseDAO<Expense, Partial<Expense>> {
  constructor() {
    super('expenses');
  }

  protected mapRowToEntity(row: ExpenseRow): Expense {
    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      category: row.category as ExpenseCategory,
      description: row.description,
      date: new Date(row.date),
      receiptImage: row.receipt_image || undefined,
      isRecurring: Boolean(row.is_recurring),
      recurringPeriod: row.recurring_period as 'daily' | 'weekly' | 'monthly' | undefined,
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(entity: Partial<Expense>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id) row.id = entity.id;
    if (entity.userId) row.user_id = entity.userId;
    if (entity.amount !== undefined) row.amount = entity.amount;
    if (entity.category) row.category = entity.category;
    if (entity.description) row.description = entity.description;
    if (entity.date) row.date = entity.date.toISOString();
    if (entity.receiptImage !== undefined) row.receipt_image = entity.receiptImage;
    if (entity.isRecurring !== undefined) row.is_recurring = entity.isRecurring;
    if (entity.recurringPeriod !== undefined) row.recurring_period = entity.recurringPeriod;
    if (entity.tags !== undefined) row.tags = JSON.stringify(entity.tags);
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  public async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND date >= ? AND date <= ? 
      ORDER BY date DESC
    `;
    
    try {
      const rows = await this.db.getAllAsync<ExpenseRow>(sql, [
        userId, 
        startDate.toISOString(), 
        endDate.toISOString()
      ]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding expenses by date range:', error);
      throw error;
    }
  }

  public async findByCategory(userId: string, category: ExpenseCategory): Promise<Expense[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND category = ? ORDER BY date DESC`;
    
    try {
      const rows = await this.db.getAllAsync<ExpenseRow>(sql, [userId, category]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding expenses by category:', error);
      throw error;
    }
  }

  public async findByTags(userId: string, tags: string[]): Promise<Expense[]> {
    // Create a query that checks if any of the provided tags exist in the expense tags
    const tagConditions = tags.map(() => `JSON_EXTRACT(tags, '$') LIKE ?`).join(' OR ');
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND (${tagConditions})
      ORDER BY date DESC
    `;
    
    const tagParams = tags.map(tag => `%"${tag}"%`);
    
    try {
      const rows = await this.db.getAllAsync<ExpenseRow>(sql, [userId, ...tagParams]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding expenses by tags:', error);
      throw error;
    }
  }

  public async getTotalByCategory(userId: string, startDate?: Date, endDate?: Date): Promise<Record<ExpenseCategory, number>> {
    let sql = `
      SELECT category, SUM(amount) as total 
      FROM ${this.tableName} 
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (startDate && endDate) {
      sql += ` AND date >= ? AND date <= ?`;
      params.push(startDate.toISOString(), endDate.toISOString());
    }

    sql += ` GROUP BY category`;
    
    try {
      const rows = await this.db.getAllAsync<{ category: string; total: number }>(sql, params);
      
      const result: Record<string, number> = {};
      rows.forEach(row => {
        result[row.category] = row.total;
      });
      
      return result as Record<ExpenseCategory, number>;
    } catch (error) {
      console.error('Error getting total by category:', error);
      throw error;
    }
  }

  public async getTotalForPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const sql = `
      SELECT SUM(amount) as total 
      FROM ${this.tableName} 
      WHERE user_id = ? AND date >= ? AND date <= ?
    `;
    
    try {
      const result = await this.db.getFirstAsync<{ total: number }>(sql, [
        userId, 
        startDate.toISOString(), 
        endDate.toISOString()
      ]);
      
      return result?.total || 0;
    } catch (error) {
      console.error('Error getting total for period:', error);
      throw error;
    }
  }

  public async getAverageDaily(userId: string, days: number = 30): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const sql = `
      SELECT AVG(daily_total) as average_daily
      FROM (
        SELECT DATE(date) as expense_date, SUM(amount) as daily_total
        FROM ${this.tableName}
        WHERE user_id = ? AND date >= ? AND date <= ?
        GROUP BY DATE(date)
      ) daily_expenses
    `;
    
    try {
      const result = await this.db.getFirstAsync<{ average_daily: number }>(sql, [
        userId, 
        startDate.toISOString(), 
        endDate.toISOString()
      ]);
      
      return result?.average_daily || 0;
    } catch (error) {
      console.error('Error getting average daily expenses:', error);
      throw error;
    }
  }

  public async findRecurring(userId: string): Promise<Expense[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND is_recurring = 1 ORDER BY date DESC`;
    
    try {
      const rows = await this.db.getAllAsync<ExpenseRow>(sql, [userId]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding recurring expenses:', error);
      throw error;
    }
  }

  public async getMonthlyTrend(userId: string, months: number = 6): Promise<Array<{ month: string; total: number }>> {
    const sql = `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total
      FROM ${this.tableName}
      WHERE user_id = ? AND date >= date('now', '-${months} months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
    `;
    
    try {
      const rows = await this.db.getAllAsync<{ month: string; total: number }>(sql, [userId]);
      return rows;
    } catch (error) {
      console.error('Error getting monthly trend:', error);
      throw error;
    }
  }
}