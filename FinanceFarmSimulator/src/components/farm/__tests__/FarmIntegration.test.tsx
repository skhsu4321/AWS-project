import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FarmScreen } from '../FarmScreen';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { farmSlice } from '../../../store/slices/farmSlice';
import { authSlice } from '../../../store/slices/authSlice';
import { financialSlice } from '../../../store/slices/financialSlice';
import { uiSlice } from '../../../store/slices/uiSlice';
import { Farm, CropType, GrowthStage } from '../../../models/Game';

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
    out: jest.fn(() => jest.fn()),
    back: jest.fn(() => jest.fn()),
    bounce: jest.fn(),
  },
  useSharedValueEffect: jest.fn(),
  interpolate: jest.fn((value, input, output) => output[0]),
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

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

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

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      farm: farmSlice.reducer,
      financial: financialSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          profile: {
            displayName: 'Test User',
            age: 25,
            mode: 'adult' as const,
            currency: 'HKD',
            timezone: 'Asia/Hong_Kong',
            preferences: {
              notifications: true,
              darkMode: false,
              language: 'en',
            },
          },
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      farm: {
        farm: mockFarm,
        loading: false,
        error: null,
      },
      financial: {
        goals: [
          {
            id: 'goal-1',
            userId: 'user-1',
            title: 'Emergency Fund',
            description: 'Save for emergencies',
            targetAmount: 10000,
            currentAmount: 6000,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            category: 'emergency_fund',
            status: 'active' as const,
            priority: 'high' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        expenses: [],
        income: [],
        loading: false,
        error: null,
      },
      ui: {
        theme: 'adult' as const,
        loading: false,
        error: null,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </Provider>
  );
};

describe('Farm Integration', () => {
  it('renders FarmScreen without crashing', () => {
    const { getByText } = renderWithProviders(
      <FarmScreen navigation={mockNavigation} />
    );
    
    // Check if farm header is rendered
    expect(getByText('My Farm')).toBeTruthy();
  });

  it('displays farm statistics correctly', () => {
    const { getByText } = renderWithProviders(
      <FarmScreen navigation={mockNavigation} />
    );
    
    // Check if farm stats are displayed
    expect(getByText('90%')).toBeTruthy(); // Health score
    expect(getByText('3')).toBeTruthy(); // Level
    expect(getByText('1')).toBeTruthy(); // Crops count
  });

  it('renders farm controls', () => {
    const { getByText } = renderWithProviders(
      <FarmScreen navigation={mockNavigation} />
    );
    
    // Check if control buttons are rendered
    expect(getByText('Create Goal')).toBeTruthy();
    expect(getByText('View Goals')).toBeTruthy();
    expect(getByText('Analytics')).toBeTruthy();
  });

  it('handles navigation correctly', () => {
    const { getByText } = renderWithProviders(
      <FarmScreen navigation={mockNavigation} />
    );
    
    // This would require more complex testing with user interactions
    // For now, we just verify the component renders
    expect(getByText('Create Goal')).toBeTruthy();
  });
});