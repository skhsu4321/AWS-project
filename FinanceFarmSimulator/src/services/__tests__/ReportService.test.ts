import { ReportService } from '../ReportService';
import { FinancialDataManager } from '../FinancialDataManager';
import { AnalyticsService } from '../AnalyticsService';
import { ExpenseCategory, IncomeSource } from '../../models/Financial';

// Mock dependencies
jest.mock('../FinancialDataManager');
jest.mock('../AnalyticsService');

describe('ReportService', () => {
  let reportService: ReportService;
  let mockFinancialDataManager: jest.Mocked<FinancialDataManager>;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;

  const mockUserId = 'test-user-id';
  const mockDate = new Date('2024-01-15');

  beforeEach(() => {
    mockFinancialDataManager = new FinancialDataManager() as jest.Mocked<FinancialDataManager>;
    reportService = new ReportService(mockFinancialDataManager);
    
    // Access the private analyticsService for mocking
    mockAnalyticsService = (reportService as any).analyticsService as jest.Mocked<AnalyticsService>;
    
    jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateReport', () => {
    const mockSummary = {
      userId: mockUserId,
      period: 'monthly' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      totalIncome: 5000,
      totalExpenses: 3000,
      netAmount: 2000,
      savingsRate: 40,
      expensesByCategory: {
        [ExpenseCategory.FOOD]: 1500,
        [ExpenseCategory.TRANSPORT]: 1000,
        [ExpenseCategory.ENTERTAINMENT]: 500,
      } as any,
      incomeBySource: {
        [IncomeSource.SALARY]: 4000,
        [IncomeSource.BONUS]: 1000,
      } as any,
      activeGoalsCount: 2,
      completedGoalsCount: 1,
      generatedAt: mockDate,
    };

    const mockTrends = {
      income: [
        { period: '2024-01-01', value: 5000, label: 'Jan 2024' },
        { period: '2023-12-01', value: 4500, label: 'Dec 2023' },
      ],
      expenses: [
        { period: '2024-01-01', value: 3000, label: 'Jan 2024' },
        { period: '2023-12-01', value: 2800, label: 'Dec 2023' },
      ],
      netAmount: [
        { period: '2024-01-01', value: 2000, label: 'Jan 2024' },
        { period: '2023-12-01', value: 1700, label: 'Dec 2023' },
      ],
      savingsRate: [
        { period: '2024-01-01', value: 40, label: 'Jan 2024' },
        { period: '2023-12-01', value: 37.8, label: 'Dec 2023' },
      ],
    };

    const mockExpenseBreakdown = [
      {
        category: 'FOOD',
        amount: 1500,
        percentage: 50,
        color: '#FF6B6B',
      },
      {
        category: 'TRANSPORT',
        amount: 1000,
        percentage: 33.33,
        color: '#4ECDC4',
      },
      {
        category: 'ENTERTAINMENT',
        amount: 500,
        percentage: 16.67,
        color: '#45B7D1',
      },
    ];

    const mockHealthScore = {
      overall: 75,
      savingsRate: 80,
      budgetAdherence: 90,
      goalProgress: 70,
      incomeConsistency: 60,
      breakdown: [
        {
          category: 'Savings Rate',
          score: 80,
          weight: 0.3,
          description: 'How much of your income you save',
        },
        {
          category: 'Budget Adherence',
          score: 90,
          weight: 0.25,
          description: 'How well you stick to your budget',
        },
        {
          category: 'Goal Progress',
          score: 70,
          weight: 0.25,
          description: 'Progress towards your savings goals',
        },
        {
          category: 'Income Consistency',
          score: 60,
          weight: 0.2,
          description: 'Regularity of income logging',
        },
      ],
    };

    const mockInsights = [
      {
        id: 'insight-1',
        type: 'spending' as const,
        title: 'Food Spending Increasing',
        description: 'Your food expenses have been trending upward',
        severity: 'warning' as const,
        actionable: true,
        recommendation: 'Consider meal planning to reduce food costs',
        generatedAt: mockDate,
      },
    ];

    beforeEach(() => {
      mockFinancialDataManager.generateFinancialSummary.mockResolvedValue(mockSummary);
      mockAnalyticsService.generateFinancialTrends.mockResolvedValue(mockTrends);
      mockAnalyticsService.generateExpenseBreakdown.mockResolvedValue(mockExpenseBreakdown);
      mockAnalyticsService.calculateFinancialHealthScore.mockResolvedValue(mockHealthScore);
      mockAnalyticsService.generateInsights.mockResolvedValue(mockInsights);
    });

    it('should generate a complete monthly report', async () => {
      const reportConfig = {
        userId: mockUserId,
        reportType: 'monthly' as const,
        includeCharts: true,
        includeInsights: true,
        includeRecommendations: true,
        format: 'pdf' as const,
      };

      const report = await reportService.generateReport(reportConfig);

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('expenseBreakdown');
      expect(report).toHaveProperty('healthScore');
      expect(report).toHaveProperty('insights');
      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('reportPeriod');

      expect(report.summary).toEqual(mockSummary);
      expect(report.trends).toEqual(mockTrends);
      expect(report.expenseBreakdown).toEqual(mockExpenseBreakdown);
      expect(report.healthScore).toEqual(mockHealthScore);
      expect(report.insights).toEqual(mockInsights);

      expect(report.reportPeriod.type).toBe('monthly');
      expect(report.reportPeriod.startDate).toBeInstanceOf(Date);
      expect(report.reportPeriod.endDate).toBeInstanceOf(Date);
    });

    it('should generate report without insights when not requested', async () => {
      const reportConfig = {
        userId: mockUserId,
        reportType: 'weekly' as const,
        includeCharts: true,
        includeInsights: false,
        includeRecommendations: false,
        format: 'json' as const,
      };

      const report = await reportService.generateReport(reportConfig);

      expect(report.insights).toEqual([]);
      expect(mockAnalyticsService.generateInsights).not.toHaveBeenCalled();
    });

    it('should handle quarterly reports', async () => {
      const reportConfig = {
        userId: mockUserId,
        reportType: 'quarterly' as const,
        includeCharts: true,
        includeInsights: true,
        includeRecommendations: true,
        format: 'pdf' as const,
      };

      const report = await reportService.generateReport(reportConfig);

      expect(report.reportPeriod.type).toBe('monthly'); // Quarterly uses monthly type
      expect(mockAnalyticsService.generateFinancialTrends).toHaveBeenCalledWith(
        mockUserId,
        4, // 4 periods for quarterly
        'monthly'
      );
    });

    it('should handle yearly reports', async () => {
      const reportConfig = {
        userId: mockUserId,
        reportType: 'yearly' as const,
        includeCharts: true,
        includeInsights: true,
        includeRecommendations: true,
        format: 'pdf' as const,
      };

      const report = await reportService.generateReport(reportConfig);

      expect(report.reportPeriod.type).toBe('yearly');
      expect(mockAnalyticsService.generateFinancialTrends).toHaveBeenCalledWith(
        mockUserId,
        3, // 3 periods for yearly
        'monthly'
      );
    });
  });

  describe('generateHTMLReport', () => {
    const mockReportData = {
      summary: {
        userId: mockUserId,
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalIncome: 5000,
        totalExpenses: 3000,
        netAmount: 2000,
        savingsRate: 40,
        expensesByCategory: {} as any,
        incomeBySource: {} as any,
        activeGoalsCount: 2,
        completedGoalsCount: 1,
        generatedAt: mockDate,
      },
      trends: {
        income: [],
        expenses: [],
        netAmount: [],
        savingsRate: [],
      },
      expenseBreakdown: [
        {
          category: 'FOOD',
          amount: 1500,
          percentage: 50,
          color: '#FF6B6B',
        },
      ],
      healthScore: {
        overall: 75,
        savingsRate: 80,
        budgetAdherence: 90,
        goalProgress: 70,
        incomeConsistency: 60,
        breakdown: [
          {
            category: 'Savings Rate',
            score: 80,
            weight: 0.3,
            description: 'How much of your income you save',
          },
        ],
      },
      insights: [
        {
          id: 'insight-1',
          type: 'spending' as const,
          title: 'Test Insight',
          description: 'Test description',
          severity: 'info' as const,
          actionable: true,
          recommendation: 'Test recommendation',
          generatedAt: mockDate,
        },
      ],
      generatedAt: mockDate,
      reportPeriod: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        type: 'monthly' as const,
      },
    };

    const mockOptions = {
      title: 'Test Financial Report',
      subtitle: 'Test Subtitle',
      includeHeader: true,
      includeFooter: true,
      pageSize: 'A4' as const,
      orientation: 'portrait' as const,
    };

    it('should generate HTML report with all sections', () => {
      const html = reportService.generateHTMLReport(mockReportData, mockOptions);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('Test Financial Report');
      expect(html).toContain('Test Subtitle');
      expect(html).toContain('Financial Summary');
      expect(html).toContain('Health Score');
      expect(html).toContain('Expense Breakdown');
      expect(html).toContain('Insights & Recommendations');
      expect(html).toContain('$5,000'); // Total income formatted
      expect(html).toContain('$3,000'); // Total expenses formatted
      expect(html).toContain('40.0%'); // Savings rate
      expect(html).toContain('Test Insight');
      expect(html).toContain('Test recommendation');
    });

    it('should handle report without header and footer', () => {
      const optionsWithoutHeaderFooter = {
        ...mockOptions,
        includeHeader: false,
        includeFooter: false,
      };

      const html = reportService.generateHTMLReport(mockReportData, optionsWithoutHeaderFooter);

      expect(html).not.toContain('Test Financial Report');
      expect(html).not.toContain('Generated on');
      expect(html).toContain('Financial Summary'); // Content should still be there
    });

    it('should handle report without insights', () => {
      const reportDataWithoutInsights = {
        ...mockReportData,
        insights: [],
      };

      const html = reportService.generateHTMLReport(reportDataWithoutInsights, mockOptions);

      expect(html).not.toContain('Insights & Recommendations');
      expect(html).toContain('Financial Summary'); // Other sections should still be there
    });

    it('should format currency correctly', () => {
      const html = reportService.generateHTMLReport(mockReportData, mockOptions);

      // Check HKD currency formatting
      expect(html).toContain('HK$'); // Should format as Hong Kong dollars
    });

    it('should apply correct health score styling', () => {
      const html = reportService.generateHTMLReport(mockReportData, mockOptions);

      expect(html).toContain('75'); // Health score value
      expect(html).toContain('score-good'); // Should apply good score class for 75
    });
  });

  describe('exportReportAsJSON', () => {
    it('should export report data as formatted JSON', () => {
      const mockReportData = {
        summary: {
          userId: mockUserId,
          totalIncome: 5000,
          totalExpenses: 3000,
        },
        generatedAt: mockDate,
      } as any;

      const json = reportService.exportReportAsJSON(mockReportData);

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
      
      const parsedData = JSON.parse(json);
      expect(parsedData.summary.userId).toBe(mockUserId);
      expect(parsedData.summary.totalIncome).toBe(5000);
      expect(parsedData.summary.totalExpenses).toBe(3000);
    });
  });

  describe('generateDashboardSummary', () => {
    beforeEach(() => {
      const mockCurrentSummary = {
        userId: mockUserId,
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalIncome: 5000,
        totalExpenses: 3000,
        netAmount: 2000,
        savingsRate: 40,
        expensesByCategory: {} as any,
        incomeBySource: {} as any,
        activeGoalsCount: 2,
        completedGoalsCount: 1,
        generatedAt: mockDate,
      };

      const mockPreviousSummary = {
        ...mockCurrentSummary,
        totalIncome: 4500,
        totalExpenses: 2800,
        netAmount: 1700,
        savingsRate: 37.8,
      };

      mockFinancialDataManager.generateFinancialSummary
        .mockResolvedValueOnce(mockCurrentSummary)
        .mockResolvedValueOnce(mockPreviousSummary);

      mockAnalyticsService.generateExpenseBreakdown.mockResolvedValue([
        {
          category: 'FOOD',
          amount: 1500,
          percentage: 50,
          color: '#FF6B6B',
        },
      ]);

      mockAnalyticsService.calculateFinancialHealthScore.mockResolvedValue({
        overall: 75,
        savingsRate: 80,
        budgetAdherence: 90,
        goalProgress: 70,
        incomeConsistency: 60,
        breakdown: [],
      });

      mockAnalyticsService.generateInsights.mockResolvedValue([
        {
          id: 'insight-1',
          type: 'spending',
          title: 'Warning Insight',
          description: 'Test warning',
          severity: 'warning',
          actionable: true,
          generatedAt: mockDate,
        },
        {
          id: 'insight-2',
          type: 'income',
          title: 'Info Insight',
          description: 'Test info',
          severity: 'info',
          actionable: false,
          generatedAt: mockDate,
        },
      ] as any);
    });

    it('should generate dashboard summary with trends', async () => {
      const summary = await reportService.generateDashboardSummary(mockUserId);

      expect(summary).toHaveProperty('currentMonth');
      expect(summary).toHaveProperty('previousMonth');
      expect(summary).toHaveProperty('trends');
      expect(summary).toHaveProperty('topCategories');
      expect(summary).toHaveProperty('healthScore');
      expect(summary).toHaveProperty('urgentInsights');

      expect(summary.currentMonth.totalIncome).toBe(5000);
      expect(summary.previousMonth.totalIncome).toBe(4500);

      expect(summary.trends.incomeChange).toBeCloseTo(11.11, 1); // (5000-4500)/4500 * 100
      expect(summary.trends.expenseChange).toBeCloseTo(7.14, 1); // (3000-2800)/2800 * 100
      expect(summary.trends.savingsRateChange).toBeCloseTo(2.2, 1); // 40 - 37.8

      expect(summary.healthScore).toBe(75);
      expect(summary.topCategories).toHaveLength(1);
      expect(summary.urgentInsights).toHaveLength(1); // Only warning/danger insights
      expect(summary.urgentInsights[0].severity).toBe('warning');
    });

    it('should handle zero previous values in trend calculation', async () => {
      const mockCurrentSummary = {
        userId: mockUserId,
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalIncome: 5000,
        totalExpenses: 3000,
        netAmount: 2000,
        savingsRate: 40,
        expensesByCategory: {} as any,
        incomeBySource: {} as any,
        activeGoalsCount: 2,
        completedGoalsCount: 1,
        generatedAt: mockDate,
      };

      const mockPreviousSummary = {
        ...mockCurrentSummary,
        totalIncome: 0,
        totalExpenses: 0,
      };

      mockFinancialDataManager.generateFinancialSummary
        .mockResolvedValueOnce(mockCurrentSummary)
        .mockResolvedValueOnce(mockPreviousSummary);

      const summary = await reportService.generateDashboardSummary(mockUserId);

      expect(summary.trends.incomeChange).toBe(100); // From 0 to 5000 should be 100%
      expect(summary.trends.expenseChange).toBe(100); // From 0 to 3000 should be 100%
    });
  });

  describe('generatePDFReport', () => {
    it('should generate PDF content string', async () => {
      const mockReportData = {
        summary: {
          totalIncome: 5000,
          totalExpenses: 3000,
          netAmount: 2000,
          savingsRate: 40,
        },
        healthScore: {
          overall: 75,
          breakdown: [
            { category: 'Savings Rate', score: 80 },
            { category: 'Budget Adherence', score: 90 },
          ],
        },
        expenseBreakdown: [
          { category: 'FOOD', amount: 1500, percentage: 50 },
        ],
        insights: [
          {
            title: 'Test Insight',
            description: 'Test description',
            recommendation: 'Test recommendation',
          },
        ],
        generatedAt: mockDate,
      } as any;

      const options = {
        title: 'Test Report',
        includeHeader: true,
        includeFooter: true,
        pageSize: 'A4' as const,
        orientation: 'portrait' as const,
      };

      const pdfContent = await reportService.generatePDFReport(mockReportData, options);

      expect(typeof pdfContent).toBe('string');
      expect(pdfContent).toContain('FINANCIAL REPORT');
      expect(pdfContent).toContain('Test Report');
      expect(pdfContent).toContain('Total Income: HK$5,000.00');
      expect(pdfContent).toContain('Total Expenses: HK$3,000.00');
      expect(pdfContent).toContain('Overall Score: 75/100');
      expect(pdfContent).toContain('Test Insight');
    });
  });
});