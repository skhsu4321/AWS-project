import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import {
  FinancialLineChart,
  FinancialBarChart,
  ExpensePieChart,
  HealthScoreChart,
  TrendComparisonChart,
} from '../../components/analytics/ChartComponents';
import { AnalyticsService, FinancialTrend, CategoryBreakdown, FinancialHealthScore, AnalyticsInsight } from '../../services/AnalyticsService';
import { ReportService, ReportData } from '../../services/ReportService';
import { FinancialDataManager } from '../../services/FinancialDataManager';
import { theme } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

type TimePeriodType = 'weekly' | 'monthly' | 'quarterly';
type ChartType = 'trends' | 'breakdown' | 'health' | 'comparison';

interface AnalyticsScreenProps {
  navigation: any;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriodType>('monthly');
  const [selectedChart, setSelectedChart] = useState<ChartType>('trends');
  
  // Data state
  const [trends, setTrends] = useState<FinancialTrend | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  
  // Services
  const [analyticsService] = useState(() => new AnalyticsService(new FinancialDataManager()));
  const [reportService] = useState(() => new ReportService(new FinancialDataManager()));

  const loadAnalyticsData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const periodCount = selectedPeriod === 'weekly' ? 8 : selectedPeriod === 'monthly' ? 6 : 4;
      const periodType = selectedPeriod === 'weekly' ? 'weekly' : 'monthly';

      const [
        trendsData,
        breakdownData,
        healthData,
        insightsData,
      ] = await Promise.all([
        analyticsService.generateFinancialTrends(user.id, periodCount, periodType),
        analyticsService.generateExpenseBreakdown(user.id),
        analyticsService.calculateFinancialHealthScore(user.id),
        analyticsService.generateInsights(user.id),
      ]);

      setTrends(trendsData);
      setExpenseBreakdown(breakdownData);
      setHealthScore(healthData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedPeriod, analyticsService]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  }, [loadAnalyticsData]);

  const handleGenerateReport = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const reportData = await reportService.generateReport({
        userId: user.id,
        reportType: selectedPeriod,
        includeCharts: true,
        includeInsights: true,
        includeRecommendations: true,
        format: 'pdf',
      });

      // Navigate to report screen or show report
      navigation.navigate('ReportViewer', { reportData });
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      const reportData = await reportService.generateReport({
        userId: user.id,
        reportType: selectedPeriod,
        includeCharts: false,
        includeInsights: true,
        includeRecommendations: true,
        format: 'json',
      });

      const jsonData = reportService.exportReportAsJSON(reportData);
      
      // In a real app, you would save this to device storage or share it
      Alert.alert('Export Complete', 'Data has been exported successfully.');
      console.log('Exported data:', jsonData);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['weekly', 'monthly', 'quarterly'] as TimePeriodType[]).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChartSelector = () => (
    <View style={styles.chartSelector}>
      {([
        { key: 'trends', label: 'Trends' },
        { key: 'breakdown', label: 'Breakdown' },
        { key: 'health', label: 'Health' },
        { key: 'comparison', label: 'Compare' },
      ] as { key: ChartType; label: string }[]).map((chart) => (
        <TouchableOpacity
          key={chart.key}
          style={[
            styles.chartButton,
            selectedChart === chart.key && styles.chartButtonActive,
          ]}
          onPress={() => setSelectedChart(chart.key)}
        >
          <Text
            style={[
              styles.chartButtonText,
              selectedChart === chart.key && styles.chartButtonTextActive,
            ]}
          >
            {chart.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChart = () => {
    if (!trends || !healthScore) return null;

    switch (selectedChart) {
      case 'trends':
        return (
          <FinancialLineChart
            data={trends.savingsRate}
            title="Savings Rate Trend"
            color={theme.colors.success}
            suffix="%"
          />
        );
      case 'breakdown':
        return (
          <ExpensePieChart
            data={expenseBreakdown}
            title="Expense Breakdown"
          />
        );
      case 'health':
        return (
          <HealthScoreChart
            healthScore={healthScore}
            title="Financial Health Score"
          />
        );
      case 'comparison':
        return (
          <TrendComparisonChart
            incomeData={trends.income}
            expenseData={trends.expenses}
            title="Income vs Expenses"
          />
        );
      default:
        return null;
    }
  };

  const renderInsights = () => (
    <View style={styles.insightsContainer}>
      <Text style={styles.sectionTitle}>Insights & Recommendations</Text>
      {insights.length === 0 ? (
        <View style={styles.noInsights}>
          <Text style={styles.noInsightsText}>No insights available yet.</Text>
          <Text style={styles.noInsightsSubtext}>
            Keep logging your financial activities to get personalized insights!
          </Text>
        </View>
      ) : (
        insights.slice(0, 3).map((insight) => (
          <View key={insight.id} style={[styles.insightCard, styles[`insight${insight.severity}`]]}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <View style={[styles.severityBadge, styles[`severity${insight.severity}`]]}>
                <Text style={styles.severityText}>{insight.severity.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            {insight.recommendation && (
              <Text style={styles.insightRecommendation}>
                💡 {insight.recommendation}
              </Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderQuickStats = () => {
    if (!healthScore) return null;

    return (
      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{healthScore.overall}/100</Text>
          <Text style={styles.statLabel}>Health Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{healthScore.savingsRate}/100</Text>
          <Text style={styles.statLabel}>Savings Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{healthScore.goalProgress}/100</Text>
          <Text style={styles.statLabel}>Goal Progress</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Financial Analytics</Text>
          <Text style={styles.subtitle}>Track your financial progress</Text>
        </View>

        {renderQuickStats()}
        {renderPeriodSelector()}
        {renderChartSelector()}
        {renderChart()}
        {renderInsights()}

        <View style={styles.actionButtons}>
          <Button
            title="Generate Report"
            onPress={handleGenerateReport}
            style={styles.actionButton}
          />
          <Button
            title="Export Data"
            onPress={handleExportData}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  chartSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chartButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  chartButtonActive: {
    backgroundColor: theme.colors.secondary,
  },
  chartButtonText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  chartButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  insightsContainer: {
    padding: 20,
  },
  noInsights: {
    alignItems: 'center',
    padding: 40,
  },
  noInsightsText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  noInsightsSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  insightCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  insightinfo: {
    borderLeftColor: theme.colors.info,
  },
  insightwarning: {
    borderLeftColor: theme.colors.warning,
  },
  insightsuccess: {
    borderLeftColor: theme.colors.success,
  },
  insightdanger: {
    borderLeftColor: theme.colors.error,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityinfo: {
    backgroundColor: theme.colors.info,
  },
  severitywarning: {
    backgroundColor: theme.colors.warning,
  },
  severitysuccess: {
    backgroundColor: theme.colors.success,
  },
  severitydanger: {
    backgroundColor: theme.colors.error,
  },
  severityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  insightRecommendation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    flex: 0.45,
  },
});

export default AnalyticsScreen;