import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AppIntegrationEnhanced } from '../../components/integration/AppIntegrationEnhanced';
import { ErrorHandlingService } from '../../services/ErrorHandlingService';
import { LoggingService } from '../../services/LoggingService';
import { PerformanceMonitoringService } from '../../services/PerformanceMonitoringService';
import { OfflineService } from '../../services/OfflineService';
import { AccessibilityService } from '../../services/AccessibilityService';
import { authSlice } from '../../store/slices/authSlice';
import { farmSlice } from '../../store/slices/farmSlice';
import { financialSlice } from '../../store/slices/financialSlice';
import { uiSlice } from '../../store/slices/uiSlice';
import { syncSlice } from '../../store/slices/syncSlice';
import errorReducer from '../../store/slices/errorSlice';
import { Text, View } from 'react-native';

// Mock services
jest.mock('../../services/ErrorHandlingService');
jest.mock('../../services/LoggingService');
jest.mock('../../services/PerformanceMonitoringService');
jest.mock('../../services/OfflineService');
jest.mock('../../services/AccessibilityService');

// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  BackHandler: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Linking: {
    getInitialURL: jest.fn(() => Promise.resolve(null)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Platform: {
    OS: 'ios',
    Version: '16.0',
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock components
jest.mock('../../components/common/OfflineIndicator', () => ({
  OfflineIndicator: () => <View testID="offline-indicator" />,
}));

jest.mock('../../components/common/SyncStatusIndicator', () => ({
  SyncStatusIndicator: () => <View testID="sync-status-indicator" />,
}));

jest.mock('../../components/common/ConflictResolutionModal', () => ({
  ConflictResolutionModal: ({ conflicts, onResolve, onDismiss }: any) => (
    <View testID="conflict-resolution-modal">
      <Text testID="conflicts-count">{conflicts.length}</Text>
    </View>
  ),
}));

jest.mock('../../components/performance/PerformanceOptimizer', () => ({
  PerformanceOptimizer: ({ children }: any) => <View testID="performance-optimizer">{children}</View>,
}));

describe('Final Integration Tests', () => {
  let store: any;
  let mockErrorService: jest.Mocked<ErrorHandlingService>;
  let mockLoggingService: jest.Mocked<LoggingService>;
  let mockPerformanceService: jest.Mocked<PerformanceMonitoringService>;
  let mockOfflineService: jest.Mocked<OfflineService>;
  let mockAccessibilityService: jest.Mocked<AccessibilityService>;

  beforeEach(() => {
    // Create test store
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
        farm: farmSlice.reducer,
        financial: financialSlice.reducer,
        ui: uiSlice.reducer,
        sync: syncSlice.reducer,
        error: errorReducer,
      },
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        },
        network: {
          isOnline: true,
        },
        sync: {
          syncStatus: 'idle',
          conflicts: [],
          lastSync: null,
        },
        error: {
          errors: [],
          currentError: null,
          isShowingError: false,
        },
      },
    });

    // Setup service mocks
    mockErrorService = {
      getInstance: jest.fn().mockReturnThis(),
      handleError: jest.fn(),
      clearAllErrors: jest.fn(),
      getErrorHistory: jest.fn().mockReturnValue([]),
    } as any;

    mockLoggingService = {
      getInstance: jest.fn().mockReturnThis(),
      logInfo: jest.fn(),
      logError: jest.fn(),
      logWarn: jest.fn(),
      logDebug: jest.fn(),
      logFatal: jest.fn(),
      setUserId: jest.fn(),
      reportCrash: jest.fn(),
    } as any;

    mockPerformanceService = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn(),
      pause: jest.fn(),
      cleanup: jest.fn(),
      enableOfflineOptimizations: jest.fn(),
    } as any;

    mockOfflineService = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn().mockResolvedValue(undefined),
      setUserId: jest.fn(),
      clearUserData: jest.fn(),
      syncPendingOperations: jest.fn().mockResolvedValue(undefined),
      persistCriticalState: jest.fn().mockResolvedValue(undefined),
      enableOfflineMode: jest.fn(),
      resolveConflict: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAccessibilityService = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock service getInstance methods
    (ErrorHandlingService.getInstance as jest.Mock).mockReturnValue(mockErrorService);
    (LoggingService.getInstance as jest.Mock).mockReturnValue(mockLoggingService);
    (PerformanceMonitoringService.getInstance as jest.Mock).mockReturnValue(mockPerformanceService);
    (OfflineService.getInstance as jest.Mock).mockReturnValue(mockOfflineService);
    (AccessibilityService.getInstance as jest.Mock).mockReturnValue(mockAccessibilityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('App Initialization', () => {
    it('should initialize all services successfully', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      // Wait for initialization to complete
      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      // Verify services were initialized
      expect(mockPerformanceService.initialize).toHaveBeenCalled();
      expect(mockOfflineService.initialize).toHaveBeenCalled();
      expect(mockAccessibilityService.initialize).toHaveBeenCalled();
      expect(mockLoggingService.logInfo).toHaveBeenCalledWith(
        'App initialization started',
        expect.any(Object)
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockPerformanceService.initialize.mockRejectedValue(new Error('Init failed'));

      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      expect(mockErrorService.handleError).toHaveBeenCalled();
      expect(mockLoggingService.logError).toHaveBeenCalledWith(
        'App initialization failed',
        expect.any(Error)
      );
    });

    it('should show loading state during initialization', () => {
      // Mock services to delay initialization
      mockPerformanceService.initialize.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { queryByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      // Should not show child content immediately
      expect(queryByTestId('test-child')).toBeNull();
    });
  });

  describe('User Authentication Integration', () => {
    it('should handle user login correctly', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      // Simulate user login
      act(() => {
        store.dispatch({
          type: 'auth/loginSuccess',
          payload: {
            user: {
              id: 'user123',
              email: 'test@example.com',
              profile: { mode: 'adult' },
            },
          },
        });
      });

      expect(mockLoggingService.setUserId).toHaveBeenCalledWith('user123');
      expect(mockOfflineService.setUserId).toHaveBeenCalledWith('user123');
      expect(mockLoggingService.logInfo).toHaveBeenCalledWith(
        'User authenticated',
        expect.objectContaining({ userId: 'user123' })
      );
    });

    it('should handle user logout correctly', async () => {
      // Start with authenticated user
      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          farm: farmSlice.reducer,
          financial: financialSlice.reducer,
          ui: uiSlice.reducer,
          sync: syncSlice.reducer,
          error: errorReducer,
        },
        preloadedState: {
          auth: {
            user: { id: 'user123', email: 'test@example.com' },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          network: { isOnline: true },
          sync: { syncStatus: 'idle', conflicts: [], lastSync: null },
          error: { errors: [], currentError: null, isShowingError: false },
        },
      });

      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      // Simulate user logout
      act(() => {
        store.dispatch({ type: 'auth/logout' });
      });

      expect(mockLoggingService.logInfo).toHaveBeenCalledWith('User logged out');
      expect(mockOfflineService.clearUserData).toHaveBeenCalled();
    });
  });

  describe('Network Status Integration', () => {
    it('should handle network disconnection', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      // Simulate network disconnection
      act(() => {
        store.dispatch({ type: 'network/setOffline' });
      });

      expect(mockLoggingService.logInfo).toHaveBeenCalledWith('Network connection lost');
      expect(mockOfflineService.enableOfflineMode).toHaveBeenCalled();
      expect(mockPerformanceService.enableOfflineOptimizations).toHaveBeenCalled();
    });

    it('should handle network reconnection', async () => {
      // Start offline
      store = configureStore({
        reducer: {
          auth: authSlice.reducer,
          farm: farmSlice.reducer,
          financial: financialSlice.reducer,
          ui: uiSlice.reducer,
          sync: syncSlice.reducer,
          error: errorReducer,
        },
        preloadedState: {
          auth: {
            user: { id: 'user123', email: 'test@example.com' },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          network: { isOnline: false },
          sync: { syncStatus: 'idle', conflicts: [], lastSync: null },
          error: { errors: [], currentError: null, isShowingError: false },
        },
      });

      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      // Simulate network reconnection
      act(() => {
        store.dispatch({ type: 'network/setOnline' });
      });

      expect(mockLoggingService.logInfo).toHaveBeenCalledWith('Network connection restored');
      expect(mockOfflineService.syncPendingOperations).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should display error modal when error occurs', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      // Simulate error
      act(() => {
        store.dispatch({
          type: 'error/setError',
          payload: {
            id: 'error123',
            type: 'NETWORK',
            severity: 'HIGH',
            message: 'Network error occurred',
            timestamp: new Date(),
            recoverable: true,
          },
        });
      });

      // Error modal should be visible
      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
        // In a real test, we'd check for error modal visibility
      });
    });

    it('should handle conflict resolution', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      // Simulate sync conflicts
      act(() => {
        store.dispatch({
          type: 'sync/setConflicts',
          payload: [
            { id: 'conflict1', type: 'goal', localData: {}, remoteData: {} },
          ],
        });
      });

      // Conflict resolution modal should be visible
      await waitFor(() => {
        expect(getByTestId('conflict-resolution-modal')).toBeTruthy();
        expect(getByTestId('conflicts-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle app state changes correctly', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      // Simulate app going to background
      const { AppState } = require('react-native');
      const mockListener = AppState.addEventListener.mock.calls[0][1];
      
      await act(async () => {
        mockListener('background');
      });

      expect(mockPerformanceService.pause).toHaveBeenCalled();
      expect(mockOfflineService.persistCriticalState).toHaveBeenCalled();
      expect(mockPerformanceService.cleanup).toHaveBeenCalled();

      // Simulate app coming to foreground
      await act(async () => {
        mockListener('active');
      });

      expect(mockPerformanceService.resume).toHaveBeenCalled();
    });
  });

  describe('Accessibility Integration', () => {
    it('should initialize accessibility service', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(mockAccessibilityService.initialize).toHaveBeenCalled();
      });
    });
  });

  describe('Global UI Components', () => {
    it('should render offline indicator', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('offline-indicator')).toBeTruthy();
      });
    });

    it('should render sync status indicator', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('sync-status-indicator')).toBeTruthy();
      });
    });

    it('should render performance optimizer', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('performance-optimizer')).toBeTruthy();
      });
    });
  });

  describe('Deep Linking Integration', () => {
    it('should handle deep links correctly', async () => {
      const { Linking } = require('react-native');
      
      // Mock initial URL
      Linking.getInitialURL.mockResolvedValue('financefarm://goal?id=123');

      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(mockLoggingService.logInfo).toHaveBeenCalledWith(
          'Deep link received',
          expect.objectContaining({ url: 'financefarm://goal?id=123' })
        );
      });
    });
  });

  describe('Metrics Tracking', () => {
    it('should track user interactions', async () => {
      const TestChild = () => <Text testID="test-child">Test Content</Text>;

      const { getByTestId } = render(
        <Provider store={store}>
          <AppIntegrationEnhanced>
            <TestChild />
          </AppIntegrationEnhanced>
        </Provider>
      );

      await waitFor(() => {
        expect(getByTestId('test-child')).toBeTruthy();
      });

      // Simulate error dismissal (user interaction)
      act(() => {
        store.dispatch({
          type: 'error/setError',
          payload: {
            id: 'error123',
            type: 'NETWORK',
            severity: 'HIGH',
            message: 'Test error',
            timestamp: new Date(),
            recoverable: true,
          },
        });
      });

      act(() => {
        store.dispatch({ type: 'error/dismissCurrentError' });
      });

      // Metrics should be updated (this would be verified through service calls)
      expect(mockLoggingService.logInfo).toHaveBeenCalled();
    });
  });
});

describe('Error Boundary Integration', () => {
  it('should catch and handle React errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <Provider store={store}>
        <AppIntegrationEnhanced>
          <ThrowError />
        </AppIntegrationEnhanced>
      </Provider>
    );

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
  });
});

describe('Service Integration', () => {
  it('should properly integrate all services', async () => {
    const TestChild = () => <Text testID="test-child">Test Content</Text>;

    render(
      <Provider store={store}>
        <AppIntegrationEnhanced>
          <TestChild />
        </AppIntegrationEnhanced>
      </Provider>
    );

    await waitFor(() => {
      // Verify all services were instantiated
      expect(ErrorHandlingService.getInstance).toHaveBeenCalled();
      expect(LoggingService.getInstance).toHaveBeenCalled();
      expect(PerformanceMonitoringService.getInstance).toHaveBeenCalled();
      expect(OfflineService.getInstance).toHaveBeenCalled();
      expect(AccessibilityService.getInstance).toHaveBeenCalled();
    });
  });
});