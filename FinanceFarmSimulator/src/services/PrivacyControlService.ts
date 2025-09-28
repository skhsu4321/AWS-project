import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorageService from './SecureStorageService';
import DataAnonymizationService from './DataAnonymizationService';

export interface PrivacySettings {
  dataCollection: {
    analytics: boolean;
    crashReporting: boolean;
    performanceMetrics: boolean;
    usageStatistics: boolean;
  };
  dataSharing: {
    anonymizedAnalytics: boolean;
    marketResearch: boolean;
    productImprovement: boolean;
  };
  dataRetention: {
    financialData: number; // days
    activityLogs: number; // days
    analyticsData: number; // days
  };
  notifications: {
    privacyUpdates: boolean;
    dataProcessingAlerts: boolean;
    securityNotifications: boolean;
  };
  biometrics: {
    enabled: boolean;
    type: 'fingerprint' | 'face' | 'voice' | null;
  };
}

export interface DataExportRequest {
  userId: string;
  requestId: string;
  requestedAt: Date;
  format: 'json' | 'csv' | 'pdf';
  includeFinancialData: boolean;
  includeActivityLogs: boolean;
  includeAnalyticsData: boolean;
  anonymize: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface DataDeletionRequest {
  userId: string;
  requestId: string;
  requestedAt: Date;
  deletionType: 'partial' | 'complete';
  dataTypes: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
  verificationRequired: boolean;
}

export interface ConsentRecord {
  userId: string;
  consentType: string;
  granted: boolean;
  timestamp: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export class PrivacyControlService {
  private static instance: PrivacyControlService;
  private secureStorage: SecureStorageService;
  private anonymizationService: DataAnonymizationService;
  private defaultSettings: PrivacySettings;

  private constructor() {
    this.secureStorage = SecureStorageService.getInstance();
    this.anonymizationService = DataAnonymizationService.getInstance();
    this.defaultSettings = {
      dataCollection: {
        analytics: false,
        crashReporting: true,
        performanceMetrics: false,
        usageStatistics: false,
      },
      dataSharing: {
        anonymizedAnalytics: false,
        marketResearch: false,
        productImprovement: false,
      },
      dataRetention: {
        financialData: 2555, // 7 years (regulatory requirement)
        activityLogs: 90,
        analyticsData: 365,
      },
      notifications: {
        privacyUpdates: true,
        dataProcessingAlerts: true,
        securityNotifications: true,
      },
      biometrics: {
        enabled: false,
        type: null,
      },
    };
  }

  public static getInstance(): PrivacyControlService {
    if (!PrivacyControlService.instance) {
      PrivacyControlService.instance = new PrivacyControlService();
    }
    return PrivacyControlService.instance;
  }

  /**
   * Get user's privacy settings
   */
  public async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const stored = await this.secureStorage.getFinancialData(`privacy_settings_${userId}`);
      return stored || this.defaultSettings;
    } catch (error) {
      console.error('Failed to get privacy settings:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Update user's privacy settings
   */
  public async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    try {
      const currentSettings = await this.getPrivacySettings(userId);
      const updatedSettings = this.mergeSettings(currentSettings, settings);
      
      await this.secureStorage.storeFinancialData(
        `privacy_settings_${userId}`,
        updatedSettings
      );

      // Log consent changes
      await this.logConsentChanges(userId, settings);
      
      // Apply settings immediately
      await this.applyPrivacySettings(userId, updatedSettings);
    } catch (error) {
      throw new Error(`Failed to update privacy settings: ${error}`);
    }
  }

  /**
   * Request data export
   */
  public async requestDataExport(
    userId: string,
    options: {
      format: 'json' | 'csv' | 'pdf';
      includeFinancialData: boolean;
      includeActivityLogs: boolean;
      includeAnalyticsData: boolean;
      anonymize: boolean;
    }
  ): Promise<DataExportRequest> {
    try {
      const requestId = await this.generateRequestId();
      const exportRequest: DataExportRequest = {
        userId,
        requestId,
        requestedAt: new Date(),
        ...options,
        status: 'pending',
      };

      // Store export request
      await this.secureStorage.storeFinancialData(
        `export_request_${requestId}`,
        exportRequest
      );

      // Start export process
      this.processDataExport(exportRequest);

      return exportRequest;
    } catch (error) {
      throw new Error(`Failed to request data export: ${error}`);
    }
  }

  /**
   * Request data deletion
   */
  public async requestDataDeletion(
    userId: string,
    options: {
      deletionType: 'partial' | 'complete';
      dataTypes: string[];
    }
  ): Promise<DataDeletionRequest> {
    try {
      const requestId = await this.generateRequestId();
      const deletionRequest: DataDeletionRequest = {
        userId,
        requestId,
        requestedAt: new Date(),
        ...options,
        status: 'pending',
        verificationRequired: options.deletionType === 'complete',
      };

      // Store deletion request
      await this.secureStorage.storeFinancialData(
        `deletion_request_${requestId}`,
        deletionRequest
      );

      // Start deletion process if no verification required
      if (!deletionRequest.verificationRequired) {
        this.processDataDeletion(deletionRequest);
      }

      return deletionRequest;
    } catch (error) {
      throw new Error(`Failed to request data deletion: ${error}`);
    }
  }

  /**
   * Record user consent
   */
  public async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    version: string = '1.0'
  ): Promise<void> {
    try {
      const consentRecord: ConsentRecord = {
        userId,
        consentType,
        granted,
        timestamp: new Date(),
        version,
      };

      // Store consent record
      const consentKey = `consent_${userId}_${consentType}_${Date.now()}`;
      await this.secureStorage.storeFinancialData(consentKey, consentRecord);

      // Update privacy settings based on consent
      await this.updateSettingsFromConsent(userId, consentType, granted);
    } catch (error) {
      throw new Error(`Failed to record consent: ${error}`);
    }
  }

  /**
   * Get consent history
   */
  public async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    try {
      const stats = await this.secureStorage.getStorageStats();
      const consentKeys = (await AsyncStorage.getAllKeys())
        .filter(key => key.includes(`consent_${userId}`));

      const consentRecords: ConsentRecord[] = [];
      for (const key of consentKeys) {
        const record = await this.secureStorage.getFinancialData(
          key.replace('secure_financial_', '')
        );
        if (record) {
          consentRecords.push(record);
        }
      }

      return consentRecords.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Failed to get consent history:', error);
      return [];
    }
  }

  /**
   * Check if data collection is allowed
   */
  public async isDataCollectionAllowed(
    userId: string,
    dataType: keyof PrivacySettings['dataCollection']
  ): Promise<boolean> {
    try {
      const settings = await this.getPrivacySettings(userId);
      return settings.dataCollection[dataType];
    } catch (error) {
      console.error('Failed to check data collection permission:', error);
      return false;
    }
  }

  /**
   * Check if data sharing is allowed
   */
  public async isDataSharingAllowed(
    userId: string,
    sharingType: keyof PrivacySettings['dataSharing']
  ): Promise<boolean> {
    try {
      const settings = await this.getPrivacySettings(userId);
      return settings.dataSharing[sharingType];
    } catch (error) {
      console.error('Failed to check data sharing permission:', error);
      return false;
    }
  }

  /**
   * Process data export request
   */
  private async processDataExport(request: DataExportRequest): Promise<void> {
    try {
      // Update status to processing
      request.status = 'processing';
      await this.secureStorage.storeFinancialData(
        `export_request_${request.requestId}`,
        request
      );

      // Collect requested data
      const exportData: any = {};

      if (request.includeFinancialData) {
        exportData.financialData = await this.collectFinancialData(request.userId);
      }

      if (request.includeActivityLogs) {
        exportData.activityLogs = await this.collectActivityLogs(request.userId);
      }

      if (request.includeAnalyticsData) {
        exportData.analyticsData = await this.collectAnalyticsData(request.userId);
      }

      // Anonymize data if requested
      if (request.anonymize) {
        exportData.financialData = await this.anonymizationService.sanitizeDataExport(
          exportData.financialData
        );
      }

      // Generate export file
      const exportFile = await this.generateExportFile(exportData, request.format);
      
      // Store export file (in real implementation, upload to secure storage)
      const downloadUrl = await this.storeExportFile(request.requestId, exportFile);

      // Update request with completion details
      request.status = 'completed';
      request.downloadUrl = downloadUrl;
      request.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await this.secureStorage.storeFinancialData(
        `export_request_${request.requestId}`,
        request
      );
    } catch (error) {
      console.error('Failed to process data export:', error);
      request.status = 'failed';
      await this.secureStorage.storeFinancialData(
        `export_request_${request.requestId}`,
        request
      );
    }
  }

  /**
   * Process data deletion request
   */
  private async processDataDeletion(request: DataDeletionRequest): Promise<void> {
    try {
      request.status = 'processing';
      await this.secureStorage.storeFinancialData(
        `deletion_request_${request.requestId}`,
        request
      );

      // Delete requested data types
      for (const dataType of request.dataTypes) {
        await this.deleteDataByType(request.userId, dataType);
      }

      // Complete deletion
      request.status = 'completed';
      request.completedAt = new Date();

      await this.secureStorage.storeFinancialData(
        `deletion_request_${request.requestId}`,
        request
      );
    } catch (error) {
      console.error('Failed to process data deletion:', error);
      request.status = 'failed';
      await this.secureStorage.storeFinancialData(
        `deletion_request_${request.requestId}`,
        request
      );
    }
  }

  /**
   * Apply privacy settings
   */
  private async applyPrivacySettings(
    userId: string,
    settings: PrivacySettings
  ): Promise<void> {
    // Configure analytics collection
    if (!settings.dataCollection.analytics) {
      // Disable analytics collection
      await this.disableAnalyticsCollection(userId);
    }

    // Configure data retention
    await this.configureDataRetention(userId, settings.dataRetention);

    // Configure biometrics
    if (settings.biometrics.enabled) {
      await this.enableBiometrics(userId, settings.biometrics.type);
    }
  }

  /**
   * Merge privacy settings
   */
  private mergeSettings(
    current: PrivacySettings,
    updates: Partial<PrivacySettings>
  ): PrivacySettings {
    return {
      dataCollection: { ...current.dataCollection, ...updates.dataCollection },
      dataSharing: { ...current.dataSharing, ...updates.dataSharing },
      dataRetention: { ...current.dataRetention, ...updates.dataRetention },
      notifications: { ...current.notifications, ...updates.notifications },
      biometrics: { ...current.biometrics, ...updates.biometrics },
    };
  }

  /**
   * Log consent changes
   */
  private async logConsentChanges(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    const changes = Object.entries(settings).flat();
    for (const [category, values] of Object.entries(settings)) {
      if (typeof values === 'object') {
        for (const [key, value] of Object.entries(values)) {
          await this.recordConsent(userId, `${category}.${key}`, value as boolean);
        }
      }
    }
  }

  /**
   * Update settings from consent
   */
  private async updateSettingsFromConsent(
    userId: string,
    consentType: string,
    granted: boolean
  ): Promise<void> {
    // Map consent types to privacy settings
    const consentMapping: Record<string, string> = {
      'analytics': 'dataCollection.analytics',
      'marketing': 'dataSharing.marketResearch',
      'performance': 'dataCollection.performanceMetrics',
    };

    const settingPath = consentMapping[consentType];
    if (settingPath) {
      const [category, key] = settingPath.split('.');
      const currentSettings = await this.getPrivacySettings(userId);
      (currentSettings as any)[category][key] = granted;
      await this.secureStorage.storeFinancialData(
        `privacy_settings_${userId}`,
        currentSettings
      );
    }
  }

  // Helper methods (simplified implementations)
  private async generateRequestId(): Promise<string> {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async collectFinancialData(userId: string): Promise<any> {
    // Collect user's financial data
    return { placeholder: 'financial_data' };
  }

  private async collectActivityLogs(userId: string): Promise<any> {
    // Collect user's activity logs
    return { placeholder: 'activity_logs' };
  }

  private async collectAnalyticsData(userId: string): Promise<any> {
    // Collect user's analytics data
    return { placeholder: 'analytics_data' };
  }

  private async generateExportFile(data: any, format: string): Promise<string> {
    // Generate export file in requested format
    return JSON.stringify(data, null, 2);
  }

  private async storeExportFile(requestId: string, file: string): Promise<string> {
    // Store export file and return download URL
    return `https://exports.financefarmsimulator.com/${requestId}`;
  }

  private async deleteDataByType(userId: string, dataType: string): Promise<void> {
    // Delete specific data type for user
    console.log(`Deleting ${dataType} for user ${userId}`);
  }

  private async disableAnalyticsCollection(userId: string): Promise<void> {
    // Disable analytics collection for user
    console.log(`Analytics disabled for user ${userId}`);
  }

  private async configureDataRetention(
    userId: string,
    retention: PrivacySettings['dataRetention']
  ): Promise<void> {
    // Configure data retention policies
    console.log(`Data retention configured for user ${userId}:`, retention);
  }

  private async enableBiometrics(
    userId: string,
    type: 'fingerprint' | 'face' | 'voice' | null
  ): Promise<void> {
    // Enable biometric authentication
    console.log(`Biometrics enabled for user ${userId}: ${type}`);
  }
}

export default PrivacyControlService;