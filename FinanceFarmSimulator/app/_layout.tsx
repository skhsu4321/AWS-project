import React from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import { AppIntegration } from '../src/components/integration/AppIntegration';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppIntegration>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </AppIntegration>
    </Provider>
  );
}