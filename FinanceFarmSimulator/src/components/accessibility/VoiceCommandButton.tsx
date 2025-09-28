import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { voiceCommandService, VoiceCommand } from '../../services/VoiceCommandService';

export interface VoiceCommandButtonProps {
  onCommand?: (command: VoiceCommand) => void;
  style?: any;
  size?: 'small' | 'medium' | 'large';
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onCommand,
  style,
  size = 'medium',
}) => {
  const { theme } = useTheme();
  const { settings, triggerHapticFeedback, speak } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const styles = StyleSheet.create({
    container: {
      width: size === 'small' ? 40 : size === 'large' ? 64 : 52,
      height: size === 'small' ? 40 : size === 'large' ? 64 : 52,
      borderRadius: size === 'small' ? 20 : size === 'large' ? 32 : 26,
      backgroundColor: isListening ? theme.colors.error : theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: theme.colors.common.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    icon: {
      ...theme.typography.h3,
      color: theme.colors.onPrimary,
      fontSize: size === 'small' ? 16 : size === 'large' ? 24 : 20,
    },
    disabled: {
      opacity: 0.5,
    },
  });

  useEffect(() => {
    if (!settings.voiceCommandsEnabled) return;

    const unsubscribe = voiceCommandService.subscribe((command) => {
      setIsListening(false);
      stopPulseAnimation();
      onCommand?.(command);
    });

    return unsubscribe;
  }, [settings.voiceCommandsEnabled, onCommand]);

  useEffect(() => {
    // Update listening state
    const checkListeningState = () => {
      const listening = voiceCommandService.isCurrentlyListening();
      setIsListening(listening);
      
      if (listening) {
        startPulseAnimation();
      } else {
        stopPulseAnimation();
      }
    };

    const interval = setInterval(checkListeningState, 100);
    return () => clearInterval(interval);
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    if (!settings.voiceCommandsEnabled) {
      await speak('Voice commands are disabled. Enable them in accessibility settings.');
      return;
    }

    await triggerHapticFeedback('medium');

    if (isListening) {
      // Stop listening
      await voiceCommandService.stopListening();
      setIsListening(false);
      stopPulseAnimation();
      await speak('Voice command cancelled');
    } else {
      // Start listening
      await voiceCommandService.startListening();
      setIsListening(true);
      startPulseAnimation();
    }
  };

  if (!settings.voiceCommandsEnabled) {
    return null;
  }

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          !settings.voiceCommandsEnabled && styles.disabled,
          style,
        ]}
        onPress={handlePress}
        disabled={!settings.voiceCommandsEnabled}
        accessibilityRole="button"
        accessibilityLabel={isListening ? 'Stop voice command' : 'Start voice command'}
        accessibilityHint={
          isListening 
            ? 'Tap to stop listening for voice commands'
            : 'Tap to start listening for voice commands'
        }
        accessibilityState={{ selected: isListening }}
      >
        <Text style={styles.icon}>
          {isListening ? '⏹️' : '🎤'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};