import { ApprovalRequestDAO } from '../ApprovalRequestDAO';
import { ApprovalRequestInput, ApprovalStatus } from '../../../models/ParentalControl';

// Mock the database
const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  execAsync: jest.fn(),
};

// Mock the DatabaseService
jest.mock('../../DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      getDatabase: jest.fn(() => mockDb),
    })),
  },
}));

describe('ApprovalRequestDAO', () => {
  let dao: ApprovalRequestDAO;

  beforeEach(() => {
    jest.clearAllMocks();
    dao = new ApprovalRequestDAO();
  });

  describe('getPendingRequestsByParentId', () => {
    it('should return pending approval requests for a parent', async () => {
      const mockRows = [
        {
          id: 'request-1',
          child_id: 'child-123',
          parent_id: 'parent-123',
          type: 'goal',
          item_id: 'goal-1',
          request_data: '{"amount": 100}',
          status: 'pending',
          requested_at: '2024-01-01T00:00:00.000Z',
          responded_at: null,
          parent_response: null,
          expires_at: null,
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await dao.getPendingRequestsByParentId('parent-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'request-1',
        childId: 'child-123',
        parentId: 'parent-123',
        type: 'goal',
        itemId: 'goal-1',
        requestData: { amount: 100 },
        status: ApprovalStatus.PENDING,
        requestedAt: new Date('2024-01-01T00:00:00.000Z'),
        respondedAt: undefined,
        parentResponse: undefined,
        expiresAt: undefined,
      });
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("WHERE parent_id = ? AND status = 'pending'"),
        ['parent-123']
      );
    });
  });

  describe('getRequestByItemId', () => {
    it('should return approval request by item ID and type', async () => {
      const mockRow = {
        id: 'request-1',
        child_id: 'child-123',
        parent_id: 'parent-123',
        type: 'goal',
        item_id: 'goal-1',
        request_data: '{"amount": 100}',
        status: 'pending',
        requested_at: '2024-01-01T00:00:00.000Z',
        responded_at: null,
        parent_response: null,
        expires_at: null,
      };

      mockDb.getFirstAsync.mockResolvedValue(mockRow);

      const result = await dao.getRequestByItemId('goal-1', 'goal');

      expect(result).toEqual({
        id: 'request-1',
        childId: 'child-123',
        parentId: 'parent-123',
        type: 'goal',
        itemId: 'goal-1',
        requestData: { amount: 100 },
        status: ApprovalStatus.PENDING,
        requestedAt: new Date('2024-01-01T00:00:00.000Z'),
        respondedAt: undefined,
        parentResponse: undefined,
        expiresAt: undefined,
      });
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE item_id = ? AND type = ?'),
        ['goal-1', 'goal']
      );
    });

    it('should return null if no request found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await dao.getRequestByItemId('goal-1', 'goal');

      expect(result).toBeNull();
    });
  });

  describe('approveRequest', () => {
    it('should approve a pending request', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await dao.approveRequest('request-123', 'Looks good!');

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'approved'"),
        [expect.any(String), 'Looks good!', 'request-123']
      );
    });

    it('should return false if no rows were affected', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      const result = await dao.approveRequest('request-123');

      expect(result).toBe(false);
    });
  });

  describe('rejectRequest', () => {
    it('should reject a pending request', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await dao.rejectRequest('request-123', 'Not appropriate');

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'rejected'"),
        [expect.any(String), 'Not appropriate', 'request-123']
      );
    });

    it('should return false if no rows were affected', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      const result = await dao.rejectRequest('request-123');

      expect(result).toBe(false);
    });
  });

  describe('getExpiredRequests', () => {
    it('should return expired pending requests', async () => {
      const mockRows = [
        {
          id: 'request-1',
          child_id: 'child-123',
          parent_id: 'parent-123',
          type: 'goal',
          item_id: 'goal-1',
          request_data: '{"amount": 100}',
          status: 'pending',
          requested_at: '2024-01-01T00:00:00.000Z',
          responded_at: null,
          parent_response: null,
          expires_at: '2024-01-01T12:00:00.000Z',
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await dao.getExpiredRequests();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('request-1');
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < ?"),
        [expect.any(String)]
      );
    });
  });

  describe('autoRejectExpiredRequests', () => {
    it('should auto-reject expired requests and return count', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 3 });

      const result = await dao.autoRejectExpiredRequests();

      expect(result).toBe(3);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'rejected'"),
        [expect.any(String), expect.any(String)]
      );
    });
  });

  describe('countPendingRequestsByParentId', () => {
    it('should return count of pending requests for a parent', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 5 });

      const result = await dao.countPendingRequestsByParentId('parent-123');

      expect(result).toBe(5);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining("WHERE parent_id = ? AND status = 'pending'"),
        ['parent-123']
      );
    });

    it('should return 0 if no pending requests', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });

      const result = await dao.countPendingRequestsByParentId('parent-123');

      expect(result).toBe(0);
    });

    it('should return 0 if query returns null', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await dao.countPendingRequestsByParentId('parent-123');

      expect(result).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a new approval request', async () => {
      const input: ApprovalRequestInput = {
        childId: 'child-123',
        parentId: 'parent-123',
        type: 'goal',
        itemId: 'goal-123',
        requestData: { amount: 100 },
        expiresAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const mockCreatedRequest = {
        id: 'request-123',
        child_id: 'child-123',
        parent_id: 'parent-123',
        type: 'goal',
        item_id: 'goal-123',
        request_data: '{"amount":100}',
        status: 'pending',
        requested_at: '2024-01-01T00:00:00.000Z',
        responded_at: null,
        parent_response: null,
        expires_at: '2024-01-02T00:00:00.000Z',
      };

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue(mockCreatedRequest);

      const result = await dao.create(input);

      expect(result).toEqual({
        id: 'request-123',
        childId: 'child-123',
        parentId: 'parent-123',
        type: 'goal',
        itemId: 'goal-123',
        requestData: { amount: 100 },
        status: ApprovalStatus.PENDING,
        requestedAt: new Date('2024-01-01T00:00:00.000Z'),
        respondedAt: undefined,
        parentResponse: undefined,
        expiresAt: new Date('2024-01-02T00:00:00.000Z'),
      });
    });
  });
});