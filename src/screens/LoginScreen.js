// src/screens/LoginScreen.js
/**
 * Beautiful Login Screen for Beauty Shop POS
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login, loginWithPin } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPinLogin, setShowPinLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      setErrorMessage('Please enter your username');
      shake();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      let result;
      
      if (showPinLogin) {
        if (!pin || pin.length !== 4) {
          setErrorMessage('Please enter a 4-digit PIN');
          setIsLoading(false);
          shake();
          return;
        }
        result = await loginWithPin(username.trim(), pin);
      } else {
        if (!password) {
          setErrorMessage('Please enter your password');
          setIsLoading(false);
          shake();
          return;
        }
        result = await login(username.trim(), password);
      }

      if (result.success) {
        // Navigation will be handled by auth state change
      } else {
        setErrorMessage(result.error || 'Login failed');
        shake();
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      shake();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginMode = () => {
    Animated.timing(fadeAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowPinLogin(!showPinLogin);
      setErrorMessage('');
      setPin('');
      setPassword('');
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#FF69B4', '#FF1493', '#C71585']}
        style={styles.background}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Brand */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💄</Text>
            </View>
            <Text style={styles.shopName}>Divine Beauty & Cosmetics Shop</Text>
            <Text style={styles.shopTagline}>Point of Sale System</Text>
          </View>

          {/* Login Card */}
          <Animated.View 
            style={[
              styles.loginCard,
              { transform: [{ translateX: shakeAnimation }] }
            ]}
          >
            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !showPinLogin && styles.toggleButtonActive]}
                onPress={() => showPinLogin && toggleLoginMode()}
              >
                <Ionicons 
                  name="key" 
                  size={20} 
                  color={!showPinLogin ? COLORS.white : COLORS.textLight} 
                />
                <Text style={[styles.toggleText, !showPinLogin && styles.toggleTextActive]}>
                  Password
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.toggleButton, showPinLogin && styles.toggleButtonActive]}
                onPress={() => !showPinLogin && toggleLoginMode()}
              >
                <Ionicons 
                  name="phone-portrait" 
                  size={20} 
                  color={showPinLogin ? COLORS.white : COLORS.textLight} 
                />
                <Text style={[styles.toggleText, showPinLogin && styles.toggleTextActive]}>
                  PIN
                </Text>
              </TouchableOpacity>
            </View>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.textLight} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={COLORS.placeholder}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setErrorMessage('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password or PIN Input */}
            <Animated.View style={{ opacity: fadeAnimation }}>
              {showPinLogin ? (
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 4-digit PIN"
                    placeholderTextColor={COLORS.placeholder}
                    value={pin}
                    onChangeText={(text) => {
                      setPin(text.replace(/[^0-9]/g, '').slice(0, 4));
                      setErrorMessage('');
                    }}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.placeholder}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={COLORS.textLight} 
                    />
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FF69B4', '#FF1493']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>
                      {showPinLogin ? '🔓 Login with PIN' : '✨ Sign In'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Beauty Shop POS v1.0</Text>
            <Text style={styles.footerText}>© 2024 Divine Beauty & Cosmetics Shop</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoEmoji: {
    fontSize: 50,
  },
  shopName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: SPACING.xs,
  },
  shopTagline: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '300',
  },
  loginCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.large,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xxl,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.xxl,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  toggleText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    flex: 1,
  },
  loginButton: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    marginTop: SPACING.md,
    ...SHADOWS.medium,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: FONTS.sizes.xs,
  },
});