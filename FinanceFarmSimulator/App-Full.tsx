import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { store } from './src/store/store';
import MainNavigator from './src/navigation/MainNavigator';
import ErrorBoundary from './src/components/integration/ErrorBoundary';
import { LoggingService } from './src/services/LoggingService';

// Initialize logging
LoggingService.initialize();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ErrorBoundary>
            <NavigationContainer>
              <MainNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </ErrorBoundary>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});