import { BaseDAO } from './BaseDAO';
import { SavingsGoal, GoalCategory, GoalStatus } from '../../models/Financial';

interface SavingsGoalRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
  crop_type: string;
  status: string;
  is_recurring: boolean;
  recurring_period: string | null;
  created_at: string;
  updated_at: string;
}

export class SavingsGoalDAO extends BaseDAO<SavingsGoal, Partial<SavingsGoal>> {
  constructor() {
    super('savings_goals');
  }

  protected mapRowToEntity(row: SavingsGoalRow): SavingsGoal {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || undefined,
      targetAmount: row.target_amount,
      currentAmount: row.current_amount,
      deadline: new Date(row.deadline),
      category: row.category as GoalCategory,
      cropType: row.crop_type,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      status: row.status as GoalStatus,
      isRecurring: Boolean(row.is_recurring),
      recurringPeriod: row.recurring_period as 'weekly' | 'monthly' | 'yearly' | undefined,
    };
  }

  protected mapEntityToRow(entity: Partial<SavingsGoal>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id) row.id = entity.id;
    if (entity.userId) row.user_id = entity.userId;
    if (entity.title) row.title = entity.title;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.targetAmount !== undefined) row.target_amount = entity.targetAmount;
    if (entity.currentAmount !== undefined) row.current_amount = entity.currentAmount;
    if (entity.deadline) row.deadline = entity.deadline.toISOString();
    if (entity.category) row.category = entity.category;
    if (entity.cropType) row.crop_type = entity.cropType;
    if (entity.status) row.status = entity.status;
    if (entity.isRecurring !== undefined) row.is_recurring = entity.isRecurring;
    if (entity.recurringPeriod !== undefined) row.recurring_period = entity.recurringPeriod;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  public async findActiveByUserId(userId: string): Promise<SavingsGoal[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC`;
    
    try {
      const rows = await this.db.getAllAsync<SavingsGoalRow>(sql, [userId]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding active goals by user ID:', error);
      throw error;
    }
  }

  public async findByCategory(userId: string, category: GoalCategory): Promise<SavingsGoal[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND category = ? ORDER BY created_at DESC`;
    
    try {
      const rows = await this.db.getAllAsync<SavingsGoalRow>(sql, [userId, category]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding goals by category:', error);
      throw error;
    }
  }

  public async findByStatus(userId: string, status: GoalStatus): Promise<SavingsGoal[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND status = ? ORDER BY created_at DESC`;
    
    try {
      const rows = await this.db.getAllAsync<SavingsGoalRow>(sql, [userId, status]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding goals by status:', error);
      throw error;
    }
  }

  public async updateProgress(goalId: string, amount: number): Promise<SavingsGoal | null> {
    const sql = `UPDATE ${this.tableName} SET current_amount = current_amount + ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [amount, now, goalId]);
      return await this.findById(goalId);
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  public async markAsCompleted(goalId: string): Promise<SavingsGoal | null> {
    const sql = `UPDATE ${this.tableName} SET status = 'completed', updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [now, goalId]);
      return await this.findById(goalId);
    } catch (error) {
      console.error('Error marking goal as completed:', error);
      throw error;
    }
  }

  public async findExpiringSoon(userId: string, daysAhead: number = 7): Promise<SavingsGoal[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND status = 'active' AND deadline <= ? 
      ORDER BY deadline ASC
    `;
    
    try {
      const rows = await this.db.getAllAsync<SavingsGoalRow>(sql, [userId, futureDate.toISOString()]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding expiring goals:', error);
      throw error;
    }
  }

  public async getProgressSummary(userId: string): Promise<{
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    averageProgress: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_goals,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_goals,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_goals,
        SUM(target_amount) as total_target_amount,
        SUM(current_amount) as total_current_amount,
        AVG(CASE WHEN target_amount > 0 THEN (current_amount / target_amount) * 100 ELSE 0 END) as average_progress
      FROM ${this.tableName} 
      WHERE user_id = ?
    `;
    
    try {
      const result = await this.db.getFirstAsync<{
        total_goals: number;
        active_goals: number;
        completed_goals: number;
        total_target_amount: number;
        total_current_amount: number;
        average_progress: number;
      }>(sql, [userId]);
      
      return {
        totalGoals: result?.total_goals || 0,
        activeGoals: result?.active_goals || 0,
        completedGoals: result?.completed_goals || 0,
        totalTargetAmount: result?.total_target_amount || 0,
        totalCurrentAmount: result?.total_current_amount || 0,
        averageProgress: result?.average_progress || 0,
      };
    } catch (error) {
      console.error('Error getting progress summary:', error);
      throw error;
    }
  }
}