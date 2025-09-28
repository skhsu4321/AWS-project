import React, {ReactNode} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

export interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  elevation?: number;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = true,
  elevation = 2,
  testID,
}) => {
  const {theme} = useTheme();

  const cardStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.medium,
      minHeight: theme.dimensions.component.cardMinHeight,
      shadowColor: theme.colors.common.black,
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.1,
      shadowRadius: elevation * 2,
      elevation: elevation,
      padding: padding ? theme.spacing.component.cardPadding : 0,
    },
  });

  return (
    <View style={[cardStyles.container, style]} testID={testID}>
      {children}
    </View>
  );
};