import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {ApprovalRequest} from '../../models/ParentalControl';

export interface ParentalApprovalBannerProps {
  pendingRequests: ApprovalRequest[];
  onPress?: () => void;
  showCount?: boolean;
}

export const ParentalApprovalBanner: React.FC<ParentalApprovalBannerProps> = ({
  pendingRequests,
  onPress,
  showCount = true,
}) => {
  const {theme, colorScheme} = useTheme();
  const isChildMode = colorScheme === 'child';

  if (pendingRequests.length === 0) {
    return null;
  }

  const bannerStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.warning,
      borderRadius: theme.dimensions.borderRadius.medium,
      padding: theme.spacing.md,
      margin: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...(isChildMode && {
        borderRadius: theme.dimensions.borderRadius.large,
        borderWidth: 3,
        borderColor: theme.colors.secondaryDark,
        padding: theme.spacing.lg,
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
    content: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    title: {
      ...theme.typography.body1,
      color: '#333333',
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 2,
        fontWeight: '700',
      }),
    },
    subtitle: {
      ...theme.typography.body2,
      color: '#333333',
      opacity: 0.8,
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
      }),
    },
    countBadge: {
      backgroundColor: theme.colors.error,
      borderRadius: isChildMode ? 20 : 16,
      minWidth: isChildMode ? 40 : 32,
      height: isChildMode ? 40 : 32,
      alignItems: 'center',
      justifyContent: 'center',
      ...(isChildMode && {
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }),
    },
    countText: {
      ...theme.typography.caption,
      color: '#FFFFFF',
      fontWeight: '700',
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 2,
      }),
    },
    icon: {
      fontSize: isChildMode ? 32 : 24,
      marginRight: theme.spacing.sm,
    },
  });

  const getRequestTypeText = () => {
    const types = pendingRequests.map(req => req.type);
    const uniqueTypes = [...new Set(types)];
    
    if (uniqueTypes.length === 1) {
      const type = uniqueTypes[0];
      switch (type) {
        case 'goal':
          return isChildMode ? 'savings goal' : 'goal';
        case 'reward':
          return 'reward';
        case 'expense':
          return 'expense';
        default:
          return 'request';
      }
    }
    
    return 'requests';
  };

  const getMessage = () => {
    const count = pendingRequests.length;
    const typeText = getRequestTypeText();
    
    if (isChildMode) {
      if (count === 1) {
        return {
          title: '👨‍👩‍👧‍👦 Waiting for Mom or Dad',
          subtitle: `Your ${typeText} needs approval before it can be added to your farm!`,
        };
      } else {
        return {
          title: '👨‍👩‍👧‍👦 Waiting for Mom or Dad',
          subtitle: `You have ${count} ${typeText} waiting for approval!`,
        };
      }
    } else {
      if (count === 1) {
        return {
          title: 'Parental Approval Needed',
          subtitle: `1 ${typeText} is waiting for approval`,
        };
      } else {
        return {
          title: 'Parental Approval Needed',
          subtitle: `${count} ${typeText} are waiting for approval`,
        };
      }
    }
  };

  const message = getMessage();

  const BannerContent = (
    <View style={bannerStyles.container}>
      <Text style={bannerStyles.icon}>⏳</Text>
      
      <View style={bannerStyles.content}>
        <Text style={bannerStyles.title}>{message.title}</Text>
        <Text style={bannerStyles.subtitle}>{message.subtitle}</Text>
      </View>
      
      {showCount && (
        <View style={bannerStyles.countBadge}>
          <Text style={bannerStyles.countText}>
            {pendingRequests.length}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${pendingRequests.length} pending approval requests`}
      >
        {BannerContent}
      </TouchableOpacity>
    );
  }

  return BannerContent;
};