import React, {ReactNode} from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {Button} from './Button';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  primaryAction?: {
    title: string;
    onPress: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    title: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  testID?: string;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  primaryAction,
  secondaryAction,
  style,
  testID,
}) => {
  const {theme} = useTheme();

  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.common.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.large,
      padding: theme.spacing.lg,
      maxWidth: '90%',
      maxHeight: '80%',
      minWidth: 280,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.onSurface,
      flex: 1,
    },
    closeButton: {
      padding: theme.spacing.xs,
      marginLeft: theme.spacing.sm,
    },
    closeButtonText: {
      ...theme.typography.h4,
      color: theme.colors.outline,
    },
    content: {
      marginBottom: theme.spacing.lg,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
  });

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableOpacity
        style={modalStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[modalStyles.container, style]}
          activeOpacity={1}
          onPress={() => {}} // Prevent closing when tapping inside modal
        >
          {(title || showCloseButton) && (
            <View style={modalStyles.header}>
              {title && <Text style={modalStyles.title}>{title}</Text>}
              {showCloseButton && (
                <TouchableOpacity
                  style={modalStyles.closeButton}
                  onPress={onClose}
                  testID={`${testID}-close`}
                >
                  <Text style={modalStyles.closeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <View style={modalStyles.content}>
            {children}
          </View>
          
          {(primaryAction || secondaryAction) && (
            <View style={modalStyles.actions}>
              {secondaryAction && (
                <Button
                  title={secondaryAction.title}
                  onPress={secondaryAction.onPress}
                  variant="outline"
                  testID={`${testID}-secondary`}
                />
              )}
              {primaryAction && (
                <Button
                  title={primaryAction.title}
                  onPress={primaryAction.onPress}
                  loading={primaryAction.loading}
                  testID={`${testID}-primary`}
                />
              )}
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
};