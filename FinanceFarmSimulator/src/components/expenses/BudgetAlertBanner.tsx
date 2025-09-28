import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Typography } from '../common';
import { BudgetAlert } from '../../services/FinancialDataManager';
import { formatCurrency } from '../../utils/formatting';

interface BudgetAlertBannerProps {
  alerts: BudgetAlert[];
  onDismiss: () => void;
}

export const BudgetAlertBanner: React.FC<BudgetAlertBannerProps> = ({
  alerts,
  onDismiss,
}) => {
  const { theme, colorScheme } = useTheme();
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (alerts.length > 0) {
      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();

      // Pulse animation for critical alerts
      const currentAlert = alerts[currentAlertIndex];
      if (currentAlert.severity === 'exceeded' || currentAlert.severity === 'danger') {
        startPulseAnimation();
        Vibration.vibrate([200, 100, 200]);
      }

      // Auto-rotate through alerts if multiple
      if (alerts.length > 1) {
        const interval = setInterval(() => {
          setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
        }, 4000);

        return () => clearInterval(interval);
      }
    }
  }, [alerts, currentAlertIndex]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onDismiss();
    });
  };

  if (alerts.length === 0) return null;

  const currentAlert = alerts[currentAlertIndex];
  
  const getSeverityConfig = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'exceeded':
        return {
          backgroundColor: theme.colors.error,
          textColor: theme.colors.onError,
          icon: '🚨',
          childIcon: '🌋',
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.warning,
          textColor: theme.colors.onWarning,
          icon: '⚠️',
          childIcon: '🌪️',
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.info,
          textColor: theme.colors.onInfo,
          icon: '💡',
          childIcon: '🌤️',
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          textColor: theme.colors.onSurface,
          icon: 'ℹ️',
          childIcon: '🌱',
        };
    }
  };

  const severityConfig = getSeverityConfig(currentAlert.severity);

  const getChildFriendlyMessage = (alert: BudgetAlert): string => {
    const category = alert.category.replace('_', ' ').toLowerCase();
    
    if (alert.severity === 'exceeded') {
      return `Oops! You spent too much on ${category} this month! 🌋`;
    } else if (alert.severity === 'danger') {
      return `Careful! You're spending a lot on ${category}! 🌪️`;
    } else {
      return `You're doing well with ${category} spending! 🌤️`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: theme.colors.common.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    banner: {
      backgroundColor: severityConfig.backgroundColor,
      padding: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      marginRight: theme.spacing.md,
    },
    icon: {
      fontSize: colorScheme === 'child' ? 32 : 24,
    },
    content: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    title: {
      color: severityConfig.textColor,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
    },
    message: {
      color: severityConfig.textColor,
      opacity: 0.9,
    },
    details: {
      color: severityConfig.textColor,
      opacity: 0.8,
      marginTop: theme.spacing.xs,
    },
    actions: {
      flexDirection: 'column',
      alignItems: 'flex-end',
    },
    dismissButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.dimensions.borderRadius.small,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    dismissText: {
      color: severityConfig.textColor,
      fontWeight: 'bold',
      fontSize: 16,
    },
    indicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: 2,
    },
    activeDot: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    progressBar: {
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      marginTop: theme.spacing.sm,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 2,
    },
  });

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const progressWidth = `${Math.min(100, currentAlert.percentage)}%`;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          <Typography style={styles.icon}>
            {colorScheme === 'child' ? severityConfig.childIcon : severityConfig.icon}
          </Typography>
        </View>

        <View style={styles.content}>
          <Typography variant="body1" style={styles.title}>
            {colorScheme === 'child' 
              ? 'Garden Alert!' 
              : `Budget Alert: ${currentAlert.category.replace('_', ' ')}`
            }
          </Typography>
          
          <Typography variant="body2" style={styles.message}>
            {colorScheme === 'child' 
              ? getChildFriendlyMessage(currentAlert)
              : currentAlert.message
            }
          </Typography>

          {!colorScheme === 'child' && (
            <Typography variant="caption" style={styles.details}>
              {formatCurrency(currentAlert.currentSpending)} of {formatCurrency(currentAlert.limit)} used
            </Typography>
          )}

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: progressWidth }
              ]} 
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <Typography style={styles.dismissText}>✕</Typography>
          </TouchableOpacity>

          {/* Multiple alerts indicator */}
          {alerts.length > 1 && (
            <View style={styles.indicator}>
              {alerts.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentAlertIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};