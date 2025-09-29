import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
} from 'react-native-chart-kit';
import { TrendData, CategoryBreakdown, FinancialHealthScore } from '../../services/AnalyticsService';
// Simple theme for chart components
const theme = {
  colors: {
    primary: '#2E7D32',
    secondary: '#FF8F00',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#1C1B1F',
  },
};

const screenWidth = Dimensions.get('window').width;

interface LineChartProps {
  data: TrendData[];
  title: string;
  color?: string;
  suffix?: string;
}

export const FinancialLineChart: React.FC<LineChartProps> = ({ 
  data, 
  title, 
  color = theme.colors.primary,
  suffix = ''
}) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        color: (opacity = 1) => color,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 205, 196, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: color,
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (suffix === '%') return `${num.toFixed(1)}%`;
      if (suffix === 'HKD') return `$${num.toLocaleString()}`;
      return num.toLocaleString();
    },
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

interface BarChartProps {
  data: { label: string; value: number }[];
  title: string;
  color?: string;
}

export const FinancialBarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  color = theme.colors.secondary 
}) => {
  const chartData = {
    labels: data.map(item => item.label.substring(0, 8)), // Truncate labels
    datasets: [
      {
        data: data.map(item => item.value),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => color,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      return `$${num.toLocaleString()}`;
    },
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <BarChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
        yAxisLabel="$"
        yAxisSuffix=""
        showValuesOnTopOfBars
      />
    </View>
  );
};

interface PieChartProps {
  data: CategoryBreakdown[];
  title: string;
}

export const ExpensePieChart: React.FC<PieChartProps> = ({ data, title }) => {
  const pieData = data.map((item, index) => ({
    name: item.category,
    amount: item.amount,
    color: item.color,
    legendFontColor: theme.colors.text,
    legendFontSize: 12,
  }));

  const chartConfig = {
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <PieChart
        data={pieData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 10]}
        absolute
      />
    </View>
  );
};

interface HealthScoreChartProps {
  healthScore: FinancialHealthScore;
  title: string;
}

export const HealthScoreChart: React.FC<HealthScoreChartProps> = ({ 
  healthScore, 
  title 
}) => {
  const progressData = {
    labels: healthScore.breakdown.map(item => item.category.split(' ')[0]), // First word only
    data: healthScore.breakdown.map(item => item.score / 100),
  };

  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    color: (opacity = 1) => {
      // Color based on overall score
      if (healthScore.overall >= 80) return `rgba(39, 174, 96, ${opacity})`;
      if (healthScore.overall >= 60) return `rgba(243, 156, 18, ${opacity})`;
      return `rgba(231, 76, 60, ${opacity})`;
    },
    labelColor: (opacity = 1) => theme.colors.text,
    strokeWidth: 2,
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.healthScoreHeader}>
        <View style={[
          styles.overallScore,
          { backgroundColor: getHealthScoreColor(healthScore.overall) }
        ]}>
          <Text style={styles.overallScoreText}>{healthScore.overall}</Text>
          <Text style={styles.overallScoreLabel}>Overall Score</Text>
        </View>
      </View>
      <ProgressChart
        data={progressData}
        width={screenWidth - 40}
        height={220}
        strokeWidth={16}
        radius={32}
        chartConfig={chartConfig}
        hideLegend={false}
      />
    </View>
  );
};

interface TrendComparisonProps {
  incomeData: TrendData[];
  expenseData: TrendData[];
  title: string;
}

export const TrendComparisonChart: React.FC<TrendComparisonProps> = ({ 
  incomeData, 
  expenseData, 
  title 
}) => {
  const chartData = {
    labels: incomeData.map(item => item.label),
    datasets: [
      {
        data: incomeData.map(item => item.value),
        color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`, // Green for income
        strokeWidth: 3,
      },
      {
        data: expenseData.map(item => item.value),
        color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`, // Red for expenses
        strokeWidth: 3,
      },
    ],
    legend: ['Income', 'Expenses'],
  };

  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 205, 196, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      return `$${num.toLocaleString()}`;
    },
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

// Helper function to get health score color
const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#27AE60'; // Green
  if (score >= 60) return '#F39C12'; // Orange
  return '#E74C3C'; // Red
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  healthScoreHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  overallScore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  overallScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  overallScoreLabel: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
  },
});

export default {
  FinancialLineChart,
  FinancialBarChart,
  ExpensePieChart,
  HealthScoreChart,
  TrendComparisonChart,
};