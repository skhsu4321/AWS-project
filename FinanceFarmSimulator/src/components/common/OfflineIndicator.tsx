import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsOnline, selectPendingOperationsCount, selectUIPreferences } from '../../store/slices/syncSlice';
import { colors, spacing, typography } from '../../theme';

interface OfflineIndicatorProps {
  style?: any;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ style }) => {
  const isOnline = useSelector(selectIsOnline);
  const pendingOperationsCount = useSelector(selectPendingOperationsCount);
  const { showOfflineIndicator } = useSelector(selectUIPreferences);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!showOfflineIndicator) return;

    if (!isOnline || pendingOperationsCount > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, pendingOperationsCount, showOfflineIndicator, fadeAnim]);

  if (!showOfflineIndicator || (isOnline && pendingOperationsCount === 0)) {
    return null;
  }

  const getIndicatorText = () => {
    if (!isOnline && pendingOperationsCount > 0) {
      return `Offline • ${pendingOperationsCount} pending`;
    } else if (!isOnline) {
      return 'Offline';
    } else if (pendingOperationsCount > 0) {
      return `${pendingOperationsCount} pending sync`;
    }
    return '';
  };

  const getIndicatorColor = () => {
    if (!isOnline) {
      return colors.error;
    } else if (pendingOperationsCount > 0) {
      return colors.warning;
    }
    return colors.success;
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: getIndicatorColor(), opacity: fadeAnim },
        style
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.dot, { backgroundColor: colors.white }]} />
        <Text style={styles.text}>{getIndicatorText()}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    margin: spacing.sm,
    alignSelf: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  text: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
});