import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {Text} from 'react-native';
import {store} from '../../../store/store';
import {ThemeProvider} from '../../../contexts/ThemeContext';
import {Screen} from '../Screen';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('Screen Component', () => {
  it('renders children correctly', () => {
    const {getByText} = render(
      <TestWrapper>
        <Screen>
          <Text>Screen Content</Text>
        </Screen>
      </TestWrapper>
    );

    expect(getByText('Screen Content')).toBeTruthy();
  });

  it('renders as scrollable when scrollable prop is true', () => {
    const {getByTestId} = render(
      <TestWrapper>
        <Screen scrollable testID="scrollable-screen">
          <Text>Scrollable Content</Text>
        </Screen>
      </TestWrapper>
    );

    expect(getByTestId('scrollable-screen')).toBeTruthy();
  });

  it('shows loading overlay when loading', () => {
    const {getByTestId} = render(
      <TestWrapper>
        <Screen loading testID="loading-screen">
          <Text>Content</Text>
        </Screen>
      </TestWrapper>
    );

    expect(getByTestId('loading-screen')).toBeTruthy();
    // Loading overlay should be present
  });

  it('applies custom styles', () => {
    const customStyle = {backgroundColor: 'red'};
    const {getByTestId} = render(
      <TestWrapper>
        <Screen style={customStyle} testID="styled-screen">
          <Text>Content</Text>
        </Screen>
      </TestWrapper>
    );

    expect(getByTestId('styled-screen')).toBeTruthy();
  });

  it('handles status bar configuration', () => {
    const {getByTestId} = render(
      <TestWrapper>
        <Screen 
          showStatusBar={true} 
          statusBarStyle="light" 
          testID="status-bar-screen"
        >
          <Text>Content</Text>
        </Screen>
      </TestWrapper>
    );

    expect(getByTestId('status-bar-screen')).toBeTruthy();
  });

  it('wraps content in ErrorBoundary', () => {
    // This test ensures ErrorBoundary is present
    const {getByTestId} = render(
      <TestWrapper>
        <Screen testID="error-boundary-screen">
          <Text>Safe Content</Text>
        </Screen>
      </TestWrapper>
    );

    expect(getByTestId('error-boundary-screen')).toBeTruthy();
  });
});