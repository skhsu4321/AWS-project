import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  overlay?: boolean;
  testID?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  message,
  overlay = false,
  testID,
}) => {
  const {theme} = useTheme();

  const loadingStyles = StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.common.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    message: {
      ...theme.typography.body1,
      color: overlay ? theme.colors.common.white : theme.colors.onSurface,
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
  });

  const containerStyle = overlay ? loadingStyles.overlay : loadingStyles.container;
  const spinnerColor = overlay ? theme.colors.common.white : theme.colors.primary;

  return (
    <View style={containerStyle} testID={testID}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && <Text style={loadingStyles.message}>{message}</Text>}
    </View>
  );
};