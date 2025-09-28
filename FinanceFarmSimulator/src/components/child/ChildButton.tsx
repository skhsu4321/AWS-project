import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

export interface ChildButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'fun' | 'reward';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  icon?: React.ReactNode;
  showShadow?: boolean;
  bounceOnPress?: boolean;
}

export const ChildButton: React.FC<ChildButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  icon,
  showShadow = true,
  bounceOnPress = true,
}) => {
  const {theme, colorScheme} = useTheme();

  // Only apply child-specific styling if in child mode
  const isChildMode = colorScheme === 'child';

  const buttonStyles = StyleSheet.create({
    container: {
      height: theme.dimensions.component.buttonHeight[size],
      paddingHorizontal: theme.spacing.component.buttonPadding.horizontal,
      paddingVertical: theme.spacing.component.buttonPadding.vertical,
      borderRadius: isChildMode ? theme.dimensions.borderRadius.large : theme.dimensions.borderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minWidth: theme.dimensions.component.touchTargetSize,
      opacity: disabled ? 0.6 : 1,
      ...(showShadow && isChildMode && {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
      }),
    },
    primary: {
      backgroundColor: theme.colors.primary,
      ...(isChildMode && {
        borderWidth: 3,
        borderColor: theme.colors.primaryDark,
      }),
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      ...(isChildMode && {
        borderWidth: 3,
        borderColor: theme.colors.secondaryDark,
      }),
    },
    fun: {
      backgroundColor: '#FF6B6B',
      ...(isChildMode && {
        borderWidth: 3,
        borderColor: '#E55555',
      }),
    },
    reward: {
      backgroundColor: '#FFD93D',
      ...(isChildMode && {
        borderWidth: 3,
        borderColor: '#E6C235',
      }),
    },
    text: {
      ...theme.typography.button,
      textAlign: 'center',
      ...(isChildMode && {
        fontSize: theme.typography.button.fontSize + 2,
        fontWeight: '700',
      }),
    },
    primaryText: {
      color: theme.colors.onPrimary,
    },
    secondaryText: {
      color: theme.colors.onSecondary,
    },
    funText: {
      color: '#FFFFFF',
    },
    rewardText: {
      color: '#333333',
    },
    iconContainer: {
      marginRight: icon ? 8 : 0,
    },
  });

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = buttonStyles.container;
    switch (variant) {
      case 'primary':
        return {...baseStyle, ...buttonStyles.primary};
      case 'secondary':
        return {...baseStyle, ...buttonStyles.secondary};
      case 'fun':
        return {...baseStyle, ...buttonStyles.fun};
      case 'reward':
        return {...baseStyle, ...buttonStyles.reward};
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
      case 'fun':
        return {...baseStyle, ...buttonStyles.funText};
      case 'reward':
        return {...baseStyle, ...buttonStyles.rewardText};
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
      activeOpacity={bounceOnPress ? 0.7 : 0.8}
    >
      <View style={buttonStyles.iconContainer}>
        {icon}
      </View>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextStyle().color}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};