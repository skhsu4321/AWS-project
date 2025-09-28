import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { VoiceCommandButton } from '../VoiceCommandButton';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useTheme } from '../../../contexts/ThemeContext';
import { voiceCommandService } from '../../../services/VoiceCommandService';

// Mock dependencies
jest.mock('../../../hooks/useAccessibility');
jest.mock('../../../contexts/ThemeContext');
jest.mock('../../../services/VoiceCommandService');

const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockVoiceCommandService = voiceCommandService as jest.Mocked<typeof voiceCommandService>;

describe('VoiceCommandButton', () => {
  const mockTriggerHapticFeedback = jest.fn();
  const mockSpeak = jest.fn();
  
  const mockTheme = {
    colors: {
      primary: '#2E7D32',
      error: '#F44336',
      onPrimary: '#FFFFFF',
      common: { shadow: 'rgba(0, 0, 0, 0.1)' },
    },
    typography: {
      h3: { fontSize: 24, fontWeight: '600' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
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
      updateSettings: jest.fn(),
      triggerHapticFeedback: mockTriggerHapticFeedback,
      speak: mockSpeak,
      announceForAccessibility: jest.fn(),
    });

    mockUseTheme.mockReturnValue({ theme: mockTheme });
    
    mockVoiceCommandService.subscribe.mockReturnValue(() => {});
    mockVoiceCommandService.isCurrentlyListening.mockReturnValue(false);
    mockVoiceCommandService.startListening.mockResolvedValue();
    mockVoiceCommandService.stopListening.mockResolvedValue();
  });

  it('should render when voice commands are enabled', () => {
    const { getByRole } = render(<VoiceCommandButton />);
    
    expect(getByRole('button')).toBeTruthy();
  });

  it('should not render when voice commands are disabled', () => {
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
      updateSettings: jest.fn(),
      triggerHapticFeedback: mockTriggerHapticFeedback,
      speak: mockSpeak,
      announceForAccessibility: jest.fn(),
    });

    const { queryByRole } = render(<VoiceCommandButton />);
    
    expect(queryByRole('button')).toBeNull();
  });

  it('should start listening when pressed and not currently listening', async () => {
    mockVoiceCommandService.isCurrentlyListening.mockReturnValue(false);
    
    const { getByRole } = render(<VoiceCommandButton />);
    const button = getByRole('button');
    
    await act(async () => {
      fireEvent.press(button);
    });
    
    expect(mockTriggerHapticFeedback).toHaveBeenCalledWith('medium');
    expect(mockVoiceCommandService.startListening).toHaveBeenCalled();
  });

  it('should stop listening when pressed and currently listening', async () => {
    mockVoiceCommandService.isCurrentlyListening.mockReturnValue(true);
    
    const { getByRole } = render(<VoiceCommandButton />);
    const button = getByRole('button');
    
    await act(async () => {
      fireEvent.press(button);
    });
    
    expect(mockTriggerHapticFeedback).toHaveBeenCalledWith('medium');
    expect(mockVoiceCommandService.stopListening).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalledWith('Voice command cancelled');
  });

  it('should handle voice commands disabled state', async () => {
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
      updateSettings: jest.fn(),
      triggerHapticFeedback: mockTriggerHapticFeedback,
      speak: mockSpeak,
      announceForAccessibility: jest.fn(),
    });

    // Force render by mocking the initial state
    const { rerender } = render(<VoiceCommandButton />);
    
    // Update to disabled state
    rerender(<VoiceCommandButton />);
    
    // Should not render when disabled
    expect(mockSpeak).toHaveBeenCalledWith(
      'Voice commands are disabled. Enable them in accessibility settings.'
    );
  });

  it('should call onCommand callback when command is received', () => {
    const onCommand = jest.fn();
    let commandCallback: (command: any) => void;
    
    mockVoiceCommandService.subscribe.mockImplementation((callback) => {
      commandCallback = callback;
      return () => {};
    });
    
    render(<VoiceCommandButton onCommand={onCommand} />);
    
    const mockCommand = {
      type: 'ADD_EXPENSE',
      data: { amount: 50, category: 'food' },
      confidence: 0.8,
    };
    
    act(() => {
      commandCallback!(mockCommand);
    });
    
    expect(onCommand).toHaveBeenCalledWith(mockCommand);
  });

  it('should have proper accessibility properties when not listening', () => {
    mockVoiceCommandService.isCurrentlyListening.mockReturnValue(false);
    
    const { getByRole } = render(<VoiceCommandButton />);
    const button = getByRole('button');
    
    expect(button.props.accessibilityLabel).toBe('Start voice command');
    expect(button.props.accessibilityHint).toBe('Tap to start listening for voice commands');
    expect(button.props.accessibilityState.selected).toBe(false);
  });

  it('should have proper accessibility properties when listening', () => {
    mockVoiceCommandService.isCurrentlyListening.mockReturnValue(true);
    
    const { getByRole } = render(<VoiceCommandButton />);
    const button = getByRole('button');
    
    expect(button.props.accessibilityLabel).toBe('Stop voice command');
    expect(button.props.accessibilityHint).toBe('Tap to stop listening for voice commands');
    expect(button.props.accessibilityState.selected).toBe(true);
  });

  it('should render different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { getByRole } = render(<VoiceCommandButton size={size} />);
      const button = getByRole('button');
      
      const expectedSize = size === 'small' ? 40 : size === 'large' ? 64 : 52;
      
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: expectedSize,
            height: expectedSize,
          })
        ])
      );
    });
  });

  it('should show different icons based on listening state', () => {
    // Not listening
    mockVoiceCommandService.isCurrentlyListening.mockReturnValue(false);
    const { getByText: getByTextNotListening } = render(<VoiceCommandButton />);
    expect(getByTextNotListening('🎤')).toBeTruthy();

    // Listening
    mockVoiceCommandService.isCurrentlyListening.mockReturnValue(true);
    const { getByText: getByTextListening } = render(<VoiceCommandButton />);
    expect(getByTextListening('⏹️')).toBeTruthy();
  });

  it('should change background color based on listening state', () => {
    // Not listening - should use primary color
    mockVoiceCommandService.isCurrentlyListening.mockReturnValue(false);
    const { getByRole: getByRoleNotListening } = render(<VoiceCommandButton />);
    const buttonNotListening = getByRoleNotListening('button');
    
    expect(buttonNotListening.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: mockTheme.colors.primary,
        })
      ])
    );

    // Listening - should use error color
    mockVoiceCommandService.isCurrentlyListening.mockReturnValue(true);
    const { getByRole: getByRoleListening } = render(<VoiceCommandButton />);
    const buttonListening = getByRoleListening('button');
    
    expect(buttonListening.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: mockTheme.colors.error,
        })
      ])
    );
  });
});