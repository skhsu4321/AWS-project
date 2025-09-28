import { DatabaseService } from '../DatabaseService';

// Simple integration test to verify database setup
describe('Database Integration', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    databaseService = DatabaseService.getInstance();
  });

  afterAll(async () => {
    if (databaseService) {
      await databaseService.close();
    }
  });

  it('should create database service instance', () => {
    expect(databaseService).toBeDefined();
    expect(databaseService).toBeInstanceOf(DatabaseService);
  });

  it('should have encryption methods', () => {
    // Set up a mock encryption key for testing
    (databaseService as any).encryptionKey = 'test-key';
    
    const testData = 'sensitive information';
    const encrypted = databaseService.encryptSensitiveData(testData);
    const decrypted = databaseService.decryptSensitiveData(encrypted);

    expect(encrypted).not.toBe(testData);
    expect(decrypted).toBe(testData);
  });

  it('should handle encryption errors gracefully', () => {
    // Force encryption key to be null
    (databaseService as any).encryptionKey = null;

    expect(() => {
      databaseService.encryptSensitiveData('test');
    }).toThrow('Encryption key not initialized');

    expect(() => {
      databaseService.decryptSensitiveData('test');
    }).toThrow('Encryption key not initialized');
  });

  it('should have migration methods', () => {
    const migrations = (databaseService as any).getMigrations();
    expect(migrations).toBeDefined();
    expect(Array.isArray(migrations)).toBe(true);
    expect(migrations.length).toBeGreaterThan(0);
    
    // Check first migration structure
    const firstMigration = migrations[0];
    expect(firstMigration).toHaveProperty('version');
    expect(firstMigration).toHaveProperty('sql');
    expect(typeof firstMigration.version).toBe('number');
    expect(typeof firstMigration.sql).toBe('string');
  });

  it('should have proper database schema in migration', () => {
    const migrations = (databaseService as any).getMigrations();
    const firstMigration = migrations[0];
    const sql = firstMigration.sql;

    // Check that all required tables are created
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS savings_goals');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS expenses');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS income');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS farms');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS crops');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS decorations');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS rewards');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS achievements');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS game_statistics');

    // Check that indexes are created
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS');
    
    // Check foreign key constraints
    expect(sql).toContain('FOREIGN KEY');
    expect(sql).toContain('ON DELETE CASCADE');
  });

  it('should validate database constants', () => {
    const { DATABASE_NAME, DATABASE_VERSION } = require('../../utils/constants');
    
    expect(DATABASE_NAME).toBeDefined();
    expect(typeof DATABASE_NAME).toBe('string');
    expect(DATABASE_NAME.endsWith('.db')).toBe(true);
    
    expect(DATABASE_VERSION).toBeDefined();
    expect(typeof DATABASE_VERSION).toBe('number');
    expect(DATABASE_VERSION).toBeGreaterThan(0);
  });
});