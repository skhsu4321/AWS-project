import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AnalyticsScreen } from '../../../screens/analytics/AnalyticsScreen';
import { ReportViewerScreen } from '../../../screens/analytics/ReportViewerScreen';
import { AnalyticsService } from '../../../services/AnalyticsService';
import { ReportService } from '../../../services/ReportService';
import { useAuth } from '../../../hooks/useAuth';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../services/AnalyticsService');
jest.mock('../../../services/ReportService');
jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
  PieChart: 'PieChart',
  ProgressChart: 'ProgressChart',
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('Analytics Integration Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    profile: {
      displayName: 'Test User',
      age: 25,
      mode: 'adult' as const,
      currency: 'HKD',
      timezone: 'Asia/Hong_Kong',
    },
  };

  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
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
      generatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock AnalyticsService methods
    const mockAnalyticsService = {
      generateFinancialTrends: jest.fn().mockResolvedValue(mockTrends),
      generateExpenseBreakdown: jest.fn().mockResolvedValue(mockExpenseBreakdown),
      calculateFinancialHealthScore: jest.fn().mockResolvedValue(mockHealthScore),
      generateInsights: jest.fn().mockResolvedValue(mockInsights),
    };

    (AnalyticsService as jest.Mock).mockImplementation(() => mockAnalyticsService);

    // Mock ReportService methods
    const mockReportService = {
      generateReport: jest.fn().mockResolvedValue({
        summary: {
          userId: mockUser.id,
          totalIncome: 5000,
          totalExpenses: 3000,
          netAmount: 2000,
          savingsRate: 40,
        },
        trends: mockTrends,
        expenseBreakdown: mockExpenseBreakdown,
        healthScore: mockHealthScore,
        insights: mockInsights,
        generatedAt: new Date(),
        reportPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          type: 'monthly' as const,
        },
      }),
      exportReportAsJSON: jest.fn().mockReturnValue('{"test": "data"}'),
    };

    (ReportService as jest.Mock).mockImplementation(() => mockReportService);

    // Clear navigation mocks
    mockNavigation.navigate.mockClear();
    mockNavigation.goBack.mockClear();
  });

  describe('AnalyticsScreen', () => {
    it('should render analytics screen with loading state initially', async () => {
      const { getByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      expect(getByText('Loading analytics...')).toBeTruthy();
    });

    it('should load and display analytics data', async () => {
      const { getByText, queryByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      // Check if main elements are rendered
      expect(getByText('Financial Analytics')).toBeTruthy();
      expect(getByText('Track your financial progress')).toBeTruthy();
      expect(getByText('75/100')).toBeTruthy(); // Health score
      expect(getByText('Health Score')).toBeTruthy();
    });

    it('should handle period selection', async () => {
      const { getByText, queryByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      // Test period selector
      const weeklyButton = getByText('Weekly');
      const monthlyButton = getByText('Monthly');
      const quarterlyButton = getByText('Quarterly');

      expect(weeklyButton).toBeTruthy();
      expect(monthlyButton).toBeTruthy();
      expect(quarterlyButton).toBeTruthy();

      // Click weekly button
      fireEvent.press(weeklyButton);

      // Should reload data with new period
      await waitFor(() => {
        expect(AnalyticsService.prototype.generateFinancialTrends).toHaveBeenCalledWith(
          mockUser.id,
          8, // 8 periods for weekly
          'weekly'
        );
      });
    });

    it('should handle chart type selection', async () => {
      const { getByText, queryByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      // Test chart selector
      const trendsButton = getByText('Trends');
      const breakdownButton = getByText('Breakdown');
      const healthButton = getByText('Health');
      const compareButton = getByText('Compare');

      expect(trendsButton).toBeTruthy();
      expect(breakdownButton).toBeTruthy();
      expect(healthButton).toBeTruthy();
      expect(compareButton).toBeTruthy();

      // Click breakdown button
      fireEvent.press(breakdownButton);

      // Should show expense breakdown chart
      // Note: In a real test, you'd check for the actual chart component
    });

    it('should display insights correctly', async () => {
      const { getByText, queryByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      // Check insights section
      expect(getByText('Insights & Recommendations')).toBeTruthy();
      expect(getByText('Food Spending Increasing')).toBeTruthy();
      expect(getByText('Your food expenses have been trending upward')).toBeTruthy();
      expect(getByText('💡 Consider meal planning to reduce food costs')).toBeTruthy();
    });

    it('should handle generate report button', async () => {
      const { getByText, queryByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      const generateReportButton = getByText('Generate Report');
      
      await act(async () => {
        fireEvent.press(generateReportButton);
      });

      await waitFor(() => {
        expect(ReportService.prototype.generateReport).toHaveBeenCalledWith({
          userId: mockUser.id,
          reportType: 'monthly',
          includeCharts: true,
          includeInsights: true,
          includeRecommendations: true,
          format: 'pdf',
        });
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ReportViewer', {
        reportData: expect.any(Object),
      });
    });

    it('should handle export data button', async () => {
      const { getByText, queryByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      const exportDataButton = getByText('Export Data');
      
      await act(async () => {
        fireEvent.press(exportDataButton);
      });

      await waitFor(() => {
        expect(ReportService.prototype.generateReport).toHaveBeenCalled();
        expect(ReportService.prototype.exportReportAsJSON).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Export Complete', 'Data has been exported successfully.');
      });
    });

    it('should handle refresh functionality', async () => {
      const { getByTestId, queryByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      // Simulate pull to refresh
      const scrollView = getByTestId('analytics-scroll-view');
      
      await act(async () => {
        fireEvent(scrollView, 'refresh');
      });

      // Should reload all analytics data
      await waitFor(() => {
        expect(AnalyticsService.prototype.generateFinancialTrends).toHaveBeenCalled();
        expect(AnalyticsService.prototype.generateExpenseBreakdown).toHaveBeenCalled();
        expect(AnalyticsService.prototype.calculateFinancialHealthScore).toHaveBeenCalled();
        expect(AnalyticsService.prototype.generateInsights).toHaveBeenCalled();
      });
    });

    it('should handle no insights state', async () => {
      // Mock empty insights
      const mockAnalyticsServiceWithNoInsights = {
        generateFinancialTrends: jest.fn().mockResolvedValue(mockTrends),
        generateExpenseBreakdown: jest.fn().mockResolvedValue(mockExpenseBreakdown),
        calculateFinancialHealthScore: jest.fn().mockResolvedValue(mockHealthScore),
        generateInsights: jest.fn().mockResolvedValue([]),
      };

      (AnalyticsService as jest.Mock).mockImplementation(() => mockAnalyticsServiceWithNoInsights);

      const { getByText, queryByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      expect(getByText('No insights available yet.')).toBeTruthy();
      expect(getByText('Keep logging your financial activities to get personalized insights!')).toBeTruthy();
    });

    it('should handle error states', async () => {
      // Mock service to throw error
      const mockAnalyticsServiceWithError = {
        generateFinancialTrends: jest.fn().mockRejectedValue(new Error('Network error')),
        generateExpenseBreakdown: jest.fn().mockRejectedValue(new Error('Network error')),
        calculateFinancialHealthScore: jest.fn().mockRejectedValue(new Error('Network error')),
        generateInsights: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (AnalyticsService as jest.Mock).mockImplementation(() => mockAnalyticsServiceWithError);

      const { queryByText } = render(
        <AnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load analytics data. Please try again.');
    });
  });

  describe('ReportViewerScreen', () => {
    const mockReportData = {
      summary: {
        userId: mockUser.id,
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
        generatedAt: new Date(),
      },
      trends: mockTrends,
      expenseBreakdown: mockExpenseBreakdown,
      healthScore: mockHealthScore,
      insights: mockInsights,
      generatedAt: new Date(),
      reportPeriod: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        type: 'monthly' as const,
      },
    };

    const mockRoute = {
      params: {
        reportData: mockReportData,
      },
    };

    it('should render report viewer with summary view by default', () => {
      const { getByText } = render(
        <ReportViewerScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Financial Report')).toBeTruthy();
      expect(getByText('Summary')).toBeTruthy();
      expect(getByText('Financial Summary')).toBeTruthy();
      expect(getByText('$5,000')).toBeTruthy(); // Total income
      expect(getByText('$3,000')).toBeTruthy(); // Total expenses
      expect(getByText('$2,000')).toBeTruthy(); // Net amount
      expect(getByText('40.0%')).toBeTruthy(); // Savings rate
    });

    it('should switch between view modes', () => {
      const { getByText } = render(
        <ReportViewerScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Test view mode selector
      const summaryButton = getByText('Summary');
      const fullReportButton = getByText('Full Report');
      const rawDataButton = getByText('Raw Data');

      expect(summaryButton).toBeTruthy();
      expect(fullReportButton).toBeTruthy();
      expect(rawDataButton).toBeTruthy();

      // Click full report button
      fireEvent.press(fullReportButton);

      // Should show HTML view (WebView)
      // Note: WebView testing is limited in Jest environment

      // Click raw data button
      fireEvent.press(rawDataButton);

      // Should show JSON data
      // The actual JSON content would be displayed in a ScrollView
    });

    it('should display health score correctly', () => {
      const { getByText } = render(
        <ReportViewerScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Health Score')).toBeTruthy();
      expect(getByText('75')).toBeTruthy(); // Overall score
      expect(getByText('Savings Rate')).toBeTruthy();
      expect(getByText('Budget Adherence')).toBeTruthy();
    });

    it('should display expense breakdown', () => {
      const { getByText } = render(
        <ReportViewerScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Top Expenses')).toBeTruthy();
      expect(getByText('FOOD')).toBeTruthy();
      expect(getByText('TRANSPORT')).toBeTruthy();
      expect(getByText('$1,500')).toBeTruthy(); // Food amount
      expect(getByText('50.0%')).toBeTruthy(); // Food percentage
    });

    it('should display insights', () => {
      const { getByText } = render(
        <ReportViewerScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Key Insights')).toBeTruthy();
      expect(getByText('Food Spending Increasing')).toBeTruthy();
      expect(getByText('Your food expenses have been trending upward')).toBeTruthy();
      expect(getByText('💡 Consider meal planning to reduce food costs')).toBeTruthy();
    });

    it('should handle back navigation', () => {
      const { getByText } = render(
        <ReportViewerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const backButton = getByText('← Back');
      fireEvent.press(backButton);

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should handle share report', async () => {
      const { getByText } = render(
        <ReportViewerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const shareButton = getByText('Share Report');
      
      await act(async () => {
        fireEvent.press(shareButton);
      });

      // Note: Share functionality would be tested with proper mocking of Share API
      // For now, we just verify the button exists and can be pressed
    });

    it('should handle export data', async () => {
      const { getByText } = render(
        <ReportViewerScreen navigation={mockNavigation} route={mockRoute} />
      );

      const exportButton = getByText('Export Data');
      
      await act(async () => {
        fireEvent.press(exportButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Export Complete', 'Report data has been exported.');
      });
    });
  });
});