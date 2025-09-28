import React, { useEffect, useState } from 'react';
import { View, Alert, AppState, AppStateStatus } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { ErrorHandlingService } from '../../services/ErrorHandlingService';
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

interface AppIntegrationProps {
  children: React.ReactNode;
}

export const AppIntegration: React.FC<AppIntegrationProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isOnline } = useSelector((state: RootState) => state.network);
  const { syncStatus, conflicts } = useSelector((state: RootState) => state.sync);
  const { currentError } = useSelector((state: RootState) => state.error);
  
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Service instances
  const [errorService] = useState(() => ErrorHandlingService.getInstance());
  const [loggingService] = useState(() => LoggingService.getInstance());
  const [performanceService] = useState(() => PerformanceMonitoringService.getInstance());
  const [offlineService] = useState(() => OfflineService.getInstance());
  const [accessibilityService] = useState(() => AccessibilityService.getInstance());

  // Initialize services and app state
  useEffect(() => {
    const initializeApp = async () => {
      try {
        loggingService.logInfo('App initialization started');

        // Initialize performance monitoring
        await performanceService.initialize();
        
        // Initialize offline service
        await offlineService.initialize();
        
        // Initialize accessibility service
        await accessibilityService.initialize();
        
        // Set user context for logging
        if (user) {
          loggingService.setUserId(user.id);
        }

        setIsInitialized(true);
        loggingService.logInfo('App initialization completed');
      } catch (error) {
        loggingService.logError('App initialization failed', error);
        errorService.handleError(error, 'App Initialization');
      }
    };

    initializeApp();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      loggingService.logInfo(`App state changed: ${appState} -> ${nextAppState}`);
      
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        handleAppForeground();
      } else if (appState === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        handleAppBackground();
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  // Handle user authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loggingService.setUserId(user.id);
      loggingService.logInfo('User authenticated', { userId: user.id });
      
      // Initialize user-specific services
      offlineService.setUserId(user.id);
    } else {
      loggingService.logInfo('User logged out');
      
      // Clean up user-specific data
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
    }
  }, [conflicts]);

  const handleAppForeground = async () => {
    try {
      // Resume performance monitoring
      performanceService.resume();
      
      // Check for pending sync operations
      if (isOnline && isAuthenticated) {
        await offlineService.syncPendingOperations();
      }
      
      // Refresh critical data
      dispatch({ type: 'app/refreshData' });
      
      loggingService.logInfo('App foreground handling completed');
    } catch (error) {
      loggingService.logError('App foreground handling failed', error);
      errorService.handleError(error, 'App Foreground');
    }
  };

  const handleAppBackground = async () => {
    try {
      // Pause performance monitoring
      performanceService.pause();
      
      // Save critical state
      await offlineService.persistCriticalState();
      
      // Clean up resources
      performanceService.cleanup();
      
      loggingService.logInfo('App background handling completed');
    } catch (error) {
      loggingService.logError('App background handling failed', error);
      errorService.handleError(error, 'App Background');
    }
  };

  const handleNetworkReconnection = async () => {
    try {
      if (isAuthenticated) {
        // Sync pending operations
        await offlineService.syncPendingOperations();
        
        // Refresh data
        dispatch({ type: 'app/syncData' });
      }
    } catch (error) {
      loggingService.logError('Network reconnection handling failed', error);
      errorService.handleError(error, 'Network Reconnection');
    }
  };

  const handleNetworkDisconnection = () => {
    // Show offline indicator
    dispatch({ type: 'network/setOffline' });
    
    // Queue operations for later sync
    offlineService.enableOfflineMode();
  };

  const handleConflictResolution = async (conflictId: string, resolution: any) => {
    try {
      await offlineService.resolveConflict(conflictId, resolution);
      loggingService.logInfo(`Conflict resolved: ${conflictId}`);
    } catch (error) {
      loggingService.logError('Conflict resolution failed', error);
      errorService.handleError(error, 'Conflict Resolution');
    }
  };

  const handleErrorDismiss = () => {
    if (currentError) {
      dispatch({ type: 'error/dismissCurrentError' });
    }
  };

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedTransitions.FadeIn>
          {/* Loading component would go here */}
        </AnimatedTransitions.FadeIn>
      </View>
    );
  }

  return (
    <ErrorBoundary>
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
            <ConflictResolutionModal
              conflicts={conflicts}
              onResolve={handleConflictResolution}
              onDismiss={() => dispatch({ type: 'sync/dismissConflicts' })}
            />
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
              <AnimatedTransitions.ScaleIn style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 20,
                margin: 20,
                maxWidth: '90%',
              }}>
                {/* Error content would be rendered here */}
              </AnimatedTransitions.ScaleIn>
            </AnimatedTransitions.FadeIn>
          )}
        </View>
      </PerformanceOptimizer>
    </ErrorBoundary>
  );
};

export default AppIntegration;