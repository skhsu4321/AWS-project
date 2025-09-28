import { ParentalControlService } from '../ParentalControlService';
import { 
  ApprovalStatus, 
  ActivityType, 
  RestrictionType,
  ParentChildLinkInput,
  AllowanceConfigInput,
  ChoreInput
} from '../../models/ParentalControl';
import { UserMode, User } from '../../models/User';
import { DAOFactory } from '../dao';

// Mock the DAOs
jest.mock('../dao');

describe('ParentalControlService', () => {
  let service: ParentalControlService;
  let mockParentChildLinkDAO: any;
  let mockApprovalRequestDAO: any;
  let mockAllowanceConfigDAO: any;
  let mockChildActivityDAO: any;
  let mockRestrictionConfigDAO: any;
  let mockChoreDAO: any;
  let mockUserDAO: any;

  const mockParent: User = {
    id: 'parent-123',
    email: 'parent@test.com',
    profile: {
      displayName: 'Parent User',
      age: 35,
      mode: UserMode.ADULT,
      currency: 'HKD' as any,
      timezone: 'Asia/Hong_Kong',
      preferences: {
        theme: 'auto' as const,
        notifications: true,
        language: 'en',
        soundEnabled: true,
        hapticFeedback: true,
      },
    },
    createdAt: new Date(),
    lastLoginAt: new Date(),
    isEmailVerified: true,
    isActive: true,
  };

  const mockChild: User = {
    id: 'child-123',
    email: 'child@test.com',
    profile: {
      displayName: 'Child User',
      age: 10,
      mode: UserMode.CHILD,
      currency: 'HKD' as any,
      timezone: 'Asia/Hong_Kong',
      parentAccountId: 'parent-123',
      preferences: {
        theme: 'auto' as const,
        notifications: true,
        language: 'en',
        soundEnabled: true,
        hapticFeedback: true,
      },
    },
    createdAt: new Date(),
    lastLoginAt: new Date(),
    isEmailVerified: true,
    isActive: true,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock DAOs
    mockParentChildLinkDAO = {
      create: jest.fn(),
      getChildrenByParentId: jest.fn(),
      getParentByChildId: jest.fn(),
      isLinked: jest.fn(),
      deactivateLink: jest.fn(),
      updateNickname: jest.fn(),
    };

    mockApprovalRequestDAO = {
      create: jest.fn(),
      approveRequest: jest.fn(),
      rejectRequest: jest.fn(),
      getPendingRequestsByParentId: jest.fn(),
      getRequestByItemId: jest.fn(),
      findById: jest.fn(),
      autoRejectExpiredRequests: jest.fn(),
      getRequestsByChildId: jest.fn(),
    };

    mockAllowanceConfigDAO = {
      create: jest.fn(),
      getDueAllowances: jest.fn(),
      markAsPaid: jest.fn(),
      getActiveAllowanceByChildId: jest.fn(),
      updateAmount: jest.fn(),
    };

    mockChildActivityDAO = {
      create: jest.fn(),
      getActivitiesByChildId: jest.fn(),
      getActivitySummary: jest.fn(),
    };

    mockRestrictionConfigDAO = {
      setSpendingLimit: jest.fn(),
      setGoalAmountLimit: jest.fn(),
      setDailyUsageLimit: jest.fn(),
      checkRestrictionLimit: jest.fn(),
      getActiveRestrictionsByChildId: jest.fn(),
    };

    mockChoreDAO = {
      create: jest.fn(),
      findById: jest.fn(),
      markAsCompleted: jest.fn(),
      approveChore: jest.fn(),
      getChoresByChildId: jest.fn(),
      getPendingChoresByChildId: jest.fn(),
      getChoresAwaitingApproval: jest.fn(),
      getCompletionStats: jest.fn(),
      getTotalPendingRewards: jest.fn(),
      createRecurringInstances: jest.fn(),
    };

    mockUserDAO = {
      findById: jest.fn(),
    };

    // Mock the DAO factory
    (DAOFactory.getParentChildLinkDAO as jest.Mock).mockReturnValue(mockParentChildLinkDAO);
    (DAOFactory.getApprovalRequestDAO as jest.Mock).mockReturnValue(mockApprovalRequestDAO);
    (DAOFactory.getAllowanceConfigDAO as jest.Mock).mockReturnValue(mockAllowanceConfigDAO);
    (DAOFactory.getChildActivityDAO as jest.Mock).mockReturnValue(mockChildActivityDAO);
    (DAOFactory.getRestrictionConfigDAO as jest.Mock).mockReturnValue(mockRestrictionConfigDAO);
    (DAOFactory.getChoreDAO as jest.Mock).mockReturnValue(mockChoreDAO);
    (DAOFactory.getUserDAO as jest.Mock).mockReturnValue(mockUserDAO);
    (DAOFactory.getIncomeDAO as jest.Mock).mockReturnValue({ create: jest.fn() });

    service = new ParentalControlService();
  });

  describe('linkChildAccount', () => {
    it('should successfully link a child account to a parent', async () => {
      const mockLink = {
        id: 'link-123',
        parentId: 'parent-123',
        childId: 'child-123',
        createdAt: new Date(),
        isActive: true,
        nickname: 'My Kid',
      };

      mockUserDAO.findById
        .mockResolvedValueOnce(mockParent)
        .mockResolvedValueOnce(mockChild);
      mockParentChildLinkDAO.isLinked.mockResolvedValue(false);
      mockParentChildLinkDAO.create.mockResolvedValue(mockLink);
      mockChildActivityDAO.create.mockResolvedValue({});

      const result = await service.linkChildAccount('parent-123', 'child-123', 'My Kid');

      expect(result).toEqual(mockLink);
      expect(mockParentChildLinkDAO.create).toHaveBeenCalledWith({
        parentId: 'parent-123',
        childId: 'child-123',
        isActive: true,
        nickname: 'My Kid',
      });
      expect(mockChildActivityDAO.create).toHaveBeenCalled();
    });

    it('should throw error if parent is not in adult mode', async () => {
      const invalidParent = { ...mockParent, profile: { ...mockParent.profile, mode: UserMode.CHILD } };
      mockUserDAO.findById.mockResolvedValueOnce(invalidParent);

      await expect(service.linkChildAccount('parent-123', 'child-123'))
        .rejects.toThrow('Only adult users can be parents');
    });

    it('should throw error if child is not in child mode', async () => {
      const invalidChild = { ...mockChild, profile: { ...mockChild.profile, mode: UserMode.ADULT } };
      mockUserDAO.findById
        .mockResolvedValueOnce(mockParent)
        .mockResolvedValueOnce(invalidChild);

      await expect(service.linkChildAccount('parent-123', 'child-123'))
        .rejects.toThrow('Only child users can be linked as children');
    });

    it('should throw error if link already exists', async () => {
      mockUserDAO.findById
        .mockResolvedValueOnce(mockParent)
        .mockResolvedValueOnce(mockChild);
      mockParentChildLinkDAO.isLinked.mockResolvedValue(true);

      await expect(service.linkChildAccount('parent-123', 'child-123'))
        .rejects.toThrow('Parent-child link already exists');
    });
  });

  describe('requestApproval', () => {
    it('should create approval request for a child', async () => {
      const mockParentLink = {
        id: 'link-123',
        parentId: 'parent-123',
        childId: 'child-123',
        createdAt: new Date(),
        isActive: true,
      };

      const mockRequest = {
        id: 'request-123',
        childId: 'child-123',
        parentId: 'parent-123',
        type: 'goal' as const,
        itemId: 'goal-123',
        requestData: { amount: 100 },
        status: ApprovalStatus.PENDING,
        requestedAt: new Date(),
      };

      mockParentChildLinkDAO.getParentByChildId.mockResolvedValue(mockParentLink);
      mockApprovalRequestDAO.create.mockResolvedValue(mockRequest);
      mockChildActivityDAO.create.mockResolvedValue({});

      const result = await service.requestApproval(
        'child-123',
        'goal',
        'goal-123',
        { amount: 100 }
      );

      expect(result).toEqual(mockRequest);
      expect(mockApprovalRequestDAO.create).toHaveBeenCalledWith({
        childId: 'child-123',
        parentId: 'parent-123',
        type: 'goal',
        itemId: 'goal-123',
        requestData: { amount: 100 },
        expiresAt: undefined,
      });
    });

    it('should throw error if child is not linked to any parent', async () => {
      mockParentChildLinkDAO.getParentByChildId.mockResolvedValue(null);

      await expect(service.requestApproval('child-123', 'goal', 'goal-123', {}))
        .rejects.toThrow('Child is not linked to any parent');
    });
  });

  describe('approveRequest', () => {
    it('should approve a request and log activity', async () => {
      const mockRequest = {
        id: 'request-123',
        childId: 'child-123',
        parentId: 'parent-123',
        type: 'goal' as const,
        itemId: 'goal-123',
        requestData: { amount: 100 },
        status: ApprovalStatus.APPROVED,
        requestedAt: new Date(),
      };

      mockApprovalRequestDAO.approveRequest.mockResolvedValue(true);
      mockApprovalRequestDAO.findById.mockResolvedValue(mockRequest);
      mockChildActivityDAO.create.mockResolvedValue({});

      const result = await service.approveRequest('request-123', 'Looks good!');

      expect(result).toBe(true);
      expect(mockApprovalRequestDAO.approveRequest).toHaveBeenCalledWith('request-123', 'Looks good!');
      expect(mockChildActivityDAO.create).toHaveBeenCalled();
    });
  });

  describe('setupAllowance', () => {
    it('should create allowance configuration for a child', async () => {
      const allowanceInput: AllowanceConfigInput = {
        childId: 'child-123',
        parentId: 'parent-123',
        amount: 50,
        frequency: 'weekly',
        dayOfWeek: 0,
        isActive: true,
        startDate: new Date(),
      };

      const mockAllowance = {
        id: 'allowance-123',
        ...allowanceInput,
        nextPaymentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockParentChildLinkDAO.isLinked.mockResolvedValue(true);
      mockAllowanceConfigDAO.create.mockResolvedValue(mockAllowance);
      mockChildActivityDAO.create.mockResolvedValue({});

      const result = await service.setupAllowance(allowanceInput);

      expect(result).toEqual(mockAllowance);
      expect(mockAllowanceConfigDAO.create).toHaveBeenCalledWith(allowanceInput);
      expect(mockChildActivityDAO.create).toHaveBeenCalled();
    });

    it('should throw error if parent-child relationship not found', async () => {
      const allowanceInput: AllowanceConfigInput = {
        childId: 'child-123',
        parentId: 'parent-123',
        amount: 50,
        frequency: 'weekly',
        isActive: true,
        startDate: new Date(),
      };

      mockParentChildLinkDAO.isLinked.mockResolvedValue(false);

      await expect(service.setupAllowance(allowanceInput))
        .rejects.toThrow('Parent-child relationship not found');
    });
  });

  describe('createChore', () => {
    it('should create a chore for a child', async () => {
      const choreInput: ChoreInput = {
        childId: 'child-123',
        parentId: 'parent-123',
        title: 'Clean room',
        description: 'Clean and organize bedroom',
        reward: 10,
        dueDate: new Date(),
        isRecurring: false,
      };

      const mockChore = {
        id: 'chore-123',
        ...choreInput,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockParentChildLinkDAO.isLinked.mockResolvedValue(true);
      mockChoreDAO.create.mockResolvedValue(mockChore);
      mockChildActivityDAO.create.mockResolvedValue({});

      const result = await service.createChore(choreInput);

      expect(result).toEqual(mockChore);
      expect(mockChoreDAO.create).toHaveBeenCalledWith(choreInput);
      expect(mockChildActivityDAO.create).toHaveBeenCalled();
    });
  });

  describe('completeChore', () => {
    it('should mark chore as completed and log activity', async () => {
      const mockChore = {
        id: 'chore-123',
        childId: 'child-123',
        parentId: 'parent-123',
        title: 'Clean room',
        reward: 10,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChoreDAO.findById.mockResolvedValue(mockChore);
      mockChoreDAO.markAsCompleted.mockResolvedValue(true);
      mockChildActivityDAO.create.mockResolvedValue({});

      const result = await service.completeChore('chore-123');

      expect(result).toBe(true);
      expect(mockChoreDAO.markAsCompleted).toHaveBeenCalledWith('chore-123');
      expect(mockChildActivityDAO.create).toHaveBeenCalled();
    });

    it('should throw error if chore not found', async () => {
      mockChoreDAO.findById.mockResolvedValue(null);

      await expect(service.completeChore('chore-123'))
        .rejects.toThrow('Chore not found');
    });
  });

  describe('approveChore', () => {
    it('should approve chore, create income, and log activity', async () => {
      const mockChore = {
        id: 'chore-123',
        childId: 'child-123',
        parentId: 'parent-123',
        title: 'Clean room',
        reward: 10,
        isCompleted: true,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockIncomeDAO = { create: jest.fn() };

      mockChoreDAO.findById.mockResolvedValue(mockChore);
      mockChoreDAO.approveChore.mockResolvedValue(true);
      (DAOFactory.getIncomeDAO as jest.Mock).mockReturnValue(mockIncomeDAO);
      mockChildActivityDAO.create.mockResolvedValue({});

      const result = await service.approveChore('chore-123');

      expect(result).toBe(true);
      expect(mockChoreDAO.approveChore).toHaveBeenCalledWith('chore-123');
      expect(mockIncomeDAO.create).toHaveBeenCalled();
      expect(mockChildActivityDAO.create).toHaveBeenCalled();
    });

    it('should create recurring instances for recurring chores', async () => {
      const mockChore = {
        id: 'chore-123',
        childId: 'child-123',
        parentId: 'parent-123',
        title: 'Clean room',
        reward: 10,
        isCompleted: true,
        isRecurring: true,
        recurringPeriod: 'weekly' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockIncomeDAO = { create: jest.fn() };

      mockChoreDAO.findById.mockResolvedValue(mockChore);
      mockChoreDAO.approveChore.mockResolvedValue(true);
      mockChoreDAO.createRecurringInstances.mockResolvedValue([]);
      (DAOFactory.getIncomeDAO as jest.Mock).mockReturnValue(mockIncomeDAO);
      mockChildActivityDAO.create.mockResolvedValue({});

      await service.approveChore('chore-123');

      expect(mockChoreDAO.createRecurringInstances).toHaveBeenCalledWith('chore-123');
    });
  });

  describe('validateChildAction', () => {
    it('should allow action if no restrictions are violated', async () => {
      mockRestrictionConfigDAO.checkRestrictionLimit.mockResolvedValue({
        isViolation: false,
      });

      const result = await service.validateChildAction('child-123', 'expense', 50);

      expect(result).toEqual({ allowed: true });
    });

    it('should deny action if restriction is violated', async () => {
      const mockRestriction = {
        id: 'restriction-123',
        childId: 'child-123',
        parentId: 'parent-123',
        type: RestrictionType.SPENDING_LIMIT,
        value: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRestrictionConfigDAO.checkRestrictionLimit.mockResolvedValue({
        isViolation: true,
        limit: 100,
        restriction: mockRestriction,
      });

      const result = await service.validateChildAction('child-123', 'expense', 150);

      expect(result).toEqual({
        allowed: false,
        reason: 'Action exceeds expense limit of 100',
        restriction: mockRestriction,
      });
    });
  });

  describe('getChildReport', () => {
    it('should return comprehensive child report', async () => {
      const mockActivities = [{ id: 'activity-1', type: ActivityType.GOAL_CREATED }];
      const mockActivitySummary = { [ActivityType.GOAL_CREATED]: 5 };
      const mockRestrictions = [{ id: 'restriction-1', type: RestrictionType.SPENDING_LIMIT }];
      const mockAllowance = { id: 'allowance-1', amount: 50 };
      const mockApprovals = [{ id: 'approval-1', status: ApprovalStatus.PENDING }];
      const mockChoreStats = { totalChores: 10, completedChores: 8 };

      mockUserDAO.findById.mockResolvedValue(mockChild);
      mockChildActivityDAO.getActivitiesByChildId.mockResolvedValue(mockActivities);
      mockChildActivityDAO.getActivitySummary.mockResolvedValue(mockActivitySummary);
      mockRestrictionConfigDAO.getActiveRestrictionsByChildId.mockResolvedValue(mockRestrictions);
      mockAllowanceConfigDAO.getActiveAllowanceByChildId.mockResolvedValue(mockAllowance);
      mockApprovalRequestDAO.getRequestsByChildId.mockResolvedValue(mockApprovals);
      mockChoreDAO.getCompletionStats.mockResolvedValue(mockChoreStats);
      mockChoreDAO.getTotalPendingRewards.mockResolvedValue(25);

      const result = await service.getChildReport('child-123', 30);

      expect(result).toEqual({
        child: mockChild,
        activities: mockActivities,
        activitySummary: mockActivitySummary,
        restrictions: mockRestrictions,
        allowance: mockAllowance,
        pendingApprovals: mockApprovals,
        choreStats: mockChoreStats,
        totalPendingRewards: 25,
      });
    });

    it('should throw error if child not found', async () => {
      mockUserDAO.findById.mockResolvedValue(null);

      await expect(service.getChildReport('child-123'))
        .rejects.toThrow('Child not found');
    });
  });

  describe('processDueAllowances', () => {
    it('should process due allowances and create income records', async () => {
      const mockAllowances = [
        {
          id: 'allowance-1',
          childId: 'child-123',
          amount: 50,
          frequency: 'weekly' as const,
        },
        {
          id: 'allowance-2',
          childId: 'child-456',
          amount: 25,
          frequency: 'weekly' as const,
        },
      ];

      const mockIncomeDAO = { create: jest.fn() };

      mockAllowanceConfigDAO.getDueAllowances.mockResolvedValue(mockAllowances);
      mockAllowanceConfigDAO.markAsPaid.mockResolvedValue(true);
      (DAOFactory.getIncomeDAO as jest.Mock).mockReturnValue(mockIncomeDAO);
      mockChildActivityDAO.create.mockResolvedValue({});

      const result = await service.processDueAllowances();

      expect(result).toBe(2);
      expect(mockAllowanceConfigDAO.markAsPaid).toHaveBeenCalledTimes(2);
      expect(mockIncomeDAO.create).toHaveBeenCalledTimes(2);
      expect(mockChildActivityDAO.create).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully and continue processing', async () => {
      const mockAllowances = [
        {
          id: 'allowance-1',
          childId: 'child-123',
          amount: 50,
          frequency: 'weekly' as const,
        },
        {
          id: 'allowance-2',
          childId: 'child-456',
          amount: 25,
          frequency: 'weekly' as const,
        },
      ];

      const mockIncomeDAO = { create: jest.fn() };
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockAllowanceConfigDAO.getDueAllowances.mockResolvedValue(mockAllowances);
      mockAllowanceConfigDAO.markAsPaid
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(true);
      (DAOFactory.getIncomeDAO as jest.Mock).mockReturnValue(mockIncomeDAO);
      mockChildActivityDAO.create.mockResolvedValue({});

      const result = await service.processDueAllowances();

      expect(result).toBe(1); // Only one processed successfully
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to process allowance allowance-1:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});