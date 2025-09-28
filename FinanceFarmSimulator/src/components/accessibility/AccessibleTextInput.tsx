import React, { useState, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface AccessibleTextInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  hintStyle?: TextStyle;
}

export const AccessibleTextInput: React.FC<AccessibleTextInputProps> = ({
  label,
  error,
  hint,
  required = false,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  hintStyle,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const { triggerHapticFeedback, announceForAccessibility } = useAccessibility();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    labelContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.xs,
    },
    label: {
      ...theme.typography.body2,
      color: theme.colors.onBackground,
      fontWeight: '500',
    },
    required: {
      color: theme.colors.error,
      marginLeft: theme.spacing.xs,
    },
    inputContainer: {
      borderWidth: 2,
      borderColor: error 
        ? theme.colors.error 
        : isFocused 
          ? theme.colors.primary 
          : theme.colors.outline,
      borderRadius: theme.dimensions.borderRadius.medium,
      backgroundColor: theme.colors.surface,
      minHeight: theme.dimensions.component.inputHeight,
    },
    input: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: theme.dimensions.component.inputHeight,
      textAlignVertical: 'center',
    },
    hint: {
      ...theme.typography.caption,
      color: theme.colors.onBackground,
      opacity: 0.7,
      marginTop: theme.spacing.xs,
    },
    error: {
      ...theme.typography.caption,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    highContrast: {
      borderWidth: 3,
    },
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    triggerHapticFeedback('light');
    
    // Announce the field for screen readers
    const announcement = `${label}${required ? ', required' : ''} text field${hint ? `, ${hint}` : ''}`;
    announceForAccessibility(announcement);
    
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const accessibilityLabel = `${label}${required ? ', required' : ''} text input`;
  const accessibilityHint = hint || (error ? `Error: ${error}` : undefined);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
        {required && (
          <Text style={styles.required} accessibilityLabel="required">
            *
          </Text>
        )}
      </View>
      
      <View 
        style={[
          styles.inputContainer,
          theme.accessibility.highContrast && styles.highContrast,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityRequired={required}
          accessibilityState={{
            invalid: !!error,
          }}
          {...textInputProps}
        />
      </View>
      
      {hint && !error && (
        <Text style={[styles.hint, hintStyle]} accessibilityRole="text">
          {hint}
        </Text>
      )}
      
      {error && (
        <Text 
          style={[styles.error, errorStyle]} 
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
};