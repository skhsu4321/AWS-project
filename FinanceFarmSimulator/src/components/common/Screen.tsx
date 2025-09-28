import React, {ReactNode} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../../contexts/ThemeContext';
import {LoadingSpinner} from './LoadingSpinner';
import {ErrorBoundary} from './ErrorBoundary';

export interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showStatusBar?: boolean;
  statusBarStyle?: 'auto' | 'inverted' | 'light' | 'dark';
  testID?: string;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  loading = false,
  style,
  contentContainerStyle,
  showStatusBar = true,
  statusBarStyle = 'auto',
  testID,
}) => {
  const {theme} = useTheme();

  const screenStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.component.screenPadding,
    },
    scrollContent: {
      flexGrow: 1,
      padding: theme.spacing.component.screenPadding,
    },
  });

  const Content = scrollable ? ScrollView : View;
  const contentStyle = scrollable ? screenStyles.scrollContent : screenStyles.content;

  return (
    <ErrorBoundary>
      <SafeAreaView style={[screenStyles.container, style]} testID={testID}>
        {showStatusBar && (
          <StatusBar
            barStyle={
              statusBarStyle === 'auto'
                ? theme.mode === 'child'
                  ? 'dark-content'
                  : 'default'
                : statusBarStyle === 'light'
                ? 'light-content'
                : 'dark-content'
            }
            backgroundColor={theme.colors.background}
          />
        )}
        
        <Content
          style={scrollable ? undefined : contentStyle}
          contentContainerStyle={scrollable ? [contentStyle, contentContainerStyle] : undefined}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </Content>
        
        {loading && <LoadingSpinner overlay />}
      </SafeAreaView>
    </ErrorBoundary>
  );
};