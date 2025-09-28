import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const {theme} = useTheme();

  const buttonStyles = StyleSheet.create({
    container: {
      height: theme.dimensions.component.buttonHeight[size],
      paddingHorizontal: theme.spacing.component.buttonPadding.horizontal,
      paddingVertical: theme.spacing.component.buttonPadding.vertical,
      borderRadius: theme.dimensions.borderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minWidth: theme.dimensions.component.touchTargetSize,
      opacity: disabled ? 0.6 : 1,
    },
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    text: {
      backgroundColor: 'transparent',
    },
    text: {
      ...theme.typography.button,
      textAlign: 'center',
    },
    primaryText: {
      color: theme.colors.onPrimary,
    },
    secondaryText: {
      color: theme.colors.onSecondary,
    },
    outlineText: {
      color: theme.colors.primary,
    },
    textVariantText: {
      color: theme.colors.primary,
    },
  });

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = buttonStyles.container;
    switch (variant) {
      case 'primary':
        return {...baseStyle, ...buttonStyles.primary};
      case 'secondary':
        return {...baseStyle, ...buttonStyles.secondary};
      case 'outline':
        return {...baseStyle, ...buttonStyles.outline};
      case 'text':
        return {...baseStyle, ...buttonStyles.text};
      default:
        return {...baseStyle, ...buttonStyles.primary};
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = buttonStyles.text;
    switch (variant) {
      case 'primary':
        return {...baseStyle, ...buttonStyles.primaryText};
      case 'secondary':
        return {...baseStyle, ...buttonStyles.secondaryText};
      case 'outline':
        return {...baseStyle, ...buttonStyles.outlineText};
      case 'text':
        return {...baseStyle, ...buttonStyles.textVariantText};
      default:
        return {...baseStyle, ...buttonStyles.primaryText};
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{disabled: disabled || loading}}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'text' ? theme.colors.primary : theme.colors.onPrimary}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};