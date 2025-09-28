import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';
import { updateFarmState, updateCropGrowth } from '../store/slices/farmSlice';
import { Crop, GrowthStage } from '../models/Game';

interface BackgroundTask {
  id: string;
  type: 'growth_calculation' | 'farm_update' | 'data_sync';
  priority: 'high' | 'medium' | 'low';
  scheduledTime: number;
  data: any;
}

interface ProcessingQueue {
  tasks: BackgroundTask[];
  isProcessing: boolean;
  lastProcessed: number;
}

export class BackgroundProcessingService {
  private static instance: BackgroundProcessingService;
  private queue: ProcessingQueue = {
    tasks: [],
    isProcessing: false,
    lastProcessed: 0,
  };
  private readonly QUEUE_KEY = 'background_processing_queue';
  private readonly PROCESSING_INTERVAL = 30000; // 30 seconds
  private readonly MAX_BATCH_SIZE = 10;
  private intervalId: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;

  static getInstance(): BackgroundProcessingService {
    if (!BackgroundProcessingService.instance) {
      BackgroundProcessingService.instance = new BackgroundProcessingService();
    }
    return BackgroundProcessingService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load persisted queue
      await this.loadQueue();
      
      // Set up app state listener
      this.setupAppStateListener();
      
      // Start processing loop
      this.startProcessingLoop();
      
      // Schedule initial growth calculations
      await this.scheduleGrowthCalculations();
    } catch (error) {
      console.error('Failed to initialize background processing service:', error);
    }
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    if (nextAppState === 'background') {
      // App is going to background - save current state and schedule tasks
      await this.onAppBackground();
    } else if (nextAppState === 'active') {
      // App is becoming active - process accumulated tasks
      await this.onAppForeground();
    }
  }

  private async onAppBackground(): Promise<void> {
    try {
      // Save current timestamp
      await AsyncStorage.setItem('app_background_time', Date.now().toString());
      
      // Schedule growth calculations for while app is in background
      await this.scheduleBackgroundGrowthCalculations();
      
      // Persist current queue
      await this.persistQueue();
    } catch (error) {
      console.error('Error handling app background:', error);
    }
  }

  private async onAppForeground(): Promise<void> {
    try {
      // Calculate time spent in background
      const backgroundTimeStr = await AsyncStorage.getItem('app_background_time');
      if (backgroundTimeStr) {
        const backgroundTime = parseInt(backgroundTimeStr, 10);
        const timeInBackground = Date.now() - backgroundTime;
        
        // Process accumulated growth for time spent in background
        await this.processBackgroundGrowth(timeInBackground);
      }
      
      // Process any pending tasks
      await this.processPendingTasks();
    } catch (error) {
      console.error('Error handling app foreground:', error);
    }
  }

  private startProcessingLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      if (!this.queue.isProcessing) {
        await this.processQueue();
      }
    }, this.PROCESSING_INTERVAL);
  }

  async scheduleTask(task: Omit<BackgroundTask, 'id'>): Promise<string> {
    const taskId = `${task.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullTask: BackgroundTask = {
      ...task,
      id: taskId,
    };

    this.queue.tasks.push(fullTask);
    this.sortQueueByPriority();
    
    await this.persistQueue();
    return taskId;
  }

  private async scheduleGrowthCalculations(): Promise<void> {
    const state = store.getState();
    const crops = state.farm.currentFarm?.crops || [];
    
    for (const crop of crops) {
      if (this.shouldScheduleGrowthCalculation(crop)) {
        await this.scheduleTask({
          type: 'growth_calculation',
          priority: 'medium',
          scheduledTime: Date.now() + this.getGrowthCalculationInterval(crop),
          data: { cropId: crop.id },
        });
      }
    }
  }

  private async scheduleBackgroundGrowthCalculations(): Promise<void> {
    // Schedule growth calculations at regular intervals while app is in background
    const intervals = [60000, 300000, 900000]; // 1min, 5min, 15min
    
    for (const interval of intervals) {
      await this.scheduleTask({
        type: 'growth_calculation',
        priority: 'low',
        scheduledTime: Date.now() + interval,
        data: { backgroundCalculation: true },
      });
    }
  }

  private shouldScheduleGrowthCalculation(crop: Crop): boolean {
    return crop.growthStage !== GrowthStage.HARVESTED && 
           crop.growthStage !== GrowthStage.WITHERED &&
           crop.growthStage !== GrowthStage.READY_TO_HARVEST;
  }

  private getGrowthCalculationInterval(crop: Crop): number {
    // Different intervals based on growth stage
    switch (crop.growthStage) {
      case GrowthStage.SEED:
        return 300000; // 5 minutes
      case GrowthStage.SPROUT:
        return 600000; // 10 minutes
      case GrowthStage.GROWING:
        return 900000; // 15 minutes
      case GrowthStage.MATURE:
        return 1800000; // 30 minutes
      default:
        return 600000; // 10 minutes default
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.isProcessing || this.queue.tasks.length === 0) {
      return;
    }

    this.queue.isProcessing = true;

    try {
      const now = Date.now();
      const tasksToProcess = this.queue.tasks
        .filter(task => task.scheduledTime <= now)
        .slice(0, this.MAX_BATCH_SIZE);

      if (tasksToProcess.length === 0) {
        return;
      }

      // Process tasks in batches
      const results = await Promise.allSettled(
        tasksToProcess.map(task => this.processTask(task))
      );

      // Remove processed tasks from queue
      const processedTaskIds = new Set(tasksToProcess.map(task => task.id));
      this.queue.tasks = this.queue.tasks.filter(task => !processedTaskIds.has(task.id));

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Background task ${tasksToProcess[index].id} failed:`, result.reason);
        }
      });

      this.queue.lastProcessed = now;
      await this.persistQueue();
    } catch (error) {
      console.error('Error processing background queue:', error);
    } finally {
      this.queue.isProcessing = false;
    }
  }

  private async processTask(task: BackgroundTask): Promise<void> {
    switch (task.type) {
      case 'growth_calculation':
        await this.processGrowthCalculation(task);
        break;
      case 'farm_update':
        await this.processFarmUpdate(task);
        break;
      case 'data_sync':
        await this.processDataSync(task);
        break;
      default:
        console.warn(`Unknown task type: ${task.type}`);
    }
  }

  private async processGrowthCalculation(task: BackgroundTask): Promise<void> {
    const { cropId, backgroundCalculation } = task.data;
    
    if (backgroundCalculation) {
      // Process growth for all active crops
      store.dispatch(updateFarmState());
    } else if (cropId) {
      // Process growth for specific crop
      store.dispatch(updateCropGrowth({ cropId }));
    }
  }

  private async processFarmUpdate(task: BackgroundTask): Promise<void> {
    store.dispatch(updateFarmState());
  }

  private async processDataSync(task: BackgroundTask): Promise<void> {
    // Implement data synchronization logic
    // This would typically involve syncing with cloud storage
    console.log('Processing data sync task:', task.data);
  }

  private async processBackgroundGrowth(timeInBackground: number): Promise<void> {
    // Calculate how much growth should have occurred while app was in background
    const state = store.getState();
    const crops = state.farm.currentFarm?.crops || [];
    
    // Process growth in chunks to avoid blocking the main thread
    const CHUNK_SIZE = 5;
    for (let i = 0; i < crops.length; i += CHUNK_SIZE) {
      const chunk = crops.slice(i, i + CHUNK_SIZE);
      
      await new Promise(resolve => {
        setTimeout(() => {
          chunk.forEach(crop => {
            if (this.shouldProcessBackgroundGrowth(crop, timeInBackground)) {
              store.dispatch(updateCropGrowth({ 
                cropId: crop.id, 
                backgroundTime: timeInBackground 
              }));
            }
          });
          resolve(void 0);
        }, 0);
      });
    }
  }

  private shouldProcessBackgroundGrowth(crop: Crop, timeInBackground: number): boolean {
    // Only process if significant time has passed and crop is actively growing
    return timeInBackground > 60000 && // More than 1 minute
           crop.growthStage !== GrowthStage.HARVESTED &&
           crop.growthStage !== GrowthStage.WITHERED;
  }

  private async processPendingTasks(): Promise<void> {
    // Process any high-priority tasks that accumulated while app was in background
    const highPriorityTasks = this.queue.tasks.filter(task => task.priority === 'high');
    
    for (const task of highPriorityTasks) {
      try {
        await this.processTask(task);
        this.queue.tasks = this.queue.tasks.filter(t => t.id !== task.id);
      } catch (error) {
        console.error(`Failed to process high-priority task ${task.id}:`, error);
      }
    }
    
    await this.persistQueue();
  }

  private sortQueueByPriority(): void {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    this.queue.tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by scheduled time
      return a.scheduledTime - b.scheduledTime;
    });
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (queueData) {
        this.queue = { ...this.queue, ...JSON.parse(queueData) };
        this.sortQueueByPriority();
      }
    } catch (error) {
      console.warn('Failed to load background processing queue:', error);
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to persist background processing queue:', error);
    }
  }

  async getQueueStats(): Promise<{
    totalTasks: number;
    tasksByType: { [type: string]: number };
    tasksByPriority: { [priority: string]: number };
    isProcessing: boolean;
    lastProcessed: number;
  }> {
    const tasksByType: { [type: string]: number } = {};
    const tasksByPriority: { [priority: string]: number } = {};
    
    this.queue.tasks.forEach(task => {
      tasksByType[task.type] = (tasksByType[task.type] || 0) + 1;
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    });
    
    return {
      totalTasks: this.queue.tasks.length,
      tasksByType,
      tasksByPriority,
      isProcessing: this.queue.isProcessing,
      lastProcessed: this.queue.lastProcessed,
    };
  }

  async clearQueue(): Promise<void> {
    this.queue.tasks = [];
    await this.persistQueue();
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}