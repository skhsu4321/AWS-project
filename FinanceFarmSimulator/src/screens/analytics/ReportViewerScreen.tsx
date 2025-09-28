import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { ReportData, ReportService } from '../../services/ReportService';
import { FinancialDataManager } from '../../services/FinancialDataManager';
import { theme } from '../../theme';

interface ReportViewerScreenProps {
  navigation: any;
  route: {
    params: {
      reportData: ReportData;
    };
  };
}

type ViewMode = 'summary' | 'html' | 'data';

export const ReportViewerScreen: React.FC<ReportViewerScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { reportData } = route.params;
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [reportService] = useState(() => new ReportService(new FinancialDataManager()));

  const handleShare = async () => {
    try {
      const htmlContent = reportService.generateHTMLReport(reportData, {
        title: 'Financial Report',
        subtitle: `Generated on ${reportData.generatedAt.toLocaleDateString()}`,
        includeHeader: true,
        includeFooter: true,
        pageSize: 'A4',
        orientation: 'portrait',
      });

      await Share.share({
        message: 'Financial Report',
        title: 'Financial Report',
        // In a real app, you would save the HTML to a file and share the file
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Failed to share report.');
    }
  };

  const handleExport = async () => {
    try {
      const jsonData = reportService.exportReportAsJSON(reportData);
      
      // In a real app, you would save this to device storage
      Alert.alert('Export Complete', 'Report data has been exported.');
      console.log('Exported report data:', jsonData);
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export report.');
    }
  };

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      {([
        { key: 'summary', label: 'Summary' },
        { key: 'html', label: 'Full Report' },
        { key: 'data', label: 'Raw Data' },
      ] as { key: ViewMode; label: string }[]).map((mode) => (
        <TouchableOpacity
          key={mode.key}
          style={[
            styles.viewModeButton,
            viewMode === mode.key && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode(mode.key)}
        >
          <Text
            style={[
              styles.viewModeButtonText,
              viewMode === mode.key && styles.viewModeButtonTextActive,
            ]}
          >
            {mode.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryView = () => {
    const { summary, healthScore, expenseBreakdown, insights } = reportData;

    return (
      <ScrollView style={styles.summaryContainer}>
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>${summary.totalIncome.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Income</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>${summary.totalExpenses.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Expenses</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[
                styles.metricValue,
                { color: summary.netAmount >= 0 ? theme.colors.success : theme.colors.error }
              ]}>
                ${summary.netAmount.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Net Amount</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.savingsRate.toFixed(1)}%</Text>
              <Text style={styles.metricLabel}>Savings Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Health Score</Text>
          <View style={styles.healthScoreContainer}>
            <View style={[
              styles.healthScoreCircle,
              { backgroundColor: getHealthScoreColor(healthScore.overall) }
            ]}>
              <Text style={styles.healthScoreText}>{healthScore.overall}</Text>
            </View>
            <View style={styles.healthBreakdown}>
              {healthScore.breakdown.map((item, index) => (
                <View key={index} style={styles.healthItem}>
                  <Text style={styles.healthItemLabel}>{item.category}</Text>
                  <View style={styles.healthItemBar}>
                    <View 
                      style={[
                        styles.healthItemFill,
                        { 
                          width: `${item.score}%`,
                          backgroundColor: getScoreColor(item.score)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.healthItemScore}>{item.score}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Top Expenses</Text>
          {expenseBreakdown.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.expenseItem}>
              <View style={[styles.expenseColor, { backgroundColor: item.color }]} />
              <Text style={styles.expenseCategory}>{item.category}</Text>
              <Text style={styles.expenseAmount}>${item.amount.toLocaleString()}</Text>
              <Text style={styles.expensePercentage}>{item.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </View>

        {insights.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Key Insights</Text>
            {insights.slice(0, 3).map((insight) => (
              <View key={insight.id} style={[
                styles.insightCard,
                { borderLeftColor: getInsightColor(insight.severity) }
              ]}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                {insight.recommendation && (
                  <Text style={styles.insightRecommendation}>
                    💡 {insight.recommendation}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderHTMLView = () => {
    const htmlContent = reportService.generateHTMLReport(reportData, {
      title: 'Financial Report',
      subtitle: `Generated on ${reportData.generatedAt.toLocaleDateString()}`,
      includeHeader: true,
      includeFooter: true,
      pageSize: 'A4',
      orientation: 'portrait',
    });

    return (
      <WebView
        source={{ html: htmlContent }}
        style={styles.webView}
        scalesPageToFit={true}
        startInLoadingState={true}
      />
    );
  };

  const renderDataView = () => {
    const jsonData = reportService.exportReportAsJSON(reportData);

    return (
      <ScrollView style={styles.dataContainer}>
        <Text style={styles.dataText}>{jsonData}</Text>
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'summary':
        return renderSummaryView();
      case 'html':
        return renderHTMLView();
      case 'data':
        return renderDataView();
      default:
        return renderSummaryView();
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Financial Report</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderViewModeSelector()}
        
        <View style={styles.content}>
          {renderContent()}
        </View>

        <View style={styles.actionButtons}>
          <Button
            title="Share Report"
            onPress={handleShare}
            style={styles.actionButton}
          />
          <Button
            title="Export Data"
            onPress={handleExport}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      </View>
    </Screen>
  );
};

// Helper functions
const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#27AE60';
  if (score >= 60) return '#F39C12';
  return '#E74C3C';
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#27AE60';
  if (score >= 60) return '#F39C12';
  return '#E74C3C';
};

const getInsightColor = (severity: string): string => {
  switch (severity) {
    case 'success': return '#27AE60';
    case 'warning': return '#F39C12';
    case 'danger': return '#E74C3C';
    default: return '#3498DB';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  viewModeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  viewModeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  viewModeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  viewModeButtonText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  viewModeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    flex: 1,
    padding: 16,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  healthScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  healthBreakdown: {
    flex: 1,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthItemLabel: {
    fontSize: 12,
    color: theme.colors.text,
    width: 80,
  },
  healthItemBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  healthItemFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthItemScore: {
    fontSize: 12,
    color: theme.colors.text,
    width: 30,
    textAlign: 'right',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  expenseColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  expenseCategory: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: 12,
  },
  expensePercentage: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
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
  webView: {
    flex: 1,
  },
  dataContainer: {
    flex: 1,
    padding: 16,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: theme.colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flex: 0.45,
  },
});

export default ReportViewerScreen;