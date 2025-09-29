import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';

// Simple placeholder screens to get the app working
const FarmScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>🌱 Farm</Text>
    <Text style={styles.subtitle}>Interactive farm visualization</Text>
    <Text style={styles.description}>Your farm grows as you save money and reach your financial goals!</Text>
  </View>
);

const IncomeScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>💰 Income</Text>
    <Text style={styles.subtitle}>Track your earnings</Text>
    <Text style={styles.description}>Add income from allowance, chores, gifts, and more!</Text>
  </View>
);

const ExpensesScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>📊 Expenses</Text>
    <Text style={styles.subtitle}>Monitor your spending</Text>
    <Text style={styles.description}>Keep track of where your money goes and stay within budget!</Text>
  </View>
);

const GoalsScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>🎯 Goals</Text>
    <Text style={styles.subtitle}>Set savings targets</Text>
    <Text style={styles.description}>Create goals and watch your progress as your farm goals!</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>⚙️ Settings</Text>
    <Text style={styles.subtitle}>Customize your experience</Text>
    <Text style={styles.description}>Adjust preferences, notifications, and more!</Text>
  </View>
);

const Tab = createBottomTabNavigator();

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Farm" 
        component={FarmScreen}
        options={{
          tabBarLabel: 'Farm',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: 24, color}}>🌱</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Income" 
        component={IncomeScreen}
        options={{
          tabBarLabel: 'Income',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: 24, color}}>💰</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpensesScreen}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: 24, color}}>📊</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsScreen}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: 24, color}}>🎯</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: 24, color}}>📈</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: 24, color}}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});

export default MainNavigator;