import React from 'react';
import { render, act } from '../../utils/testHelpers';
import { FarmCanvas } from '../../components/farm/FarmCanvas';
import { FarmAnimations } from '../../components/farm/FarmAnimations';
import { CropSprite } from '../../components/farm/CropSprite';
import { measureRenderTime, waitForAnimationFrame } from '../../utils/testHelpers';

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: any) => ({ value: initial }),
  useAnimatedStyle: (fn: any) => fn(),
  withTiming: (value: any) => value,
  withSpring: (value: any) => value,
  withSequence: (...values: any[]) => values[values.length - 1],
  runOnJS: (fn: any) => fn,
  interpolate: (value: any, input: any[], output: any[]) => output[0],
}));

// Mock React Native Skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: any) => children,
  Group: ({ children }: any) => children,
  Circle: () => null,
  Rect: () => null,
  Path: () => null,
  useValue: (initial: any) => ({ current: initial }),
  useTiming: () => ({ current: 0 }),
}));

describe('Animation Performance Tests', () => {
  const mockFarmData = {
    id: 'test-farm',
    userId: 'test-user',
    crops: [
      {
        id: 'crop-1',
        goalId: 'goal-1',
        type: 'apple',
        growthStage: 2,
        healthPoints: 80,
        position: { x: 100, y: 100 },
        plantedAt: new Date(),
      },
      {
        id: 'crop-2',
        goalId: 'goal-2',
        type: 'carrot',
        growthStage: 1,
        healthPoints: 90,
        position: { x: 200, y: 150 },
        plantedAt: new Date(),
      },
    ],
    layout: { width: 400, height: 300, plots: [] },
    decorations: [],
    healthScore: 85,
    level: 3,
    experience: 1250,
  };

  describe('Farm Canvas Rendering Performance', () => {
    it('should render farm canvas within performance budget', async () => {
      const renderTime = await measureRenderTime(() => {
        render(<FarmCanvas farm={mockFarmData} onCropTap={jest.fn()} />);
      });

      // Should render within 16ms (60fps budget)
      expect(renderTime).toBeLessThan(16);
    });

    it('should handle large number of crops efficiently', async () => {
      const largeFarm = {
        ...mockFarmData,
        crops: Array.from({ length: 50 }, (_, i) => ({
          id: `crop-${i}`,
          goalId: `goal-${i}`,
          type: 'apple',
          growthStage: Math.floor(Math.random() * 4),
          healthPoints: 80 + Math.random() * 20,
          position: { x: (i % 10) * 40, y: Math.floor(i / 10) * 40 },
          plantedAt: new Date(),
        })),
      };

      const renderTime = await measureRenderTime(() => {
        render(<FarmCanvas farm={largeFarm} onCropTap={jest.fn()} />);
      });

      // Should still render within reasonable time even with many crops
      expect(renderTime).toBeLessThan(50);
    });

    it('should maintain 60fps during pan and zoom operations', async () => {
      const { getByTestId } = render(
        <FarmCanvas farm={mockFarmData} onCropTap={jest.fn()} />
      );

      const canvas = getByTestId('farm-canvas');
      
      // Simulate pan gesture
      const panTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        act(() => {
          canvas.props.onPanGestureEvent({
            nativeEvent: { translationX: i * 10, translationY: i * 5 },
          });
        });
        
        await waitForAnimationFrame();
        const endTime = performance.now();
        panTimes.push(endTime - startTime);
      }

      // Average frame time should be under 16ms
      const averageFrameTime = panTimes.reduce((a, b) => a + b, 0) / panTimes.length;
      expect(averageFrameTime).toBeLessThan(16);
    });
  });

  describe('Crop Animation Performance', () => {
    it('should animate crop growth smoothly', async () => {
      const mockCrop = mockFarmData.crops[0];
      
      const renderTime = await measureRenderTime(() => {
        render(
          <CropSprite
            crop={mockCrop}
            onTap={jest.fn()}
            animateGrowth={true}
          />
        );
      });

      expect(renderTime).toBeLessThan(10);
    });

    it('should handle multiple simultaneous crop animations', async () => {
      const animationTimes: number[] = [];

      for (const crop of mockFarmData.crops) {
        const startTime = performance.now();
        
        render(
          <CropSprite
            crop={crop}
            onTap={jest.fn()}
            animateGrowth={true}
          />
        );
        
        await waitForAnimationFrame();
        const endTime = performance.now();
        animationTimes.push(endTime - startTime);
      }

      // All animations should complete within budget
      animationTimes.forEach(time => {
        expect(time).toBeLessThan(16);
      });
    });

    it('should optimize animation memory usage', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Render multiple animated crops
      const crops = Array.from({ length: 20 }, (_, i) => (
        <CropSprite
          key={i}
          crop={{
            ...mockFarmData.crops[0],
            id: `crop-${i}`,
            position: { x: i * 20, y: i * 20 },
          }}
          onTap={jest.fn()}
          animateGrowth={true}
        />
      ));

      render(<>{crops}</>);

      // Wait for animations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Farm Animation System Performance', () => {
    it('should handle fertilizer animations efficiently', async () => {
      const { getByTestId } = render(
        <FarmAnimations
          farmId="test-farm"
          animations={[
            {
              type: 'fertilizer',
              cropId: 'crop-1',
              position: { x: 100, y: 100 },
              duration: 1000,
            },
          ]}
        />
      );

      const animationContainer = getByTestId('farm-animations');
      expect(animationContainer).toBeTruthy();

      // Animation should not block the main thread
      const startTime = performance.now();
      await waitForAnimationFrame();
      const frameTime = performance.now() - startTime;
      
      expect(frameTime).toBeLessThan(16);
    });

    it('should handle harvest celebrations without performance drops', async () => {
      const harvestAnimations = Array.from({ length: 5 }, (_, i) => ({
        type: 'harvest' as const,
        cropId: `crop-${i}`,
        position: { x: i * 50, y: i * 50 },
        duration: 2000,
      }));

      const renderTime = await measureRenderTime(() => {
        render(
          <FarmAnimations
            farmId="test-farm"
            animations={harvestAnimations}
          />
        );
      });

      expect(renderTime).toBeLessThan(20);
    });

    it('should clean up completed animations to prevent memory leaks', async () => {
      const { rerender } = render(
        <FarmAnimations
          farmId="test-farm"
          animations={[
            {
              type: 'weed-pull',
              cropId: 'crop-1',
              position: { x: 100, y: 100 },
              duration: 500,
            },
          ]}
        />
      );

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 600));

      // Re-render with no animations
      rerender(
        <FarmAnimations
          farmId="test-farm"
          animations={[]}
        />
      );

      // Should not have any active animations
      const animationContainer = document.querySelector('[data-testid="farm-animations"]');
      expect(animationContainer?.children.length).toBe(0);
    });
  });

  describe('Interaction Performance', () => {
    it('should respond to touch events within acceptable latency', async () => {
      const onCropTap = jest.fn();
      const { getByTestId } = render(
        <FarmCanvas farm={mockFarmData} onCropTap={onCropTap} />
      );

      const crop = getByTestId('crop-crop-1');
      
      const startTime = performance.now();
      act(() => {
        crop.props.onPress();
      });
      const responseTime = performance.now() - startTime;

      // Touch response should be under 100ms
      expect(responseTime).toBeLessThan(100);
      expect(onCropTap).toHaveBeenCalledWith('crop-1');
    });

    it('should handle rapid touch events without dropping frames', async () => {
      const onCropTap = jest.fn();
      const { getByTestId } = render(
        <FarmCanvas farm={mockFarmData} onCropTap={onCropTap} />
      );

      const crop = getByTestId('crop-crop-1');
      const responseTimes: number[] = [];

      // Simulate rapid tapping
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        act(() => {
          crop.props.onPress();
        });
        const responseTime = performance.now() - startTime;
        responseTimes.push(responseTime);
        
        await waitForAnimationFrame();
      }

      // All responses should be fast
      responseTimes.forEach(time => {
        expect(time).toBeLessThan(50);
      });

      expect(onCropTap).toHaveBeenCalledTimes(10);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during animation cycles', async () => {
      const getMemoryUsage = () => (performance as any).memory?.usedJSHeapSize || 0;
      
      const initialMemory = getMemoryUsage();

      // Run multiple animation cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        const { unmount } = render(
          <FarmCanvas farm={mockFarmData} onCropTap={jest.fn()} />
        );

        // Wait for animations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        unmount();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    it('should properly dispose of animation resources', async () => {
      const { unmount } = render(
        <FarmAnimations
          farmId="test-farm"
          animations={[
            {
              type: 'fertilizer',
              cropId: 'crop-1',
              position: { x: 100, y: 100 },
              duration: 1000,
            },
          ]}
        />
      );

      // Start animation
      await waitForAnimationFrame();

      // Unmount component
      unmount();

      // Should not have any lingering timers or intervals
      expect(setTimeout).not.toHaveBeenCalled();
      expect(setInterval).not.toHaveBeenCalled();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet target performance metrics', async () => {
      const metrics = {
        renderTime: 0,
        animationFrameRate: 0,
        memoryUsage: 0,
        touchLatency: 0,
      };

      // Measure render time
      metrics.renderTime = await measureRenderTime(() => {
        render(<FarmCanvas farm={mockFarmData} onCropTap={jest.fn()} />);
      });

      // Measure animation frame rate
      const frameStartTime = performance.now();
      for (let i = 0; i < 60; i++) {
        await waitForAnimationFrame();
      }
      const frameEndTime = performance.now();
      metrics.animationFrameRate = 60000 / (frameEndTime - frameStartTime);

      // Measure memory usage
      metrics.memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

      // Measure touch latency
      const { getByTestId } = render(
        <FarmCanvas farm={mockFarmData} onCropTap={jest.fn()} />
      );
      const crop = getByTestId('crop-crop-1');
      const touchStartTime = performance.now();
      act(() => {
        crop.props.onPress();
      });
      metrics.touchLatency = performance.now() - touchStartTime;

      // Assert performance targets
      expect(metrics.renderTime).toBeLessThan(16); // 60fps
      expect(metrics.animationFrameRate).toBeGreaterThan(55); // Close to 60fps
      expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // Under 50MB
      expect(metrics.touchLatency).toBeLessThan(100); // Under 100ms
    });
  });
});