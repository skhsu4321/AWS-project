import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {GoalsScreen} from '../screens/goals/GoalsScreen';
import {ExpensesScreen} from '../screens/expenses/ExpensesScreen';
import {IncomeScreen} from '../screens/income/IncomeScreen';
import {FarmScreen} from '../components/farm/FarmScreen';
import {AnalyticsScreen} from '../screens/analytics/AnalyticsScreen';

const Tab = createBottomTabNavigator();

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
        name="Income" 
        component={IncomeScreen}
        options={{
          tabBarLabel: 'Income',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: colorScheme === 'child' ? 28 : 24, color}}>💰</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpensesScreen}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({color}) => (
            <Text style={{fontSize: colorScheme === 'child' ? 28 : 24, color}}>🧹</Text>
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