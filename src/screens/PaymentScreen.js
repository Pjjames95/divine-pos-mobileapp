// src/screens/PaymentScreen.js
/**
 * Payment Processing Screen
 * Handles both Cash and M-Pesa payments
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../database/DatabaseContext';
import { MpesaService } from '../services/mpesaService';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../styles/theme';

export default function PaymentScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { paymentMethod = 'cash' } = route.params || {};
  const {
    cartItems,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
    prepareSaleData,
    customerInfo,
  } = useCart();
  
  const { user } = useAuth();
  const db = useDatabase();
  const mpesaService = new MpesaService();

  // Calculate totals with discount
  const discountApplied = route.params?.discountApplied || false;
  const discountPercent = route.params?.discountPercent || 0;
  const subtotal = route.params?.subtotal || getSubtotal();
  const tax = route.params?.tax || getTax();
  const total = route.params?.total || getTotal();
  const discountAmount = discountApplied ? subtotal * (discountPercent / 100) : 0;
  const finalTotal = total - discountAmount;

  const [selectedMethod, setSelectedMethod] = useState(paymentMethod);
  const [cashTendered, setCashTendered] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(customerInfo?.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, failed
  const [mpesaStatus, setMpesaStatus] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);

  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (paymentStatus === 'processing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [paymentStatus]);

  const calculateChange = () => {
    const cash = parseFloat(cashTendered) || 0;
    return cash - finalTotal;
  };

  const handleCashPayment = async () => {
    const cash = parseFloat(cashTendered) || 0;
    
    if (cash < finalTotal) {
      Alert.alert(
        'Insufficient Cash',
        `Cash tendered (KES ${cash.toLocaleString()}) is less than total (KES ${finalTotal.toLocaleString()})`
      );
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const change = cash - finalTotal;
      setChangeAmount(change);

      // Prepare sale data
      const saleData = prepareSaleData(user?.id);
      saleData.totalAmount = finalTotal;
      saleData.paymentMethod = 'cash';
      saleData.paymentStatus = 'completed';
      saleData.cashTendered = cash;
      saleData.changeAmount = change;
      saleData.customerPhone = customerInfo?.phone;

      // Save to database
      if (db && db.isReady) {
        const result = await db.createSale(saleData);
        setReceiptNumber(result.receiptNumber);
      }

      setPaymentStatus('success');
    } catch (error) {
      console.error('Cash payment error:', error);
      setPaymentStatus('failed');
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setMpesaStatus('Initiating M-Pesa payment...');

    try {
      // Initiate M-Pesa STK Push
      const result = await mpesaService.initiatePayment(
        phoneNumber,
        finalTotal,
        `BEAUTY-${Date.now().toString().slice(-6)}`
      );

      if (result.success) {
        setMpesaStatus('M-Pesa prompt sent to phone. Waiting for PIN...');

        // Create pending sale in database
        const saleData = prepareSaleData(user?.id);
        saleData.totalAmount = finalTotal;
        
        if (db && db.isReady) {
          const saleResult = await db.createPendingMpesaSale(
            saleData,
            phoneNumber,
            result.checkoutRequestId
          );
          setReceiptNumber(saleResult.receiptNumber);
        }

        // Poll for payment completion
        mpesaService.pollForCompletion(
          result.checkoutRequestId,
          (status) => {
            if (status.status === 'completed') {
              setMpesaStatus('Payment received! Completing transaction...');
              setPaymentStatus('success');
              
              // Complete sale in database
              if (db && db.isReady) {
                db.completeMpesaSale(
                  result.checkoutRequestId,
                  status.receiptNumber
                );
              }
            } else if (status.status === 'failed') {
              setMpesaStatus('Payment failed or was cancelled');
              setPaymentStatus('failed');
            }
          },
          120000 // 2 minutes timeout
        );
      } else {
        setMpesaStatus(result.error || 'M-Pesa payment initiation failed');
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      setMpesaStatus('Payment processing error');
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPayment = () => {
    if (selectedMethod === 'cash') {
      handleCashPayment();
    } else {
      handleMpesaPayment();
    }
  };

  const handleDone = () => {
    clearCart();
    navigation.navigate('Home');
  };

  const handlePrintReceipt = () => {
    // In production, implement printing functionality
    Alert.alert('Print', 'Receipt printing functionality will be available soon');
  };

  // Success Screen
  if (paymentStatus === 'success') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[COLORS.success, '#45a049']}
          style={styles.successContainer}
        >
          <View style={styles.successContent}>
            <Animated.View style={[styles.successIcon, { transform: [{ scale: pulseAnimation }] }]}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.white} />
            </Animated.View>
            
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successAmount}>
              KES {finalTotal.toLocaleString()}
            </Text>
            
            {receiptNumber && (
              <Text style={styles.receiptText}>
                Receipt: {receiptNumber}
              </Text>
            )}

            {selectedMethod === 'cash' && changeAmount > 0 && (
              <View style={styles.changeContainer}>
                <Text style={styles.changeLabel}>Change</Text>
                <Text style={styles.changeAmount}>
                  KES {changeAmount.toLocaleString()}
                </Text>
              </View>
            )}

            {selectedMethod === 'mpesa' && (
              <Text style={styles.mpesaConfirmText}>
                M-Pesa confirmation will be sent to {phoneNumber}
              </Text>
            )}
          </View>

          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.printButton}
              onPress={handlePrintReceipt}
            >
              <Ionicons name="print-outline" size={24} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Print Receipt</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Processing Screen
  if (paymentStatus === 'processing') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingTitle}>Processing Payment</Text>
          <Text style={styles.processingAmount}>
            KES {finalTotal.toLocaleString()}
          </Text>
          {selectedMethod === 'mpesa' && (
            <>
              <Text style={styles.mpesaStatus}>{mpesaStatus}</Text>
              <Text style={styles.mpesaHint}>
                Check your phone and enter your M-Pesa PIN
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  // Failed Screen
  if (paymentStatus === 'failed') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.failedContainer}>
          <Ionicons name="close-circle" size={80} color={COLORS.error} />
          <Text style={styles.failedTitle}>Payment Failed</Text>
          <Text style={styles.failedMessage}>
            {selectedMethod === 'mpesa' ? mpesaStatus : 'Transaction could not be completed'}
          </Text>
          
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setPaymentStatus('idle')}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Payment Method Selection
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Display */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            KES {finalTotal.toLocaleString()}
          </Text>
          {discountApplied && (
            <View style={styles.discountRow}>
              <Text style={styles.discountText}>
                Discount ({discountPercent}%): -KES {discountAmount.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Method Selection */}
        <View style={styles.methodSection}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'cash' && styles.methodCardActive,
            ]}
            onPress={() => setSelectedMethod('cash')}
          >
            <View style={styles.methodIcon}>
              <Ionicons
                name="cash-outline"
                size={32}
                color={selectedMethod === 'cash' ? COLORS.white : COLORS.success}
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[
                styles.methodName,
                selectedMethod === 'cash' && styles.methodTextActive,
              ]}>
                Cash Payment
              </Text>
              <Text style={[
                styles.methodDescription,
                selectedMethod === 'cash' && styles.methodTextActive,
              ]}>
                Pay with physical cash
              </Text>
            </View>
            {selectedMethod === 'cash' && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'mpesa' && styles.methodCardActiveMpesa,
            ]}
            onPress={() => setSelectedMethod('mpesa')}
          >
            <View style={styles.methodIcon}>
              <Ionicons
                name="phone-portrait-outline"
                size={32}
                color={selectedMethod === 'mpesa' ? COLORS.white : '#4CAF50'}
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[
                styles.methodName,
                selectedMethod === 'mpesa' && styles.methodTextActive,
              ]}>
                M-Pesa Payment
              </Text>
              <Text style={[
                styles.methodDescription,
                selectedMethod === 'mpesa' && styles.methodTextActive,
              ]}>
                Pay via M-Pesa mobile money
              </Text>
            </View>
            {selectedMethod === 'mpesa' && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Payment Details */}
        {selectedMethod === 'cash' ? (
          <View style={styles.cashSection}>
            <Text style={styles.sectionTitle}>Cash Details</Text>
            <View style={styles.cashInput}>
              <Text style={styles.cashLabel}>Cash Tendered</Text>
              <View style={styles.cashInputRow}>
                <Text style={styles.currencySymbol}>KES</Text>
                <TextInput
                  style={styles.cashTextInput}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.placeholder}
                  value={cashTendered}
                  onChangeText={setCashTendered}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {[finalTotal, finalTotal + 100, finalTotal + 200, finalTotal + 500].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setCashTendered(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>
                    KES {amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Change Display */}
            {cashTendered && parseFloat(cashTendered) >= finalTotal && (
              <View style={styles.changeDisplay}>
                <Text style={styles.changeLabel}>Change Due</Text>
                <Text style={styles.changeValue}>
                  KES {calculateChange().toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.mpesaSection}>
            <Text style={styles.sectionTitle}>M-Pesa Details</Text>
            <View style={styles.phoneInput}>
              <Text style={styles.phoneLabel}>Customer Phone Number</Text>
              <View style={styles.phoneInputRow}>
                <Ionicons name="call-outline" size={20} color={COLORS.textLight} />
                <TextInput
                  style={styles.phoneTextInput}
                  placeholder="0712 345 678"
                  placeholderTextColor={COLORS.placeholder}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.phoneHint}>
                Enter the M-Pesa registered phone number
              </Text>
            </View>
          </View>
        )}

        {/* Process Payment Button */}
        <TouchableOpacity
          style={[
            styles.processButton,
            (!cashTendered && selectedMethod === 'cash') && styles.processButtonDisabled,
          ]}
          onPress={handleProcessPayment}
          disabled={
            isProcessing ||
            (selectedMethod === 'cash' && (!cashTendered || parseFloat(cashTendered) < finalTotal))
          }
        >
          <LinearGradient
            colors={
              selectedMethod === 'cash'
                ? [COLORS.success, '#45a049']
                : ['#4CAF50', '#388E3C']
            }
            style={styles.processButtonGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name={selectedMethod === 'cash' ? 'cash' : 'phone-portrait'}
                  size={24}
                  color={COLORS.white}
                />
                <Text style={styles.processButtonText}>
                  {selectedMethod === 'cash'
                    ? `Process Cash Payment`
                    : `Send M-Pesa Request`
                  }
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  amountCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  amountLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.primary,
  },
  discountRow: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  discountText: {
    color: COLORS.success,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  methodSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  methodCardActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  methodCardActiveMpesa: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  methodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  methodTextActive: {
    color: COLORS.white,
  },
  cashSection: {
    marginBottom: SPACING.xl,
  },
  cashInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cashLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  cashInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: SPACING.xs,
  },
  currencySymbol: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  cashTextInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickAmountButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickAmountText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  changeDisplay: {
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  changeLabel: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.success,
    fontWeight: '600',
  },
  changeValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.success,
  },
  mpesaSection: {
    marginBottom: SPACING.xl,
  },
  phoneInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  phoneLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    paddingBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  processButton: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    marginBottom: SPACING.xxl,
    ...SHADOWS.medium,
  },
  processButtonDisabled: {
    opacity: 0.5,
  },
  processButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  processButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
  },
  // Success styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.xxxl,
  },
  successIcon: {
    marginBottom: SPACING.xl,
  },
  successTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  successAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  receiptText: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: SPACING.xl,
  },
  changeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    minWidth: 200,
  },
  mpesaConfirmText: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.md,
  },
  successActions: {
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.md,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    gap: SPACING.sm,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    gap: SPACING.sm,
  },
  doneButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  // Processing styles
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  processingTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  processingAmount: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xl,
  },
  mpesaStatus: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  mpesaHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  // Failed styles
  failedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  failedTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.error,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  failedMessage: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: BORDER_RADIUS.xxl,
    marginBottom: SPACING.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: SPACING.md,
  },
  cancelButtonText: {
    color: COLORS.textLight,
    fontSize: FONTS.sizes.md,
  },
});