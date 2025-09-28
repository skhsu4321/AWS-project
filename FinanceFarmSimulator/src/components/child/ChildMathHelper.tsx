import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {ChildButton} from './ChildButton';

export interface ChildMathHelperProps {
  visible: boolean;
  onClose: () => void;
  onResult: (result: number) => void;
  currentValue?: number;
}

export const ChildMathHelper: React.FC<ChildMathHelperProps> = ({
  visible,
  onClose,
  onResult,
  currentValue = 0,
}) => {
  const {theme} = useTheme();
  const [display, setDisplay] = useState(currentValue.toString());
  const [operation, setOperation] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);

  const helperStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.dimensions.borderRadius.large,
      padding: theme.spacing.lg,
      margin: theme.spacing.md,
      width: '90%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      fontWeight: '700',
    },
    display: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.dimensions.borderRadius.medium,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    displayText: {
      ...theme.typography.h2,
      color: theme.colors.onBackground,
      textAlign: 'center',
      fontWeight: '700',
    },
    buttonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    numberButton: {
      width: '22%',
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.primaryLight,
    },
    operationButton: {
      width: '22%',
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.secondary,
    },
    wideButton: {
      width: '48%',
      marginBottom: theme.spacing.sm,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
  });

  const handleNumberPress = (num: string) => {
    if (display === '0' || operation === '=') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
    if (operation === '=') {
      setOperation(null);
      setPreviousValue(null);
    }
  };

  const handleOperationPress = (op: string) => {
    const current = parseFloat(display);
    
    if (previousValue !== null && operation && operation !== '=') {
      const result = calculate(previousValue, current, operation);
      setDisplay(result.toString());
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }
    
    setOperation(op);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + current;
      case '-':
        return prev - current;
      case '×':
        return prev * current;
      case '÷':
        return current !== 0 ? prev / current : prev;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      setDisplay(result.toString());
      setOperation('=');
      setPreviousValue(null);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setOperation(null);
    setPreviousValue(null);
  };

  const handleUseResult = () => {
    const result = parseFloat(display);
    onResult(result);
  };

  const NumberButton: React.FC<{number: string}> = ({number}) => (
    <ChildButton
      title={number}
      onPress={() => handleNumberPress(number)}
      style={helperStyles.numberButton}
      variant="primary"
    />
  );

  const OperationButton: React.FC<{operation: string}> = ({operation: op}) => (
    <ChildButton
      title={op}
      onPress={() => handleOperationPress(op)}
      style={helperStyles.operationButton}
      variant="secondary"
    />
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={helperStyles.overlay}>
        <View style={helperStyles.container}>
          <Text style={helperStyles.title}>🧮 Math Helper</Text>
          
          <View style={helperStyles.display}>
            <Text style={helperStyles.displayText}>{display}</Text>
          </View>
          
          <View style={helperStyles.buttonGrid}>
            <ChildButton
              title="Clear"
              onPress={handleClear}
              style={[helperStyles.wideButton, {backgroundColor: theme.colors.warning}]}
              variant="secondary"
            />
            <ChildButton
              title="÷"
              onPress={() => handleOperationPress('÷')}
              style={helperStyles.operationButton}
              variant="secondary"
            />
            
            <NumberButton number="7" />
            <NumberButton number="8" />
            <NumberButton number="9" />
            <OperationButton operation="×" />
            
            <NumberButton number="4" />
            <NumberButton number="5" />
            <NumberButton number="6" />
            <OperationButton operation="-" />
            
            <NumberButton number="1" />
            <NumberButton number="2" />
            <NumberButton number="3" />
            <OperationButton operation="+" />
            
            <ChildButton
              title="0"
              onPress={() => handleNumberPress('0')}
              style={[helperStyles.wideButton, helperStyles.numberButton]}
              variant="primary"
            />
            <ChildButton
              title="="
              onPress={handleEquals}
              style={[helperStyles.wideButton, {backgroundColor: theme.colors.success}]}
              variant="primary"
            />
          </View>
          
          <View style={helperStyles.actionButtons}>
            <ChildButton
              title="Cancel"
              onPress={onClose}
              style={helperStyles.actionButton}
              variant="secondary"
            />
            <ChildButton
              title="Use This Number"
              onPress={handleUseResult}
              style={helperStyles.actionButton}
              variant="fun"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};