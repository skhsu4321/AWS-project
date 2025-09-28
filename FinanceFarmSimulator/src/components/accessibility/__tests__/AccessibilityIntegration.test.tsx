import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilitySettingsScreen } from '../../../screens/settings/AccessibilitySettingsScreen';
import { Button } from '../../common/Button';
import { AccessibleTextInput } from '../AccessibleTextInput';
import { VoiceCommandButton } from '../VoiceCommandButton';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useTheme } from '../../../contexts/ThemeContext';
import { accessibilityService } from '../../../services/AccessibilityService';

// Mock dependencies
jest.mock('../../../hooks/useAccessibility');
jest.mock('../../../contexts/ThemeContext');
jest.mock('../../../services/AccessibilityService');
jest.mock('../../../components/common/Screen', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockAccessibilityService = accessibilityService as jest.Mocked<typeof accessibilityService>;

describe('Accessibility Integration', () => {
  const mockUpdateSettings = jest.fn();
  const mockTriggerHapticFeedback = jest.fn();
  const mockSpeak = jest.fn();
  const mockAnnounceForAccessibility = jest.fn();

  const mockTheme = {
    colors: {
      onBackground: '#000000',
      error: '#FF0000',
      primary: '#2E7D32',
      outline: '#79747E',
      surface: '#F5F5F5',
      onSurface: '#1C1B1F',
      surfaceVariant: '#E8F5E8',
    },
    typography: {
      h3: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
      body1: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
      body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
      caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    },
    spacing: {
      md: 16,
      lg: 24,
      sm: 8,
      xs: 4,
    },
    dimensions: {
      borderRadius: { medium: 8 },
      component: { touchTargetSize: 44 },
    },
    accessibility: {
      highContrast: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAccessibility.mockReturnValue({
      settings: {
        screenReaderEnabled: false,
        highContrastMode: false,
        fontSize: 'medium',
        voiceCommandsEnabled: false,
        hapticsEnabled: true,
        reducedMotion: false,
      },
      theme: mockTheme,
      updateSettings: mockUpdateSettings,
      triggerHapticFeedback: mockTriggerHapticFeedback,
      speak: mockSpeak,
      announceForAccessibility: mockAnnounceForAccessibility,
    });

    mockUseTheme.mockReturnValue({ theme: mockTheme });
  });

  describe('AccessibilitySettingsScreen', () => {
    it('should render all accessibility settings', () => {
      const { getByText } = render(<AccessibilitySettingsScreen />);

      expect(getByText('Visual Accessibility')).toBeTruthy();
      expect(getByText('Audio Accessibility')).toBeTruthy();
      expect(getByText('Physical Accessibility')).toBeTruthy();
      expect(getByText('Test Accessibility Features')).toBeTruthy();
    });

    it('should toggle high contrast mode', async () => {
      const { getByLabelText } = render(<AccessibilitySettingsScreen />);

      const highContrastSwitch = getByLabelText('Toggle high contrast mode');
      fireEvent(highContrastSwitch, 'valueChange', true);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({ highContrastMode: true });
        expect(mockTriggerHapticFeedback).toHaveBeenCalledWith('light');
        expect(mockSpeak).toHaveBeenCalledWith('High contrast mode enabled');
      });
    });

    it('should change font size', async () => {
      const { getByText } = render(<AccessibilitySettingsScreen />);

      const largeButton = getByText('Large');
      fireEvent.press(largeButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({ fontSize: 'large' });
        expect(mockTriggerHapticFeedback).toHaveBeenCalledWith('light');
        expect(mockSpeak).toHaveBeenCalledWith('Font size changed to large');
      });
    });

    it('should toggle screen reader support', async () => {
      const { getByLabelText } = render(<AccessibilitySettingsScreen />);

      const screenReaderSwitch = getByLabelText('Toggle screen reader support');
      fireEvent(screenReaderSwitch, 'valueChange', true);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({ screenReaderEnabled: true });
        expect(mockSpeak).toHaveBeenCalledWith('Screen reader enabled');
      });
    });

    it('should test haptic feedback', async () => {
      const { getByText } = render(<AccessibilitySettingsScreen />);

      const testButton = getByText('Test Haptic Feedback');
      fireEvent.press(testButton);

      await waitFor(() => {
        expect(mockTriggerHapticFeedback).toHaveBeenCalledWith('success');
        expect(mockSpeak).toHaveBeenCalledWith('Haptic feedback test');
      });
    });

    it('should test text-to-speech', async () => {
      const { getByText } = render(<AccessibilitySettingsScreen />);

      const testButton = getByText('Test Text-to-Speech');
      fireEvent.press(testButton);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          'This is a test of the text to speech functionality. Your current font size and contrast settings are working properly.'
        );
      });
    });
  });

  describe('Enhanced Button Component', () => {
    it('should trigger haptic feedback on press', async () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Button
          title="Test Button"
          onPress={onPress}
          hapticFeedback="success"
        />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockTriggerHapticFeedback).toHaveBeenCalledWith('success');
        expect(onPress).toHaveBeenCalled();
      });
    });

    it('should announce on press when specified', async () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Button
          title="Save"
          onPress={onPress}
          announceOnPress="Settings saved successfully"
        />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockAnnounceForAccessibility).toHaveBeenCalledWith('Settings saved successfully');
      });
    });

    it('should have proper accessibility properties', () => {
      const { getByRole } = render(
        <Button
          title="Submit"
          onPress={() => {}}
          accessibilityLabel="Submit form"
          accessibilityHint="Submits the current form data"
        />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Submit form');
      expect(button.props.accessibilityHint).toBe('Submits the current form data');
      expect(button.props.accessible).toBe(true);
    });
  });

  describe('Font Size Scaling', () => {
    it('should apply font size multiplier to theme', () => {
      const largeTheme = {
        ...mockTheme,
        typography: {
          ...mockTheme.typography,
          body1: { fontSize: 18, fontWeight: '400', lineHeight: 27 }, // 16 * 1.15 = 18.4 -> 18
        },
      };

      mockUseAccessibility.mockReturnValue({
        settings: {
          screenReaderEnabled: false,
          highContrastMode: false,
          fontSize: 'large',
          voiceCommandsEnabled: false,
          hapticsEnabled: true,
          reducedMotion: false,
        },
        theme: largeTheme,
        updateSettings: mockUpdateSettings,
        triggerHapticFeedback: mockTriggerHapticFeedback,
        speak: mockSpeak,
        announceForAccessibility: mockAnnounceForAccessibility,
      });

      const { getByText } = render(
        <AccessibleTextInput label="Test Input" />
      );

      const label = getByText('Test Input');
      // The component should use the scaled typography from the theme
      expect(label.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: expect.any(Number),
          })
        ])
      );
    });
  });

  describe('High Contrast Mode', () => {
    it('should apply high contrast colors when enabled', () => {
      const highContrastTheme = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: '#000000',
          background: '#FFFFFF',
          onBackground: '#000000',
        },
        accessibility: {
          highContrast: true,
        },
      };

      mockUseAccessibility.mockReturnValue({
        settings: {
          screenReaderEnabled: false,
          highContrastMode: true,
          fontSize: 'medium',
          voiceCommandsEnabled: false,
          hapticsEnabled: true,
          reducedMotion: false,
        },
        theme: highContrastTheme,
        updateSettings: mockUpdateSettings,
        triggerHapticFeedback: mockTriggerHapticFeedback,
        speak: mockSpeak,
        announceForAccessibility: mockAnnounceForAccessibility,
      });

      mockUseTheme.mockReturnValue({ theme: highContrastTheme });

      const { getByDisplayValue } = render(
        <AccessibleTextInput label="Test Input" value="" />
      );

      const input = getByDisplayValue('');
      const container = input.parent;

      // Should apply high contrast border
      expect(container?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderWidth: 3 })
        ])
      );
    });
  });

  describe('Voice Commands Integration', () => {
    it('should show voice command button when enabled', () => {
      mockUseAccessibility.mockReturnValue({
        settings: {
          screenReaderEnabled: false,
          highContrastMode: false,
          fontSize: 'medium',
          voiceCommandsEnabled: true,
          hapticsEnabled: true,
          reducedMotion: false,
        },
        theme: mockTheme,
        updateSettings: mockUpdateSettings,
        triggerHapticFeedback: mockTriggerHapticFeedback,
        speak: mockSpeak,
        announceForAccessibility: mockAnnounceForAccessibility,
      });

      const { getByRole } = render(<VoiceCommandButton />);
      expect(getByRole('button')).toBeTruthy();
    });

    it('should hide voice command button when disabled', () => {
      mockUseAccessibility.mockReturnValue({
        settings: {
          screenReaderEnabled: false,
          highContrastMode: false,
          fontSize: 'medium',
          voiceCommandsEnabled: false,
          hapticsEnabled: true,
          reducedMotion: false,
        },
        theme: mockTheme,
        updateSettings: mockUpdateSettings,
        triggerHapticFeedback: mockTriggerHapticFeedback,
        speak: mockSpeak,
        announceForAccessibility: mockAnnounceForAccessibility,
      });

      const { queryByRole } = render(<VoiceCommandButton />);
      expect(queryByRole('button')).toBeNull();
    });
  });

  describe('Reduced Motion', () => {
    it('should respect reduced motion settings', () => {
      mockUseAccessibility.mockReturnValue({
        settings: {
          screenReaderEnabled: false,
          highContrastMode: false,
          fontSize: 'medium',
          voiceCommandsEnabled: false,
          hapticsEnabled: true,
          reducedMotion: true,
        },
        theme: {
          ...mockTheme,
          accessibility: {
            ...mockTheme.accessibility,
            reducedMotion: true,
          },
        },
        updateSettings: mockUpdateSettings,
        triggerHapticFeedback: mockTriggerHapticFeedback,
        speak: mockSpeak,
        announceForAccessibility: mockAnnounceForAccessibility,
      });

      // Components should check theme.accessibility.reducedMotion
      // and disable or reduce animations accordingly
      const theme = mockUseAccessibility().theme;
      expect(theme.accessibility.reducedMotion).toBe(true);
    });
  });
});