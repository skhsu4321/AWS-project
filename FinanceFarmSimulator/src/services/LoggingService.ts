import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  sessionId: string;
  platform: string;
  version: string;
  context?: string;
  stack?: string;
}

export interface CrashReport {
  id: string;
  timestamp: Date;
  error: Error;
  userId?: string;
  sessionId: string;
  platform: string;
  version: string;
  deviceInfo: any;
  appState: any;
  breadcrumbs: LogEntry[];
}

export class LoggingService {
  private static instance: LoggingService;
  private sessionId: string;
  private logs: LogEntry[] = [];
  private breadcrumbs: LogEntry[] = [];
  private maxLogs = 1000;
  private maxBreadcrumbs = 50;
  private currentLogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.INFO;
  private version: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.version = '1.0.0'; // This would come from app config
    this.initializeLogging();
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  private initializeLogging(): void {
    // Load persisted logs
    this.loadPersistedLogs();

    // Set up periodic log persistence
    setInterval(() => {
      this.persistLogs();
    }, 30000); // Persist every 30 seconds

    // Set up crash reporting
    this.setupCrashReporting();
  }

  private setupCrashReporting(): void {
    // Handle unhandled promise rejections
    if (typeof global !== 'undefined') {
      const originalUnhandledRejection = global.onunhandledrejection;
      global.onunhandledrejection = (event: PromiseRejectionEvent) => {
        LoggingService.getInstance().logError('Unhandled Promise Rejection', event.reason);
        
        if (originalUnhandledRejection) {
          originalUnhandledRejection.call(global, event);
        }
      };
    }
  }

  public setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  public setUserId(userId: string): void {
    this.logInfo('User session started', { userId });
  }

  public logDebug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  public logInfo(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  public logWarn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  public logError(message: string, error?: any, context?: string): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;

    this.log(LogLevel.ERROR, message, errorData, context, error?.stack);
  }

  public logFatal(message: string, error?: any, context?: string): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;

    this.log(LogLevel.FATAL, message, errorData, context, error?.stack);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string,
    stack?: string
  ): void {
    if (level < this.currentLogLevel) {
      return;
    }

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      data,
      sessionId: this.sessionId,
      platform: Platform.OS,
      version: this.version,
      context,
      stack,
    };

    // Add to logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Add to breadcrumbs for crash reporting
    this.breadcrumbs.push(logEntry);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    // Console output in development
    if (__DEV__) {
      this.consoleLog(logEntry);
    }

    // Send to remote logging service in production
    if (!__DEV__ && level >= LogLevel.ERROR) {
      this.sendToRemoteLogging(logEntry);
    }
  }

  private consoleLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.sessionId.slice(0, 8)}]`;
    
    const message = entry.context 
      ? `${prefix} [${entry.context}] ${entry.message}`
      : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.data);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }

  public async reportCrash(error: Error, isFatal: boolean = false): Promise<void> {
    try {
      const crashReport: CrashReport = {
        id: this.generateCrashId(),
        timestamp: new Date(),
        error,
        sessionId: this.sessionId,
        platform: Platform.OS,
        version: this.version,
        deviceInfo: await this.getDeviceInfo(),
        appState: await this.getAppState(),
        breadcrumbs: [...this.breadcrumbs],
      };

      // Log the crash
      this.logFatal(`Crash reported: ${error.message}`, {
        crashId: crashReport.id,
        isFatal,
        stack: error.stack,
      });

      // Persist crash report
      await this.persistCrashReport(crashReport);

      // Send to crash reporting service
      if (!__DEV__) {
        await this.sendCrashReport(crashReport);
      }
    } catch (reportingError) {
      console.error('Failed to report crash:', reportingError);
    }
  }

  private async getDeviceInfo(): Promise<any> {
    // In a real app, you would use a library like react-native-device-info
    return {
      platform: Platform.OS,
      version: Platform.Version,
      // Add more device info as needed
    };
  }

  private async getAppState(): Promise<any> {
    // Capture relevant app state for crash analysis
    try {
      // This would capture Redux state, user info, etc.
      return {
        timestamp: new Date().toISOString(),
        // Add relevant app state
      };
    } catch (error) {
      return { error: 'Failed to capture app state' };
    }
  }

  private async loadPersistedLogs(): Promise<void> {
    try {
      const logsJson = await AsyncStorage.getItem('app_logs');
      if (logsJson) {
        const persistedLogs = JSON.parse(logsJson);
        this.logs = persistedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load persisted logs:', error);
    }
  }

  private async persistLogs(): Promise<void> {
    try {
      // Only persist recent logs to avoid storage bloat
      const recentLogs = this.logs.slice(-100);
      await AsyncStorage.setItem('app_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

  private async persistCrashReport(crashReport: CrashReport): Promise<void> {
    try {
      const key = `crash_report_${crashReport.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(crashReport));
    } catch (error) {
      console.error('Failed to persist crash report:', error);
    }
  }

  private async sendToRemoteLogging(entry: LogEntry): Promise<void> {
    try {
      // In a real app, this would send to a logging service like Sentry, LogRocket, etc.
      // For now, we'll just simulate the API call
      if (__DEV__) {
        console.log('Would send to remote logging:', entry);
      }
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  }

  private async sendCrashReport(crashReport: CrashReport): Promise<void> {
    try {
      // In a real app, this would send to a crash reporting service
      if (__DEV__) {
        console.log('Would send crash report:', crashReport);
      }
    } catch (error) {
      console.error('Failed to send crash report:', error);
    }
  }

  public async exportLogs(): Promise<string> {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      logs: this.logs,
    }, null, 2);
  }

  public async clearLogs(): Promise<void> {
    this.logs = [];
    this.breadcrumbs = [];
    await AsyncStorage.removeItem('app_logs');
  }

  public getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = level !== undefined 
      ? this.logs.filter(log => log.level >= level)
      : this.logs;

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateCrashId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export default LoggingService;