import { AccessibilityService, AccessibilitySettings } from '../AccessibilityService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
    announceForAccessibility: jest.fn(),
  },
  Platform: { OS: 'ios' },
}));
jest.mock('expo-haptics');
jest.mock('expo-speech');

describe('AccessibilityService', () => {
  let service: AccessibilityService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockAccessibilityInfo = AccessibilityInfo as jest.Mocked<typeof AccessibilityInfo>;
  const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;
  const mockSpeech = Speech as jest.Mocked<typeof Speech>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (AccessibilityService as any).instance = undefined;
    service = AccessibilityService.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = AccessibilityService.getInstance();
      const instance2 = AccessibilityService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialization', () => {
    it('should load saved settings from AsyncStorage', async () => {
      const savedSettings: Partial<AccessibilitySettings> = {
        highContrastMode: true,
        fontSize: 'large',
        hapticsEnabled: false,
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedSettings));
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);

      // Create new instance to trigger initialization
      (AccessibilityService as any).instance = undefined;
      const newService = AccessibilityService.getInstance();

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const settings = newService.getSettings();
      expect(settings.highContrastMode).toBe(true);
      expect(settings.fontSize).toBe('large');
      expect(settings.hapticsEnabled).toBe(false);
      expect(settings.screenReaderEnabled).toBe(true);
      expect(settings.reducedMotion).toBe(false);
    });

    it('should use default settings when no saved settings exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);

      const settings = service.getSettings();
      expect(settings.screenReaderEnabled).toBe(false);
      expect(settings.highContrastMode).toBe(false);
      expect(settings.fontSize).toBe('medium');
      expect(settings.voiceCommandsEnabled).toBe(false);
      expect(settings.hapticsEnabled).toBe(true);
      expect(settings.reducedMotion).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('should update settings and save to AsyncStorage', async () => {
      const newSettings: Partial<AccessibilitySettings> = {
        highContrastMode: true,
        fontSize: 'large',
      };

      await service.updateSettings(newSettings);

      const settings = service.getSettings();
      expect(settings.highContrastMode).toBe(true);
      expect(settings.fontSize).toBe('large');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'accessibility_settings',
        JSON.stringify(settings)
      );
    });

    it('should notify subscribers when settings change', async () => {
      const listener = jest.fn();
      service.subscribe(listener);

      await service.updateSettings({ highContrastMode: true });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ highContrastMode: true })
      );
    });
  });

  describe('haptic feedback', () => {
    beforeEach(() => {
      service.updateSettings({ hapticsEnabled: true });
    });

    it('should trigger light haptic feedback', async () => {
      await service.triggerHapticFeedback('light');
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should trigger medium haptic feedback', async () => {
      await service.triggerHapticFeedback('medium');
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should trigger heavy haptic feedback', async () => {
      await service.triggerHapticFeedback('heavy');
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('should trigger success notification feedback', async () => {
      await service.triggerHapticFeedback('success');
      expect(mockHaptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('should trigger warning notification feedback', async () => {
      await service.triggerHapticFeedback('warning');
      expect(mockHaptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    it('should trigger error notification feedback', async () => {
      await service.triggerHapticFeedback('error');
      expect(mockHaptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    it('should not trigger haptic feedback when disabled', async () => {
      await service.updateSettings({ hapticsEnabled: false });
      await service.triggerHapticFeedback('light');
      expect(mockHaptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('text-to-speech', () => {
    beforeEach(() => {
      service.updateSettings({ screenReaderEnabled: true });
    });

    it('should speak text with default options', async () => {
      await service.speak('Hello world');
      expect(mockSpeech.speak).toHaveBeenCalledWith('Hello world', {
        rate: 0.75,
        pitch: 1.0,
        language: 'en-US',
      });
    });

    it('should speak text with custom options', async () => {
      await service.speak('Hello world', { rate: 1.0, pitch: 1.2 });
      expect(mockSpeech.speak).toHaveBeenCalledWith('Hello world', {
        rate: 1.0,
        pitch: 1.2,
        language: 'en-US',
      });
    });

    it('should not speak when screen reader is disabled', async () => {
      await service.updateSettings({ screenReaderEnabled: false });
      await service.speak('Hello world');
      expect(mockSpeech.speak).not.toHaveBeenCalled();
    });

    it('should stop speaking', () => {
      service.stopSpeaking();
      expect(mockSpeech.stop).toHaveBeenCalled();
    });
  });

  describe('announceForAccessibility', () => {
    it('should announce for accessibility on iOS', () => {
      service.announceForAccessibility('Test announcement');
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Test announcement'
      );
    });
  });

  describe('font size multiplier', () => {
    it('should return correct multiplier for small font', async () => {
      await service.updateSettings({ fontSize: 'small' });
      expect(service.getFontSizeMultiplier()).toBe(0.85);
    });

    it('should return correct multiplier for medium font', async () => {
      await service.updateSettings({ fontSize: 'medium' });
      expect(service.getFontSizeMultiplier()).toBe(1.0);
    });

    it('should return correct multiplier for large font', async () => {
      await service.updateSettings({ fontSize: 'large' });
      expect(service.getFontSizeMultiplier()).toBe(1.15);
    });

    it('should return correct multiplier for extra large font', async () => {
      await service.updateSettings({ fontSize: 'extraLarge' });
      expect(service.getFontSizeMultiplier()).toBe(1.3);
    });
  });

  describe('accessibility state checks', () => {
    it('should return high contrast state', async () => {
      await service.updateSettings({ highContrastMode: true });
      expect(service.shouldUseHighContrast()).toBe(true);

      await service.updateSettings({ highContrastMode: false });
      expect(service.shouldUseHighContrast()).toBe(false);
    });

    it('should return reduced motion state', async () => {
      await service.updateSettings({ reducedMotion: true });
      expect(service.shouldReduceMotion()).toBe(true);

      await service.updateSettings({ reducedMotion: false });
      expect(service.shouldReduceMotion()).toBe(false);
    });
  });

  describe('subscription management', () => {
    it('should allow subscribing and unsubscribing', () => {
      const listener = jest.fn();
      const unsubscribe = service.subscribe(listener);

      // Trigger a change
      service.updateSettings({ highContrastMode: true });
      expect(listener).toHaveBeenCalled();

      // Unsubscribe
      unsubscribe();
      listener.mockClear();

      // Trigger another change
      service.updateSettings({ highContrastMode: false });
      expect(listener).not.toHaveBeenCalled();
    });
  });
});