import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useTheme} from '../../contexts/ThemeContext';
import {RootState} from '../../store/store';
import {Screen} from '../../components/common/Screen';
import {
  ChoreCard,
  ChoreCompletionModal,
  ParentalApprovalBanner,
  EducationalTooltip,
  ChildButton,
} from '../../components/child';
import {Chore, ApprovalRequest} from '../../models/ParentalControl';
import {ParentalControlService} from '../../services/ParentalControlService';

export const ChoresScreen: React.FC = () => {
  const {theme, colorScheme} = useTheme();
  const dispatch = useDispatch();
  const isChildMode = colorScheme === 'child';
  
  const user = useSelector((state: RootState) => state.auth.user);
  const [chores, setChores] = useState<Chore[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [loading, setLoading] = useState(true);
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
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 2,
      }),
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.screenPadding,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyStateIcon: {
      fontSize: isChildMode ? 80 : 60,
      marginBottom: theme.spacing.lg,
    },
    emptyStateTitle: {
      ...theme.typography.h3,
      color: theme.colors.onBackground,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      ...(isChildMode && {
        fontSize: theme.typography.h3.fontSize + 2,
        fontWeight: '700',
      }),
    },
    emptyStateText: {
      ...theme.typography.body1,
      color: theme.colors.onBackground,
      opacity: 0.6,
      textAlign: 'center',
      lineHeight: theme.typography.body1.lineHeight * 1.3,
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 1,
      }),
    },
    filterContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
    },
    filterButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    statsContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.large,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-around',
      ...(isChildMode && {
        borderWidth: 3,
        borderColor: theme.colors.primary,
      }),
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      ...theme.typography.h3,
      color: theme.colors.primary,
      fontWeight: '700',
      ...(isChildMode && {
        fontSize: theme.typography.h3.fontSize + 2,
      }),
    },
    statLabel: {
      ...theme.typography.caption,
      color: theme.colors.onSurface,
      opacity: 0.8,
      marginTop: theme.spacing.xs,
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 1,
      }),
    },
  });

  useEffect(() => {
    loadChores();
    loadPendingRequests();
  }, [user]);

  const loadChores = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const choresList = await ParentalControlService.getChoresForChild(user.id);
      setChores(choresList);
    } catch (error) {
      console.error('Error loading chores:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!user) return;
    
    try {
      const requests = await ParentalControlService.getPendingApprovalRequests(user.id);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadChores(), loadPendingRequests()]);
    setRefreshing(false);
  };

  const handleCompleteChore = (choreId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (chore) {
      setSelectedChore(chore);
      setShowCompletionModal(true);
    }
  };

  const handleSubmitCompletion = async (choreId: string, notes?: string) => {
    try {
      await ParentalControlService.completeChore(choreId, notes);
      setShowCompletionModal(false);
      setSelectedChore(null);
      await handleRefresh();
    } catch (error) {
      console.error('Error completing chore:', error);
    }
  };

  const getChoreStats = () => {
    const total = chores.length;
    const completed = chores.filter(c => c.isCompleted).length;
    const approved = chores.filter(c => c.approvedAt).length;
    const totalEarnings = chores
      .filter(c => c.approvedAt)
      .reduce((sum, c) => sum + c.reward, 0);

    return { total, completed, approved, totalEarnings };
  };

  const stats = getChoreStats();
  const availableChores = chores.filter(c => !c.isCompleted && !c.approvedAt);

  const renderChore = ({item}: {item: Chore}) => (
    <ChoreCard
      chore={item}
      onComplete={handleCompleteChore}
      onPress={() => {}} // Could open chore details
      testID={`chore-${item.id}`}
    />
  );

  const renderEmptyState = () => (
    <View style={screenStyles.emptyState}>
      <Text style={screenStyles.emptyStateIcon}>🏠</Text>
      <Text style={screenStyles.emptyStateTitle}>
        {isChildMode ? 'No chores right now!' : 'No Chores Available'}
      </Text>
      <Text style={screenStyles.emptyStateText}>
        {isChildMode 
          ? 'Ask your parents if there are any chores you can do to earn some money for your farm! 💰'
          : 'Check back later for new chores, or ask your parents to add some tasks for you.'
        }
      </Text>
    </View>
  );

  return (
    <Screen style={screenStyles.container}>
      <View style={screenStyles.header}>
        <EducationalTooltip concept="chores">
          <Text style={screenStyles.title}>
            {isChildMode ? '🏠 My Chores' : 'Chores & Tasks'}
          </Text>
        </EducationalTooltip>
        <Text style={screenStyles.subtitle}>
          {isChildMode 
            ? 'Complete chores to earn money for your farm!'
            : 'Complete tasks to earn rewards'
          }
        </Text>
      </View>

      <ParentalApprovalBanner
        pendingRequests={pendingRequests}
        onPress={() => {}} // Could navigate to approval status screen
      />

      <View style={screenStyles.content}>
        {stats.total > 0 && (
          <View style={screenStyles.statsContainer}>
            <View style={screenStyles.statItem}>
              <Text style={screenStyles.statNumber}>{stats.total}</Text>
              <Text style={screenStyles.statLabel}>Total</Text>
            </View>
            <View style={screenStyles.statItem}>
              <Text style={screenStyles.statNumber}>{stats.completed}</Text>
              <Text style={screenStyles.statLabel}>Completed</Text>
            </View>
            <View style={screenStyles.statItem}>
              <Text style={screenStyles.statNumber}>{stats.approved}</Text>
              <Text style={screenStyles.statLabel}>Approved</Text>
            </View>
            <View style={screenStyles.statItem}>
              <Text style={screenStyles.statNumber}>${stats.totalEarnings.toFixed(0)}</Text>
              <Text style={screenStyles.statLabel}>Earned</Text>
            </View>
          </View>
        )}

        <FlatList
          data={chores}
          renderItem={renderChore}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={chores.length === 0 ? {flex: 1} : undefined}
        />
      </View>

      <ChoreCompletionModal
        visible={showCompletionModal}
        chore={selectedChore}
        onClose={() => {
          setShowCompletionModal(false);
          setSelectedChore(null);
        }}
        onSubmit={handleSubmitCompletion}
      />
    </Screen>
  );
};