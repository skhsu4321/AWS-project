import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { Farm, Crop } from '../../models/Game';
import { SavingsGoal } from '../../models/Financial';
import { FarmInteractionHandler } from './FarmInteractionHandler';
import { FarmPerformanceOptimizer, useFarmPerformance, FarmOptimizationUtils } from './FarmPerformanceOptimizer';
import { Button, Typography, Card } from '../common';
import { useTheme } from '../../contexts/ThemeContext';
import { FarmEngine } from '../../services/FarmEngine';
import { updateFarm, updateCrop } from '../../store/slices/farmSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FarmScreenProps {
  navigation?: any;
}

export const FarmScreen: React.FC<FarmScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  
  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  const { farm, isLoading } = useSelector((state: RootState) => state.farm);
  const { goals } = useSelector((state: RootState) => state.financial);
  
  // Local state
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [isInteractive, setIsInteractive] = useState(true);
  const [viewportBounds, setViewportBounds] = useState({
    x: 0,
    y: 0,
    width: screenWidth,
    height: screenHeight * 0.6,
  });
  const [scale, setScale] = useState(1);
  
  // Performance monitoring
  const { frameRate, renderTime, measurePerformance } = useFarmPerformance();
  
  // Farm engine instance
  const [farmEngine, setFarmEngine] = useState<FarmEngine | null>(null);

  // Initialize farm engine
  useEffect(() => {
    // In a real app, this would be injected via dependency injection
    // For now, we'll create it here (this would need proper DAO instances)
    // setFarmEngine(new FarmEngine(farmDAO, cropDAO));
  }, []);

  // Update viewport bounds when scale changes
  const updateViewportBounds = useCallback(
    FarmOptimizationUtils.throttle((newScale: number, translateX: number, translateY: number) => {
      const bounds = FarmOptimizationUtils.calculateViewportBounds(
        screenWidth,
        screenHeight * 0.6,
        newScale,
        translateX,
        translateY
      );
      setViewportBounds(bounds);
      setScale(newScale);
    }, 16) // ~60fps
  , []);

  // Handle crop selection
  const handleCropSelect = useCallback((crop: Crop) => {
    setSelectedCrop(crop);
    
    // Find associated savings goal
    const associatedGoal = goals.find(goal => goal.id === crop.goalId);
    
    if (associatedGoal) {
      Alert.alert(
        `${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)} Crop`,
        `Goal: ${associatedGoal.title}\n` +
        `Progress: ${crop.growthProgress}%\n` +
        `Health: ${crop.healthPoints}%\n` +
        `Growth Stage: ${crop.growthStage}\n` +
        `Fertilizer Boost: ${crop.fertilizerBoost.toFixed(1)}x`,
        [
          {
            text: 'View Goal Details',
            onPress: () => {
              // Navigate to goal details screen
              if (navigation) {
                navigation.navigate('GoalDetails', { goalId: associatedGoal.id });
              }
            },
          },
          {
            text: 'Close',
            style: 'cancel',
          },
        ]
      );
    }
  }, [goals, navigation]);

  // Handle planting new crop
  const handlePlantCrop = useCallback(async (position: { x: number; y: number }) => {
    if (!user || !farmEngine) return;

    try {
      // Show goal selection dialog
      const availableGoals = goals.filter(goal => 
        goal.status === 'active' && 
        !farm?.crops.some(crop => crop.goalId === goal.id)
      );

      if (availableGoals.length === 0) {
        Alert.alert(
          'No Available Goals',
          'Create a savings goal first to plant a crop!',
          [
            {
              text: 'Create Goal',
              onPress: () => {
                if (navigation) {
                  navigation.navigate('CreateGoal');
                }
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      // For demo purposes, use the first available goal
      const goalToPlant = availableGoals[0];
      
      const newCrop = await farmEngine.plantCrop(user.id, goalToPlant);
      dispatch(updateCrop(newCrop));
      
      Alert.alert(
        'Crop Planted!',
        `Your ${newCrop.type} crop has been planted for the goal "${goalToPlant.title}".`
      );
    } catch (error) {
      console.error('Error planting crop:', error);
      Alert.alert('Error', 'Failed to plant crop. Please try again.');
    }
  }, [user, farmEngine, goals, farm, dispatch, navigation]);

  // Handle fertilizing crop
  const handleFertilizeCrop = useCallback(async (cropId: string) => {
    if (!farmEngine) return;

    try {
      // Simulate income amount and streak multiplier
      const incomeAmount = 1000; // This would come from actual income logging
      const streakMultiplier = 1.5; // This would come from user's streak data
      
      await farmEngine.applyFertilizer(cropId, incomeAmount, streakMultiplier);
      
      // Update local state
      const updatedCrop = farm?.crops.find(crop => crop.id === cropId);
      if (updatedCrop) {
        dispatch(updateCrop({
          ...updatedCrop,
          fertilizerBoost: Math.min(5, updatedCrop.fertilizerBoost + 0.5),
          lastFertilizedAt: new Date(),
        }));
      }
      
      Alert.alert('Fertilized!', 'Your crop has been fertilized and will grow faster!');
    } catch (error) {
      console.error('Error fertilizing crop:', error);
      Alert.alert('Error', 'Failed to fertilize crop. Please try again.');
    }
  }, [farmEngine, farm, dispatch]);

  // Handle harvesting crop
  const handleHarvestCrop = useCallback(async (cropId: string) => {
    if (!farmEngine) return;

    try {
      const crop = farm?.crops.find(c => c.id === cropId);
      if (!crop) return;

      const rewards = await farmEngine.triggerHarvest(crop.goalId);
      
      // Update local state
      dispatch(updateCrop({
        ...crop,
        growthStage: 'harvested' as any,
        harvestedAt: new Date(),
      }));
      
      const rewardText = rewards.map(r => `${r.title}: ${r.value} points`).join('\n');
      Alert.alert(
        'Harvest Complete!',
        `Congratulations! You've completed your savings goal!\n\nRewards:\n${rewardText}`
      );
    } catch (error) {
      console.error('Error harvesting crop:', error);
      Alert.alert('Error', 'Failed to harvest crop. Please try again.');
    }
  }, [farmEngine, farm, dispatch]);

  // Handle pulling weeds
  const handlePullWeeds = useCallback(async (cropId: string) => {
    if (!farmEngine || !user) return;

    try {
      // Simulate expense data that caused weeds
      const expenses = []; // This would come from actual expense data
      
      await farmEngine.processWeeds(user.id, expenses);
      
      // Update local state
      const updatedCrop = farm?.crops.find(crop => crop.id === cropId);
      if (updatedCrop) {
        dispatch(updateCrop({
          ...updatedCrop,
          weedPenalty: Math.max(0, updatedCrop.weedPenalty - 0.2),
          healthPoints: Math.min(100, updatedCrop.healthPoints + 10),
        }));
      }
      
      Alert.alert('Weeds Removed!', 'Your crop is healthier now!');
    } catch (error) {
      console.error('Error pulling weeds:', error);
      Alert.alert('Error', 'Failed to remove weeds. Please try again.');
    }
  }, [farmEngine, user, farm, dispatch]);

  // Performance monitoring display (development only)
  const renderPerformanceInfo = () => {
    if (__DEV__) {
      return (
        <View style={styles.performanceInfo}>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            FPS: {frameRate} | Render: {renderTime}ms
          </Typography>
        </View>
      );
    }
    return null;
  };

  if (isLoading || !farm) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Typography variant="body1" style={styles.loadingText}>
            Loading your farm...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Farm Header */}
      <View style={styles.header}>
        <Typography variant="h2" color={theme.colors.text}>
          My Farm
        </Typography>
        <View style={styles.farmStats}>
          <Card style={styles.statCard}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Health
            </Typography>
            <Typography variant="h3" color={theme.colors.primary}>
              {Math.round(farm.healthScore)}%
            </Typography>
          </Card>
          <Card style={styles.statCard}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Level
            </Typography>
            <Typography variant="h3" color={theme.colors.primary}>
              {farm.level}
            </Typography>
          </Card>
          <Card style={styles.statCard}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Crops
            </Typography>
            <Typography variant="h3" color={theme.colors.primary}>
              {farm.crops.length}
            </Typography>
          </Card>
        </View>
      </View>

      {/* Farm Canvas */}
      <View style={styles.farmContainer}>
        <FarmPerformanceOptimizer
          farm={farm}
          viewportBounds={viewportBounds}
          scale={scale}
        >
          <FarmInteractionHandler
            farm={farm}
            onCropSelect={handleCropSelect}
            onPlantCrop={handlePlantCrop}
            onFertilizeCrop={handleFertilizeCrop}
            onHarvestCrop={handleHarvestCrop}
            onPullWeeds={handlePullWeeds}
            isInteractive={isInteractive}
          />
        </FarmPerformanceOptimizer>
      </View>

      {/* Farm Controls */}
      <View style={styles.controls}>
        <Button
          title="Create Goal"
          onPress={() => navigation?.navigate('CreateGoal')}
          variant="primary"
          style={styles.controlButton}
        />
        <Button
          title="View Goals"
          onPress={() => navigation?.navigate('Goals')}
          variant="secondary"
          style={styles.controlButton}
        />
        <Button
          title="Analytics"
          onPress={() => navigation?.navigate('Analytics')}
          variant="secondary"
          style={styles.controlButton}
        />
      </View>

      {/* Performance Info (dev only) */}
      {renderPerformanceInfo()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  farmStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
    minWidth: 80,
  },
  farmContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    justifyContent: 'space-around',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  performanceInfo: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
  },
});