import * as Crypto from 'expo-crypto';

export interface AnonymizationConfig {
  hashSalt: string;
  preserveStructure: boolean;
  anonymizeAmounts: boolean;
  anonymizeDates: boolean;
  anonymizeCategories: boolean;
}

export interface AnonymizedFinancialData {
  userId: string; // hashed
  goalId?: string; // hashed
  expenseId?: string; // hashed
  incomeId?: string; // hashed
  amount?: number; // anonymized
  category?: string; // anonymized
  date?: string; // anonymized
  metadata: {
    originalType: string;
    anonymizedAt: number;
    version: string;
  };
}

export interface AnalyticsData {
  userSegment: string;
  behaviorPattern: string;
  aggregatedMetrics: {
    avgSavingsGoals: number;
    avgExpenseCategories: number;
    avgIncomeFrequency: number;
    engagementScore: number;
  };
  timeframe: {
    start: string;
    end: string;
  };
}

export class DataAnonymizationService {
  private static instance: DataAnonymizationService;
  private config: AnonymizationConfig;
  private hashCache: Map<string, string> = new Map();

  private constructor() {
    this.config = {
      hashSalt: 'finance_farm_analytics_salt_2024',
      preserveStructure: true,
      anonymizeAmounts: true,
      anonymizeDates: true,
      anonymizeCategories: false, // Keep categories for analytics
    };
  }

  public static getInstance(): DataAnonymizationService {
    if (!DataAnonymizationService.instance) {
      DataAnonymizationService.instance = new DataAnonymizationService();
    }
    return DataAnonymizationService.instance;
  }

  /**
   * Anonymize user financial data for analytics
   */
  public async anonymizeFinancialData(data: any): Promise<AnonymizedFinancialData> {
    try {
      const anonymized: AnonymizedFinancialData = {
        userId: await this.hashIdentifier(data.userId),
        metadata: {
          originalType: data.type || 'unknown',
          anonymizedAt: Date.now(),
          version: '1.0',
        },
      };

      // Anonymize IDs
      if (data.goalId) {
        anonymized.goalId = await this.hashIdentifier(data.goalId);
      }
      if (data.expenseId) {
        anonymized.expenseId = await this.hashIdentifier(data.expenseId);
      }
      if (data.incomeId) {
        anonymized.incomeId = await this.hashIdentifier(data.incomeId);
      }

      // Anonymize amounts
      if (data.amount && this.config.anonymizeAmounts) {
        anonymized.amount = this.anonymizeAmount(data.amount);
      }

      // Anonymize categories (optional)
      if (data.category) {
        anonymized.category = this.config.anonymizeCategories
          ? await this.hashIdentifier(data.category)
          : data.category;
      }

      // Anonymize dates
      if (data.date && this.config.anonymizeDates) {
        anonymized.date = this.anonymizeDate(data.date);
      }

      return anonymized;
    } catch (error) {
      throw new Error(`Failed to anonymize financial data: ${error}`);
    }
  }

  /**
   * Create aggregated analytics data without personal information
   */
  public async createAnalyticsData(
    userDataSets: any[],
    timeframe: { start: Date; end: Date }
  ): Promise<AnalyticsData> {
    try {
      const aggregatedMetrics = this.calculateAggregatedMetrics(userDataSets);
      const userSegment = this.determineUserSegment(aggregatedMetrics);
      const behaviorPattern = this.identifyBehaviorPattern(userDataSets);

      return {
        userSegment,
        behaviorPattern,
        aggregatedMetrics,
        timeframe: {
          start: timeframe.start.toISOString().split('T')[0], // Date only
          end: timeframe.end.toISOString().split('T')[0],
        },
      };
    } catch (error) {
      throw new Error(`Failed to create analytics data: ${error}`);
    }
  }

  /**
   * Hash identifiers consistently
   */
  private async hashIdentifier(identifier: string): Promise<string> {
    // Check cache first
    if (this.hashCache.has(identifier)) {
      return this.hashCache.get(identifier)!;
    }

    try {
      const combined = identifier + this.config.hashSalt;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combined,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Take first 16 characters for shorter anonymous IDs
      const shortHash = hash.substring(0, 16);
      this.hashCache.set(identifier, shortHash);
      return shortHash;
    } catch (error) {
      throw new Error(`Failed to hash identifier: ${error}`);
    }
  }

  /**
   * Anonymize monetary amounts using ranges
   */
  private anonymizeAmount(amount: number): number {
    if (amount <= 0) return 0;

    // Create amount ranges to preserve analytical value while anonymizing
    const ranges = [
      { min: 0, max: 100, bucket: 50 },
      { min: 100, max: 500, bucket: 250 },
      { min: 500, max: 1000, bucket: 750 },
      { min: 1000, max: 5000, bucket: 2500 },
      { min: 5000, max: 10000, bucket: 7500 },
      { min: 10000, max: 50000, bucket: 25000 },
      { min: 50000, max: Infinity, bucket: 75000 },
    ];

    for (const range of ranges) {
      if (amount >= range.min && amount < range.max) {
        return range.bucket;
      }
    }

    return 75000; // Default for very large amounts
  }

  /**
   * Anonymize dates to preserve temporal patterns while removing specificity
   */
  private anonymizeDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Return only year and month to preserve seasonal patterns
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    
    return `${year}-${month.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate aggregated metrics from user data
   */
  private calculateAggregatedMetrics(userDataSets: any[]): {
    avgSavingsGoals: number;
    avgExpenseCategories: number;
    avgIncomeFrequency: number;
    engagementScore: number;
  } {
    if (userDataSets.length === 0) {
      return {
        avgSavingsGoals: 0,
        avgExpenseCategories: 0,
        avgIncomeFrequency: 0,
        engagementScore: 0,
      };
    }

    const totals = userDataSets.reduce(
      (acc, userData) => {
        acc.savingsGoals += userData.savingsGoals?.length || 0;
        acc.expenseCategories += new Set(
          userData.expenses?.map((e: any) => e.category) || []
        ).size;
        acc.incomeEntries += userData.incomes?.length || 0;
        acc.engagementDays += userData.activeDays || 0;
        return acc;
      },
      { savingsGoals: 0, expenseCategories: 0, incomeEntries: 0, engagementDays: 0 }
    );

    const userCount = userDataSets.length;

    return {
      avgSavingsGoals: Math.round(totals.savingsGoals / userCount),
      avgExpenseCategories: Math.round(totals.expenseCategories / userCount),
      avgIncomeFrequency: Math.round(totals.incomeEntries / userCount),
      engagementScore: Math.round(totals.engagementDays / userCount),
    };
  }

  /**
   * Determine user segment based on behavior
   */
  private determineUserSegment(metrics: {
    avgSavingsGoals: number;
    avgExpenseCategories: number;
    avgIncomeFrequency: number;
    engagementScore: number;
  }): string {
    if (metrics.engagementScore >= 20 && metrics.avgSavingsGoals >= 3) {
      return 'power_user';
    } else if (metrics.engagementScore >= 10 && metrics.avgSavingsGoals >= 1) {
      return 'regular_user';
    } else if (metrics.engagementScore >= 5) {
      return 'casual_user';
    } else {
      return 'new_user';
    }
  }

  /**
   * Identify behavior patterns
   */
  private identifyBehaviorPattern(userDataSets: any[]): string {
    const patterns = [];

    // Analyze saving patterns
    const avgGoalsPerUser = userDataSets.reduce(
      (sum, user) => sum + (user.savingsGoals?.length || 0),
      0
    ) / userDataSets.length;

    if (avgGoalsPerUser >= 3) patterns.push('multi_goal_saver');
    else if (avgGoalsPerUser >= 1) patterns.push('goal_oriented');

    // Analyze expense tracking patterns
    const avgExpensesPerUser = userDataSets.reduce(
      (sum, user) => sum + (user.expenses?.length || 0),
      0
    ) / userDataSets.length;

    if (avgExpensesPerUser >= 50) patterns.push('detailed_tracker');
    else if (avgExpensesPerUser >= 20) patterns.push('regular_tracker');

    // Analyze income logging patterns
    const avgIncomePerUser = userDataSets.reduce(
      (sum, user) => sum + (user.incomes?.length || 0),
      0
    ) / userDataSets.length;

    if (avgIncomePerUser >= 10) patterns.push('frequent_logger');

    return patterns.length > 0 ? patterns.join('_') : 'basic_user';
  }

  /**
   * Remove personally identifiable information from data export
   */
  public async sanitizeDataExport(data: any): Promise<any> {
    const sanitized = JSON.parse(JSON.stringify(data)); // Deep clone

    // Remove or hash PII fields
    const piiFields = ['email', 'phone', 'address', 'fullName', 'socialSecurityNumber'];
    
    const sanitizeObject = async (obj: any): Promise<void> => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (piiFields.includes(key)) {
            obj[key] = await this.hashIdentifier(obj[key]);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            await sanitizeObject(obj[key]);
          }
        }
      }
    };

    await sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Update anonymization configuration
   */
  public updateConfig(newConfig: Partial<AnonymizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Clear cache when config changes
    this.hashCache.clear();
  }

  /**
   * Clear hash cache
   */
  public clearCache(): void {
    this.hashCache.clear();
  }

  /**
   * Get anonymization statistics
   */
  public getStats(): {
    cacheSize: number;
    config: AnonymizationConfig;
  } {
    return {
      cacheSize: this.hashCache.size,
      config: { ...this.config },
    };
  }
}

export default DataAnonymizationService;