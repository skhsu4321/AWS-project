import React, {useState} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {useDispatch} from 'react-redux';
import {useTheme} from '../../contexts/ThemeContext';
import {Screen, Typography, Input, Button, Card} from '../../components/common';
import {setUser} from '../../store/slices/authSlice';
import {UserMode, Currency} from '../../models/User';

export const RegisterScreen: React.FC = () => {
  const {theme, colorScheme} = useTheme();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !displayName.trim() || !age.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const ageNumber = parseInt(age);
    if (isNaN(ageNumber) || ageNumber < 6 || ageNumber > 120) {
      Alert.alert('Error', 'Please enter a valid age between 6 and 120');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate registration delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Determine user mode based on age
      const isChild = ageNumber < 18;
      
      const mockUser = {
        id: 'mock-user-' + Date.now(),
        email: email.toLowerCase(),
        profile: {
          displayName: displayName.trim(),
          age: ageNumber,
          mode: isChild ? UserMode.CHILD : UserMode.ADULT,
          currency: Currency.HKD,
          timezone: 'Asia/Hong_Kong',
          preferences: {
            theme: 'auto' as const,
            notifications: true,
            language: 'en',
            soundEnabled: true,
            hapticFeedback: true,
          },
        },
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: true,
        isActive: true,
      };

      // Dispatch registration success
      dispatch(setUser(mockUser));
      
    } catch (error) {
      Alert.alert('Registration Failed', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.component.screenPadding,
    },
    card: {
      padding: theme.spacing.lg,
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    title: {
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      color: theme.colors.primary,
    },
    subtitle: {
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      color: theme.colors.onSurface,
    },
    inputContainer: {
      marginBottom: theme.spacing.md,
    },
    ageInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.md,
    },
    ageInput: {
      flex: 1,
    },
    registerButton: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    demoText: {
      textAlign: 'center',
      marginTop: theme.spacing.md,
      color: theme.colors.outline,
      fontSize: colorScheme === 'child' ? 14 : 12,
    },
  });

  return (
    <Screen scrollable testID="register-screen">
      <View style={styles.container}>
        <Card style={styles.card}>
          <Typography variant="h2" style={styles.title}>
            🌱 Join Farm Finance
          </Typography>
          
          <Typography variant="body1" style={styles.subtitle}>
            Create your farming adventure account
          </Typography>

          <View style={styles.inputContainer}>
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="What should we call you?"
              testID="display-name-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="email-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              keyboardType="numeric"
              testID="age-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              testID="password-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              testID="confirm-password-input"
            />
          </View>

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
            testID="register-button"
          />

          <Typography variant="caption" style={styles.demoText}>
            Demo Mode - Account will be created instantly
          </Typography>
        </Card>
      </View>
    </Screen>
  );
};