import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {Screen, Typography} from '../components/common';

const Tab = createBottomTabNavigator();

// Placeholder components - will be implemented in later tasks
const FarmScreen: React.FC = () => {
  const {theme} = useTheme();
  
  return (
    <Screen testID="farm-screen">
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Typography variant="h2" color={theme.colors.primary}>
          🌱 Farm Dashboard
        </Typography>
        <Typography variant="body1" style={{marginTop: theme.spacing.md, textAlign: 'center'}}>
          Interactive farm visualization will be implemented in task 9
        </Typography>
      </View>
    </Screen>
  );
};

const GoalsScreen: React.FC = () => {
  const {theme} = useTheme();
  
  return (
    <Screen testID="goals-screen">
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Typography variant="h2" color={theme.colors.primary}>
          🎯 Savings Goals
        </Typography>
        <Typography variant="body1" style={{marginTop: theme.spacing.md, textAlign: 'center'}}>
          Goal management interface will be implemented in task 10
        </Typography>
      </View>
    </Screen>
  );
};

const ExpensesScreen: React.FC = () => {
  const {theme} = useTheme();
  
  return (
    <Screen testID="expenses-screen">
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Typography variant="h2" color={theme.colors.primary}>
          💰 Expense Tracking
        </Typography>
        <Typography variant="body1" style={{marginTop: theme.spacing.md, textAlign: 'center'}}>
          Expense tracking interface will be implemented in task 11
        </Typography>
      </View>
    </Screen>
  );
};

const AnalyticsScreen: React.FC = () => {
  const {theme} = useTheme();
  
  return (
    <Screen testID="analytics-screen">
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Typography variant="h2" color={theme.colors.primary}>
          📊 Analytics
        </Typography>
        <Typography variant="body1" style={{marginTop: theme.spacing.md, textAlign: 'center'}}>
          Analytics dashboard will be implemented in task 14
        </Typography>
      </View>
    </Screen>
  );
};

export const MainNavigator: React.FC = () => {
  const {theme, colorScheme} = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          height: theme.dimensions.component.tabBarHeight,
          paddingBottom: colorScheme === 'child' ? theme.spacing.sm : theme.spacing.xs,
          paddingTop: theme.spacing.xs,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontSize: colorScheme === 'child' ? 14 : 12,
        },
        tabBarIconStyle: {
          marginBottom: colorScheme === 'child' ? theme.spacing.xs : 0,
        },
      }}
    >
      <Tab.Screen 
        name="Farm" 
        component={FarmScreen}
        options={{
          tabBarLabel: 'Farm',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: colorScheme === 'child' ? 28 : 24, color}}>🌱</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsScreen}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: colorScheme === 'child' ? 28 : 24, color}}>🎯</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpensesScreen}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: colorScheme === 'child' ? 28 : 24, color}}>💰</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: colorScheme === 'child' ? 28 : 24, color}}>📊</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};