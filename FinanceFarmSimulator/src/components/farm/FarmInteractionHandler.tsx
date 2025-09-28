import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Farm, Crop } from '../../models/Game';
import { FarmCanvas } from './FarmCanvas';
import {
  GrowthAnimation,
  FertilizerAnimation,
  HarvestAnimation,
  WeedPullingAnimation,
  PlantingAnimation,
} from './FarmAnimations';

interface FarmInteractionHandlerProps {
  farm: Farm;
  onCropSelect?: (crop: Crop) => void;
  onPlantCrop?: (position: { x: number; y: number }) => void;
  onFertilizeCrop?: (cropId: string) => void;
  onHarvestCrop?: (cropId: string) => void;
  onPullWeeds?: (cropId: string) => void;
  isInteractive?: boolean;
}

interface ActiveAnimation {
  type: 'growth' | 'fertilizer' | 'harvest' | 'weed' | 'planting';
  cropId?: string;
  position: { x: number; y: number };
  id: string;
}

export const FarmInteractionHandler: React.FC<FarmInteractionHandlerProps> = ({
  farm,
  onCropSelect,
  onPlantCrop,
  onFertilizeCrop,
  onHarvestCrop,
  onPullWeeds,
  isInteractive = true,
}) => {
  const [activeAnimations, setActiveAnimations] = useState<ActiveAnimation[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);

  // Handle crop tap
  const handleCropTap = useCallback((crop: Crop) => {
    if (!isInteractive) return;

    setSelectedCrop(crop);
    
    // Show crop action options
    const actions = [];
    
    if (crop.fertilizerBoost < 5) {
      actions.push({
        text: 'Fertilize',
        onPress: () => {
          if (onFertilizeCrop) {
            onFertilizeCrop(crop.id);
            triggerAnimation('fertilizer', crop.id, crop.position);
          }
        },
      });
    }
    
    if (crop.growthStage === 'ready_to_harvest') {
      actions.push({
        text: 'Harvest',
        onPress: () => {
          if (onHarvestCrop) {
            onHarvestCrop(crop.id);
            triggerAnimation('harvest', crop.id, crop.position);
          }
        },
      });
    }
    
    if (crop.weedPenalty > 0) {
      actions.push({
        text: 'Pull Weeds',
        onPress: () => {
          if (onPullWeeds) {
            onPullWeeds(crop.id);
            triggerAnimation('weed', crop.id, crop.position);
          }
        },
      });
    }

    actions.push({
      text: 'View Details',
      onPress: () => {
        if (onCropSelect) {
          onCropSelect(crop);
        }
      },
    });

    actions.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: () => setSelectedCrop(null),
    });

    Alert.alert(
      `${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)} Crop`,
      `Growth: ${crop.growthProgress}%\nHealth: ${crop.healthPoints}%`,
      actions
    );
  }, [isInteractive, onCropSelect, onFertilizeCrop, onHarvestCrop, onPullWeeds]);

  // Handle empty space tap
  const handleEmptySpaceTap = useCallback((position: { x: number; y: number }) => {
    if (!isInteractive) return;

    Alert.alert(
      'Plant New Crop',
      `Plant a crop at position (${position.x}, ${position.y})?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Plant',
          onPress: () => {
            if (onPlantCrop) {
              onPlantCrop(position);
              triggerAnimation('planting', undefined, position);
            }
          },
        },
      ]
    );
  }, [isInteractive, onPlantCrop]);

  // Trigger animation
  const triggerAnimation = useCallback((
    type: ActiveAnimation['type'],
    cropId?: string,
    position?: { x: number; y: number }
  ) => {
    if (!position && cropId) {
      const crop = farm.crops.find(c => c.id === cropId);
      if (crop) {
        position = crop.position;
      }
    }

    if (!position) return;

    const animationId = `${type}-${Date.now()}-${Math.random()}`;
    const newAnimation: ActiveAnimation = {
      type,
      cropId,
      position,
      id: animationId,
    };

    setActiveAnimations(prev => [...prev, newAnimation]);

    // Remove animation after completion
    setTimeout(() => {
      setActiveAnimations(prev => prev.filter(anim => anim.id !== animationId));
    }, 1500); // Animation duration
  }, [farm.crops]);

  // Trigger growth animation when crop growth stage changes
  React.useEffect(() => {
    // This would be triggered by external state changes
    // For now, we'll just monitor crop changes
    farm.crops.forEach(crop => {
      // Check if crop just advanced growth stage (this would need proper state tracking)
      // For demo purposes, we'll trigger growth animation for mature crops
      if (crop.growthStage === 'mature' && Math.random() < 0.1) {
        triggerAnimation('growth', crop.id, crop.position);
      }
    });
  }, [farm.crops, triggerAnimation]);

  // Convert grid position to canvas coordinates
  const gridToCanvas = useCallback((gridPos: { x: number; y: number }) => {
    const GRID_SIZE = 40;
    const CANVAS_WIDTH = 350; // Should match FarmCanvas
    const CANVAS_HEIGHT = 400;
    
    const farmWidth = farm.layout.width * GRID_SIZE;
    const farmHeight = farm.layout.height * GRID_SIZE;
    const offsetX = (CANVAS_WIDTH - farmWidth) / 2;
    const offsetY = (CANVAS_HEIGHT - farmHeight) / 2;
    
    return {
      x: offsetX + gridPos.x * GRID_SIZE + GRID_SIZE / 2,
      y: offsetY + gridPos.y * GRID_SIZE + GRID_SIZE / 2,
    };
  }, [farm.layout]);

  // Render active animations
  const renderAnimations = useCallback(() => {
    return activeAnimations.map(animation => {
      const canvasPos = gridToCanvas(animation.position);
      
      switch (animation.type) {
        case 'growth':
          return (
            <GrowthAnimation
              key={animation.id}
              x={canvasPos.x}
              y={canvasPos.y}
              isActive={true}
              onComplete={() => {
                setActiveAnimations(prev => 
                  prev.filter(anim => anim.id !== animation.id)
                );
              }}
            />
          );
        
        case 'fertilizer':
          return (
            <FertilizerAnimation
              key={animation.id}
              x={canvasPos.x}
              y={canvasPos.y}
              isActive={true}
              onComplete={() => {
                setActiveAnimations(prev => 
                  prev.filter(anim => anim.id !== animation.id)
                );
              }}
            />
          );
        
        case 'harvest':
          return (
            <HarvestAnimation
              key={animation.id}
              x={canvasPos.x}
              y={canvasPos.y}
              isActive={true}
              onComplete={() => {
                setActiveAnimations(prev => 
                  prev.filter(anim => anim.id !== animation.id)
                );
              }}
            />
          );
        
        case 'weed':
          return (
            <WeedPullingAnimation
              key={animation.id}
              x={canvasPos.x}
              y={canvasPos.y}
              isActive={true}
              onComplete={() => {
                setActiveAnimations(prev => 
                  prev.filter(anim => anim.id !== animation.id)
                );
              }}
            />
          );
        
        case 'planting':
          return (
            <PlantingAnimation
              key={animation.id}
              x={canvasPos.x}
              y={canvasPos.y}
              isActive={true}
              onComplete={() => {
                setActiveAnimations(prev => 
                  prev.filter(anim => anim.id !== animation.id)
                );
              }}
            />
          );
        
        default:
          return null;
      }
    });
  }, [activeAnimations, gridToCanvas]);

  return (
    <View style={styles.container}>
      <FarmCanvas
        farm={farm}
        onCropTap={handleCropTap}
        onEmptySpaceTap={handleEmptySpaceTap}
        isInteractive={isInteractive}
      />
      
      {/* Render animations overlay */}
      <View style={styles.animationOverlay} pointerEvents="none">
        {renderAnimations()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});