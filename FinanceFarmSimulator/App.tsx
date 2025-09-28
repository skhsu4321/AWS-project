import React from 'react';
import {StatusBar} from 'expo-status-bar';
import {Provider} from 'react-redux';
import {store} from './src/store/store';
import {AppNavigator} from './src/navigation/AppNavigator';
import {AppIntegration} from './src/components/integration/AppIntegration';
import 'react-native-gesture-handler';

export default function App() {
  return (
    <Provider store={store}>
      <AppIntegration>
        <AppNavigator />
        <StatusBar style="auto" />
      </AppIntegration>
    </Provider>
  );
}
