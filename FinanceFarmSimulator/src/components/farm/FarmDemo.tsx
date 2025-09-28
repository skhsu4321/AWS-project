import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { Farm, Crop, CropType, GrowthStage } from '../../models/Game';
import { FarmInteractionHandler } from './FarmInteractionHandler';
import { Button } from '../common/Button';
import { v4 as uuidv4 } from 'uuid';

// Demo component to showcase farm visualization and animation system
export const FarmDemo: React.FC = () => {
  const [farm, setFarm] = useState<Farm>(() => createDemoFarm());
  const [animationCount, setAnimationCount] = useState(0);

  // Create a demo farm with various crop types and growth stages
  function createDemoFarm(): Farm {
    const now = new Date();
    const crops: Crop[] = [
      {
        id: uuidv4(),
        goalId: uuidv4(),
        userId: 'demo-user',
        type: CropType.TOMATO,
        growthStage: GrowthStage.SEED,
        healthPoints: 100,
        position: { x: 1, y: 1 },
        plantedAt: now,
        growthProgress: 10,
        fertilizerBoost: 1.0,
        weedPenalty: 0,
        streakMultiplier: 1.0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        goalId: uuidv4(),
        userId: 'demo-user',
        type: CropType.CARROT,
        growthStage: GrowthStage.SPROUT,
        healthPoints: 90,
        position: { x: 3, y: 1 },
        plantedAt: now,
        growthProgress: 25,
        fertilizerBoost: 1.2,
        weedPenalty: 0.1,
        streakMultiplier: 1.2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        goalId: uuidv4(),
        userId: 'demo-user',
        type: CropType.CORN,
        growthStage: GrowthStage.GROWING,
        healthPoints: 85,
        position: { x: 2, y: 3 },
        plantedAt: now,
        growthProgress: 50,
        fertilizerBoost: 1.5,
        weedPenalty: 0.05,
        streakMultiplier: 1.8,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        goalId: uuidv4(),
        userId: 'demo-user',
        type: CropType.WHEAT,
        growthStage: GrowthStage.MATURE,
        healthPoints: 95,
        position: { x: 4, y: 2 },
        plantedAt: now,
        growthProgress: 80,
        fertilizerBoost: 2.0,
        weedPenalty: 0,
        streakMultiplier: 2.5,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        goalId: uuidv4(),
        userId: 'demo-user',
        type: CropType.APPLE,
        growthStage: GrowthStage.READY_TO_HARVEST,
        healthPoints: 100,
        position: { x: 0, y: 4 },
        plantedAt: now,
        growthProgress: 100,
        fertilizerBoost: 3.0,
        weedPenalty: 0,
        streakMultiplier: 3.0,
        createdAt: now,
        updatedAt: now,
      },
    ];

    return {
      id: uuidv4(),
      userId: 'demo-user',
      layout: {
        width: 6,
        height: 6,
        theme: 'classic',
      },
      crops,
      decorations: [],
      healthScore: 92,
      level: 5,
      experience: 2500,
      totalHarvests: 12,
      streakDays: 15,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Simulate crop growth over time
  useEffect(() => {
    const interval = setInterval(() => {
      setFarm(prevFarm => {
        const updatedCrops = prevFarm.crops.map(crop => {
          if (crop.growthStage === GrowthStage.READY_TO_HARVEST) {
            return crop; // Don't update ready crops
          }

          const newProgress = Math.min(100, crop.growthProgress + Math.random() * 5);
          let newStage = crop.growthStage;

          if (newProgress >= 100) newStage = GrowthStage.READY_TO_HARVEST;
          else if (newProgress >= 80) newStage = GrowthStage.MATURE;
          else if (newProgress >= 50) newStage = GrowthStage.GROWING;
          else if (newProgress >= 20) newStage = GrowthStage.SPROUT;

          return {
            ...crop,
            growthProgress: newProgress,
            growthStage: newStage,
            updatedAt: new Date(),
          };
        });

        return {
          ...prevFarm,
          crops: updatedCrops,
          updatedAt: new Date(),
        };
      });
    }, 3000); // Update every 3 seconds for demo

    return () => clearInterval(interval);
  }, []);

  const handleCropSelect = (crop: Crop) => {
    Alert.alert(
      `${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)} Crop`,
      `Growth: ${Math.round(crop.growthProgress)}%\n` +
      `Health: ${crop.healthPoints}%\n` +
      `Stage: ${crop.growthStage}\n` +
      `Fertilizer Boost: ${crop.fertilizerBoost.toFixed(1)}x\n` +
      `Streak Multiplier: ${crop.streakMultiplier.toFixed(1)}x`,
      [{ text: 'OK' }]
    );
  };

  const handlePlantCrop = (position: { x: number; y: number }) => {
    const cropTypes = Object.values(CropType);
    const randomType = cropTypes[Math.floor(Math.random() * cropTypes.length)];
    
    const newCrop: Crop = {
      id: uuidv4(),
      goalId: uuidv4(),
      userId: 'demo-user',
      type: randomType,
      growthStage: GrowthStage.SEED,
      healthPoints: 100,
      position,
      plantedAt: new Date(),
      growthProgress: 0,
      fertilizerBoost: 1.0,
      weedPenalty: 0,
      streakMultiplier: 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setFarm(prevFarm => ({
      ...prevFarm,
      crops: [...prevFarm.crops, newCrop],
      updatedAt: new Date(),
    }));

    Alert.alert('Crop Planted!', `${randomType} planted at (${position.x}, ${position.y})`);
  };

  const handleFertilizeCrop = (cropId: string) => {
    setFarm(prevFarm => ({
      ...prevFarm,
      crops: prevFarm.crops.map(crop =>
        crop.id === cropId
          ? {
              ...crop,
              fertilizerBoost: Math.min(5, crop.fertilizerBoost + 0.5),
              lastFertilizedAt: new Date(),
              updatedAt: new Date(),
            }
          : crop
      ),
      updatedAt: new Date(),
    }));

    setAnimationCount(prev => prev + 1);
    Alert.alert('Fertilized!', 'Crop has been fertilized and will grow faster!');
  };

  const handleHarvestCrop = (cropId: string) => {
    const crop = farm.crops.find(c => c.id === cropId);
    if (!crop) return;

    setFarm(prevFarm => ({
      ...prevFarm,
      crops: prevFarm.crops.filter(c => c.id !== cropId),
      totalHarvests: prevFarm.totalHarvests + 1,
      experience: prevFarm.experience + 100,
      updatedAt: new Date(),
    }));

    setAnimationCount(prev => prev + 1);
    Alert.alert(
      'Harvest Complete!',
      `Congratulations! You harvested a ${crop.type}!\n\n+100 XP gained!`
    );
  };

  const handlePullWeeds = (cropId: string) => {
    setFarm(prevFarm => ({
      ...prevFarm,
      crops: prevFarm.crops.map(crop =>
        crop.id === cropId
          ? {
              ...crop,
              weedPenalty: Math.max(0, crop.weedPenalty - 0.2),
              healthPoints: Math.min(100, crop.healthPoints + 10),
              updatedAt: new Date(),
            }
          : crop
      ),
      updatedAt: new Date(),
    }));

    setAnimationCount(prev => prev + 1);
    Alert.alert('Weeds Removed!', 'Your crop is healthier now!');
  };

  const resetDemo = () => {
    setFarm(createDemoFarm());
    setAnimationCount(0);
  };

  return (
    <View style={styles.container}>
      {/* Demo Info */}
      <View style={styles.header}>
        <Text style={styles.title}>Farm Visualization Demo</Text>
        <Text style={styles.subtitle}>
          Interactive farm with React Native Skia rendering
        </Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>Crops: {farm.crops.length}</Text>
          <Text style={styles.stat}>Health: {Math.round(farm.healthScore)}%</Text>
          <Text style={styles.stat}>Level: {farm.level}</Text>
          <Text style={styles.stat}>Animations: {animationCount}</Text>
        </View>
      </View>

      {/* Farm Canvas */}
      <View style={styles.farmContainer}>
        <FarmInteractionHandler
          farm={farm}
          onCropSelect={handleCropSelect}
          onPlantCrop={handlePlantCrop}
          onFertilizeCrop={handleFertilizeCrop}
          onHarvestCrop={handleHarvestCrop}
          onPullWeeds={handlePullWeeds}
          isInteractive={true}
        />
      </View>

      {/* Demo Controls */}
      <View style={styles.controls}>
        <Button
          title="Reset Demo"
          onPress={resetDemo}
          variant="secondary"
          style={styles.controlButton}
        />
      </View>

      {/* Performance Info */}
      <View style={styles.performanceInfo}>
        <Text style={styles.performanceText}>
          • Tap crops to interact with them
        </Text>
        <Text style={styles.performanceText}>
          • Tap empty spaces to plant new crops
        </Text>
        <Text style={styles.performanceText}>
          • Zoom and pan to explore the farm
        </Text>
        <Text style={styles.performanceText}>
          • Crops grow automatically over time
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  stat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  farmContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
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
    justifyContent: 'center',
  },
  controlButton: {
    minWidth: 120,
  },
  performanceInfo: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  performanceText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});