import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {RootState} from '../store/store';
import {ThemeProvider} from '../contexts/ThemeContext';
import {AuthNavigator} from './AuthNavigator';
import {MainNavigator} from './MainNavigator';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
};