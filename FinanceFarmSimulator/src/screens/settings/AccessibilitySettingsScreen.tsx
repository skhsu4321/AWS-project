import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useTheme } from '../../contexts/ThemeContext';

export const AccessibilitySettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { settings, updateSettings, triggerHapticFeedback, speak } = useAccessibility();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.md,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.medium,
      marginBottom: theme.spacing.sm,
      minHeight: theme.dimensions.component.touchTargetSize,
    },
    settingLabel: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      flex: 1,
      marginRight: theme.spacing.md,
    },
    settingDescription: {
      ...theme.typography.body2,
      color: theme.colors.onSurface,
      opacity: 0.7,
      marginTop: theme.spacing.xs,
    },
    fontSizeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    fontSizeButton: {
      minWidth: 80,
    },
    testSection: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: theme.spacing.md,
      borderRadius: theme.dimensions.borderRadius.medium,
    },
    testText: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
  });

  const handleToggleSetting = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings({ [key]: value });
    await triggerHapticFeedback('light');
    
    // Provide audio feedback for important changes
    if (key === 'screenReaderEnabled') {
      await speak(value ? 'Screen reader enabled' : 'Screen reader disabled');
    } else if (key === 'highContrastMode') {
      await speak(value ? 'High contrast mode enabled' : 'High contrast mode disabled');
    }
  };

  const handleFontSizeChange = async (fontSize: 'small' | 'medium' | 'large' | 'extraLarge') => {
    await updateSettings({ fontSize });
    await triggerHapticFeedback('light');
    await speak(`Font size changed to ${fontSize}`);
  };

  const testHapticFeedback = async () => {
    await triggerHapticFeedback('success');
    await speak('Haptic feedback test');
  };

  const testTextToSpeech = async () => {
    await speak('This is a test of the text to speech functionality. Your current font size and contrast settings are working properly.');
  };

  const showVoiceCommandHelp = () => {
    Alert.alert(
      'Voice Commands',
      'You can use these voice commands:\n\n' +
      '• "Add expense [amount] for [category]"\n' +
      '• "Add income [amount] from [source]"\n' +
      '• "Create goal [amount] for [name]"\n' +
      '• "Go to [screen name]"\n' +
      '• "Help" - for assistance',
      [{ text: 'OK', onPress: () => triggerHapticFeedback('light') }]
    );
  };

  return (
    <Screen>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual Accessibility</Text>
          
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>High Contrast Mode</Text>
              <Text style={styles.settingDescription}>
                Increases contrast for better visibility
              </Text>
            </View>
            <Switch
              value={settings.highContrastMode}
              onValueChange={(value) => handleToggleSetting('highContrastMode', value)}
              accessibilityLabel="Toggle high contrast mode"
              accessibilityHint="Increases contrast for better visibility"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Font Size</Text>
              <Text style={styles.settingDescription}>
                Adjust text size for better readability
              </Text>
              <View style={styles.fontSizeButtons}>
                {(['small', 'medium', 'large', 'extraLarge'] as const).map((size) => (
                  <Button
                    key={size}
                    title={size.charAt(0).toUpperCase() + size.slice(1)}
                    variant={settings.fontSize === size ? 'primary' : 'outline'}
                    size="small"
                    style={styles.fontSizeButton}
                    onPress={() => handleFontSizeChange(size)}
                    accessibilityLabel={`Set font size to ${size}`}
                    hapticFeedback="light"
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Accessibility</Text>
          
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Screen Reader Support</Text>
              <Text style={styles.settingDescription}>
                Enable text-to-speech for interface elements
              </Text>
            </View>
            <Switch
              value={settings.screenReaderEnabled}
              onValueChange={(value) => handleToggleSetting('screenReaderEnabled', value)}
              accessibilityLabel="Toggle screen reader support"
              accessibilityHint="Enables text-to-speech for interface elements"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Voice Commands</Text>
              <Text style={styles.settingDescription}>
                Enable voice control for expense logging and navigation
              </Text>
            </View>
            <Switch
              value={settings.voiceCommandsEnabled}
              onValueChange={(value) => handleToggleSetting('voiceCommandsEnabled', value)}
              accessibilityLabel="Toggle voice commands"
              accessibilityHint="Enables voice control for expense logging and navigation"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Accessibility</Text>
          
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Vibration feedback for button presses and interactions
              </Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(value) => handleToggleSetting('hapticsEnabled', value)}
              accessibilityLabel="Toggle haptic feedback"
              accessibilityHint="Enables vibration feedback for interactions"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Reduce Motion</Text>
              <Text style={styles.settingDescription}>
                Minimize animations and transitions
              </Text>
            </View>
            <Switch
              value={settings.reducedMotion}
              onValueChange={(value) => handleToggleSetting('reducedMotion', value)}
              accessibilityLabel="Toggle reduced motion"
              accessibilityHint="Minimizes animations and transitions"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Accessibility Features</Text>
          
          <View style={styles.testSection}>
            <Text style={styles.testText}>
              This text demonstrates your current font size and contrast settings.
              Use the buttons below to test accessibility features.
            </Text>
            
            <Button
              title="Test Haptic Feedback"
              onPress={testHapticFeedback}
              style={{ marginBottom: theme.spacing.sm }}
              accessibilityLabel="Test haptic feedback"
              accessibilityHint="Triggers a haptic feedback vibration"
              hapticFeedback="success"
            />
            
            <Button
              title="Test Text-to-Speech"
              onPress={testTextToSpeech}
              style={{ marginBottom: theme.spacing.sm }}
              accessibilityLabel="Test text to speech"
              accessibilityHint="Plays a sample text-to-speech message"
              hapticFeedback="light"
            />
            
            <Button
              title="Voice Command Help"
              onPress={showVoiceCommandHelp}
              variant="outline"
              accessibilityLabel="Show voice command help"
              accessibilityHint="Displays available voice commands"
              hapticFeedback="light"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};