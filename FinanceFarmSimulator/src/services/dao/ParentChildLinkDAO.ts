import { BaseDAO } from './BaseDAO';
import { 
  ParentChildLink, 
  ParentChildLinkInput,
  validateParentChildLink,
  validateParentChildLinkInput 
} from '../../models/ParentalControl';
import { generateId } from '../../utils/security';

export class ParentChildLinkDAO extends BaseDAO<ParentChildLink, ParentChildLinkInput> {
  constructor() {
    super('parent_child_links');
  }

  protected createTableQuery = `
    CREATE TABLE IF NOT EXISTS parent_child_links (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL,
      child_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      nickname TEXT,
      FOREIGN KEY (parent_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (child_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(parent_id, child_id)
    )
  `;

  protected mapRowToEntity(row: any): ParentChildLink {
    return {
      id: row.id,
      parentId: row.parent_id,
      childId: row.child_id,
      createdAt: new Date(row.created_at),
      isActive: Boolean(row.is_active),
      nickname: row.nickname || undefined,
    };
  }

  protected mapEntityToRow(input: ParentChildLinkInput): Record<string, any> {
    return {
      id: generateId(),
      parent_id: input.parentId,
      child_id: input.childId,
      created_at: new Date().toISOString(),
      is_active: input.isActive ? 1 : 0,
      nickname: input.nickname || null,
    };
  }

  /**
   * Get all children linked to a parent
   */
  async getChildrenByParentId(parentId: string): Promise<ParentChildLink[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.getAllAsync(query, [parentId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get parent link for a child
   */
  async getParentByChildId(childId: string): Promise<ParentChildLink | null> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ? AND is_active = 1
      LIMIT 1
    `;
    
    const row = await this.db.getFirstAsync(query, [childId]);
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Check if a parent-child relationship exists
   */
  async isLinked(parentId: string, childId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM ${this.tableName} 
      WHERE parent_id = ? AND child_id = ? AND is_active = 1
    `;
    
    const result = await this.db.getFirstAsync(query, [parentId, childId]) as any;
    return (result?.count || 0) > 0;
  }

  /**
   * Deactivate a parent-child link
   */
  async deactivateLink(parentId: string, childId: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_active = 0 
      WHERE parent_id = ? AND child_id = ?
    `;
    
    const result = await this.db.runAsync(query, [parentId, childId]);
    return result.changes > 0;
  }

  /**
   * Update nickname for a child
   */
  async updateNickname(parentId: string, childId: string, nickname: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET nickname = ? 
      WHERE parent_id = ? AND child_id = ? AND is_active = 1
    `;
    
    const result = await this.db.runAsync(query, [nickname, parentId, childId]);
    return result.changes > 0;
  }
}