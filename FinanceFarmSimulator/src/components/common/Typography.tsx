import React, {ReactNode} from 'react';
import {Text, TextStyle} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {TypographyVariant} from '../../theme';

export interface TypographyProps {
  variant?: TypographyVariant;
  children: ReactNode;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
  testID?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  children,
  color,
  style,
  numberOfLines,
  testID,
}) => {
  const {theme} = useTheme();

  const textStyle: TextStyle = {
    ...theme.typography[variant],
    color: color || theme.colors.onSurface,
    ...style,
  };

  return (
    <Text
      style={textStyle}
      numberOfLines={numberOfLines}
      testID={testID}
    >
      {children}
    </Text>
  );
};