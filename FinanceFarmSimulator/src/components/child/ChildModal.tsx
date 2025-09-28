import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {ChildButton} from './ChildButton';

export interface ChildModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeButtonText?: string;
  style?: ViewStyle;
  scrollable?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

export const ChildModal: React.FC<ChildModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeButtonText,
  style,
  scrollable = true,
  size = 'medium',
}) => {
  const {theme, colorScheme} = useTheme();
  const isChildMode = colorScheme === 'child';

  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.large,
      padding: theme.spacing.lg,
      margin: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
      ...getContainerSize(),
      ...(isChildMode && {
        borderWidth: 4,
        borderColor: theme.colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 12,
      }),
    },
    fullscreenContainer: {
      flex: 1,
      margin: 0,
      borderRadius: 0,
      ...(isChildMode && {
        borderWidth: 0,
      }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
      ...(title && {
        borderBottomWidth: isChildMode ? 2 : 1,
        borderBottomColor: theme.colors.outline,
        paddingBottom: theme.spacing.md,
      }),
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.onSurface,
      flex: 1,
      textAlign: 'center',
      ...(isChildMode && {
        fontSize: theme.typography.h3.fontSize + 2,
        fontWeight: '700',
      }),
    },
    closeIcon: {
      width: isChildMode ? 36 : 28,
      height: isChildMode ? 36 : 28,
      borderRadius: isChildMode ? 18 : 14,
      backgroundColor: theme.colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeIconText: {
      color: '#FFFFFF',
      fontSize: isChildMode ? 20 : 16,
      fontWeight: '600',
    },
    content: {
      flex: size === 'fullscreen' ? 1 : undefined,
    },
    scrollContent: {
      flexGrow: 1,
    },
    footer: {
      marginTop: theme.spacing.lg,
      ...(showCloseButton && {
        borderTopWidth: isChildMode ? 2 : 1,
        borderTopColor: theme.colors.outline,
        paddingTop: theme.spacing.md,
      }),
    },
  });

  function getContainerSize() {
    switch (size) {
      case 'small':
        return {
          width: '80%',
          maxWidth: 300,
          maxHeight: '60%',
        };
      case 'medium':
        return {
          width: '90%',
          maxWidth: 400,
          maxHeight: '80%',
        };
      case 'large':
        return {
          width: '95%',
          maxWidth: 500,
          maxHeight: '90%',
        };
      case 'fullscreen':
        return {};
      default:
        return {
          width: '90%',
          maxWidth: 400,
          maxHeight: '80%',
        };
    }
  }

  const Content = scrollable ? (
    <ScrollView
      style={modalStyles.content}
      contentContainerStyle={modalStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={modalStyles.content}>
      {children}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={size !== 'fullscreen'}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={modalStyles.overlay}>
        <View style={[
          modalStyles.container,
          size === 'fullscreen' && modalStyles.fullscreenContainer,
          style
        ]}>
          {(title || showCloseButton) && (
            <View style={modalStyles.header}>
              {title && (
                <Text style={modalStyles.title}>{title}</Text>
              )}
              
              {!title && showCloseButton && (
                <TouchableOpacity
                  style={modalStyles.closeIcon}
                  onPress={onClose}
                  accessibilityLabel="Close modal"
                  accessibilityRole="button"
                >
                  <Text style={modalStyles.closeIconText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {Content}

          {showCloseButton && (
            <View style={modalStyles.footer}>
              <ChildButton
                title={closeButtonText || (isChildMode ? 'Close 👍' : 'Close')}
                onPress={onClose}
                variant="secondary"
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};