import React, {useState} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {useDispatch} from 'react-redux';
import {useTheme} from '../../contexts/ThemeContext';
import {Screen, Typography, Input, Button, Card} from '../../components/common';
import {setUser} from '../../store/slices/authSlice';
import {UserMode, Currency} from '../../models/User';

export const LoginScreen: React.FC = () => {
  const {theme, colorScheme} = useTheme();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock user based on email to demonstrate adult/child mode switching
      const isChildAccount = email.toLowerCase().includes('child') || email.toLowerCase().includes('kid');
      
      const mockUser = {
        id: 'mock-user-' + Date.now(),
        email: email.toLowerCase(),
        profile: {
          displayName: isChildAccount ? 'Little Farmer' : 'Farm Manager',
          age: isChildAccount ? 8 : 25,
          mode: isChildAccount ? UserMode.CHILD : UserMode.ADULT,
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

      // Dispatch login success
      dispatch(setUser(mockUser));
      
    } catch (error) {
      Alert.alert('Login Failed', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.component.screenPadding,
    },
    card: {
      padding: theme.spacing.lg,
      marginHorizontal: theme.spacing.md,
    },
    title: {
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
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
    loginButton: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    demoText: {
      textAlign: 'center',
      marginTop: theme.spacing.lg,
      color: theme.colors.outline,
      fontSize: colorScheme === 'child' ? 14 : 12,
    },
    demoHint: {
      textAlign: 'center',
      marginTop: theme.spacing.sm,
      color: theme.colors.outline,
      fontSize: colorScheme === 'child' ? 12 : 10,
      fontStyle: 'italic',
    },
  });

  return (
    <Screen testID="login-screen">
      <View style={styles.container}>
        <Card style={styles.card}>
          <Typography variant="h1" style={styles.title}>
            🌱 Farm Finance
          </Typography>
          
          <Typography variant="h3" style={styles.subtitle}>
            Welcome Back!
          </Typography>

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
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              testID="password-input"
            />
          </View>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
            testID="login-button"
          />

          <Typography variant="caption" style={styles.demoText}>
            Demo Mode - Any email and password will work
          </Typography>
          
          <Typography variant="caption" style={styles.demoHint}>
            💡 Try "child@example.com" to see child mode interface
          </Typography>
        </Card>
      </View>
    </Screen>
  );
};