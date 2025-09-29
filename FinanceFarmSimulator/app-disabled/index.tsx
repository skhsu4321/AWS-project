import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function HomeScreen() {
  const handlePress = (feature: string) => {
    Alert.alert('Feature', `${feature} - Coming Soon!`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 Finance Farm Simulator</Text>
      <Text style={styles.subtitle}>Grow your financial literacy through gamified money management</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handlePress('Farm View')}
        >
          <Text style={styles.buttonText}>🚜 View Farm</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handlePress('Goals Management')}
        >
          <Text style={styles.buttonText}>🎯 Manage Goals</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handlePress('Income Tracking')}
        >
          <Text style={styles.buttonText}>💰 Track Income</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handlePress('Expense Logging')}
        >
          <Text style={styles.buttonText}>💸 Log Expenses</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handlePress('Analytics')}
        >
          <Text style={styles.buttonText}>📊 View Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handlePress('Family Mode')}
        >
          <Text style={styles.buttonText}>👨‍👩‍👧‍👦 Family Mode</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.status}>✅ App loaded successfully!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  status: {
    marginTop: 30,
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
    textAlign: 'center',
  },
});