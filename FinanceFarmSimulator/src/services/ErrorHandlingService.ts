import { Alert } from 'react-native';
import { store } from '../store/store';
import { setError, clearError } from '../store/slices/errorSlice';
import { LoggingService } from './LoggingService';

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  GAME_STATE = 'GAME_STATE',
  STORAGE = 'STORAGE',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  context?: string;
  stack?: string;
  recoverable: boolean;
  retryCount?: number;
}

export interface ErrorRecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<boolean>;
  maxRetries: number;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private loggingService: LoggingService;
  private recoveryStrategies: Map<ErrorType, ErrorRecoveryStrategy> = new Map();
  private errorQueue: AppError[] = [];
  private isProcessingQueue = false;

  private constructor() {
    this.loggingService = LoggingService.getInstance();
    this.initializeRecoveryStrategies();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  private initializeRecoveryStrategies(): void {
    // Network error recovery
    this.recoveryStrategies.set(ErrorType.NETWORK, {
      canRecover: (error) => error.retryCount === undefined || error.retryCount < 3,
      recover: async (error) => {
        // Implement network retry logic
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, error.retryCount || 0)));
        return true;
      },
      maxRetries: 3,
    });

    // Game state recovery
    this.recoveryStrategies.set(ErrorType.GAME_STATE, {
      canRecover: (error) => true,
      recover: async (error) => {
        try {
          // Reset farm state to last known good state
          const state = store.getState();
          if (state.auth.user) {
            // Trigger farm state recovery
            store.dispatch({ type: 'farm/recoverState', payload: { userId: state.auth.user.id } });
            return true;
          }
          return false;
        } catch (recoveryError) {
          this.loggingService.logError('Failed to recover game state', recoveryError);
          return false;
        }
      },
      maxRetries: 1,
    });

    // Storage error recovery
    this.recoveryStrategies.set(ErrorType.STORAGE, {
      canRecover: (error) => error.retryCount === undefined || error.retryCount < 2,
      recover: async (error) => {
        try {
          // Clear corrupted data and reinitialize
          // This would involve clearing specific storage keys and reloading
          return true;
        } catch (recoveryError) {
          return false;
        }
      },
      maxRetries: 2,
    });

    // Authentication error recovery
    this.recoveryStrategies.set(ErrorType.AUTHENTICATION, {
      canRecover: (error) => false, // Auth errors typically require user intervention
      recover: async (error) => {
        // Redirect to login screen
        store.dispatch({ type: 'auth/logout' });
        return false;
      },
      maxRetries: 0,
    });
  }

  public async handleError(
    error: Error | AppError,
    context?: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): Promise<void> {
    let appError: AppError;

    if (this.isAppError(error)) {
      appError = error;
    } else {
      appError = this.createAppError(error, context, severity);
    }

    // Log the error
    await this.loggingService.logError(appError.message, appError);

    // Add to Redux store
    store.dispatch(setError(appError));

    // Add to processing queue
    this.errorQueue.push(appError);

    // Process the queue
    this.processErrorQueue();

    // Show user-facing error if appropriate
    this.showUserError(appError);
  }

  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  private createAppError(
    error: Error,
    context?: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): AppError {
    const state = store.getState();
    const userId = state.auth.user?.id;

    return {
      id: this.generateErrorId(),
      type: this.categorizeError(error),
      severity,
      message: error.message || 'An unknown error occurred',
      details: {
        name: error.name,
        stack: error.stack,
      },
      timestamp: new Date(),
      userId,
      context,
      stack: error.stack,
      recoverable: this.isRecoverable(error),
      retryCount: 0,
    };
  }

  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || name.includes('network')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('farm') || message.includes('crop') || message.includes('game')) {
      return ErrorType.GAME_STATE;
    }
    if (message.includes('storage') || message.includes('database') || message.includes('sqlite')) {
      return ErrorType.STORAGE;
    }
    if (message.includes('permission') || message.includes('denied')) {
      return ErrorType.PERMISSION;
    }

    return ErrorType.UNKNOWN;
  }

  private isRecoverable(error: Error): boolean {
    const type = this.categorizeError(error);
    const strategy = this.recoveryStrategies.get(type);
    return strategy !== undefined;
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift()!;
      await this.attemptRecovery(error);
    }

    this.isProcessingQueue = false;
  }

  private async attemptRecovery(error: AppError): Promise<void> {
    if (!error.recoverable) {
      return;
    }

    const strategy = this.recoveryStrategies.get(error.type);
    if (!strategy || !strategy.canRecover(error)) {
      return;
    }

    try {
      const recovered = await strategy.recover(error);
      
      if (recovered) {
        this.loggingService.logInfo(`Successfully recovered from error: ${error.id}`);
        store.dispatch(clearError(error.id));
      } else {
        error.retryCount = (error.retryCount || 0) + 1;
        
        if (error.retryCount < strategy.maxRetries) {
          // Re-queue for retry
          setTimeout(() => {
            this.errorQueue.push(error);
            this.processErrorQueue();
          }, 1000 * Math.pow(2, error.retryCount));
        } else {
          this.loggingService.logError(`Failed to recover from error after ${error.retryCount} attempts: ${error.id}`);
        }
      }
    } catch (recoveryError) {
      this.loggingService.logError(`Recovery attempt failed for error: ${error.id}`, recoveryError);
    }
  }

  private showUserError(error: AppError): void {
    // Don't show low severity errors to users
    if (error.severity === ErrorSeverity.LOW) {
      return;
    }

    // Don't show errors that are being automatically recovered
    if (error.recoverable && error.severity !== ErrorSeverity.CRITICAL) {
      return;
    }

    const userMessage = this.getUserFriendlyMessage(error);
    const title = this.getErrorTitle(error);

    Alert.alert(
      title,
      userMessage,
      [
        {
          text: 'OK',
          onPress: () => store.dispatch(clearError(error.id)),
        },
        ...(error.recoverable ? [{
          text: 'Retry',
          onPress: () => this.retryError(error),
        }] : []),
      ]
    );
  }

  private getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Please check your internet connection and try again.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in again to continue.';
      case ErrorType.GAME_STATE:
        return 'There was an issue with your farm. We\'re trying to fix it automatically.';
      case ErrorType.STORAGE:
        return 'There was an issue saving your data. Please try again.';
      case ErrorType.PERMISSION:
        return 'This feature requires additional permissions to work properly.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  private getErrorTitle(error: AppError): string {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'Critical Error';
      case ErrorSeverity.HIGH:
        return 'Error';
      case ErrorSeverity.MEDIUM:
        return 'Something went wrong';
      case ErrorSeverity.LOW:
        return 'Notice';
      default:
        return 'Error';
    }
  }

  private retryError(error: AppError): void {
    error.retryCount = 0; // Reset retry count
    this.errorQueue.push(error);
    this.processErrorQueue();
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  public clearAllErrors(): void {
    this.errorQueue = [];
    store.dispatch({ type: 'error/clearAll' });
  }

  public getErrorHistory(): AppError[] {
    const state = store.getState();
    return state.error?.errors || [];
  }
}

// Global error handler for unhandled promise rejections
if (typeof global !== 'undefined') {
  // Handle unhandled promise rejections
  const originalUnhandledRejection = global.onunhandledrejection;
  global.onunhandledrejection = (event: PromiseRejectionEvent) => {
    ErrorHandlingService.getInstance().handleError(
      new Error(event.reason?.message || 'Unhandled Promise Rejection'),
      'Unhandled Promise Rejection',
      ErrorSeverity.HIGH
    );
    
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(global, event);
    }
  };
}

export default ErrorHandlingService;