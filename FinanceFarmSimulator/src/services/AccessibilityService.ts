import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extraLarge';
  voiceCommandsEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private settings: AccessibilitySettings;
  private listeners: ((settings: AccessibilitySettings) => void)[] = [];

  private constructor() {
    this.settings = {
      screenReaderEnabled: false,
      highContrastMode: false,
      fontSize: 'medium',
      voiceCommandsEnabled: false,
      hapticsEnabled: true,
      reducedMotion: false,
    };
    this.initializeSettings();
  }

  public static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  private async initializeSettings(): Promise<void> {
    try {
      // Load saved settings
      const savedSettings = await AsyncStorage.getItem('accessibility_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }

      // Check system accessibility settings
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      const reducedMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();

      this.settings.screenReaderEnabled = screenReaderEnabled;
      this.settings.reducedMotion = reducedMotionEnabled;

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to initialize accessibility settings:', error);
    }
  }

  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  public async updateSettings(newSettings: Partial<AccessibilitySettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    
    try {
      await AsyncStorage.setItem('accessibility_settings', JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }

  public subscribe(listener: (settings: AccessibilitySettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  // Haptic feedback methods
  public async triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): Promise<void> {
    if (!this.settings.hapticsEnabled) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }

  // Text-to-speech methods
  public async speak(text: string, options?: { rate?: number; pitch?: number }): Promise<void> {
    if (!this.settings.screenReaderEnabled) return;

    try {
      await Speech.speak(text, {
        rate: options?.rate || 0.75,
        pitch: options?.pitch || 1.0,
        language: 'en-US',
      });
    } catch (error) {
      console.error('Text-to-speech failed:', error);
    }
  }

  public stopSpeaking(): void {
    Speech.stop();
  }

  // Accessibility announcement
  public announceForAccessibility(message: string): void {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // For Android, we can use our TTS as fallback
      this.speak(message);
    }
  }

  // Font size multipliers
  public getFontSizeMultiplier(): number {
    switch (this.settings.fontSize) {
      case 'small':
        return 0.85;
      case 'medium':
        return 1.0;
      case 'large':
        return 1.15;
      case 'extraLarge':
        return 1.3;
      default:
        return 1.0;
    }
  }

  // Check if high contrast should be applied
  public shouldUseHighContrast(): boolean {
    return this.settings.highContrastMode;
  }

  // Check if animations should be reduced
  public shouldReduceMotion(): boolean {
    return this.settings.reducedMotion;
  }
}

export const accessibilityService = AccessibilityService.getInstance();