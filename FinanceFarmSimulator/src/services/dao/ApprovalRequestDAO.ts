import { BaseDAO } from './BaseDAO';
import { 
  ApprovalRequest, 
  ApprovalRequestInput,
  ApprovalStatus,
  validateApprovalRequest,
  validateApprovalRequestInput 
} from '../../models/ParentalControl';
import { generateId } from '../../utils/security';

export class ApprovalRequestDAO extends BaseDAO<ApprovalRequest, ApprovalRequestInput> {
  constructor() {
    super('approval_requests');
  }

  protected createTableQuery = `
    CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('goal', 'reward', 'expense')),
      item_id TEXT NOT NULL,
      request_data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      requested_at TEXT NOT NULL,
      responded_at TEXT,
      parent_response TEXT,
      expires_at TEXT,
      FOREIGN KEY (child_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;

  protected mapRowToEntity(row: any): ApprovalRequest {
    return {
      id: row.id,
      childId: row.child_id,
      parentId: row.parent_id,
      type: row.type as 'goal' | 'reward' | 'expense',
      itemId: row.item_id,
      requestData: JSON.parse(row.request_data),
      status: row.status as ApprovalStatus,
      requestedAt: new Date(row.requested_at),
      respondedAt: row.responded_at ? new Date(row.responded_at) : undefined,
      parentResponse: row.parent_response || undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    };
  }

  protected mapEntityToRow(input: ApprovalRequestInput): Record<string, any> {
    return {
      id: generateId(),
      child_id: input.childId,
      parent_id: input.parentId,
      type: input.type,
      item_id: input.itemId,
      request_data: JSON.stringify(input.requestData),
      status: ApprovalStatus.PENDING,
      requested_at: new Date().toISOString(),
      responded_at: null,
      parent_response: input.parentResponse || null,
      expires_at: input.expiresAt?.toISOString() || null,
    };
  }

  /**
   * Get pending approval requests for a parent
   */
  async getPendingRequestsByParentId(parentId: string): Promise<ApprovalRequest[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = ? AND status = 'pending'
      ORDER BY requested_at DESC
    `;
    
    const rows = await this.db.getAllAsync(query, [parentId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get approval requests for a child
   */
  async getRequestsByChildId(childId: string): Promise<ApprovalRequest[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE child_id = ?
      ORDER BY requested_at DESC
    `;
    
    const rows = await this.db.getAllAsync(query, [childId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get approval request by item ID and type
   */
  async getRequestByItemId(itemId: string, type: 'goal' | 'reward' | 'expense'): Promise<ApprovalRequest | null> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE item_id = ? AND type = ?
      ORDER BY requested_at DESC
      LIMIT 1
    `;
    
    const row = await this.db.getFirstAsync(query, [itemId, type]);
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Approve a request
   */
  async approveRequest(requestId: string, parentResponse?: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET status = 'approved', responded_at = ?, parent_response = ?
      WHERE id = ? AND status = 'pending'
    `;
    
    const result = await this.db.runAsync(query, [
      new Date().toISOString(),
      parentResponse || null,
      requestId
    ]);
    return result.changes > 0;
  }

  /**
   * Reject a request
   */
  async rejectRequest(requestId: string, parentResponse?: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET status = 'rejected', responded_at = ?, parent_response = ?
      WHERE id = ? AND status = 'pending'
    `;
    
    const result = await this.db.runAsync(query, [
      new Date().toISOString(),
      parentResponse || null,
      requestId
    ]);
    return result.changes > 0;
  }

  /**
   * Get expired requests that should be auto-rejected
   */
  async getExpiredRequests(): Promise<ApprovalRequest[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < ?
    `;
    
    const rows = await this.db.getAllAsync(query, [new Date().toISOString()]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Auto-reject expired requests
   */
  async autoRejectExpiredRequests(): Promise<number> {
    const query = `
      UPDATE ${this.tableName} 
      SET status = 'rejected', responded_at = ?, parent_response = 'Auto-rejected due to expiration'
      WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < ?
    `;
    
    const now = new Date().toISOString();
    const result = await this.db.runAsync(query, [now, now]);
    return result.changes;
  }

  /**
   * Count pending requests for a parent
   */
  async countPendingRequestsByParentId(parentId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM ${this.tableName} 
      WHERE parent_id = ? AND status = 'pending'
    `;
    
    const result = await this.db.getFirstAsync(query, [parentId]) as any;
    return result?.count || 0;
  }
}