import React from 'react';
import {StatusBar} from 'expo-status-bar';
import {Provider} from 'react-redux';
import {store} from './src/store/store';
import {AppNavigator} from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
      <StatusBar style="auto" />
    </Provider>
  );
}
