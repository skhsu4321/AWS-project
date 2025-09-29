import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMode, setUserMode] = useState('adult'); // 'adult' or 'child'
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  
  // User data
  const [user, setUser] = useState({ email: '', name: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  
  // Financial data
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [incomeForm, setIncomeForm] = useState({ amount: '', source: 'allowance', description: '' });
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'food', description: '' });
  const [goalForm, setGoalForm] = useState({ title: '', targetAmount: '', description: '' });

  // Authentication Functions
  const handleLogin = () => {
    if (loginForm.email && loginForm.password) {
      setUser({ email: loginForm.email, name: loginForm.email.split('@')[0] });
      setIsLoggedIn(true);
      setCurrentScreen('Farm');
      Alert.alert('Success!', 'Welcome to Finance Farm Simulator!');
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const handleRegister = () => {
    if (registerForm.name && registerForm.email && registerForm.password && registerForm.confirmPassword) {
      if (registerForm.password === registerForm.confirmPassword) {
        setUser({ email: registerForm.email, name: registerForm.name });
        setIsLoggedIn(true);
        setCurrentScreen('ModeSelection');
        Alert.alert('Success!', 'Account created successfully!');
      } else {
        Alert.alert('Error', 'Passwords do not match');
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('Login');
    setUser({ email: '', name: '' });
    Alert.alert('Logged Out', 'See you next time!');
  };

  // Financial Functions
  const addIncome = () => {
    if (incomeForm.amount && incomeForm.description) {
      const newIncome = {
        id: Date.now(),
        amount: parseFloat(incomeForm.amount),
        source: incomeForm.source,
        description: incomeForm.description,
        date: new Date().toLocaleDateString()
      };
      setIncome([...income, newIncome]);
      setIncomeForm({ amount: '', source: 'allowance', description: '' });
      setShowModal(false);
      Alert.alert('Success!', `Added $${incomeForm.amount} income!`);
    } else {
      Alert.alert('Error', 'Please fill in amount and description');
    }
  };

  const addExpense = () => {
    if (expenseForm.amount && expenseForm.description) {
      const newExpense = {
        id: Date.now(),
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description,
        date: new Date().toLocaleDateString()
      };
      setExpenses([...expenses, newExpense]);
      setExpenseForm({ amount: '', category: 'food', description: '' });
      setShowModal(false);
      Alert.alert('Success!', `Added $${expenseForm.amount} expense!`);
    } else {
      Alert.alert('Error', 'Please fill in amount and description');
    }
  };

  const addGoal = () => {
    if (goalForm.title && goalForm.targetAmount) {
      const newGoal = {
        id: Date.now(),
        title: goalForm.title,
        targetAmount: parseFloat(goalForm.targetAmount),
        currentAmount: 0,
        description: goalForm.description,
        date: new Date().toLocaleDateString()
      };
      setGoals([...goals, newGoal]);
      setGoalForm({ title: '', targetAmount: '', description: '' });
      setShowModal(false);
      Alert.alert('Success!', `Created goal: ${goalForm.title}!`);
    } else {
      Alert.alert('Error', 'Please fill in title and target amount');
    }
  };

  // Screen Components
  const LoginScreen = () => (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>🌱 Welcome to Finance Farm</Text>
        <Text style={styles.authSubtitle}>Login to your account</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={loginForm.email}
          onChangeText={(text) => setLoginForm({...loginForm, email: text})}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={loginForm.password}
          onChangeText={(text) => setLoginForm({...loginForm, password: text})}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => setCurrentScreen('Register')}
        >
          <Text style={styles.secondaryButtonText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const RegisterScreen = () => (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>🌱 Create Account</Text>
        <Text style={styles.authSubtitle}>Join Finance Farm Simulator</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={registerForm.name}
          onChangeText={(text) => setRegisterForm({...registerForm, name: text})}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={registerForm.email}
          onChangeText={(text) => setRegisterForm({...registerForm, email: text})}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={registerForm.password}
          onChangeText={(text) => setRegisterForm({...registerForm, password: text})}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={registerForm.confirmPassword}
          onChangeText={(text) => setRegisterForm({...registerForm, confirmPassword: text})}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => setCurrentScreen('Login')}
        >
          <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const ModeSelectionScreen = () => (
    <View style={styles.screenContainer}>
      <View style={styles.modeContainer}>
        <Text style={styles.authTitle}>Choose Your Mode</Text>
        <Text style={styles.authSubtitle}>How would you like to use Finance Farm?</Text>
        
        <TouchableOpacity 
          style={styles.modeButton} 
          onPress={() => {
            setUserMode('adult');
            setCurrentScreen('Farm');
            Alert.alert('Adult Mode', 'Full features unlocked!');
          }}
        >
          <Text style={styles.modeIcon}>👨‍💼</Text>
          <Text style={styles.modeTitle}>Adult Mode</Text>
          <Text style={styles.modeDescription}>Full access to all financial features</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.modeButton} 
          onPress={() => {
            setUserMode('child');
            setCurrentScreen('Farm');
            Alert.alert('Child Mode', 'Kid-friendly interface activated!');
          }}
        >
          <Text style={styles.modeIcon}>👶</Text>
          <Text style={styles.modeTitle}>Child Mode</Text>
          <Text style={styles.modeDescription}>Simplified interface with parental controls</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const FarmScreen = () => {
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    return (
      <ScrollView style={styles.screenContainer}>
        <View style={styles.farmContainer}>
          <Text style={styles.screenTitle}>🌱 Your Farm</Text>
          <Text style={styles.welcomeText}>Welcome back, {user.name}!</Text>
          
          <View style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>Current Balance</Text>
            <Text style={[styles.balanceAmount, balance >= 0 ? styles.positive : styles.negative]}>
              ${balance.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>${totalIncome.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Income</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statValue}>${totalExpenses.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Expenses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statValue}>{goals.length}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
          </View>
          
          <View style={styles.farmVisualization}>
            <Text style={styles.farmTitle}>🚜 Farm Status</Text>
            <Text style={styles.farmDescription}>
              {balance > 100 ? "Your farm is thriving! 🌟" : 
               balance > 0 ? "Your farm is growing steadily 🌱" : 
               "Time to plant some seeds! 🌰"}
            </Text>
            <View style={styles.farmGrid}>
              {[...Array(9)].map((_, i) => (
                <View key={i} style={styles.farmPlot}>
                  <Text style={styles.farmEmoji}>
                    {i < Math.floor(balance / 20) ? "🌾" : "🟫"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const IncomeScreen = () => (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>💰 Income</Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setModalType('income');
            setShowModal(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add Income</Text>
        </TouchableOpacity>
        
        {income.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>No income recorded yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add Income" to get started!</Text>
          </View>
        ) : (
          income.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemAmount}>+${item.amount.toFixed(2)}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemSource}>Source: {item.source}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const ExpensesScreen = () => (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>💸 Expenses</Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setModalType('expense');
            setShowModal(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add Expense</Text>
        </TouchableOpacity>
        
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyText}>No expenses recorded yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add Expense" to track your spending!</Text>
          </View>
        ) : (
          expenses.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemAmount, styles.expenseAmount]}>-${item.amount.toFixed(2)}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemCategory}>Category: {item.category}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  // Modal Component
  const renderModal = () => {
    if (modalType === 'income') {
      return (
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add Income</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Amount ($)"
                value={incomeForm.amount}
                onChangeText={(text) => setIncomeForm({...incomeForm, amount: text})}
                keyboardType="numeric"
              />
              
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Source:</Text>
                {['allowance', 'chores', 'gift', 'job', 'other'].map((source) => (
                  <TouchableOpacity
                    key={source}
                    style={[
                      styles.pickerOption,
                      incomeForm.source === source && styles.pickerOptionSelected
                    ]}
                    onPress={() => setIncomeForm({...incomeForm, source})}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      incomeForm.source === source && styles.pickerOptionTextSelected
                    ]}>
                      {source.charAt(0).toUpperCase() + source.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={incomeForm.description}
                onChangeText={(text) => setIncomeForm({...incomeForm, description: text})}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalSaveButton}
                  onPress={addIncome}
                >
                  <Text style={styles.modalSaveText}>Add Income</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    } else if (modalType === 'expense') {
      return (
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Amount ($)"
                value={expenseForm.amount}
                onChangeText={(text) => setExpenseForm({...expenseForm, amount: text})}
                keyboardType="numeric"
              />
              
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Category:</Text>
                {['food', 'entertainment', 'transport', 'shopping', 'other'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.pickerOption,
                      expenseForm.category === category && styles.pickerOptionSelected
                    ]}
                    onPress={() => setExpenseForm({...expenseForm, category})}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      expenseForm.category === category && styles.pickerOptionTextSelected
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={expenseForm.description}
                onChangeText={(text) => setExpenseForm({...expenseForm, description: text})}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalSaveButton}
                  onPress={addExpense}
                >
                  <Text style={styles.modalSaveText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }
    return null;
  };

  // Main render logic
  if (!isLoggedIn) {
    if (currentScreen === 'Register') {
      return RegisterScreen();
    } else if (currentScreen === 'ModeSelection') {
      return ModeSelectionScreen();
    } else {
      return LoginScreen();
    }
  }

  // Logged in screens
  const screens = {
    Farm: FarmScreen,
    Income: IncomeScreen,
    Expenses: ExpensesScreen,
    Goals: () => <Text>Goals Screen (Coming Soon)</Text>,
    Analytics: () => {
      const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
      const balance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
      
      // Calculate expense breakdown
      const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});
      
      const categoryColors = {
        food: '#FF6B6B',
        entertainment: '#4ECDC4', 
        transport: '#45B7D1',
        shopping: '#96CEB4',
        other: '#FFEAA7'
      };
      
      return (
        <ScrollView style={styles.screenContainer}>
          <View style={styles.contentContainer}>
            <Text style={styles.screenTitle}>📈 Analytics</Text>
            
            {/* Quick Stats */}
            <View style={styles.analyticsStatsContainer}>
              <View style={styles.analyticsStatCard}>
                <Text style={styles.analyticsStatValue}>${totalIncome.toFixed(2)}</Text>
                <Text style={styles.analyticsStatLabel}>Total Income</Text>
              </View>
              <View style={styles.analyticsStatCard}>
                <Text style={[styles.analyticsStatValue, styles.expenseAmount]}>
                  ${totalExpenses.toFixed(2)}
                </Text>
                <Text style={styles.analyticsStatLabel}>Total Expenses</Text>
              </View>
              <View style={styles.analyticsStatCard}>
                <Text style={[styles.analyticsStatValue, balance >= 0 ? styles.positive : styles.negative]}>
                  ${balance.toFixed(2)}
                </Text>
                <Text style={styles.analyticsStatLabel}>Net Balance</Text>
              </View>
            </View>
            
            {/* Savings Rate */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsCardTitle}>💰 Savings Rate</Text>
              <View style={styles.savingsRateContainer}>
                <Text style={[styles.savingsRateValue, savingsRate >= 20 ? styles.positive : savingsRate >= 10 ? styles.warning : styles.negative]}>
                  {savingsRate.toFixed(1)}%
                </Text>
                <Text style={styles.savingsRateDescription}>
                  {savingsRate >= 20 ? "Excellent! You're saving well!" :
                   savingsRate >= 10 ? "Good savings rate, keep it up!" :
                   savingsRate >= 0 ? "Try to save more each month" :
                   "You're spending more than earning"}
                </Text>
              </View>
            </View>
            
            {/* Expense Breakdown */}
            {expenses.length > 0 && (
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsCardTitle}>📊 Expense Breakdown</Text>
                {Object.entries(expensesByCategory).map(([category, amount]) => {
                  const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0;
                  return (
                    <View key={category} style={styles.expenseBreakdownItem}>
                      <View style={styles.expenseBreakdownHeader}>
                        <Text style={styles.expenseBreakdownCategory}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                        <Text style={styles.expenseBreakdownAmount}>
                          ${amount.toFixed(2)} ({percentage.toFixed(1)}%)
                        </Text>
                      </View>
                      <View style={styles.expenseBreakdownBar}>
                        <View 
                          style={[
                            styles.expenseBreakdownFill,
                            { 
                              width: `${percentage}%`,
                              backgroundColor: categoryColors[category] || '#CCCCCC'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            
            {/* Recent Activity */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsCardTitle}>📋 Recent Activity</Text>
              {[...income.slice(-3).map(item => ({...item, type: 'income'})), 
                ...expenses.slice(-3).map(item => ({...item, type: 'expense'}))]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map((item, index) => (
                  <View key={`${item.type}-${item.id}`} style={styles.recentActivityItem}>
                    <Text style={styles.recentActivityIcon}>
                      {item.type === 'income' ? '💰' : '💸'}
                    </Text>
                    <View style={styles.recentActivityDetails}>
                      <Text style={styles.recentActivityDescription}>{item.description}</Text>
                      <Text style={styles.recentActivityDate}>{item.date}</Text>
                    </View>
                    <Text style={[
                      styles.recentActivityAmount,
                      item.type === 'income' ? styles.positive : styles.expenseAmount
                    ]}>
                      {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
              
              {income.length === 0 && expenses.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📈</Text>
                  <Text style={styles.emptyText}>No data to analyze yet</Text>
                  <Text style={styles.emptySubtext}>Start adding income and expenses to see your analytics!</Text>
                </View>
              )}
            </View>
            
            {/* Financial Health Score */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsCardTitle}>🏥 Financial Health</Text>
              <View style={styles.healthScoreContainer}>
                {(() => {
                  let score = 0;
                  let factors = [];
                  
                  // Savings rate factor (40 points max)
                  if (savingsRate >= 20) {
                    score += 40;
                    factors.push("✅ Excellent savings rate");
                  } else if (savingsRate >= 10) {
                    score += 25;
                    factors.push("⚠️ Good savings rate");
                  } else if (savingsRate >= 0) {
                    score += 10;
                    factors.push("❌ Low savings rate");
                  } else {
                    factors.push("❌ Spending more than earning");
                  }
                  
                  // Income consistency (30 points max)
                  if (income.length >= 5) {
                    score += 30;
                    factors.push("✅ Consistent income tracking");
                  } else if (income.length >= 2) {
                    score += 20;
                    factors.push("⚠️ Some income tracking");
                  } else {
                    factors.push("❌ Limited income tracking");
                  }
                  
                  // Expense tracking (30 points max)
                  if (expenses.length >= 5) {
                    score += 30;
                    factors.push("✅ Good expense tracking");
                  } else if (expenses.length >= 2) {
                    score += 20;
                    factors.push("⚠️ Some expense tracking");
                  } else {
                    factors.push("❌ Limited expense tracking");
                  }
                  
                  const healthColor = score >= 80 ? '#28a745' : score >= 60 ? '#ffc107' : '#dc3545';
                  const healthText = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
                  
                  return (
                    <>
                      <View style={styles.healthScoreCircle}>
                        <Text style={[styles.healthScoreNumber, { color: healthColor }]}>
                          {score}/100
                        </Text>
                        <Text style={[styles.healthScoreText, { color: healthColor }]}>
                          {healthText}
                        </Text>
                      </View>
                      <View style={styles.healthFactors}>
                        {factors.map((factor, index) => (
                          <Text key={index} style={styles.healthFactor}>{factor}</Text>
                        ))}
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>
          </View>
        </ScrollView>
      );
    },
    Settings: () => (
      <View style={styles.screenContainer}>
        <Text style={styles.screenTitle}>⚙️ Settings</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    ),
  };

  const CurrentScreenComponent = screens[currentScreen];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Finance Farm Simulator</Text>
        <Text style={styles.headerSubtitle}>
          {userMode === 'child' ? '👶 Child Mode' : '👨‍💼 Adult Mode'} • {user.name}
        </Text>
      </View>

      {/* Current Screen */}
      <View style={styles.content}>
        <CurrentScreenComponent />
      </View>

      {/* Bottom Navigation */}
      <View style={styles.navigation}>
        {Object.keys(screens).map((screenName) => (
          <TouchableOpacity
            key={screenName}
            style={[
              styles.navButton,
              currentScreen === screenName && styles.navButtonActive
            ]}
            onPress={() => setCurrentScreen(screenName)}
          >
            <Text style={styles.navIcon}>
              {screenName === 'Farm' ? '🌱' :
               screenName === 'Income' ? '💰' :
               screenName === 'Expenses' ? '📊' :
               screenName === 'Goals' ? '🎯' :
               screenName === 'Analytics' ? '📈' : '⚙️'}
            </Text>
            <Text style={[
              styles.navLabel,
              currentScreen === screenName && styles.navLabelActive
            ]}>
              {screenName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal */}
      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Auth Styles
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 14,
  },
  
  // Mode Selection
  modeContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  modeButton: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  modeIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Farm Screen
  farmContainer: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  positive: {
    color: '#28a745',
  },
  negative: {
    color: '#dc3545',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  farmVisualization: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
  },
  farmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  farmDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  farmGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  farmPlot: {
    width: 60,
    height: 60,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  farmEmoji: {
    fontSize: 24,
  },
  
  // Income Screen
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  expenseAmount: {
    color: '#dc3545',
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
  itemDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  itemSource: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  pickerOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 5,
  },
  pickerOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  pickerOptionText: {
    color: '#333',
    textAlign: 'center',
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
  },
  modalCancelText: {
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#28a745',
    borderRadius: 8,
    marginLeft: 10,
  },
  modalSaveText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // Settings
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Navigation
  navigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  navButtonActive: {
    backgroundColor: '#f0f4ff',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#667eea',
  },
  
  // Analytics Styles
  analyticsStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  analyticsStatCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  analyticsStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  analyticsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  savingsRateContainer: {
    alignItems: 'center',
  },
  savingsRateValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  savingsRateDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  warning: {
    color: '#ffc107',
  },
  expenseBreakdownItem: {
    marginBottom: 15,
  },
  expenseBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseBreakdownCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expenseBreakdownAmount: {
    fontSize: 14,
    color: '#666',
  },
  expenseBreakdownBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  expenseBreakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentActivityIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  recentActivityDetails: {
    flex: 1,
  },
  recentActivityDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  recentActivityDate: {
    fontSize: 12,
    color: '#666',
  },
  recentActivityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  healthScoreContainer: {
    alignItems: 'center',
  },
  healthScoreCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  healthScoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  healthScoreText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },
  healthFactors: {
    alignSelf: 'stretch',
  },
  healthFactor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 10,
  },
});