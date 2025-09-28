import { BaseDAO } from './BaseDAO';
import { Farm, FarmLayout } from '../../models/Game';

interface FarmRow {
  id: string;
  user_id: string;
  layout: string; // JSON
  health_score: number;
  level: number;
  experience: number;
  total_harvests: number;
  streak_days: number;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export class FarmDAO extends BaseDAO<Farm, Partial<Farm>> {
  constructor() {
    super('farms');
  }

  protected mapRowToEntity(row: FarmRow): Farm {
    const layout: FarmLayout = JSON.parse(row.layout);

    return {
      id: row.id,
      userId: row.user_id,
      layout,
      crops: [], // Crops are loaded separately via CropDAO
      decorations: [], // Decorations are loaded separately via DecorationDAO
      healthScore: row.health_score,
      level: row.level,
      experience: row.experience,
      totalHarvests: row.total_harvests,
      streakDays: row.streak_days,
      lastActiveAt: new Date(row.last_active_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(entity: Partial<Farm>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id) row.id = entity.id;
    if (entity.userId) row.user_id = entity.userId;
    if (entity.layout) row.layout = JSON.stringify(entity.layout);
    if (entity.healthScore !== undefined) row.health_score = entity.healthScore;
    if (entity.level !== undefined) row.level = entity.level;
    if (entity.experience !== undefined) row.experience = entity.experience;
    if (entity.totalHarvests !== undefined) row.total_harvests = entity.totalHarvests;
    if (entity.streakDays !== undefined) row.streak_days = entity.streakDays;
    if (entity.lastActiveAt) row.last_active_at = entity.lastActiveAt.toISOString();
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  public async findByUserId(userId: string): Promise<Farm[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`;
    
    try {
      const rows = await this.db.getAllAsync<FarmRow>(sql, [userId]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding farms by user ID:', error);
      throw error;
    }
  }

  public async findFarmByUserId(userId: string): Promise<Farm | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? LIMIT 1`;
    
    try {
      const row = await this.db.getFirstAsync<FarmRow>(sql, [userId]);
      return row ? this.mapRowToEntity(row) : null;
    } catch (error) {
      console.error('Error finding farm by user ID:', error);
      throw error;
    }
  }

  public async updateHealthScore(farmId: string, healthScore: number): Promise<Farm | null> {
    const sql = `UPDATE ${this.tableName} SET health_score = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [Math.max(0, Math.min(100, healthScore)), now, farmId]);
      return await this.findById(farmId);
    } catch (error) {
      console.error('Error updating farm health score:', error);
      throw error;
    }
  }

  public async addExperience(farmId: string, experiencePoints: number): Promise<Farm | null> {
    const sql = `UPDATE ${this.tableName} SET experience = experience + ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [experiencePoints, now, farmId]);
      
      // Check if level up is needed
      const farm = await this.findById(farmId);
      if (farm) {
        const newLevel = this.calculateLevel(farm.experience);
        if (newLevel > farm.level) {
          await this.updateLevel(farmId, newLevel);
          return await this.findById(farmId);
        }
      }
      
      return farm;
    } catch (error) {
      console.error('Error adding farm experience:', error);
      throw error;
    }
  }

  public async updateLevel(farmId: string, level: number): Promise<Farm | null> {
    const sql = `UPDATE ${this.tableName} SET level = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [level, now, farmId]);
      return await this.findById(farmId);
    } catch (error) {
      console.error('Error updating farm level:', error);
      throw error;
    }
  }

  public async incrementHarvest(farmId: string): Promise<Farm | null> {
    const sql = `UPDATE ${this.tableName} SET total_harvests = total_harvests + 1, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [now, farmId]);
      return await this.findById(farmId);
    } catch (error) {
      console.error('Error incrementing farm harvest count:', error);
      throw error;
    }
  }

  public async updateStreak(farmId: string, streakDays: number): Promise<Farm | null> {
    const sql = `UPDATE ${this.tableName} SET streak_days = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [streakDays, now, farmId]);
      return await this.findById(farmId);
    } catch (error) {
      console.error('Error updating farm streak:', error);
      throw error;
    }
  }

  public async updateLastActive(farmId: string): Promise<Farm | null> {
    const sql = `UPDATE ${this.tableName} SET last_active_at = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [now, now, farmId]);
      return await this.findById(farmId);
    } catch (error) {
      console.error('Error updating farm last active:', error);
      throw error;
    }
  }

  public async updateLayout(farmId: string, layout: FarmLayout): Promise<Farm | null> {
    const sql = `UPDATE ${this.tableName} SET layout = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [JSON.stringify(layout), now, farmId]);
      return await this.findById(farmId);
    } catch (error) {
      console.error('Error updating farm layout:', error);
      throw error;
    }
  }

  public async getFarmStatistics(userId: string): Promise<{
    totalFarms: number;
    averageLevel: number;
    totalHarvests: number;
    averageHealthScore: number;
    longestStreak: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_farms,
        AVG(level) as average_level,
        SUM(total_harvests) as total_harvests,
        AVG(health_score) as average_health_score,
        MAX(streak_days) as longest_streak
      FROM ${this.tableName} 
      WHERE user_id = ?
    `;
    
    try {
      const result = await this.db.getFirstAsync<{
        total_farms: number;
        average_level: number;
        total_harvests: number;
        average_health_score: number;
        longest_streak: number;
      }>(sql, [userId]);
      
      return {
        totalFarms: result?.total_farms || 0,
        averageLevel: result?.average_level || 1,
        totalHarvests: result?.total_harvests || 0,
        averageHealthScore: result?.average_health_score || 100,
        longestStreak: result?.longest_streak || 0,
      };
    } catch (error) {
      console.error('Error getting farm statistics:', error);
      throw error;
    }
  }

  public async getInactiveFarms(daysInactive: number = 7): Promise<Farm[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE last_active_at < ? 
      ORDER BY last_active_at ASC
    `;
    
    try {
      const rows = await this.db.getAllAsync<FarmRow>(sql, [cutoffDate.toISOString()]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding inactive farms:', error);
      throw error;
    }
  }

  private calculateLevel(experience: number): number {
    // Simple level calculation: every 1000 XP = 1 level
    return Math.floor(experience / 1000) + 1;
  }

  public getExperienceForLevel(level: number): number {
    return (level - 1) * 1000;
  }

  public getExperienceToNextLevel(currentExperience: number): number {
    const currentLevel = this.calculateLevel(currentExperience);
    const nextLevelExperience = this.getExperienceForLevel(currentLevel + 1);
    return nextLevelExperience - currentExperience;
  }
}