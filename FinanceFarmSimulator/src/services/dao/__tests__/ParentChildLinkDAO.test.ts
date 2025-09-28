import { ParentChildLinkDAO } from '../ParentChildLinkDAO';
import { ParentChildLinkInput } from '../../../models/ParentalControl';

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

describe('ParentChildLinkDAO', () => {
  let dao: ParentChildLinkDAO;

  beforeEach(() => {
    jest.clearAllMocks();
    dao = new ParentChildLinkDAO();
  });

  describe('getChildrenByParentId', () => {
    it('should return children linked to a parent', async () => {
      const mockRows = [
        {
          id: 'link-1',
          parent_id: 'parent-123',
          child_id: 'child-1',
          created_at: '2024-01-01T00:00:00.000Z',
          is_active: 1,
          nickname: 'Kid 1',
        },
        {
          id: 'link-2',
          parent_id: 'parent-123',
          child_id: 'child-2',
          created_at: '2024-01-01T00:00:00.000Z',
          is_active: 1,
          nickname: 'Kid 2',
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await dao.getChildrenByParentId('parent-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'link-1',
        parentId: 'parent-123',
        childId: 'child-1',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isActive: true,
        nickname: 'Kid 1',
      });
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE parent_id = ? AND is_active = 1'),
        ['parent-123']
      );
    });

    it('should return empty array if no children found', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await dao.getChildrenByParentId('parent-123');

      expect(result).toEqual([]);
    });
  });

  describe('getParentByChildId', () => {
    it('should return parent link for a child', async () => {
      const mockRow = {
        id: 'link-1',
        parent_id: 'parent-123',
        child_id: 'child-123',
        created_at: '2024-01-01T00:00:00.000Z',
        is_active: 1,
        nickname: 'My Kid',
      };

      mockDb.getFirstAsync.mockResolvedValue(mockRow);

      const result = await dao.getParentByChildId('child-123');

      expect(result).toEqual({
        id: 'link-1',
        parentId: 'parent-123',
        childId: 'child-123',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isActive: true,
        nickname: 'My Kid',
      });
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE child_id = ? AND is_active = 1'),
        ['child-123']
      );
    });

    it('should return null if no parent found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await dao.getParentByChildId('child-123');

      expect(result).toBeNull();
    });
  });

  describe('isLinked', () => {
    it('should return true if parent-child relationship exists', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 1 });

      const result = await dao.isLinked('parent-123', 'child-123');

      expect(result).toBe(true);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE parent_id = ? AND child_id = ? AND is_active = 1'),
        ['parent-123', 'child-123']
      );
    });

    it('should return false if no relationship exists', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });

      const result = await dao.isLinked('parent-123', 'child-123');

      expect(result).toBe(false);
    });

    it('should return false if query returns null', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await dao.isLinked('parent-123', 'child-123');

      expect(result).toBe(false);
    });
  });

  describe('deactivateLink', () => {
    it('should deactivate a parent-child link', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await dao.deactivateLink('parent-123', 'child-123');

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET is_active = 0'),
        ['parent-123', 'child-123']
      );
    });

    it('should return false if no rows were affected', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      const result = await dao.deactivateLink('parent-123', 'child-123');

      expect(result).toBe(false);
    });
  });

  describe('updateNickname', () => {
    it('should update nickname for a child', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await dao.updateNickname('parent-123', 'child-123', 'New Nickname');

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET nickname = ?'),
        ['New Nickname', 'parent-123', 'child-123']
      );
    });

    it('should return false if no rows were affected', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      const result = await dao.updateNickname('parent-123', 'child-123', 'New Nickname');

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should create a new parent-child link', async () => {
      const input: ParentChildLinkInput = {
        parentId: 'parent-123',
        childId: 'child-123',
        isActive: true,
        nickname: 'My Kid',
      };

      const mockCreatedLink = {
        id: 'link-123',
        parent_id: 'parent-123',
        child_id: 'child-123',
        created_at: '2024-01-01T00:00:00.000Z',
        is_active: 1,
        nickname: 'My Kid',
      };

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue(mockCreatedLink);

      const result = await dao.create(input);

      expect(result).toEqual({
        id: 'link-123',
        parentId: 'parent-123',
        childId: 'child-123',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isActive: true,
        nickname: 'My Kid',
      });
    });
  });
});