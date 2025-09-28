import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectIsSyncing, 
  selectLastSyncTime, 
  selectSyncErrors, 
  selectPendingOperationsCount,
  selectUIPreferences,
  clearSyncErrors 
} from '../../store/slices/syncSlice';
import { colors, spacing, typography } from '../../theme';

interface SyncStatusIndicatorProps {
  onPress?: () => void;
  style?: any;
  compact?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  onPress, 
  style, 
  compact = false 
}) => {
  const dispatch = useDispatch();
  const isSyncing = useSelector(selectIsSyncing);
  const lastSyncTime = useSelector(selectLastSyncTime);
  const syncErrors = useSelector(selectSyncErrors);
  const pendingOperationsCount = useSelector(selectPendingOperationsCount);
  const { showSyncStatus } = useSelector(selectUIPreferences);

  if (!showSyncStatus) {
    return null;
  }

  const formatLastSyncTime = (timestamp: string | null): string => {
    if (!timestamp) return 'Never synced';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getSyncStatusText = (): string => {
    if (isSyncing) {
      return 'Syncing...';
    }
    
    if (syncErrors.length > 0) {
      return `Sync failed (${syncErrors.length} errors)`;
    }
    
    if (pendingOperationsCount > 0) {
      return `${pendingOperationsCount} pending`;
    }
    
    return `Last sync: ${formatLastSyncTime(lastSyncTime)}`;
  };

  const getSyncStatusColor = (): string => {
    if (isSyncing) {
      return colors.primary;
    }
    
    if (syncErrors.length > 0) {
      return colors.error;
    }
    
    if (pendingOperationsCount > 0) {
      return colors.warning;
    }
    
    return colors.textSecondary;
  };

  const handlePress = () => {
    if (syncErrors.length > 0) {
      dispatch(clearSyncErrors());
    }
    onPress?.();
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactContainer, style]} 
        onPress={handlePress}
        disabled={!onPress && syncErrors.length === 0}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={[styles.statusDot, { backgroundColor: getSyncStatusColor() }]} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handlePress}
      disabled={!onPress && syncErrors.length === 0}
    >
      <View style={styles.content}>
        <View style={styles.statusRow}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.indicator} />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: getSyncStatusColor() }]} />
          )}
          <Text style={[styles.statusText, { color: getSyncStatusColor() }]}>
            {getSyncStatusText()}
          </Text>
        </View>
        
        {syncErrors.length > 0 && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText} numberOfLines={2}>
              {syncErrors[0]}
            </Text>
            {syncErrors.length > 1 && (
              <Text style={styles.moreErrorsText}>
                +{syncErrors.length - 1} more
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactContainer: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    marginRight: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    ...typography.body2,
    flex: 1,
  },
  errorContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    lineHeight: 16,
  },
  moreErrorsText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});