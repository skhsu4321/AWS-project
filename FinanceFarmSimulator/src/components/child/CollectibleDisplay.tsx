import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {ChildCard} from './ChildCard';

const {width: screenWidth} = Dimensions.get('window');

export interface Collectible {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  category: 'animals' | 'decorations' | 'tools' | 'badges';
}

export interface CollectibleDisplayProps {
  collectibles: Collectible[];
  onCollectiblePress?: (collectible: Collectible) => void;
  showUnlockedOnly?: boolean;
  title?: string;
}

export const CollectibleDisplay: React.FC<CollectibleDisplayProps> = ({
  collectibles,
  onCollectiblePress,
  showUnlockedOnly = false,
  title = "My Collection",
}) => {
  const {theme, colorScheme} = useTheme();
  const isChildMode = colorScheme === 'child';

  const displayStyles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        fontSize: theme.typography.h3.fontSize + 2,
        fontWeight: '700',
      }),
    },
    categoryContainer: {
      marginBottom: theme.spacing.lg,
    },
    categoryTitle: {
      ...theme.typography.h4,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
      ...(isChildMode && {
        fontSize: theme.typography.h4.fontSize + 2,
        fontWeight: '700',
      }),
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    collectibleCard: {
      width: (screenWidth - theme.spacing.screenPadding * 2 - theme.spacing.md) / 2,
      marginBottom: theme.spacing.md,
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    emojiContainer: {
      width: isChildMode ? 80 : 60,
      height: isChildMode ? 80 : 60,
      borderRadius: isChildMode ? 40 : 30,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
      ...(isChildMode && {
        borderWidth: 3,
        borderColor: theme.colors.primary,
      }),
    },
    emoji: {
      fontSize: isChildMode ? 40 : 30,
    },
    lockedEmoji: {
      opacity: 0.3,
    },
    collectibleName: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
        fontWeight: '700',
      }),
    },
    collectibleDescription: {
      ...theme.typography.caption,
      color: theme.colors.onSurface,
      opacity: 0.7,
      textAlign: 'center',
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 1,
      }),
    },
    rarityBadge: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.dimensions.borderRadius.small,
      ...(isChildMode && {
        borderRadius: theme.dimensions.borderRadius.medium,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
      }),
    },
    rarityText: {
      ...theme.typography.caption,
      fontWeight: '600',
      fontSize: isChildMode ? 10 : 8,
      ...(isChildMode && {
        fontSize: 12,
        fontWeight: '700',
      }),
    },
    lockedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: theme.dimensions.borderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      ...(isChildMode && {
        borderRadius: theme.dimensions.borderRadius.large,
      }),
    },
    lockedText: {
      ...theme.typography.caption,
      color: '#FFFFFF',
      fontWeight: '600',
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 1,
        fontWeight: '700',
      }),
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyStateText: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      opacity: 0.6,
      textAlign: 'center',
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 2,
      }),
    },
  });

  const getRarityColor = (rarity: Collectible['rarity']) => {
    switch (rarity) {
      case 'common':
        return '#9E9E9E';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getRarityLabel = (rarity: Collectible['rarity']) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const getCategoryEmoji = (category: Collectible['category']) => {
    switch (category) {
      case 'animals':
        return '🐾';
      case 'decorations':
        return '🎨';
      case 'tools':
        return '🔧';
      case 'badges':
        return '🏆';
      default:
        return '📦';
    }
  };

  const getCategoryTitle = (category: Collectible['category']) => {
    switch (category) {
      case 'animals':
        return 'Farm Animals';
      case 'decorations':
        return 'Decorations';
      case 'tools':
        return 'Farm Tools';
      case 'badges':
        return 'Achievement Badges';
      default:
        return 'Other';
    }
  };

  const filteredCollectibles = showUnlockedOnly 
    ? collectibles.filter(c => c.unlockedAt)
    : collectibles;

  const groupedCollectibles = filteredCollectibles.reduce((groups, collectible) => {
    const category = collectible.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(collectible);
    return groups;
  }, {} as Record<string, Collectible[]>);

  const renderCollectible = (collectible: Collectible) => {
    const isUnlocked = !!collectible.unlockedAt;
    
    return (
      <TouchableOpacity
        key={collectible.id}
        onPress={() => onCollectiblePress?.(collectible)}
        disabled={!isUnlocked}
      >
        <ChildCard
          style={displayStyles.collectibleCard}
          variant={isUnlocked ? 'success' : 'default'}
          showBorder={isChildMode}
        >
          <View style={[
            displayStyles.rarityBadge,
            {backgroundColor: getRarityColor(collectible.rarity)}
          ]}>
            <Text style={[
              displayStyles.rarityText,
              {color: '#FFFFFF'}
            ]}>
              {getRarityLabel(collectible.rarity)}
            </Text>
          </View>
          
          <View style={displayStyles.emojiContainer}>
            <Text style={[
              displayStyles.emoji,
              !isUnlocked && displayStyles.lockedEmoji
            ]}>
              {collectible.emoji}
            </Text>
          </View>
          
          <Text style={displayStyles.collectibleName}>
            {collectible.name}
          </Text>
          
          <Text style={displayStyles.collectibleDescription}>
            {collectible.description}
          </Text>
          
          {!isUnlocked && (
            <View style={displayStyles.lockedOverlay}>
              <Text style={displayStyles.lockedText}>🔒 Locked</Text>
            </View>
          )}
        </ChildCard>
      </TouchableOpacity>
    );
  };

  if (filteredCollectibles.length === 0) {
    return (
      <View style={displayStyles.container}>
        <Text style={displayStyles.title}>{title}</Text>
        <View style={displayStyles.emptyState}>
          <Text style={displayStyles.emptyStateText}>
            {showUnlockedOnly 
              ? "You haven't unlocked any collectibles yet!\nComplete chores and reach goals to earn rewards! 🎁"
              : "No collectibles available at the moment."
            }
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={displayStyles.container} showsVerticalScrollIndicator={false}>
      <Text style={displayStyles.title}>{title}</Text>
      
      {Object.entries(groupedCollectibles).map(([category, items]) => (
        <View key={category} style={displayStyles.categoryContainer}>
          <Text style={displayStyles.categoryTitle}>
            {getCategoryEmoji(category as Collectible['category'])} {getCategoryTitle(category as Collectible['category'])}
          </Text>
          
          <View style={displayStyles.grid}>
            {items.map(renderCollectible)}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};