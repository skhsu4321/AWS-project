import React, {useState} from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  labelStyle,
  required = false,
  ...textInputProps
}) => {
  const {theme} = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const inputStyles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    required: {
      color: theme.colors.error,
    },
    inputContainer: {
      borderWidth: 1,
      borderColor: error ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.outline,
      borderRadius: theme.dimensions.borderRadius.medium,
      backgroundColor: theme.colors.surface,
    },
    input: {
      ...theme.typography.body1,
      height: theme.dimensions.component.inputHeight,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.onSurface,
    },
    helperText: {
      ...theme.typography.caption,
      color: error ? theme.colors.error : theme.colors.outline,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <View style={[inputStyles.container, containerStyle]}>
      {label && (
        <Text style={[inputStyles.label, labelStyle]}>
          {label}
          {required && <Text style={inputStyles.required}> *</Text>}
        </Text>
      )}
      <View style={inputStyles.inputContainer}>
        <TextInput
          style={[inputStyles.input, inputStyle]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={theme.colors.outline}
          {...textInputProps}
        />
      </View>
      {(error || helperText) && (
        <Text style={inputStyles.helperText}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};