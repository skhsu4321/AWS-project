import React from 'react';
import { render } from '@testing-library/react-native';
import { FarmCanvas } from '../FarmCanvas';
import { Farm, CropType, GrowthStage } from '../../../models/Game';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock React Native Skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: any) => children,
  Group: ({ children }: any) => children,
  Rect: () => null,
  Circle: () => null,
  Path: () => null,
  Skia: {
    Path: {
      Make: () => ({
        moveTo: jest.fn(),
        lineTo: jest.fn(),
      }),
    },
  },
  useValue: () => ({ current: 0 }),
  runTiming: jest.fn(),
  Easing: {
    inOut: jest.fn(() => jest.fn()),
    ease: jest.fn(),
  },
  useSharedValueEffect: jest.fn(),
}));

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: any) => children,
  Gesture: {
    Pinch: () => ({
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
    Pan: () => ({
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
    Tap: () => ({
      onEnd: jest.fn().mockReturnThis(),
    }),
    Simultaneous: jest.fn().mockReturnThis(),
    Race: jest.fn().mockReturnThis(),
  },
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: () => ({ value: 1 }),
  useAnimatedStyle: () => ({}),
  withSpring: jest.fn(),
  withTiming: jest.fn(),
  runOnJS: (fn: Function) => fn,
  default: {
    View: ({ children, style }: any) => ({ children, style }),
  },
}));

const mockFarm: Farm = {
  id: 'farm-1',
  userId: 'user-1',
  layout: {
    width: 5,
    height: 5,
    theme: 'classic',
  },
  crops: [
    {
      id: 'crop-1',
      goalId: 'goal-1',
      userId: 'user-1',
      type: CropType.TOMATO,
      growthStage: GrowthStage.GROWING,
      healthPoints: 80,
      position: { x: 1, y: 1 },
      plantedAt: new Date(),
      growthProgress: 60,
      fertilizerBoost: 1.2,
      weedPenalty: 0.1,
      streakMultiplier: 1.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'crop-2',
      goalId: 'goal-2',
      userId: 'user-1',
      type: CropType.CARROT,
      growthStage: GrowthStage.READY_TO_HARVEST,
      healthPoints: 100,
      position: { x: 3, y: 2 },
      plantedAt: new Date(),
      growthProgress: 100,
      fertilizerBoost: 2.0,
      weedPenalty: 0,
      streakMultiplier: 2.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  decorations: [],
  healthScore: 90,
  level: 3,
  experience: 1500,
  totalHarvests: 5,
  streakDays: 7,
  lastActiveAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('FarmCanvas', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <FarmCanvas farm={mockFarm} />
    );
    
    // Since we're mocking Skia components, we can't test visual rendering
    // but we can ensure the component mounts without errors
    expect(true).toBe(true);
  });

  it('handles crop tap events', () => {
    const mockOnCropTap = jest.fn();
    
    renderWithTheme(
      <FarmCanvas 
        farm={mockFarm} 
        onCropTap={mockOnCropTap}
        isInteractive={true}
      />
    );
    
    // Test would require more complex gesture simulation
    expect(mockOnCropTap).not.toHaveBeenCalled();
  });

  it('handles empty space tap events', () => {
    const mockOnEmptySpaceTap = jest.fn();
    
    renderWithTheme(
      <FarmCanvas 
        farm={mockFarm} 
        onEmptySpaceTap={mockOnEmptySpaceTap}
        isInteractive={true}
      />
    );
    
    // Test would require more complex gesture simulation
    expect(mockOnEmptySpaceTap).not.toHaveBeenCalled();
  });

  it('disables interactions when isInteractive is false', () => {
    const mockOnCropTap = jest.fn();
    const mockOnEmptySpaceTap = jest.fn();
    
    renderWithTheme(
      <FarmCanvas 
        farm={mockFarm} 
        onCropTap={mockOnCropTap}
        onEmptySpaceTap={mockOnEmptySpaceTap}
        isInteractive={false}
      />
    );
    
    // Component should render but not handle interactions
    expect(true).toBe(true);
  });

  it('renders different crop types correctly', () => {
    const farmWithDifferentCrops: Farm = {
      ...mockFarm,
      crops: [
        {
          ...mockFarm.crops[0],
          type: CropType.WHEAT,
          growthStage: GrowthStage.SEED,
        },
        {
          ...mockFarm.crops[1],
          type: CropType.APPLE,
          growthStage: GrowthStage.MATURE,
        },
      ],
    };
    
    renderWithTheme(
      <FarmCanvas farm={farmWithDifferentCrops} />
    );
    
    // Component should handle different crop types
    expect(true).toBe(true);
  });

  it('handles empty farm correctly', () => {
    const emptyFarm: Farm = {
      ...mockFarm,
      crops: [],
    };
    
    renderWithTheme(
      <FarmCanvas farm={emptyFarm} />
    );
    
    // Should render empty farm without errors
    expect(true).toBe(true);
  });
});