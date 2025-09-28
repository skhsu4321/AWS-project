export { BaseDAO } from './BaseDAO';
export { UserDAO } from './UserDAO';
export { SavingsGoalDAO } from './SavingsGoalDAO';
export { ExpenseDAO } from './ExpenseDAO';
export { IncomeDAO } from './IncomeDAO';
export { FarmDAO } from './FarmDAO';
export { CropDAO } from './CropDAO';
export { ParentChildLinkDAO } from './ParentChildLinkDAO';
export { ApprovalRequestDAO } from './ApprovalRequestDAO';
export { AllowanceConfigDAO } from './AllowanceConfigDAO';
export { ChildActivityDAO } from './ChildActivityDAO';
export { RestrictionConfigDAO } from './RestrictionConfigDAO';
export { ChoreDAO } from './ChoreDAO';

import { UserDAO } from './UserDAO';
import { SavingsGoalDAO } from './SavingsGoalDAO';
import { ExpenseDAO } from './ExpenseDAO';
import { IncomeDAO } from './IncomeDAO';
import { FarmDAO } from './FarmDAO';
import { CropDAO } from './CropDAO';
import { ParentChildLinkDAO } from './ParentChildLinkDAO';
import { ApprovalRequestDAO } from './ApprovalRequestDAO';
import { AllowanceConfigDAO } from './AllowanceConfigDAO';
import { ChildActivityDAO } from './ChildActivityDAO';
import { RestrictionConfigDAO } from './RestrictionConfigDAO';
import { ChoreDAO } from './ChoreDAO';

// DAO Factory for easy access to all DAOs
export class DAOFactory {
  private static userDAO: UserDAO;
  private static savingsGoalDAO: SavingsGoalDAO;
  private static expenseDAO: ExpenseDAO;
  private static incomeDAO: IncomeDAO;
  private static farmDAO: FarmDAO;
  private static cropDAO: CropDAO;
  private static parentChildLinkDAO: ParentChildLinkDAO;
  private static approvalRequestDAO: ApprovalRequestDAO;
  private static allowanceConfigDAO: AllowanceConfigDAO;
  private static childActivityDAO: ChildActivityDAO;
  private static restrictionConfigDAO: RestrictionConfigDAO;
  private static choreDAO: ChoreDAO;

  public static getUserDAO(): UserDAO {
    if (!this.userDAO) {
      this.userDAO = new UserDAO();
    }
    return this.userDAO;
  }

  public static getSavingsGoalDAO(): SavingsGoalDAO {
    if (!this.savingsGoalDAO) {
      this.savingsGoalDAO = new SavingsGoalDAO();
    }
    return this.savingsGoalDAO;
  }

  public static getExpenseDAO(): ExpenseDAO {
    if (!this.expenseDAO) {
      this.expenseDAO = new ExpenseDAO();
    }
    return this.expenseDAO;
  }

  public static getIncomeDAO(): IncomeDAO {
    if (!this.incomeDAO) {
      this.incomeDAO = new IncomeDAO();
    }
    return this.incomeDAO;
  }

  public static getFarmDAO(): FarmDAO {
    if (!this.farmDAO) {
      this.farmDAO = new FarmDAO();
    }
    return this.farmDAO;
  }

  public static getCropDAO(): CropDAO {
    if (!this.cropDAO) {
      this.cropDAO = new CropDAO();
    }
    return this.cropDAO;
  }

  public static getParentChildLinkDAO(): ParentChildLinkDAO {
    if (!this.parentChildLinkDAO) {
      this.parentChildLinkDAO = new ParentChildLinkDAO();
    }
    return this.parentChildLinkDAO;
  }

  public static getApprovalRequestDAO(): ApprovalRequestDAO {
    if (!this.approvalRequestDAO) {
      this.approvalRequestDAO = new ApprovalRequestDAO();
    }
    return this.approvalRequestDAO;
  }

  public static getAllowanceConfigDAO(): AllowanceConfigDAO {
    if (!this.allowanceConfigDAO) {
      this.allowanceConfigDAO = new AllowanceConfigDAO();
    }
    return this.allowanceConfigDAO;
  }

  public static getChildActivityDAO(): ChildActivityDAO {
    if (!this.childActivityDAO) {
      this.childActivityDAO = new ChildActivityDAO();
    }
    return this.childActivityDAO;
  }

  public static getRestrictionConfigDAO(): RestrictionConfigDAO {
    if (!this.restrictionConfigDAO) {
      this.restrictionConfigDAO = new RestrictionConfigDAO();
    }
    return this.restrictionConfigDAO;
  }

  public static getChoreDAO(): ChoreDAO {
    if (!this.choreDAO) {
      this.choreDAO = new ChoreDAO();
    }
    return this.choreDAO;
  }
}