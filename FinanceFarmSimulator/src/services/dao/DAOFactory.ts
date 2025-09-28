import { FarmDAO, MockFarmDAO } from './FarmDAO';
import { CropDAO, MockCropDAO } from './CropDAO';

// Factory for creating DAO instances
export class DAOFactory {
  private static farmDAO: FarmDAO | null = null;
  private static cropDAO: CropDAO | null = null;

  static getFarmDAO(): FarmDAO {
    if (!this.farmDAO) {
      // In production, this would create the appropriate DAO implementation
      // For now, we use the mock implementation
      this.farmDAO = new MockFarmDAO();
    }
    return this.farmDAO;
  }

  static getCropDAO(): CropDAO {
    if (!this.cropDAO) {
      // In production, this would create the appropriate DAO implementation
      // For now, we use the mock implementation
      this.cropDAO = new MockCropDAO();
    }
    return this.cropDAO;
  }

  // Additional DAO getters for other services (placeholders)
  static getParentChildLinkDAO(): any {
    return {};
  }

  static getApprovalRequestDAO(): any {
    return {};
  }

  static getAllowanceConfigDAO(): any {
    return {};
  }

  static getChildActivityDAO(): any {
    return {};
  }

  static getRestrictionConfigDAO(): any {
    return {};
  }

  static getChoreDAO(): any {
    return {};
  }

  // Reset method for testing
  static reset(): void {
    this.farmDAO = null;
    this.cropDAO = null;
  }
}