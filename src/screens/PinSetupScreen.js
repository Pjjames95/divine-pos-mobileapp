// src/screens/PinSetupScreen.js
/**
 * PIN Setup Screen for quick login
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../styles/theme';

export default function PinSetupScreen({ navigation, route }) {
  const { userId } = route.params || {};
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1: Enter PIN, 2: Confirm PIN
  const [error, setError] = useState('');
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleNumberPress = (number) => {
    setError('');
    
    if (step === 1 && pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);
      
      if (newPin.length === 4) {
        // Move to confirmation step
        setTimeout(() => setStep(2), 300);
      }
    } else if (step === 2 && confirmPin.length < 4) {
      const newConfirmPin = confirmPin + number;
      setConfirmPin(newConfirmPin);
      
      if (newConfirmPin.length === 4) {
        // Verify PINs match
        if (newConfirmPin === pin) {
          savePin(newConfirmPin);
        } else {
          setError('PINs do not match');
          setPin('');
          setConfirmPin('');
          setStep(1);
          shake();
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 2 && confirmPin.length > 0) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else if (step === 1 && pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const savePin = async (finalPin) => {
    try {
      // In production, hash the PIN and save to database
      Alert.alert(
        'Success',
        'PIN has been set successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      setError('Failed to save PIN');
    }
  };

  const renderPinDots = (count, maxLength = 4) => {
    const dots = [];
    for (let i = 0; i < maxLength; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            i < count && styles.pinDotFilled,
          ]}
        />
      );
    }
    return dots;
  };

  const renderKeypad = () => {
    const numbers = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['', 0, 'delete'],
    ];

    return numbers.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.keypadRow}>
        {row.map((num, colIndex) => (
          <TouchableOpacity
            key={colIndex}
            style={[
              styles.keypadButton,
              num === '' && styles.keypadButtonEmpty,
            ]}
            onPress={() => {
              if (num === 'delete') {
                handleDelete();
              } else if (num !== '') {
                handleNumberPress(num);
              }
            }}
            disabled={num === ''}
          >
            {num === 'delete' ? (
              <Ionicons name="backspace-outline" size={28} color={COLORS.text} />
            ) : num !== '' ? (
              <Text style={styles.keypadNumber}>{num}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {step === 1 ? 'Set Your PIN' : 'Confirm Your PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1 
            ? 'Enter a 4-digit PIN for quick login' 
            : 'Re-enter your PIN to confirm'}
        </Text>
      </View>

      <Animated.View 
        style={[
          styles.content,
          { transform: [{ translateX: shakeAnimation }] }
        ]}
      >
        {/* PIN Display */}
        <View style={styles.pinDisplay}>
          {renderPinDots(step === 1 ? pin.length : confirmPin.length)}
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Keypad */}
        <View style={styles.keypad}>
          {renderKeypad()}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.background,
  },
  backButton: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.xxxl,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  pinDotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
  },
  keypad: {
    paddingHorizontal: SPACING.xxl,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keypadButtonEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keypadNumber: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '600',
    color: COLORS.text,
  },
});