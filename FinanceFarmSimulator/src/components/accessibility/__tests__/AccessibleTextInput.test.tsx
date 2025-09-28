import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibleTextInput } from '../AccessibleTextInput';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock dependencies
jest.mock('../../../hooks/useAccessibility');
jest.mock('../../../contexts/ThemeContext');

const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('AccessibleTextInput', () => {
  const mockTriggerHapticFeedback = jest.fn();
  const mockAnnounceForAccessibility = jest.fn();
  
  const mockTheme = {
    colors: {
      onBackground: '#000000',
      error: '#FF0000',
      primary: '#2E7D32',
      outline: '#79747E',
      surface: '#F5F5F5',
      onSurface: '#1C1B1F',
    },
    typography: {
      body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
      body1: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
      caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    },
    spacing: {
      md: 16,
      xs: 4,
      sm: 8,
    },
    dimensions: {
      borderRadius: { medium: 8 },
      component: { inputHeight: 48 },
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
      updateSettings: jest.fn(),
      triggerHapticFeedback: mockTriggerHapticFeedback,
      speak: jest.fn(),
      announceForAccessibility: mockAnnounceForAccessibility,
    });

    mockUseTheme.mockReturnValue({ theme: mockTheme });
  });

  it('should render with label', () => {
    const { getByText } = render(
      <AccessibleTextInput label="Test Input" />
    );

    expect(getByText('Test Input')).toBeTruthy();
  });

  it('should show required indicator when required', () => {
    const { getByText } = render(
      <AccessibleTextInput label="Test Input" required />
    );

    expect(getByText('*')).toBeTruthy();
  });

  it('should display hint text', () => {
    const { getByText } = render(
      <AccessibleTextInput 
        label="Test Input" 
        hint="This is a helpful hint" 
      />
    );

    expect(getByText('This is a helpful hint')).toBeTruthy();
  });

  it('should display error message', () => {
    const { getByText } = render(
      <AccessibleTextInput 
        label="Test Input" 
        error="This field is required" 
      />
    );

    expect(getByText('This field is required')).toBeTruthy();
  });

  it('should prioritize error over hint', () => {
    const { getByText, queryByText } = render(
      <AccessibleTextInput 
        label="Test Input" 
        hint="This is a hint"
        error="This is an error" 
      />
    );

    expect(getByText('This is an error')).toBeTruthy();
    expect(queryByText('This is a hint')).toBeNull();
  });

  it('should trigger haptic feedback on focus', () => {
    const { getByDisplayValue } = render(
      <AccessibleTextInput label="Test Input" value="" />
    );

    const input = getByDisplayValue('');
    fireEvent(input, 'focus');

    expect(mockTriggerHapticFeedback).toHaveBeenCalledWith('light');
  });

  it('should announce field information on focus', () => {
    const { getByDisplayValue } = render(
      <AccessibleTextInput 
        label="Email Address" 
        required 
        hint="Enter your email address"
        value=""
      />
    );

    const input = getByDisplayValue('');
    fireEvent(input, 'focus');

    expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
      'Email Address, required text field, Enter your email address'
    );
  });

  it('should have proper accessibility properties', () => {
    const { getByDisplayValue } = render(
      <AccessibleTextInput 
        label="Test Input" 
        required
        hint="Test hint"
        value=""
      />
    );

    const input = getByDisplayValue('');
    
    expect(input.props.accessibilityLabel).toBe('Test Input, required text input');
    expect(input.props.accessibilityHint).toBe('Test hint');
    expect(input.props.accessibilityRequired).toBe(true);
  });

  it('should indicate invalid state when error is present', () => {
    const { getByDisplayValue } = render(
      <AccessibleTextInput 
        label="Test Input" 
        error="Invalid input"
        value=""
      />
    );

    const input = getByDisplayValue('');
    expect(input.props.accessibilityState.invalid).toBe(true);
  });

  it('should call onFocus and onBlur callbacks', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    
    const { getByDisplayValue } = render(
      <AccessibleTextInput 
        label="Test Input" 
        onFocus={onFocus}
        onBlur={onBlur}
        value=""
      />
    );

    const input = getByDisplayValue('');
    
    fireEvent(input, 'focus');
    expect(onFocus).toHaveBeenCalled();
    
    fireEvent(input, 'blur');
    expect(onBlur).toHaveBeenCalled();
  });

  it('should apply high contrast styles when enabled', () => {
    const highContrastTheme = {
      ...mockTheme,
      accessibility: { highContrast: true },
    };

    mockUseTheme.mockReturnValue({ theme: highContrastTheme });

    const { getByDisplayValue } = render(
      <AccessibleTextInput label="Test Input" value="" />
    );

    const input = getByDisplayValue('');
    const container = input.parent;
    
    // Check if high contrast border width is applied
    expect(container?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderWidth: 3 })
      ])
    );
  });

  it('should handle text input props correctly', () => {
    const { getByDisplayValue } = render(
      <AccessibleTextInput 
        label="Test Input" 
        value="test value"
        placeholder="Enter text"
        secureTextEntry
        keyboardType="email-address"
      />
    );

    const input = getByDisplayValue('test value');
    
    expect(input.props.placeholder).toBe('Enter text');
    expect(input.props.secureTextEntry).toBe(true);
    expect(input.props.keyboardType).toBe('email-address');
  });
});