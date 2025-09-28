import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { DATABASE_NAME, DATABASE_VERSION } from '../utils/constants';

interface Migration {
  version: number;
  sql: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private encryptionKey: string | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await this.initializeEncryption();
      await this.runMigrations();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async initializeEncryption(): Promise<void> {
    // Generate or retrieve encryption key for sensitive data
    // In production, this should be stored securely (e.g., Keychain/Keystore)
    this.encryptionKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${DATABASE_NAME}_encryption_key_v${DATABASE_VERSION}`,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check current database version
    const result = await this.db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    const currentVersion = result?.user_version || 0;

    if (currentVersion < DATABASE_VERSION) {
      console.log(`Migrating database from version ${currentVersion} to ${DATABASE_VERSION}`);
      
      const migrations = this.getMigrations();
      
      for (const migration of migrations) {
        if (migration.version > currentVersion) {
          console.log(`Running migration ${migration.version}`);
          await this.db.execAsync(migration.sql);
        }
      }

      // Update database version
      await this.db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
      console.log('Database migration completed');
    }
  }

  private getMigrations(): Migration[] {
    return [
      {
        version: 1,
        sql: `
          -- Users table
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            profile TEXT NOT NULL, -- Encrypted JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login_at DATETIME,
            is_email_verified BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE
          );

          -- Savings Goals table
          CREATE TABLE IF NOT EXISTS savings_goals (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            deadline DATETIME,
            category TEXT NOT NULL,
            crop_type TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            is_recurring BOOLEAN DEFAULT FALSE,
            recurring_period TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          -- Expenses table
          CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            date DATETIME NOT NULL,
            receipt_image TEXT, -- Encrypted if contains sensitive data
            is_recurring BOOLEAN DEFAULT FALSE,
            recurring_period TEXT,
            tags TEXT, -- JSON array
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          -- Income table
          CREATE TABLE IF NOT EXISTS income (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            source TEXT NOT NULL,
            description TEXT NOT NULL,
            date DATETIME NOT NULL,
            is_recurring BOOLEAN DEFAULT FALSE,
            recurring_period TEXT,
            multiplier REAL DEFAULT 1,
            streak_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          -- Farms table
          CREATE TABLE IF NOT EXISTS farms (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            layout TEXT NOT NULL, -- JSON
            health_score REAL DEFAULT 100,
            level INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            total_harvests INTEGER DEFAULT 0,
            streak_days INTEGER DEFAULT 0,
            last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          -- Crops table
          CREATE TABLE IF NOT EXISTS crops (
            id TEXT PRIMARY KEY,
            goal_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            growth_stage TEXT DEFAULT 'seed',
            health_points REAL DEFAULT 100,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            planted_at DATETIME NOT NULL,
            last_watered_at DATETIME,
            last_fertilized_at DATETIME,
            harvestable_at DATETIME,
            harvested_at DATETIME,
            growth_progress REAL DEFAULT 0,
            fertilizer_boost REAL DEFAULT 1,
            weed_penalty REAL DEFAULT 0,
            streak_multiplier REAL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (goal_id) REFERENCES savings_goals (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          -- Decorations table
          CREATE TABLE IF NOT EXISTS decorations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            is_unlocked BOOLEAN DEFAULT FALSE,
            purchased_at DATETIME,
            cost REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          -- Rewards table
          CREATE TABLE IF NOT EXISTS rewards (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            value REAL DEFAULT 0,
            icon_url TEXT,
            unlocked_at DATETIME NOT NULL,
            category TEXT DEFAULT 'general',
            is_collected BOOLEAN DEFAULT FALSE,
            collected_at DATETIME,
            expires_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          -- Achievements table
          CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            progress REAL DEFAULT 0,
            target REAL NOT NULL,
            is_completed BOOLEAN DEFAULT FALSE,
            completed_at DATETIME,
            reward_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (reward_id) REFERENCES rewards (id)
          );

          -- Game Statistics table
          CREATE TABLE IF NOT EXISTS game_statistics (
            user_id TEXT PRIMARY KEY,
            total_play_time INTEGER DEFAULT 0,
            crops_planted INTEGER DEFAULT 0,
            crops_harvested INTEGER DEFAULT 0,
            total_fertilizer_used INTEGER DEFAULT 0,
            weeds_pulled INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            current_streak INTEGER DEFAULT 0,
            achievements_unlocked INTEGER DEFAULT 0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals (user_id);
          CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON savings_goals (status);
          CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses (user_id);
          CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);
          CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);
          CREATE INDEX IF NOT EXISTS idx_income_user_id ON income (user_id);
          CREATE INDEX IF NOT EXISTS idx_income_date ON income (date);
          CREATE INDEX IF NOT EXISTS idx_crops_user_id ON crops (user_id);
          CREATE INDEX IF NOT EXISTS idx_crops_goal_id ON crops (goal_id);
          CREATE INDEX IF NOT EXISTS idx_decorations_user_id ON decorations (user_id);
          CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards (user_id);
          CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements (user_id);
        `
      }
    ];
  }

  public encryptSensitiveData(data: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }
    
    // Simple XOR encryption for demo purposes
    // In production, use proper encryption libraries like AES
    const encrypted = Buffer.from(data)
      .map((byte, index) => 
        byte ^ this.encryptionKey!.charCodeAt(index % this.encryptionKey!.length)
      );
    
    return Buffer.from(encrypted).toString('base64');
  }

  public decryptSensitiveData(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }
    
    try {
      const encrypted = Buffer.from(encryptedData, 'base64');
      const decrypted = encrypted
        .map((byte, index) => 
          byte ^ this.encryptionKey!.charCodeAt(index % this.encryptionKey!.length)
        );
      
      return Buffer.from(decrypted).toString();
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  public async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tables = [
      'game_statistics',
      'achievements', 
      'rewards',
      'decorations',
      'crops',
      'farms',
      'income',
      'expenses',
      'savings_goals',
      'users'
    ];

    for (const table of tables) {
      await this.db.execAsync(`DELETE FROM ${table}`);
    }
  }
}