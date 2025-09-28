import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {View} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {Screen, Typography} from '../components/common';

const Stack = createStackNavigator();

// Placeholder components - will be implemented in later tasks
const LoginScreen: React.FC = () => {
  const {theme} = useTheme();
  
  return (
    <Screen testID="login-screen">
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Typography variant="h2" color={theme.colors.primary}>
          Login Screen
        </Typography>
        <Typography variant="body1" style={{marginTop: theme.spacing.md}}>
          Authentication interface will be implemented in task 4
        </Typography>
      </View>
    </Screen>
  );
};

const RegisterScreen: React.FC = () => {
  const {theme} = useTheme();
  
  return (
    <Screen testID="register-screen">
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Typography variant="h2" color={theme.colors.primary}>
          Register Screen
        </Typography>
        <Typography variant="body1" style={{marginTop: theme.spacing.md}}>
          Registration interface will be implemented in task 4
        </Typography>
      </View>
    </Screen>
  );
};

export const AuthNavigator: React.FC = () => {
  const {theme} = useTheme();
  
  return (
    <Stack.Navigator
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
        options={{title: 'Welcome Back'}}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{title: 'Create Account'}}
      />
    </Stack.Navigator>
  );
};