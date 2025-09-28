import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {ChildMathHelper} from './ChildMathHelper';

export interface ChildNumberInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  maxValue?: number;
  minValue?: number;
  showMathHelper?: boolean;
  currency?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  testID?: string;
  disabled?: boolean;
  showIncrementButtons?: boolean;
  incrementStep?: number;
}

export const ChildNumberInput: React.FC<ChildNumberInputProps> = ({
  value,
  onChangeText,
  placeholder = '0',
  label,
  maxValue,
  minValue = 0,
  showMathHelper = true,
  currency = 'HKD',
  style,
  inputStyle,
  labelStyle,
  testID,
  disabled = false,
  showIncrementButtons = true,
  incrementStep = 1,
}) => {
  const {theme, colorScheme} = useTheme();
  const [showHelper, setShowHelper] = useState(false);
  const isChildMode = colorScheme === 'child';

  const inputStyles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 2,
        fontWeight: '600',
      }),
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: isChildMode ? theme.dimensions.borderRadius.large : theme.dimensions.borderRadius.medium,
      borderWidth: isChildMode ? 3 : 1,
      borderColor: theme.colors.outline,
      paddingHorizontal: theme.spacing.md,
      height: theme.dimensions.component.inputHeight,
      ...(isChildMode && {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
      }),
    },
    input: {
      flex: 1,
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      textAlign: 'center',
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 4,
        fontWeight: '600',
      }),
    },
    incrementButton: {
      width: isChildMode ? 44 : 36,
      height: isChildMode ? 44 : 36,
      borderRadius: isChildMode ? 22 : 18,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: theme.spacing.xs,
    },
    incrementButtonText: {
      color: theme.colors.onPrimary,
      fontSize: isChildMode ? 24 : 20,
      fontWeight: '700',
    },
    currencyText: {
      ...theme.typography.body1,
      color: theme.colors.onSurface,
      opacity: 0.7,
      marginLeft: theme.spacing.xs,
      ...(isChildMode && {
        fontSize: theme.typography.body1.fontSize + 2,
        fontWeight: '600',
      }),
    },
    helperButton: {
      marginTop: theme.spacing.xs,
      alignSelf: 'center',
    },
    helperButtonText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      textDecorationLine: 'underline',
      ...(isChildMode && {
        fontSize: theme.typography.caption.fontSize + 2,
      }),
    },
  });

  const handleIncrement = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue + incrementStep;
    if (!maxValue || newValue <= maxValue) {
      onChangeText(newValue.toString());
    }
  };

  const handleDecrement = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue - incrementStep;
    if (newValue >= minValue) {
      onChangeText(newValue.toString());
    }
  };

  const handleTextChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleanText = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanText.split('.');
    if (parts.length > 2) {
      return;
    }
    
    const numValue = parseFloat(cleanText);
    if (!isNaN(numValue)) {
      if (maxValue && numValue > maxValue) {
        return;
      }
      if (numValue < minValue) {
        return;
      }
    }
    
    onChangeText(cleanText);
  };

  return (
    <View style={[inputStyles.container, style]}>
      {label && (
        <Text style={[inputStyles.label, labelStyle]}>{label}</Text>
      )}
      
      <View style={inputStyles.inputContainer}>
        {showIncrementButtons && isChildMode && (
          <TouchableOpacity
            style={inputStyles.incrementButton}
            onPress={handleDecrement}
            disabled={disabled}
            accessibilityLabel="Decrease amount"
            accessibilityRole="button"
          >
            <Text style={inputStyles.incrementButtonText}>-</Text>
          </TouchableOpacity>
        )}
        
        <TextInput
          style={[inputStyles.input, inputStyle]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.outline}
          keyboardType="numeric"
          testID={testID}
          editable={!disabled}
          selectTextOnFocus
        />
        
        {currency && (
          <Text style={inputStyles.currencyText}>{currency}</Text>
        )}
        
        {showIncrementButtons && isChildMode && (
          <TouchableOpacity
            style={inputStyles.incrementButton}
            onPress={handleIncrement}
            disabled={disabled}
            accessibilityLabel="Increase amount"
            accessibilityRole="button"
          >
            <Text style={inputStyles.incrementButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {showMathHelper && isChildMode && (
        <TouchableOpacity
          style={inputStyles.helperButton}
          onPress={() => setShowHelper(true)}
        >
          <Text style={inputStyles.helperButtonText}>Need help with math? 🧮</Text>
        </TouchableOpacity>
      )}
      
      {showHelper && (
        <ChildMathHelper
          visible={showHelper}
          onClose={() => setShowHelper(false)}
          onResult={(result) => {
            onChangeText(result.toString());
            setShowHelper(false);
          }}
          currentValue={parseFloat(value) || 0}
        />
      )}
    </View>
  );
};