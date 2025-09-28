import { BaseDAO } from './BaseDAO';
import { User, UserProfile } from '../../models/User';
import { DatabaseService } from '../DatabaseService';

interface UserRow {
  id: string;
  email: string;
  profile: string; // Encrypted JSON
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  is_email_verified: boolean;
  is_active: boolean;
}

export class UserDAO extends BaseDAO<User, Partial<User>> {
  constructor() {
    super('users');
  }

  protected mapRowToEntity(row: UserRow): User {
    const decryptedProfile = this.databaseService.decryptSensitiveData(row.profile);
    const profile: UserProfile = JSON.parse(decryptedProfile);

    return {
      id: row.id,
      email: row.email,
      profile,
      createdAt: new Date(row.created_at),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : new Date(),
      isEmailVerified: Boolean(row.is_email_verified),
      isActive: Boolean(row.is_active),
    };
  }

  protected mapEntityToRow(entity: Partial<User>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id) row.id = entity.id;
    if (entity.email) row.email = entity.email;
    if (entity.profile) {
      const encryptedProfile = this.databaseService.encryptSensitiveData(
        JSON.stringify(entity.profile)
      );
      row.profile = encryptedProfile;
    }
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.lastLoginAt) row.last_login_at = entity.lastLoginAt.toISOString();
    if (entity.isEmailVerified !== undefined) row.is_email_verified = entity.isEmailVerified;
    if (entity.isActive !== undefined) row.is_active = entity.isActive;

    return row;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE email = ? LIMIT 1`;
    
    try {
      const row = await this.db.getFirstAsync<UserRow>(sql, [email]);
      return row ? this.mapRowToEntity(row) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  public async updateLastLogin(userId: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET last_login_at = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [now, now, userId]);
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  public async updateEmailVerification(userId: string, isVerified: boolean): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET is_email_verified = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [isVerified, now, userId]);
    } catch (error) {
      console.error('Error updating email verification:', error);
      throw error;
    }
  }

  public async deactivateUser(userId: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET is_active = ?, updated_at = ? WHERE id = ?`;
    const now = new Date().toISOString();
    
    try {
      await this.db.runAsync(sql, [false, now, userId]);
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  public async findChildrenByParentId(parentId: string): Promise<User[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE JSON_EXTRACT(profile, '$.parentAccountId') = ?`;
    
    try {
      const rows = await this.db.getAllAsync<UserRow>(sql, [parentId]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding children by parent ID:', error);
      throw error;
    }
  }
}