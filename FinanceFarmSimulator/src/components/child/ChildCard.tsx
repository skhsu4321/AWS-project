import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

export interface ChildCardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  variant?: 'default' | 'success' | 'warning' | 'fun';
  showBorder?: boolean;
  testID?: string;
}

export const ChildCard: React.FC<ChildCardProps> = ({
  title,
  subtitle,
  children,
  onPress,
  style,
  titleStyle,
  subtitleStyle,
  variant = 'default',
  showBorder = true,
  testID,
}) => {
  const {theme, colorScheme} = useTheme();
  const isChildMode = colorScheme === 'child';

  const cardStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: isChildMode ? theme.dimensions.borderRadius.large : theme.dimensions.borderRadius.medium,
      padding: theme.spacing.component.cardPadding,
      minHeight: theme.dimensions.component.cardMinHeight,
      ...(showBorder && isChildMode && {
        borderWidth: 3,
        borderColor: getBorderColor(),
      }),
      ...(isChildMode && {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }),
    },
    title: {
      ...theme.typography.h4,
      color: theme.colors.onSurface,
      marginBottom: subtitle ? theme.spacing.xs : theme.spacing.sm,
      ...(isChildMode && {
        fontSize: theme.typography.h4.fontSize + 2,
        fontWeight: '700',
      }),
    },
    subtitle: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
      opacity: 0.7,
      marginBottom: theme.spacing.sm,
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
      }),
    },
    content: {
      flex: 1,
    },
  });

  function getBorderColor(): string {
    switch (variant) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'fun':
        return '#FF6B6B';
      default:
        return theme.colors.primary;
    }
  }

  const CardContent = (
    <View style={[cardStyles.container, style]} testID={testID}>
      {title && (
        <Text style={[cardStyles.title, titleStyle]}>{title}</Text>
      )}
      {subtitle && (
        <Text style={[cardStyles.subtitle, subtitleStyle]}>{subtitle}</Text>
      )}
      <View style={cardStyles.content}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};