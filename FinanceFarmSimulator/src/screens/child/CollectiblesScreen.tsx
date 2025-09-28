import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useTheme} from '../../contexts/ThemeContext';
import {RootState} from '../../store/store';
import {Screen} from '../../components/common/Screen';
import {
  CollectibleDisplay,
  Collectible,
  ChildButton,
  EducationalTooltip,
  ChildModal,
} from '../../components/child';

export const CollectiblesScreen: React.FC = () => {
  const {theme, colorScheme} = useTheme();
  const isChildMode = colorScheme === 'child';
  
  const user = useSelector((state: RootState) => state.auth.user);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [selectedCollectible, setSelectedCollectible] = useState<Collectible | null>(null);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const screenStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.screenPadding,
      paddingBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.onBackground,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      ...(isChildMode && {
        fontSize: theme.typography.h2.fontSize + 4,
        fontWeight: '800',
      }),
    },
    subtitle: {
      ...theme.typography.body1,
      color: theme.colors.onBackground,
      opacity: 0.8,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 2,
      }),
    },
    filterContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.screenPadding,
    },
    filterButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.screenPadding,
    },
    modalContent: {
      alignItems: 'center',
    },
    modalEmoji: {
      fontSize: isChildMode ? 80 : 60,
      marginBottom: theme.spacing.lg,
    },
    modalTitle: {
      ...theme.typography.h3,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      ...(isChildMode && {
        fontSize: theme.typography.h3.fontSize + 2,
        fontWeight: '700',
      }),
    },
    modalDescription: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      textAlign: 'center',
      lineHeight: theme.typography.body1.lineHeight * 1.3,
      marginBottom: theme.spacing.lg,
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 1,
      }),
    },
    rarityBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.dimensions.borderRadius.large,
      marginBottom: theme.spacing.lg,
    },
    rarityText: {
      ...theme.typography.body2,
      color: '#FFFFFF',
      fontWeight: '700',
      textAlign: 'center',
      ...(isChildMode && {
        fontSize: theme.typography.body2.fontSize + 1,
      }),
    },
    unlockedDate: {
      ...theme.typography.caption,
      color: theme.colors.onSurface,
      opacity: 0.6,
      textAlign: 'center',
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 1,
      }),
    },
  });

  useEffect(() => {
    loadCollectibles();
  }, [user]);

  const loadCollectibles = async () => {
    // Mock data for demonstration - in real app, this would come from a service
    const mockCollectibles: Collectible[] = [
      // Animals
      {
        id: '1',
        name: 'Friendly Cow',
        emoji: '🐄',
        description: 'A happy cow that gives fresh milk every day!',
        rarity: 'common',
        category: 'animals',
        unlockedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        name: 'Playful Pig',
        emoji: '🐷',
        description: 'A cute pig that loves to roll in the mud!',
        rarity: 'common',
        category: 'animals',
        unlockedAt: new Date('2024-01-20'),
      },
      {
        id: '3',
        name: 'Golden Chicken',
        emoji: '🐓',
        description: 'A special chicken that lays golden eggs!',
        rarity: 'rare',
        category: 'animals',
      },
      {
        id: '4',
        name: 'Rainbow Unicorn',
        emoji: '🦄',
        description: 'A magical unicorn that brings good luck to your farm!',
        rarity: 'legendary',
        category: 'animals',
      },
      
      // Decorations
      {
        id: '5',
        name: 'Flower Garden',
        emoji: '🌸',
        description: 'Beautiful flowers that make your farm colorful!',
        rarity: 'common',
        category: 'decorations',
        unlockedAt: new Date('2024-01-10'),
      },
      {
        id: '6',
        name: 'Rainbow Bridge',
        emoji: '🌈',
        description: 'A magical bridge that spans across your farm!',
        rarity: 'epic',
        category: 'decorations',
      },
      
      // Tools
      {
        id: '7',
        name: 'Magic Watering Can',
        emoji: '🪣',
        description: 'A special watering can that helps plants grow faster!',
        rarity: 'rare',
        category: 'tools',
      },
      {
        id: '8',
        name: 'Super Shovel',
        emoji: '🪚',
        description: 'A powerful shovel that makes planting easier!',
        rarity: 'common',
        category: 'tools',
        unlockedAt: new Date('2024-01-25'),
      },
      
      // Badges
      {
        id: '9',
        name: 'First Goal',
        emoji: '🏆',
        description: 'Awarded for completing your very first savings goal!',
        rarity: 'common',
        category: 'badges',
        unlockedAt: new Date('2024-01-12'),
      },
      {
        id: '10',
        name: 'Chore Master',
        emoji: '⭐',
        description: 'Earned by completing 10 chores in a row!',
        rarity: 'rare',
        category: 'badges',
      },
    ];

    setCollectibles(mockCollectibles);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCollectibles();
    setRefreshing(false);
  };

  const handleCollectiblePress = (collectible: Collectible) => {
    setSelectedCollectible(collectible);
  };

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

  const formatUnlockedDate = (date: Date) => {
    return `Unlocked on ${date.toLocaleDateString()}`;
  };

  const unlockedCount = collectibles.filter(c => c.unlockedAt).length;
  const totalCount = collectibles.length;

  return (
    <Screen style={screenStyles.container}>
      <View style={screenStyles.header}>
        <EducationalTooltip concept="rewards">
          <Text style={screenStyles.title}>
            {isChildMode ? '🎁 My Collection' : 'Collectibles'}
          </Text>
        </EducationalTooltip>
        <Text style={screenStyles.subtitle}>
          {isChildMode 
            ? `You've collected ${unlockedCount} out of ${totalCount} items!`
            : `${unlockedCount}/${totalCount} items unlocked`
          }
        </Text>
      </View>

      <View style={screenStyles.filterContainer}>
        <ChildButton
          title={showUnlockedOnly ? 'Show All' : 'Show Unlocked'}
          onPress={() => setShowUnlockedOnly(!showUnlockedOnly)}
          variant={showUnlockedOnly ? 'secondary' : 'primary'}
          style={screenStyles.filterButton}
        />
        <ChildButton
          title={isChildMode ? 'How to Earn? 🤔' : 'How to Unlock'}
          onPress={() => {
            // Could show help modal about earning collectibles
          }}
          variant="fun"
          style={screenStyles.filterButton}
        />
      </View>

      <View style={screenStyles.content}>
        <CollectibleDisplay
          collectibles={collectibles}
          onCollectiblePress={handleCollectiblePress}
          showUnlockedOnly={showUnlockedOnly}
          title=""
        />
      </View>

      <ChildModal
        visible={!!selectedCollectible}
        onClose={() => setSelectedCollectible(null)}
        title={selectedCollectible?.name}
        size="medium"
      >
        {selectedCollectible && (
          <View style={screenStyles.modalContent}>
            <Text style={screenStyles.modalEmoji}>
              {selectedCollectible.emoji}
            </Text>
            
            <View style={[
              screenStyles.rarityBadge,
              {backgroundColor: getRarityColor(selectedCollectible.rarity)}
            ]}>
              <Text style={screenStyles.rarityText}>
                {getRarityLabel(selectedCollectible.rarity)}
              </Text>
            </View>
            
            <Text style={screenStyles.modalDescription}>
              {selectedCollectible.description}
            </Text>
            
            {selectedCollectible.unlockedAt ? (
              <Text style={screenStyles.unlockedDate}>
                {formatUnlockedDate(selectedCollectible.unlockedAt)}
              </Text>
            ) : (
              <Text style={screenStyles.unlockedDate}>
                {isChildMode 
                  ? 'Keep working on your goals and chores to unlock this! 💪'
                  : 'Complete more activities to unlock this collectible'
                }
              </Text>
            )}
          </View>
        )}
      </ChildModal>
    </Screen>
  );
};