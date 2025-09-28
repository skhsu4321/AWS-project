import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {Chore} from '../../models/ParentalControl';
import {ChildButton} from './ChildButton';
import {ChildCard} from './ChildCard';

export interface ChoreCardProps {
  chore: Chore;
  onComplete: (choreId: string) => void;
  onPress?: (chore: Chore) => void;
  showCompleteButton?: boolean;
  testID?: string;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  onComplete,
  onPress,
  showCompleteButton = true,
  testID,
}) => {
  const {theme, colorScheme} = useTheme();
  const isChildMode = colorScheme === 'child';

  const choreStyles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    titleContainer: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    title: {
      ...theme.typography.h4,
      color: theme.colors.onSurface,
      ...(isChildMode && {
        fontSize: theme.typography.h4.fontSize + 2,
        fontWeight: '700',
      }),
    },
    description: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
      opacity: 0.8,
      marginTop: theme.spacing.xs,
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
      }),
    },
    rewardContainer: {
      backgroundColor: theme.colors.success,
      borderRadius: theme.dimensions.borderRadius.medium,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      alignItems: 'center',
      ...(isChildMode && {
        borderRadius: theme.dimensions.borderRadius.large,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }),
    },
    rewardText: {
      ...theme.typography.caption,
      color: '#FFFFFF',
      fontWeight: '600',
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 2,
        fontWeight: '700',
      }),
    },
    rewardAmount: {
      ...theme.typography.body2,
      color: '#FFFFFF',
      fontWeight: '700',
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 2,
      }),
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.dimensions.borderRadius.small,
      ...(isChildMode && {
        borderRadius: theme.dimensions.borderRadius.medium,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }),
    },
    statusText: {
      ...theme.typography.caption,
      fontWeight: '600',
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 1,
        fontWeight: '700',
      }),
    },
    completedBadge: {
      backgroundColor: theme.colors.success,
    },
    pendingBadge: {
      backgroundColor: theme.colors.warning,
    },
    approvedBadge: {
      backgroundColor: theme.colors.primary,
    },
    completeButton: {
      minWidth: 120,
    },
    dueDateText: {
      ...theme.typography.caption,
      color: theme.colors.onSurface,
      opacity: 0.6,
      marginTop: theme.spacing.xs,
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 1,
      }),
    },
  });

  const getStatusInfo = () => {
    if (chore.approvedAt) {
      return {
        text: '✅ Approved!',
        style: choreStyles.approvedBadge,
        textColor: '#FFFFFF',
      };
    }
    if (chore.completedAt) {
      return {
        text: '⏳ Waiting for approval',
        style: choreStyles.pendingBadge,
        textColor: '#333333',
      };
    }
    return {
      text: '📝 To do',
      style: choreStyles.pendingBadge,
      textColor: '#333333',
    };
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return '⚠️ Overdue';
    } else if (diffDays === 0) {
      return '📅 Due today';
    } else if (diffDays === 1) {
      return '📅 Due tomorrow';
    } else {
      return `📅 Due in ${diffDays} days`;
    }
  };

  const statusInfo = getStatusInfo();
  const canComplete = !chore.isCompleted && !chore.approvedAt;

  return (
    <ChildCard
      style={choreStyles.container}
      onPress={onPress ? () => onPress(chore) : undefined}
      variant={chore.approvedAt ? 'success' : 'default'}
      testID={testID}
    >
      <View style={choreStyles.header}>
        <View style={choreStyles.titleContainer}>
          <Text style={choreStyles.title}>{chore.title}</Text>
          {chore.description && (
            <Text style={choreStyles.description}>{chore.description}</Text>
          )}
          {chore.dueDate && (
            <Text style={choreStyles.dueDateText}>
              {formatDueDate(chore.dueDate)}
            </Text>
          )}
        </View>
        
        <View style={choreStyles.rewardContainer}>
          <Text style={choreStyles.rewardText}>Reward</Text>
          <Text style={choreStyles.rewardAmount}>
            ${chore.reward.toFixed(2)}
          </Text>
        </View>
      </View>
      
      <View style={choreStyles.statusContainer}>
        <View style={[choreStyles.statusBadge, statusInfo.style]}>
          <Text style={[choreStyles.statusText, {color: statusInfo.textColor}]}>
            {statusInfo.text}
          </Text>
        </View>
        
        {showCompleteButton && canComplete && (
          <ChildButton
            title={isChildMode ? "I did it! 🎉" : "Complete"}
            onPress={() => onComplete(chore.id)}
            variant="fun"
            size="small"
            style={choreStyles.completeButton}
          />
        )}
      </View>
      
      {chore.isRecurring && (
        <Text style={choreStyles.dueDateText}>
          🔄 Repeats {chore.recurringPeriod}
        </Text>
      )}
    </ChildCard>
  );
};