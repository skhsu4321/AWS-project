import * as SQLite from 'expo-sqlite';
import { DatabaseService } from '../DatabaseService';

export abstract class BaseDAO<T, TInput = Partial<T>> {
  protected db: SQLite.SQLiteDatabase;
  protected tableName: string;
  protected databaseService: DatabaseService;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.databaseService = DatabaseService.getInstance();
    this.db = this.databaseService.getDatabase();
  }

  // Abstract methods that must be implemented by subclasses
  protected abstract mapRowToEntity(row: any): T;
  protected abstract mapEntityToRow(entity: TInput): Record<string, any>;

  // Generic CRUD operations
  public async create(entity: TInput): Promise<T> {
    const row = this.mapEntityToRow(entity);
    const columns = Object.keys(row).join(', ');
    const placeholders = Object.keys(row).map(() => '?').join(', ');
    const values = Object.values(row);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    
    try {
      const result = await this.db.runAsync(sql, values);
      
      // Get the created entity
      const createdEntity = await this.findById(row.id || result.lastInsertRowId?.toString());
      if (!createdEntity) {
        throw new Error(`Failed to retrieve created entity from ${this.tableName}`);
      }
      
      return createdEntity;
    } catch (error) {
      console.error(`Error creating entity in ${this.tableName}:`, error);
      throw error;
    }
  }

  public async findById(id: string | number): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    
    try {
      const row = await this.db.getFirstAsync(sql, [id]);
      return row ? this.mapRowToEntity(row) : null;
    } catch (error) {
      console.error(`Error finding entity by id in ${this.tableName}:`, error);
      throw error;
    }
  }

  public async findAll(): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
    
    try {
      const rows = await this.db.getAllAsync(sql);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error(`Error finding all entities in ${this.tableName}:`, error);
      throw error;
    }
  }

  public async findByUserId(userId: string): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`;
    
    try {
      const rows = await this.db.getAllAsync(sql, [userId]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error(`Error finding entities by user_id in ${this.tableName}:`, error);
      throw error;
    }
  }

  public async update(id: string, updates: Partial<TInput>): Promise<T | null> {
    const row = this.mapEntityToRow(updates as TInput);
    
    // Remove undefined values and add updated_at
    const cleanRow = Object.fromEntries(
      Object.entries(row).filter(([_, value]) => value !== undefined)
    );
    cleanRow.updated_at = new Date().toISOString();

    const columns = Object.keys(cleanRow).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(cleanRow), id];

    const sql = `UPDATE ${this.tableName} SET ${columns} WHERE id = ?`;
    
    try {
      await this.db.runAsync(sql, values);
      return await this.findById(id);
    } catch (error) {
      console.error(`Error updating entity in ${this.tableName}:`, error);
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    
    try {
      const result = await this.db.runAsync(sql, [id]);
      return (result.changes || 0) > 0;
    } catch (error) {
      console.error(`Error deleting entity from ${this.tableName}:`, error);
      throw error;
    }
  }

  public async deleteByUserId(userId: string): Promise<number> {
    const sql = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    
    try {
      const result = await this.db.runAsync(sql, [userId]);
      return result.changes || 0;
    } catch (error) {
      console.error(`Error deleting entities by user_id from ${this.tableName}:`, error);
      throw error;
    }
  }

  public async count(): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(sql);
      return result?.count || 0;
    } catch (error) {
      console.error(`Error counting entities in ${this.tableName}:`, error);
      throw error;
    }
  }

  public async countByUserId(userId: string): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(sql, [userId]);
      return result?.count || 0;
    } catch (error) {
      console.error(`Error counting entities by user_id in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Utility methods for date handling
  protected parseDate(dateString: string | null): Date | undefined {
    return dateString ? new Date(dateString) : undefined;
  }

  protected formatDate(date: Date | undefined): string | undefined {
    return date ? date.toISOString() : undefined;
  }

  // Utility methods for JSON handling
  protected parseJSON<T>(jsonString: string | null): T | undefined {
    if (!jsonString) return undefined;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return undefined;
    }
  }

  protected stringifyJSON(obj: any): string | undefined {
    if (obj === undefined || obj === null) return undefined;
    try {
      return JSON.stringify(obj);
    } catch (error) {
      console.error('Error stringifying JSON:', error);
      return undefined;
    }
  }
}