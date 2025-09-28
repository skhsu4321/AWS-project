import { useState, useEffect } from 'react';
import { accessibilityService, AccessibilitySettings } from '../services/AccessibilityService';
import { createTheme, Theme } from '../theme/theme';

export interface UseAccessibilityReturn {
  settings: AccessibilitySettings;
  theme: Theme;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => Promise<void>;
  triggerHapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => Promise<void>;
  speak: (text: string, options?: { rate?: number; pitch?: number }) => Promise<void>;
  announceForAccessibility: (message: string) => void;
}

export const useAccessibility = (baseMode: 'adult' | 'child' = 'adult'): UseAccessibilityReturn => {
  const [settings, setSettings] = useState<AccessibilitySettings>(accessibilityService.getSettings());
  const [theme, setTheme] = useState<Theme>(createTheme(baseMode));

  useEffect(() => {
    const unsubscribe = accessibilityService.subscribe((newSettings) => {
      setSettings(newSettings);
      
      // Update theme based on accessibility settings
      const newTheme = createTheme(
        baseMode,
        accessibilityService.getFontSizeMultiplier(),
        newSettings.highContrastMode,
        newSettings.reducedMotion
      );
      setTheme(newTheme);
    });

    return unsubscribe;
  }, [baseMode]);

  const updateSettings = async (newSettings: Partial<AccessibilitySettings>) => {
    await accessibilityService.updateSettings(newSettings);
  };

  const triggerHapticFeedback = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    await accessibilityService.triggerHapticFeedback(type);
  };

  const speak = async (text: string, options?: { rate?: number; pitch?: number }) => {
    await accessibilityService.speak(text, options);
  };

  const announceForAccessibility = (message: string) => {
    accessibilityService.announceForAccessibility(message);
  };

  return {
    settings,
    theme,
    updateSettings,
    triggerHapticFeedback,
    speak,
    announceForAccessibility,
  };
};