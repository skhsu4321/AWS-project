import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Alert, 
  AppState, 
  AppStateStatus, 
  BackHandler,
  Linking,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { ErrorHandlingService, ErrorSeverity } from '../../services/ErrorHandlingService';
import { LoggingService } from '../../services/LoggingService';
import { PerformanceMonitoringService } from '../../services/PerformanceMonitoringService';
import { OfflineService } from '../../services/OfflineService';
import { AccessibilityService } from '../../services/AccessibilityService';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { SyncStatusIndicator } from '../common/SyncStatusIndicator';
import { ConflictResolutionModal } from '../common/ConflictResolutionModal';
import { ErrorBoundary } from './ErrorBoundary';
import { PerformanceOptimizer } from '../performance/PerformanceOptimizer';
import { AnimatedTransitions } from '../common/AnimatedTransitions';
import { MicroInteractions } from '../common/MicroInteractions';

interface AppIntegrationEnhancedProps {
  children: React.ReactNode;
}

interface AppMetrics {
  sessionStart: Date;
  crashCount: number;
  errorCount: number;
  performanceIssues: number;
  userInteractions: number;
}

export const AppIntegrationEnhanced: React.FC<AppIntegrationEnhancedProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isOnline } = useSelector((state: RootState) => state.network);
  const { syncStatus, conflicts } = useSelector((state: RootState) => state.sync);
  const { currentError, errors } = useSelector((state: RootState) => state.error);
  
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [metrics, setMetrics] = useState<AppMetrics>({
    sessionStart: new Date(),
    crashCount: 0,
    errorCount: 0,
    performanceIssues: 0,
    userInteractions: 0,
  });

  // Service instances
  const [errorService] = useState(() => ErrorHandlingService.getInstance());
  const [loggingService] = useState(() => LoggingService.getInstance());
  const [performanceService] = useState(() => PerformanceMonitoringService.getInstance());
  const [offlineService] = useState(() => OfflineService.getInstance());
  const [accessibilityService] = useState(() => AccessibilityService.getInstance());

  // Initialize app and services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        loggingService.logInfo('App initialization started', {
          platform: Platform.OS,
          version: Platform.Version,
          timestamp: new Date().toISOString(),
        });

        // Initialize services in order
        await performanceService.initialize();
        await offlineService.initialize();
        await accessibilityService.initialize();
        
        // Set user context for logging
        if (user) {
          loggingService.setUserId(user.id);
          offlineService.setUserId(user.id);
        }

        // Setup deep linking
        setupDeepLinking();
        
        // Setup background task handling
        setupBackgroundTasks();
        
        // Setup crash reporting
        setupCrashReporting();

        setIsInitialized(true);
        
        // Small delay to ensure all services are ready
        setTimeout(() => {
          setIsReady(true);
          loggingService.logInfo('App initialization completed successfully');
        }, 100);

      } catch (error) {
        loggingService.logError('App initialization failed', error);
        errorService.handleError(
          error instanceof Error ? error : new Error('Initialization failed'),
          'App Initialization',
          ErrorSeverity.CRITICAL
        );
        
        // Still mark as initialized to prevent infinite loading
        setIsInitialized(true);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      loggingService.logInfo(`App state changed: ${appState} -> ${nextAppState}`);
      
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        handleAppForeground();
      } else if (appState === 'active' && nextAppState.match(/inactive|background/)) {
        handleAppBackground();
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  // Handle back button on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }
  }, []);

  // Handle user authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loggingService.setUserId(user.id);
      loggingService.logInfo('User authenticated', { 
        userId: user.id,
        mode: user.profile?.mode || 'unknown',
      });
      
      offlineService.setUserId(user.id);
      
      // Track user session
      setMetrics(prev => ({
        ...prev,
        sessionStart: new Date(),
      }));
      
    } else {
      loggingService.logInfo('User logged out');
      offlineService.clearUserData();
    }
  }, [isAuthenticated, user]);

  // Handle network status changes
  useEffect(() => {
    if (isOnline) {
      loggingService.logInfo('Network connection restored');
      handleNetworkReconnection();
    } else {
      loggingService.logInfo('Network connection lost');
      handleNetworkDisconnection();
    }
  }, [isOnline]);

  // Handle sync conflicts
  useEffect(() => {
    if (conflicts.length > 0) {
      loggingService.logWarn(`Sync conflicts detected: ${conflicts.length} conflicts`);
      setMetrics(prev => ({
        ...prev,
        performanceIssues: prev.performanceIssues + conflicts.length,
      }));
    }
  }, [conflicts]);

  // Handle errors
  useEffect(() => {
    if (errors.length > 0) {
      setMetrics(prev => ({
        ...prev,
        errorCount: errors.length,
      }));
    }
  }, [errors]);

  const setupDeepLinking = useCallback(() => {
    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, []);

  const setupBackgroundTasks = useCallback(() => {
    // Setup background sync and other tasks
    if (Platform.OS === 'ios') {
      // iOS background app refresh
      loggingService.logInfo('iOS background tasks configured');
    } else {
      // Android background processing
      loggingService.logInfo('Android background tasks configured');
    }
  }, []);

  const setupCrashReporting = useCallback(() => {
    // Enhanced crash reporting
    const originalConsoleError = console.error;
    console.error = (...args) => {
      loggingService.logError('Console Error', { args });
      originalConsoleError.apply(console, args);
    };

    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      loggingService.logWarn('Console Warning', { args });
      originalConsoleWarn.apply(console, args);
    };
  }, []);

  const handleDeepLink = useCallback((url: string) => {
    loggingService.logInfo('Deep link received', { url });
    
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      const params = Object.fromEntries(parsedUrl.searchParams);
      
      // Handle different deep link routes
      switch (path) {
        case '/goal':
          if (params.id) {
            dispatch({ type: 'navigation/navigateToGoal', payload: { goalId: params.id } });
          }
          break;
        case '/farm':
          dispatch({ type: 'navigation/navigateToFarm' });
          break;
        case '/analytics':
          dispatch({ type: 'navigation/navigateToAnalytics' });
          break;
        default:
          loggingService.logWarn('Unknown deep link path', { path, params });
      }
    } catch (error) {
      loggingService.logError('Failed to handle deep link', error);
    }
  }, [dispatch]);

  const handleBackPress = useCallback(() => {
    // Custom back button handling
    loggingService.logInfo('Hardware back button pressed');
    
    // Let the navigation system handle it first
    return false;
  }, []);

  const handleAppForeground = useCallback(async () => {
    try {
      loggingService.logInfo('App entering foreground');
      
      // Resume performance monitoring
      performanceService.resume();
      
      // Check for pending sync operations
      if (isOnline && isAuthenticated) {
        await offlineService.syncPendingOperations();
      }
      
      // Refresh critical data
      dispatch({ type: 'app/refreshData' });
      
      // Check for app updates
      checkForUpdates();
      
      loggingService.logInfo('App foreground handling completed');
    } catch (error) {
      loggingService.logError('App foreground handling failed', error);
      errorService.handleError(
        error instanceof Error ? error : new Error('Foreground handling failed'),
        'App Foreground'
      );
    }
  }, [isOnline, isAuthenticated, dispatch]);

  const handleAppBackground = useCallback(async () => {
    try {
      loggingService.logInfo('App entering background');
      
      // Pause performance monitoring
      performanceService.pause();
      
      // Save critical state
      await offlineService.persistCriticalState();
      
      // Clean up resources
      performanceService.cleanup();
      
      // Log session metrics
      const sessionDuration = Date.now() - metrics.sessionStart.getTime();
      loggingService.logInfo('Session metrics', {
        duration: sessionDuration,
        interactions: metrics.userInteractions,
        errors: metrics.errorCount,
        crashes: metrics.crashCount,
      });
      
      loggingService.logInfo('App background handling completed');
    } catch (error) {
      loggingService.logError('App background handling failed', error);
      errorService.handleError(
        error instanceof Error ? error : new Error('Background handling failed'),
        'App Background'
      );
    }
  }, [metrics]);

  const handleNetworkReconnection = useCallback(async () => {
    try {
      if (isAuthenticated) {
        // Sync pending operations
        await offlineService.syncPendingOperations();
        
        // Refresh data
        dispatch({ type: 'app/syncData' });
        
        // Check for remote updates
        dispatch({ type: 'app/checkRemoteUpdates' });
      }
    } catch (error) {
      loggingService.logError('Network reconnection handling failed', error);
      errorService.handleError(
        error instanceof Error ? error : new Error('Network reconnection failed'),
        'Network Reconnection'
      );
    }
  }, [isAuthenticated, dispatch]);

  const handleNetworkDisconnection = useCallback(() => {
    // Show offline indicator
    dispatch({ type: 'network/setOffline' });
    
    // Queue operations for later sync
    offlineService.enableOfflineMode();
    
    // Optimize for offline usage
    performanceService.enableOfflineOptimizations();
  }, [dispatch]);

  const handleConflictResolution = useCallback(async (conflictId: string, resolution: any) => {
    try {
      await offlineService.resolveConflict(conflictId, resolution);
      loggingService.logInfo(`Conflict resolved: ${conflictId}`);
      
      setMetrics(prev => ({
        ...prev,
        userInteractions: prev.userInteractions + 1,
      }));
    } catch (error) {
      loggingService.logError('Conflict resolution failed', error);
      errorService.handleError(
        error instanceof Error ? error : new Error('Conflict resolution failed'),
        'Conflict Resolution'
      );
    }
  }, []);

  const handleErrorDismiss = useCallback(() => {
    if (currentError) {
      dispatch({ type: 'error/dismissCurrentError' });
      
      setMetrics(prev => ({
        ...prev,
        userInteractions: prev.userInteractions + 1,
      }));
    }
  }, [currentError, dispatch]);

  const checkForUpdates = useCallback(async () => {
    try {
      // Check for OTA updates
      loggingService.logInfo('Checking for app updates');
      
      // This would integrate with Expo Updates or CodePush
      // For now, just log the check
      
    } catch (error) {
      loggingService.logError('Update check failed', error);
    }
  }, []);

  const handleCriticalError = useCallback((error: Error, errorInfo: any) => {
    loggingService.logFatal('Critical error in app integration', {
      error: error.message,
      stack: error.stack,
      errorInfo,
    });
    
    setMetrics(prev => ({
      ...prev,
      crashCount: prev.crashCount + 1,
    }));
    
    // Show critical error dialog
    Alert.alert(
      'Critical Error',
      'The app has encountered a critical error. Please restart the app.',
      [
        {
          text: 'Restart',
          onPress: () => {
            // In a real app, this would restart the app
            loggingService.logInfo('User requested app restart');
          },
        },
      ]
    );
  }, []);

  // Show loading state during initialization
  if (!isInitialized || !isReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
      }}>
        <AnimatedTransitions.FadeIn>
          <AnimatedTransitions.Pulse>
            {/* Loading spinner or logo would go here */}
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#007AFF',
            }} />
          </AnimatedTransitions.Pulse>
        </AnimatedTransitions.FadeIn>
      </View>
    );
  }

  return (
    <ErrorBoundary onError={handleCriticalError}>
      <PerformanceOptimizer
        enableMonitoring={true}
        enableBackgroundProcessing={true}
        enableAssetOptimization={true}
      >
        <View style={{ flex: 1 }}>
          {children}
          
          {/* Global UI Components */}
          <OfflineIndicator />
          <SyncStatusIndicator />
          
          {/* Conflict Resolution Modal */}
          {conflicts.length > 0 && (
            <AnimatedTransitions.SlideIn direction="up">
              <ConflictResolutionModal
                conflicts={conflicts}
                onResolve={handleConflictResolution}
                onDismiss={() => dispatch({ type: 'sync/dismissConflicts' })}
              />
            </AnimatedTransitions.SlideIn>
          )}
          
          {/* Global Error Handler */}
          {currentError && (
            <AnimatedTransitions.FadeIn style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }}>
              <MicroInteractions.PressableScale
                onPress={handleErrorDismiss}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 20,
                  margin: 20,
                  maxWidth: '90%',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                {/* Error content would be rendered here */}
              </MicroInteractions.PressableScale>
            </AnimatedTransitions.FadeIn>
          )}
        </View>
      </PerformanceOptimizer>
    </ErrorBoundary>
  );
};

export default AppIntegrationEnhanced;