import { FinancialSummary, TimePeriod } from '../models/Financial';
import { AnalyticsService, FinancialTrend, CategoryBreakdown, FinancialHealthScore, AnalyticsInsight } from './AnalyticsService';
import { FinancialDataManager } from './FinancialDataManager';

export interface ReportData {
  summary: FinancialSummary;
  trends: FinancialTrend;
  expenseBreakdown: CategoryBreakdown[];
  healthScore: FinancialHealthScore;
  insights: AnalyticsInsight[];
  generatedAt: Date;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
    type: TimePeriod;
  };
}

export interface ReportConfig {
  userId: string;
  reportType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  includeCharts: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
  format: 'pdf' | 'json';
}

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  includeHeader: boolean;
  includeFooter: boolean;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}

export class ReportService {
  private analyticsService: AnalyticsService;
  private financialDataManager: FinancialDataManager;

  constructor(financialDataManager: FinancialDataManager) {
    this.financialDataManager = financialDataManager;
    this.analyticsService = new AnalyticsService(financialDataManager);
  }

  /**
   * Generate comprehensive financial report
   */
  public async generateReport(config: ReportConfig): Promise<ReportData> {
    const { userId, reportType } = config;
    const reportPeriod = this.calculateReportPeriod(reportType);

    // Generate all report components in parallel
    const [
      summary,
      trends,
      expenseBreakdown,
      healthScore,
      insights
    ] = await Promise.all([
      this.financialDataManager.generateFinancialSummary(userId, reportPeriod),
      this.analyticsService.generateFinancialTrends(userId, this.getTrendPeriods(reportType), this.getTrendType(reportType)),
      this.analyticsService.generateExpenseBreakdown(userId, {
        startDate: reportPeriod.startDate,
        endDate: reportPeriod.endDate
      }),
      this.analyticsService.calculateFinancialHealthScore(userId),
      config.includeInsights ? this.analyticsService.generateInsights(userId) : []
    ]);

    return {
      summary,
      trends,
      expenseBreakdown,
      healthScore,
      insights,
      generatedAt: new Date(),
      reportPeriod
    };
  }

  /**
   * Generate PDF report (placeholder - would use react-native-pdf-lib in real implementation)
   */
  public async generatePDFReport(
    reportData: ReportData, 
    options: PDFReportOptions
  ): Promise<string> {
    // This is a simplified implementation
    // In a real app, you would use react-native-pdf-lib or similar
    
    const pdfContent = this.generatePDFContent(reportData, options);
    
    // For now, return the content as a string
    // In production, this would generate an actual PDF file
    return pdfContent;
  }

  /**
   * Generate HTML content for PDF or web display
   */
  public generateHTMLReport(reportData: ReportData, options: PDFReportOptions): string {
    const { summary, trends, expenseBreakdown, healthScore, insights, reportPeriod } = reportData;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${options.title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
            line-height: 1.6;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #4ECDC4; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .section { 
            margin-bottom: 30px; 
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        .section h2 { 
            color: #2C3E50; 
            border-bottom: 1px solid #BDC3C7;
            padding-bottom: 10px;
        }
        .metric { 
            display: inline-block; 
            margin: 10px 20px 10px 0; 
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            min-width: 150px;
        }
        .metric-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #27AE60;
        }
        .metric-label { 
            font-size: 12px; 
            color: #7F8C8D; 
            text-transform: uppercase;
        }
        .negative { color: #E74C3C; }
        .warning { color: #F39C12; }
        .success { color: #27AE60; }
        .info { color: #3498DB; }
        .insight { 
            padding: 15px; 
            margin: 10px 0; 
            border-left: 4px solid #3498DB;
            background: #f8f9fa;
        }
        .insight.warning { border-left-color: #F39C12; }
        .insight.danger { border-left-color: #E74C3C; }
        .insight.success { border-left-color: #27AE60; }
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        .breakdown-bar {
            height: 20px;
            background: #ecf0f1;
            border-radius: 10px;
            overflow: hidden;
            flex: 1;
            margin: 0 15px;
        }
        .breakdown-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        .health-score {
            text-align: center;
            padding: 20px;
        }
        .health-score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: bold;
            color: white;
        }
        .score-excellent { background: #27AE60; }
        .score-good { background: #F39C12; }
        .score-poor { background: #E74C3C; }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #BDC3C7; 
            color: #7F8C8D;
            font-size: 12px;
        }
    </style>
</head>
<body>
    ${options.includeHeader ? `
    <div class="header">
        <h1>${options.title}</h1>
        ${options.subtitle ? `<p>${options.subtitle}</p>` : ''}
        <p>Report Period: ${reportPeriod.startDate.toLocaleDateString()} - ${reportPeriod.endDate.toLocaleDateString()}</p>
    </div>
    ` : ''}

    <div class="section">
        <h2>Financial Summary</h2>
        <div class="metric">
            <div class="metric-value ${summary.totalIncome > 0 ? 'success' : ''}">${this.formatCurrency(summary.totalIncome)}</div>
            <div class="metric-label">Total Income</div>
        </div>
        <div class="metric">
            <div class="metric-value ${summary.totalExpenses > 0 ? 'warning' : ''}">${this.formatCurrency(summary.totalExpenses)}</div>
            <div class="metric-label">Total Expenses</div>
        </div>
        <div class="metric">
            <div class="metric-value ${summary.netAmount >= 0 ? 'success' : 'negative'}">${this.formatCurrency(summary.netAmount)}</div>
            <div class="metric-label">Net Amount</div>
        </div>
        <div class="metric">
            <div class="metric-value ${summary.savingsRate >= 10 ? 'success' : summary.savingsRate >= 5 ? 'warning' : 'negative'}">${summary.savingsRate.toFixed(1)}%</div>
            <div class="metric-label">Savings Rate</div>
        </div>
    </div>

    <div class="section">
        <h2>Financial Health Score</h2>
        <div class="health-score">
            <div class="health-score-circle ${this.getHealthScoreClass(healthScore.overall)}">
                ${healthScore.overall}/100
            </div>
            <p>Your overall financial health is ${this.getHealthScoreDescription(healthScore.overall)}</p>
        </div>
        <div>
            ${healthScore.breakdown.map(item => `
                <div class="breakdown-item">
                    <span>${item.category}</span>
                    <div class="breakdown-bar">
                        <div class="breakdown-fill ${this.getScoreClass(item.score)}" style="width: ${item.score}%; background: ${this.getScoreColor(item.score)};"></div>
                    </div>
                    <span>${item.score}/100</span>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>Expense Breakdown</h2>
        ${expenseBreakdown.map(item => `
            <div class="breakdown-item">
                <span>${item.category}</span>
                <div class="breakdown-bar">
                    <div class="breakdown-fill" style="width: ${item.percentage}%; background: ${item.color};"></div>
                </div>
                <span>${this.formatCurrency(item.amount)} (${item.percentage.toFixed(1)}%)</span>
            </div>
        `).join('')}
    </div>

    ${insights.length > 0 ? `
    <div class="section">
        <h2>Insights & Recommendations</h2>
        ${insights.map(insight => `
            <div class="insight ${insight.severity}">
                <h3>${insight.title}</h3>
                <p>${insight.description}</p>
                ${insight.recommendation ? `<p><strong>Recommendation:</strong> ${insight.recommendation}</p>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${options.includeFooter ? `
    <div class="footer">
        <p>Generated on ${reportData.generatedAt.toLocaleString()}</p>
        <p>Finance Farm Simulator - Your Financial Growth Partner</p>
    </div>
    ` : ''}
</body>
</html>`;

    return html;
  }

  /**
   * Export report data as JSON
   */
  public exportReportAsJSON(reportData: ReportData): string {
    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Generate summary statistics for dashboard
   */
  public async generateDashboardSummary(userId: string): Promise<{
    currentMonth: FinancialSummary;
    previousMonth: FinancialSummary;
    trends: {
      incomeChange: number;
      expenseChange: number;
      savingsRateChange: number;
    };
    topCategories: CategoryBreakdown[];
    healthScore: number;
    urgentInsights: AnalyticsInsight[];
  }> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      currentMonth,
      previousMonth,
      topCategories,
      healthScore,
      allInsights
    ] = await Promise.all([
      this.financialDataManager.generateFinancialSummary(userId, {
        type: 'monthly',
        startDate: currentMonthStart,
        endDate: now
      }),
      this.financialDataManager.generateFinancialSummary(userId, {
        type: 'monthly',
        startDate: previousMonthStart,
        endDate: previousMonthEnd
      }),
      this.analyticsService.generateExpenseBreakdown(userId, {
        startDate: currentMonthStart,
        endDate: now
      }),
      this.analyticsService.calculateFinancialHealthScore(userId),
      this.analyticsService.generateInsights(userId)
    ]);

    const trends = {
      incomeChange: this.calculatePercentageChange(previousMonth.totalIncome, currentMonth.totalIncome),
      expenseChange: this.calculatePercentageChange(previousMonth.totalExpenses, currentMonth.totalExpenses),
      savingsRateChange: currentMonth.savingsRate - previousMonth.savingsRate
    };

    const urgentInsights = allInsights.filter(insight => 
      insight.severity === 'warning' || insight.severity === 'danger'
    ).slice(0, 3);

    return {
      currentMonth,
      previousMonth,
      trends,
      topCategories: topCategories.slice(0, 5),
      healthScore: healthScore.overall,
      urgentInsights
    };
  }

  // Private helper methods
  private calculateReportPeriod(reportType: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): TimePeriod {
    const now = new Date();
    let startDate: Date;
    let type: TimePeriod;

    switch (reportType) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        type = 'weekly';
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        type = 'monthly';
        break;
      case 'quarterly':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        type = 'monthly';
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        type = 'yearly';
        break;
    }

    return {
      type,
      startDate,
      endDate: now
    };
  }

  private getTrendPeriods(reportType: string): number {
    switch (reportType) {
      case 'weekly': return 8;
      case 'monthly': return 6;
      case 'quarterly': return 4;
      case 'yearly': return 3;
      default: return 6;
    }
  }

  private getTrendType(reportType: string): 'monthly' | 'weekly' {
    return reportType === 'weekly' ? 'weekly' : 'monthly';
  }

  private generatePDFContent(reportData: ReportData, options: PDFReportOptions): string {
    // This would generate actual PDF content using a PDF library
    // For now, return a text representation
    const { summary, healthScore, expenseBreakdown, insights } = reportData;
    
    return `
FINANCIAL REPORT
${options.title}
Generated: ${reportData.generatedAt.toLocaleDateString()}

SUMMARY
=======
Total Income: ${this.formatCurrency(summary.totalIncome)}
Total Expenses: ${this.formatCurrency(summary.totalExpenses)}
Net Amount: ${this.formatCurrency(summary.netAmount)}
Savings Rate: ${summary.savingsRate.toFixed(1)}%

HEALTH SCORE
============
Overall Score: ${healthScore.overall}/100
${healthScore.breakdown.map(item => 
  `${item.category}: ${item.score}/100`
).join('\n')}

EXPENSE BREAKDOWN
================
${expenseBreakdown.map(item => 
  `${item.category}: ${this.formatCurrency(item.amount)} (${item.percentage.toFixed(1)}%)`
).join('\n')}

INSIGHTS
========
${insights.map(insight => 
  `${insight.title}: ${insight.description}${insight.recommendation ? '\nRecommendation: ' + insight.recommendation : ''}`
).join('\n\n')}
`;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD'
    }).format(amount);
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  private getHealthScoreClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
  }

  private getHealthScoreDescription(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'needs improvement';
  }

  private getScoreClass(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'negative';
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#27AE60';
    if (score >= 60) return '#F39C12';
    return '#E74C3C';
  }
}