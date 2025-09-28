import { BaseDAO } from './BaseDAO';
import { Crop, CropType, GrowthStage, Position } from '../../models/Game';

interface CropRow {
  id: string;
  goal_id: string;
  user_id: string;
  type: string;
  growth_stage: string;
  health_points: number;
  position_x: number;
  position_y: number;
  planted_at: string;
  last_watered_at: string | null;
  last_fertilized_at: string | null;
  harvestable_at: string | null;
  harvested_at: string | null;
  growth_progress: number;
  fertilizer_boost: number;
  weed_penalty: number;
  streak_multiplier: number;
  created_at: string;
  updated_at: string;
}

export class CropDAO extends BaseDAO<Crop, Partial<Crop>> {
  constructor() {
    super('crops');
  }

  protected mapRowToEntity(row: CropRow): Crop {
    const position: Position = {
      x: row.position_x,
      y: row.position_y,
    };

    return {
      id: row.id,
      goalId: row.goal_id,
      userId: row.user_id,
      type: row.type as CropType,
      growthStage: row.growth_stage as GrowthStage,
      healthPoints: row.health_points,
      position,
      plantedAt: new Date(row.planted_at),
      lastWateredAt: row.last_watered_at ? new Date(row.last_watered_at) : undefined,
      lastFertilizedAt: row.last_fertilized_at ? new Date(row.last_fertilized_at) : undefined,
      harvestableAt: row.harvestable_at ? new Date(row.harvestable_at) : undefined,
      harvestedAt: row.harvested_at ? new Date(row.harvested_at) : undefined,
      growthProgress: row.growth_progress,
      fertilizerBoost: row.fertilizer_boost,
      weedPenalty: row.weed_penalty,
      streakMultiplier: row.streak_multiplier,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(entity: Partial<Crop>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id) row.id = entity.id;
    if (entity.goalId) row.goal_id = entity.goalId;
    if (entity.userId) row.user_id = entity.userId;
    if (entity.type) row.type = entity.type;
    if (entity.growthStage) row.growth_stage = entity.growthStage;
    if (entity.healthPoints !== undefined) row.health_points = entity.healthPoints;
    if (entity.position) {
      row.position_x = entity.position.x;
      row.position_y = entity.position.y;
    }
    if (entity.plantedAt) row.planted_at = entity.plantedAt.toISOString();
    if (entity.lastWateredAt !== undefined) {
      row.last_watered_at = entity.lastWateredAt ? entity.lastWateredAt.toISOString() : null;
    }
    if (entity.lastFertilizedAt !== undefined) {
      row.last_fertilized_at = entity.lastFertilizedAt ? entity.lastFertilizedAt.toISOString() : null;
    }
    if (entity.harvestableAt !== undefined) {
      row.harvestable_at = entity.harvestableAt ? entity.harvestableAt.toISOString() : null;
    }
    if (entity.harvestedAt !== undefined) {
      row.harvested_at = entity.harvestedAt ? entity.harvestedAt.toISOString() : null;
    }
    if (entity.growthProgress !== undefined) row.growth_progress = entity.growthProgress;
    if (entity.fertilizerBoost !== undefined) row.fertilizer_boost = entity.fertilizerBoost;
    if (entity.weedPenalty !== undefined) row.weed_penalty = entity.weedPenalty;
    if (entity.streakMultiplier !== undefined) row.streak_multiplier = entity.streakMultiplier;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  public async findByGoalId(goalId: string): Promise<Crop[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE goal_id = ? ORDER BY created_at DESC`;
    
    try {
      const rows = await this.db.getAllAsync<CropRow>(sql, [goalId]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding crops by goal ID:', error);
      throw error;
    }
  }

  public async findByGrowthStage(userId: string, growthStage: GrowthStage): Promise<Crop[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND growth_stage = ? ORDER BY created_at DESC`;
    
    try {
      const rows = await this.db.getAllAsync<CropRow>(sql, [userId, growthStage]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding crops by growth stage:', error);
      throw error;
    }
  }

  public async findReadyToHarvest(userId: string): Promise<Crop[]> {
    const now = new Date().toISOString();
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND growth_stage = 'ready_to_harvest' AND harvestable_at <= ?
      ORDER BY harvestable_at ASC
    `;
    
    try {
      const rows = await this.db.getAllAsync<CropRow>(sql, [userId, now]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding crops ready to harvest:', error);
      throw error;
    }
  }

  public async findNeedingCare(userId: string, healthThreshold: number = 50): Promise<Crop[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND health_points < ? AND growth_stage NOT IN ('harvested', 'withered')
      ORDER BY health_points ASC
    `;
    
    try {
      const rows = await this.db.getAllAsync<CropRow>(sql, [userId, healthThreshold]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding crops needing care:', error);
      throw error;
    }
  }

  public async updateGrowthProgress(cropId: string, progress: number, growthStage?: GrowthStage): Promise<Crop | null> {
    let sql = `UPDATE ${this.tableName} SET growth_progress = ?, updated_at = ?`;
    const params: any[] = [Math.max(0, Math.min(100, progress)), new Date().toISOString()];
    
    if (growthStage) {
      sql += `, growth_stage = ?`;
      params.push(growthStage);
    }
    
    sql += ` WHERE id = ?`;
    params.push(cropId);
    
    try {
      await this.db.runAsync(sql, params);
      return await this.findById(cropId);
    } catch (error) {
      console.error('Error updating crop growth progress:', error);
      throw error;
    }
  }

  public async updateHealthPoints(cropId: string, healthPoints: number): Promise<Crop | null> {
    const sql = `UPDATE ${this.tableName} SET health_points = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [Math.max(0, Math.min(100, healthPoints)), now, cropId]);
      return await this.findById(cropId);
    } catch (error) {
      console.error('Error updating crop health points:', error);
      throw error;
    }
  }

  public async water(cropId: string): Promise<Crop | null> {
    const sql = `UPDATE ${this.tableName} SET last_watered_at = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [now, now, cropId]);
      return await this.findById(cropId);
    } catch (error) {
      console.error('Error watering crop:', error);
      throw error;
    }
  }

  public async fertilize(cropId: string, boostAmount: number = 0.5): Promise<Crop | null> {
    const sql = `
      UPDATE ${this.tableName} 
      SET last_fertilized_at = ?, fertilizer_boost = fertilizer_boost + ?, updated_at = ? 
      WHERE id = ?
    `;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [now, boostAmount, now, cropId]);
      return await this.findById(cropId);
    } catch (error) {
      console.error('Error fertilizing crop:', error);
      throw error;
    }
  }

  public async applyWeedPenalty(cropId: string, penaltyAmount: number): Promise<Crop | null> {
    const sql = `
      UPDATE ${this.tableName} 
      SET weed_penalty = LEAST(1.0, weed_penalty + ?), updated_at = ? 
      WHERE id = ?
    `;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [penaltyAmount, now, cropId]);
      return await this.findById(cropId);
    } catch (error) {
      console.error('Error applying weed penalty:', error);
      throw error;
    }
  }

  public async updateStreakMultiplier(cropId: string, multiplier: number): Promise<Crop | null> {
    const sql = `UPDATE ${this.tableName} SET streak_multiplier = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [Math.max(1, Math.min(10, multiplier)), now, cropId]);
      return await this.findById(cropId);
    } catch (error) {
      console.error('Error updating streak multiplier:', error);
      throw error;
    }
  }

  public async harvest(cropId: string): Promise<Crop | null> {
    const sql = `
      UPDATE ${this.tableName} 
      SET growth_stage = 'harvested', harvested_at = ?, updated_at = ? 
      WHERE id = ?
    `;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [now, now, cropId]);
      return await this.findById(cropId);
    } catch (error) {
      console.error('Error harvesting crop:', error);
      throw error;
    }
  }

  public async markAsHarvestable(cropId: string): Promise<Crop | null> {
    const sql = `
      UPDATE ${this.tableName} 
      SET growth_stage = 'ready_to_harvest', harvestable_at = ?, updated_at = ? 
      WHERE id = ?
    `;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [now, now, cropId]);
      return await this.findById(cropId);
    } catch (error) {
      console.error('Error marking crop as harvestable:', error);
      throw error;
    }
  }

  public async getCropStatistics(userId: string): Promise<{
    totalCrops: number;
    activeCrops: number;
    harvestedCrops: number;
    averageHealth: number;
    cropsByType: Record<CropType, number>;
    cropsByStage: Record<GrowthStage, number>;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_crops,
        SUM(CASE WHEN growth_stage NOT IN ('harvested', 'withered') THEN 1 ELSE 0 END) as active_crops,
        SUM(CASE WHEN growth_stage = 'harvested' THEN 1 ELSE 0 END) as harvested_crops,
        AVG(health_points) as average_health,
        type,
        growth_stage,
        COUNT(*) as count
      FROM ${this.tableName} 
      WHERE user_id = ?
      GROUP BY type, growth_stage
    `;
    
    try {
      const rows = await this.db.getAllAsync<{
        total_crops: number;
        active_crops: number;
        harvested_crops: number;
        average_health: number;
        type: string;
        growth_stage: string;
        count: number;
      }>(sql, [userId]);
      
      const cropsByType: Record<string, number> = {};
      const cropsByStage: Record<string, number> = {};
      let totalCrops = 0;
      let activeCrops = 0;
      let harvestedCrops = 0;
      let averageHealth = 0;
      
      rows.forEach(row => {
        totalCrops = row.total_crops;
        activeCrops = row.active_crops;
        harvestedCrops = row.harvested_crops;
        averageHealth = row.average_health;
        
        cropsByType[row.type] = (cropsByType[row.type] || 0) + row.count;
        cropsByStage[row.growth_stage] = (cropsByStage[row.growth_stage] || 0) + row.count;
      });
      
      return {
        totalCrops,
        activeCrops,
        harvestedCrops,
        averageHealth,
        cropsByType: cropsByType as Record<CropType, number>,
        cropsByStage: cropsByStage as Record<GrowthStage, number>,
      };
    } catch (error) {
      console.error('Error getting crop statistics:', error);
      throw error;
    }
  }

  public async findOverdue(userId: string, daysOverdue: number = 3): Promise<Crop[]> {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - daysOverdue);
    
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? 
        AND growth_stage = 'ready_to_harvest' 
        AND harvestable_at < ?
      ORDER BY harvestable_at ASC
    `;
    
    try {
      const rows = await this.db.getAllAsync<CropRow>(sql, [userId, overdueDate.toISOString()]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding overdue crops:', error);
      throw error;
    }
  }
}