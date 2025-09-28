import { 
  ParentChildLink, 
  ParentChildLinkInput,
  ApprovalRequest, 
  ApprovalRequestInput,
  AllowanceConfig, 
  AllowanceConfigInput,
  ChildActivity, 
  ChildActivityInput,
  RestrictionConfig, 
  RestrictionConfigInput,
  Chore, 
  ChoreInput,
  ApprovalStatus,
  ActivityType,
  RestrictionType
} from '../models/ParentalControl';
import { User, UserMode } from '../models/User';
import { SavingsGoal } from '../models/Financial';
import { DAOFactory } from './dao';
import { generateId } from '../utils/security';

export class ParentalControlService {
  private parentChildLinkDAO = DAOFactory.getParentChildLinkDAO();
  private approvalRequestDAO = DAOFactory.getApprovalRequestDAO();
  private allowanceConfigDAO = DAOFactory.getAllowanceConfigDAO();
  private childActivityDAO = DAOFactory.getChildActivityDAO();
  private restrictionConfigDAO = DAOFactory.getRestrictionConfigDAO();
  private choreDAO = DAOFactory.getChoreDAO();
  private userDAO = DAOFactory.getUserDAO();

  /**
   * Link a child account to a parent account
   */
  async linkChildAccount(parentId: string, childId: string, nickname?: string): Promise<ParentChildLink> {
    // Verify parent is in adult mode
    const parent = await this.userDAO.findById(parentId);
    if (!parent || parent.profile.mode !== UserMode.ADULT) {
      throw new Error('Only adult users can be parents');
    }

    // Verify child is in child mode
    const child = await this.userDAO.findById(childId);
    if (!child || child.profile.mode !== UserMode.CHILD) {
      throw new Error('Only child users can be linked as children');
    }

    // Check if link already exists
    const existingLink = await this.parentChildLinkDAO.isLinked(parentId, childId);
    if (existingLink) {
      throw new Error('Parent-child link already exists');
    }

    const linkInput: ParentChildLinkInput = {
      parentId,
      childId,
      isActive: true,
      nickname,
    };

    const link = await this.parentChildLinkDAO.create(linkInput);

    // Log activity
    await this.logChildActivity(childId, ActivityType.GOAL_CREATED, 'Account linked to parent', undefined, {
      parentId,
      nickname,
    });

    return link;
  }

  /**
   * Get all children linked to a parent
   */
  async getLinkedChildren(parentId: string): Promise<ParentChildLink[]> {
    return await this.parentChildLinkDAO.getChildrenByParentId(parentId);
  }

  /**
   * Get parent for a child
   */
  async getParentForChild(childId: string): Promise<ParentChildLink | null> {
    return await this.parentChildLinkDAO.getParentByChildId(childId);
  }

  /**
   * Unlink a child from a parent
   */
  async unlinkChildAccount(parentId: string, childId: string): Promise<boolean> {
    const success = await this.parentChildLinkDAO.deactivateLink(parentId, childId);
    
    if (success) {
      await this.logChildActivity(childId, ActivityType.GOAL_CREATED, 'Account unlinked from parent', undefined, {
        parentId,
      });
    }

    return success;
  }

  /**
   * Request approval for a goal, reward, or expense
   */
  async requestApproval(
    childId: string,
    type: 'goal' | 'reward' | 'expense',
    itemId: string,
    requestData: Record<string, any>,
    expiresAt?: Date
  ): Promise<ApprovalRequest> {
    // Get parent for this child
    const parentLink = await this.getParentForChild(childId);
    if (!parentLink) {
      throw new Error('Child is not linked to any parent');
    }

    const requestInput: ApprovalRequestInput = {
      childId,
      parentId: parentLink.parentId,
      type,
      itemId,
      requestData,
      expiresAt,
    };

    const request = await this.approvalRequestDAO.create(requestInput);

    // Log activity
    await this.logChildActivity(childId, ActivityType.GOAL_CREATED, `Requested approval for ${type}`, undefined, {
      requestId: request.id,
      type,
      itemId,
    });

    return request;
  }

  /**
   * Approve a request
   */
  async approveRequest(requestId: string, parentResponse?: string): Promise<boolean> {
    const success = await this.approvalRequestDAO.approveRequest(requestId, parentResponse);
    
    if (success) {
      const request = await this.approvalRequestDAO.findById(requestId);
      if (request) {
        await this.logChildActivity(
          request.childId, 
          ActivityType.GOAL_CREATED, 
          `${request.type} approved by parent`, 
          undefined, 
          {
            requestId,
            parentResponse,
          }
        );
      }
    }

    return success;
  }

  /**
   * Reject a request
   */
  async rejectRequest(requestId: string, parentResponse?: string): Promise<boolean> {
    const success = await this.approvalRequestDAO.rejectRequest(requestId, parentResponse);
    
    if (success) {
      const request = await this.approvalRequestDAO.findById(requestId);
      if (request) {
        await this.logChildActivity(
          request.childId, 
          ActivityType.GOAL_CREATED, 
          `${request.type} rejected by parent`, 
          undefined, 
          {
            requestId,
            parentResponse,
          }
        );
      }
    }

    return success;
  }

  /**
   * Get pending approval requests for a parent
   */
  async getPendingApprovals(parentId: string): Promise<ApprovalRequest[]> {
    return await this.approvalRequestDAO.getPendingRequestsByParentId(parentId);
  }

  /**
   * Check if an item needs approval
   */
  async needsApproval(itemId: string, type: 'goal' | 'reward' | 'expense'): Promise<boolean> {
    const request = await this.approvalRequestDAO.getRequestByItemId(itemId, type);
    return request?.status === ApprovalStatus.PENDING;
  }

  /**
   * Set up allowance for a child
   */
  async setupAllowance(allowanceInput: AllowanceConfigInput): Promise<AllowanceConfig> {
    // Verify parent-child relationship
    const isLinked = await this.parentChildLinkDAO.isLinked(allowanceInput.parentId, allowanceInput.childId);
    if (!isLinked) {
      throw new Error('Parent-child relationship not found');
    }

    const allowance = await this.allowanceConfigDAO.create(allowanceInput);

    // Log activity
    await this.logChildActivity(
      allowanceInput.childId, 
      ActivityType.ALLOWANCE_RECEIVED, 
      'Allowance configured', 
      allowanceInput.amount, 
      {
        frequency: allowanceInput.frequency,
        parentId: allowanceInput.parentId,
      }
    );

    return allowance;
  }

  /**
   * Process due allowances
   */
  async processDueAllowances(): Promise<number> {
    const dueAllowances = await this.allowanceConfigDAO.getDueAllowances();
    let processedCount = 0;

    for (const allowance of dueAllowances) {
      try {
        // Mark as paid
        await this.allowanceConfigDAO.markAsPaid(allowance.id);

        // Create income record for the child
        const incomeDAO = DAOFactory.getIncomeDAO();
        await incomeDAO.create({
          userId: allowance.childId,
          amount: allowance.amount,
          source: 'allowance' as any,
          description: 'Weekly allowance',
          date: new Date(),
          isRecurring: false,
        });

        // Log activity
        await this.logChildActivity(
          allowance.childId,
          ActivityType.ALLOWANCE_RECEIVED,
          'Allowance received',
          allowance.amount,
          {
            allowanceId: allowance.id,
            frequency: allowance.frequency,
          }
        );

        processedCount++;
      } catch (error) {
        console.error(`Failed to process allowance ${allowance.id}:`, error);
      }
    }

    return processedCount;
  }

  /**
   * Get allowance configuration for a child
   */
  async getChildAllowance(childId: string): Promise<AllowanceConfig | null> {
    return await this.allowanceConfigDAO.getActiveAllowanceByChildId(childId);
  }

  /**
   * Update allowance amount
   */
  async updateAllowanceAmount(allowanceId: string, newAmount: number): Promise<boolean> {
    return await this.allowanceConfigDAO.updateAmount(allowanceId, newAmount);
  }

  /**
   * Log child activity
   */
  async logChildActivity(
    childId: string,
    type: ActivityType,
    description: string,
    amount?: number,
    metadata?: Record<string, any>
  ): Promise<ChildActivity> {
    const activityInput: ChildActivityInput = {
      childId,
      type,
      description,
      amount,
      metadata,
      isVisible: true,
    };

    return await this.childActivityDAO.create(activityInput);
  }

  /**
   * Get child activity history
   */
  async getChildActivity(childId: string, limit: number = 50, offset: number = 0): Promise<ChildActivity[]> {
    return await this.childActivityDAO.getActivitiesByChildId(childId, limit, offset);
  }

  /**
   * Get activity summary for a child
   */
  async getActivitySummary(childId: string, days: number = 30): Promise<Record<ActivityType, number>> {
    return await this.childActivityDAO.getActivitySummary(childId, days);
  }

  /**
   * Set spending limit for a child
   */
  async setSpendingLimit(childId: string, parentId: string, limit: number): Promise<RestrictionConfig> {
    return await this.restrictionConfigDAO.setSpendingLimit(childId, parentId, limit);
  }

  /**
   * Set goal amount limit for a child
   */
  async setGoalAmountLimit(childId: string, parentId: string, limit: number): Promise<RestrictionConfig> {
    return await this.restrictionConfigDAO.setGoalAmountLimit(childId, parentId, limit);
  }

  /**
   * Set daily usage limit for a child
   */
  async setDailyUsageLimit(childId: string, parentId: string, limitMinutes: number): Promise<RestrictionConfig> {
    return await this.restrictionConfigDAO.setDailyUsageLimit(childId, parentId, limitMinutes);
  }

  /**
   * Check if an action violates restrictions
   */
  async checkRestrictions(childId: string, type: RestrictionType, value: number): Promise<{
    isViolation: boolean;
    limit?: number;
    restriction?: RestrictionConfig;
  }> {
    return await this.restrictionConfigDAO.checkRestrictionLimit(childId, type, value);
  }

  /**
   * Get all restrictions for a child
   */
  async getChildRestrictions(childId: string): Promise<RestrictionConfig[]> {
    return await this.restrictionConfigDAO.getActiveRestrictionsByChildId(childId);
  }

  /**
   * Create a chore for a child
   */
  async createChore(choreInput: ChoreInput): Promise<Chore> {
    // Verify parent-child relationship
    const isLinked = await this.parentChildLinkDAO.isLinked(choreInput.parentId, choreInput.childId);
    if (!isLinked) {
      throw new Error('Parent-child relationship not found');
    }

    const chore = await this.choreDAO.create(choreInput);

    // Log activity
    await this.logChildActivity(
      choreInput.childId,
      ActivityType.CHORE_COMPLETED,
      `New chore assigned: ${choreInput.title}`,
      choreInput.reward,
      {
        choreId: chore.id,
        parentId: choreInput.parentId,
      }
    );

    return chore;
  }

  /**
   * Mark chore as completed by child
   */
  async completeChore(choreId: string): Promise<boolean> {
    const chore = await this.choreDAO.findById(choreId);
    if (!chore) {
      throw new Error('Chore not found');
    }

    const success = await this.choreDAO.markAsCompleted(choreId);

    if (success) {
      await this.logChildActivity(
        chore.childId,
        ActivityType.CHORE_COMPLETED,
        `Completed chore: ${chore.title}`,
        chore.reward,
        {
          choreId,
          awaitingApproval: true,
        }
      );
    }

    return success;
  }

  /**
   * Approve completed chore
   */
  async approveChore(choreId: string): Promise<boolean> {
    const chore = await this.choreDAO.findById(choreId);
    if (!chore) {
      throw new Error('Chore not found');
    }

    const success = await this.choreDAO.approveChore(choreId);

    if (success) {
      // Create income record for the reward
      const incomeDAO = DAOFactory.getIncomeDAO();
      await incomeDAO.create({
        userId: chore.childId,
        amount: chore.reward,
        source: 'chores' as any,
        description: `Reward for: ${chore.title}`,
        date: new Date(),
        isRecurring: false,
      });

      await this.logChildActivity(
        chore.childId,
        ActivityType.CHORE_COMPLETED,
        `Chore approved: ${chore.title}`,
        chore.reward,
        {
          choreId,
          approved: true,
        }
      );

      // Create recurring instance if needed
      if (chore.isRecurring) {
        await this.choreDAO.createRecurringInstances(choreId);
      }
    }

    return success;
  }

  /**
   * Get chores for a child
   */
  async getChildChores(childId: string): Promise<Chore[]> {
    return await this.choreDAO.getChoresByChildId(childId);
  }

  /**
   * Get pending chores for a child
   */
  async getPendingChores(childId: string): Promise<Chore[]> {
    return await this.choreDAO.getPendingChoresByChildId(childId);
  }

  /**
   * Get chores awaiting approval for a parent
   */
  async getChoresAwaitingApproval(parentId: string): Promise<Chore[]> {
    return await this.choreDAO.getChoresAwaitingApproval(parentId);
  }

  /**
   * Get chore completion statistics
   */
  async getChoreStats(childId: string, days: number = 30): Promise<{
    totalChores: number;
    completedChores: number;
    approvedChores: number;
    totalRewards: number;
    completionRate: number;
  }> {
    return await this.choreDAO.getCompletionStats(childId, days);
  }

  /**
   * Auto-reject expired approval requests
   */
  async processExpiredRequests(): Promise<number> {
    return await this.approvalRequestDAO.autoRejectExpiredRequests();
  }

  /**
   * Get comprehensive child report for parent
   */
  async getChildReport(childId: string, days: number = 30): Promise<{
    child: User;
    activities: ChildActivity[];
    activitySummary: Record<ActivityType, number>;
    restrictions: RestrictionConfig[];
    allowance: AllowanceConfig | null;
    pendingApprovals: ApprovalRequest[];
    choreStats: any;
    totalPendingRewards: number;
  }> {
    const child = await this.userDAO.findById(childId);
    if (!child) {
      throw new Error('Child not found');
    }

    const [
      activities,
      activitySummary,
      restrictions,
      allowance,
      pendingApprovals,
      choreStats,
      totalPendingRewards
    ] = await Promise.all([
      this.getChildActivity(childId, 20),
      this.getActivitySummary(childId, days),
      this.getChildRestrictions(childId),
      this.getChildAllowance(childId),
      this.approvalRequestDAO.getRequestsByChildId(childId),
      this.getChoreStats(childId, days),
      this.choreDAO.getTotalPendingRewards(childId)
    ]);

    return {
      child,
      activities,
      activitySummary,
      restrictions,
      allowance,
      pendingApprovals: pendingApprovals.filter(r => r.status === ApprovalStatus.PENDING),
      choreStats,
      totalPendingRewards,
    };
  }

  /**
   * Validate if user can perform action based on restrictions
   */
  async validateChildAction(
    childId: string,
    actionType: 'expense' | 'goal' | 'usage',
    value: number
  ): Promise<{
    allowed: boolean;
    reason?: string;
    restriction?: RestrictionConfig;
  }> {
    let restrictionType: RestrictionType;
    
    switch (actionType) {
      case 'expense':
        restrictionType = RestrictionType.SPENDING_LIMIT;
        break;
      case 'goal':
        restrictionType = RestrictionType.GOAL_AMOUNT_LIMIT;
        break;
      case 'usage':
        restrictionType = RestrictionType.DAILY_USAGE_LIMIT;
        break;
      default:
        return { allowed: true };
    }

    const check = await this.checkRestrictions(childId, restrictionType, value);
    
    if (check.isViolation) {
      return {
        allowed: false,
        reason: `Action exceeds ${actionType} limit of ${check.limit}`,
        restriction: check.restriction,
      };
    }

    return { allowed: true };
  }
}