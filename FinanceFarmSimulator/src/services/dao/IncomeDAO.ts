import { BaseDAO } from './BaseDAO';
import { Income, IncomeSource } from '../../models/Financial';

interface IncomeRow {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  is_recurring: boolean;
  recurring_period: string | null;
  multiplier: number;
  streak_count: number;
  created_at: string;
  updated_at: string;
}

export class IncomeDAO extends BaseDAO<Income, Partial<Income>> {
  constructor() {
    super('income');
  }

  protected mapRowToEntity(row: IncomeRow): Income {
    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      source: row.source as IncomeSource,
      description: row.description,
      date: new Date(row.date),
      isRecurring: Boolean(row.is_recurring),
      recurringPeriod: row.recurring_period as 'daily' | 'weekly' | 'monthly' | undefined,
      multiplier: row.multiplier,
      streakCount: row.streak_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(entity: Partial<Income>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id) row.id = entity.id;
    if (entity.userId) row.user_id = entity.userId;
    if (entity.amount !== undefined) row.amount = entity.amount;
    if (entity.source) row.source = entity.source;
    if (entity.description) row.description = entity.description;
    if (entity.date) row.date = entity.date.toISOString();
    if (entity.isRecurring !== undefined) row.is_recurring = entity.isRecurring;
    if (entity.recurringPeriod !== undefined) row.recurring_period = entity.recurringPeriod;
    if (entity.multiplier !== undefined) row.multiplier = entity.multiplier;
    if (entity.streakCount !== undefined) row.streak_count = entity.streakCount;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  public async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Income[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND date >= ? AND date <= ? 
      ORDER BY date DESC
    `;
    
    try {
      const rows = await this.db.getAllAsync<IncomeRow>(sql, [
        userId, 
        startDate.toISOString(), 
        endDate.toISOString()
      ]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding income by date range:', error);
      throw error;
    }
  }

  public async findBySource(userId: string, source: IncomeSource): Promise<Income[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND source = ? ORDER BY date DESC`;
    
    try {
      const rows = await this.db.getAllAsync<IncomeRow>(sql, [userId, source]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding income by source:', error);
      throw error;
    }
  }

  public async getTotalBySource(userId: string, startDate?: Date, endDate?: Date): Promise<Record<IncomeSource, number>> {
    let sql = `
      SELECT source, SUM(amount * multiplier) as total 
      FROM ${this.tableName} 
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (startDate && endDate) {
      sql += ` AND date >= ? AND date <= ?`;
      params.push(startDate.toISOString(), endDate.toISOString());
    }

    sql += ` GROUP BY source`;
    
    try {
      const rows = await this.db.getAllAsync<{ source: string; total: number }>(sql, params);
      
      const result: Record<string, number> = {};
      rows.forEach(row => {
        result[row.source] = row.total;
      });
      
      return result as Record<IncomeSource, number>;
    } catch (error) {
      console.error('Error getting total by source:', error);
      throw error;
    }
  }

  public async getTotalForPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const sql = `
      SELECT SUM(amount * multiplier) as total 
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

  public async updateStreak(userId: string, incomeId: string, newStreakCount: number, newMultiplier: number): Promise<Income | null> {
    const sql = `
      UPDATE ${this.tableName} 
      SET streak_count = ?, multiplier = ?, updated_at = ? 
      WHERE id = ? AND user_id = ?
    `;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [newStreakCount, newMultiplier, now, incomeId, userId]);
      return await this.findById(incomeId);
    } catch (error) {
      console.error('Error updating income streak:', error);
      throw error;
    }
  }

  public async getCurrentStreak(userId: string): Promise<number> {
    // Get the most recent income entry and its streak count
    const sql = `
      SELECT streak_count 
      FROM ${this.tableName} 
      WHERE user_id = ? 
      ORDER BY date DESC 
      LIMIT 1
    `;
    
    try {
      const result = await this.db.getFirstAsync<{ streak_count: number }>(sql, [userId]);
      return result?.streak_count || 0;
    } catch (error) {
      console.error('Error getting current streak:', error);
      throw error;
    }
  }

  public async getStreakHistory(userId: string, limit: number = 30): Promise<Array<{ date: string; streakCount: number; multiplier: number }>> {
    const sql = `
      SELECT date, streak_count, multiplier
      FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT ?
    `;
    
    try {
      const rows = await this.db.getAllAsync<{ date: string; streak_count: number; multiplier: number }>(sql, [userId, limit]);
      return rows.map(row => ({
        date: row.date,
        streakCount: row.streak_count,
        multiplier: row.multiplier,
      }));
    } catch (error) {
      console.error('Error getting streak history:', error);
      throw error;
    }
  }

  public async findRecurring(userId: string): Promise<Income[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND is_recurring = 1 ORDER BY date DESC`;
    
    try {
      const rows = await this.db.getAllAsync<IncomeRow>(sql, [userId]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding recurring income:', error);
      throw error;
    }
  }

  public async getMonthlyTrend(userId: string, months: number = 6): Promise<Array<{ month: string; total: number; averageMultiplier: number }>> {
    const sql = `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount * multiplier) as total,
        AVG(multiplier) as average_multiplier
      FROM ${this.tableName}
      WHERE user_id = ? AND date >= date('now', '-${months} months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
    `;
    
    try {
      const rows = await this.db.getAllAsync<{ month: string; total: number; average_multiplier: number }>(sql, [userId]);
      return rows.map(row => ({
        month: row.month,
        total: row.total,
        averageMultiplier: row.average_multiplier,
      }));
    } catch (error) {
      console.error('Error getting monthly trend:', error);
      throw error;
    }
  }

  public async getHighestMultiplier(userId: string): Promise<number> {
    const sql = `SELECT MAX(multiplier) as max_multiplier FROM ${this.tableName} WHERE user_id = ?`;
    
    try {
      const result = await this.db.getFirstAsync<{ max_multiplier: number }>(sql, [userId]);
      return result?.max_multiplier || 1;
    } catch (error) {
      console.error('Error getting highest multiplier:', error);
      throw error;
    }
  }
}