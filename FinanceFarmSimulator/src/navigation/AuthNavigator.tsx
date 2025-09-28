import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../contexts/ThemeContext';
import {Typography} from '../components/common';
import {LoginScreen, RegisterScreen} from '../screens/auth';

const Stack = createStackNavigator();

export const AuthNavigator: React.FC = () => {
  const {theme} = useTheme();
  
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          ...theme.typography.h4,
          color: theme.colors.onSurface,
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={({navigation}) => ({
          title: 'Welcome Back',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={{marginRight: theme.spacing.md}}
            >
              <Typography 
                variant="button" 
                color={theme.colors.primary}
                style={{fontSize: 14}}
              >
                Sign Up
              </Typography>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          title: 'Create Account',
          headerBackTitle: 'Login',
        }}
      />
    </Stack.Navigator>
  );
};