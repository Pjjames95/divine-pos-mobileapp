// src/screens/CartScreen.js
/**
 * Shopping Cart Screen
 * Displays cart items with quantity controls and checkout options
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../styles/theme';

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
    getItemCount,
    getUniqueItemCount,
    hasSaleItems,
    getTotalSavings,
    setCustomer,
    customerInfo,
  } = useCart();
  
  const { user } = useAuth();
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(customerInfo?.phone || '');

  const handleQuantityChange = (productId, currentQty, increment) => {
    const newQty = currentQty + increment;
    if (newQty >= 1) {
      updateQuantity(productId, newQty);
    }
  };

  const handleRemoveItem = (productId, productName) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCart(productId),
        },
      ]
    );
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      Alert.alert('Error', 'Please enter a discount code');
      return;
    }
    
    // Demo discount codes
    const validCodes = {
      'BEAUTY10': 10,
      'GLAM20': 20,
      'VIP30': 30,
    };
    
    const discount = validCodes[discountCode.toUpperCase()];
    
    if (discount) {
      setDiscountApplied(true);
      Alert.alert(
        'Discount Applied! 🎉',
        `${discount}% discount has been applied to your order`
      );
    } else {
      Alert.alert('Invalid Code', 'This discount code is not valid');
    }
  };

  const handleCustomerLookup = () => {
    if (customerPhone.length >= 10) {
      // In production, look up customer from database
      setCustomer({
        phone: customerPhone,
        name: 'Walk-in Customer',
      });
    }
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart first');
      return;
    }
    
    navigation.navigate('Payment', {
      subtotal: getSubtotal(),
      tax: getTax(),
      total: getTotal(),
      discountApplied,
      discountPercent: discountApplied ? 10 : 0,
    });
  };

  const renderRightActions = (productId, productName) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleRemoveItem(productId, productName)}
      >
        <Ionicons name="trash-outline" size={24} color={COLORS.white} />
        <Text style={styles.deleteActionText}>Remove</Text>
      </TouchableOpacity>
    );
  };

  const renderCartItem = (item, index) => (
    <Swipeable
      key={item.id}
      renderRightActions={() => renderRightActions(item.id, item.name)}
    >
      <View style={styles.cartItem}>
        {/* Product Image/Emoji */}
        <View style={styles.itemImage}>
          <Text style={styles.itemEmoji}>
            {item.category === '💄 Makeup' ? '💄' :
             item.category === '💆 Skincare' ? '💆' :
             item.category === '💇 Hair Care' ? '💇' :
             item.category === '💅 Nails' ? '💅' :
             item.category === '🧴 Fragrances' ? '🧴' :
             item.category === '🛁 Bath & Body' ? '🛁' : '✨'}
          </Text>
        </View>

        {/* Product Details */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.brand && (
            <Text style={styles.itemBrand}>{item.brand}</Text>
          )}
          
          {/* Price */}
          <View style={styles.itemPriceRow}>
            {item.price < item.originalPrice ? (
              <>
                <Text style={styles.itemSalePrice}>
                  KES {item.price.toLocaleString()}
                </Text>
                <Text style={styles.itemOriginalPrice}>
                  KES {item.originalPrice.toLocaleString()}
                </Text>
              </>
            ) : (
              <Text style={styles.itemPrice}>
                KES {item.price.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Quantity Controls */}
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, item.quantity, -1)}
            >
              <Ionicons name="remove" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, item.quantity, 1)}
            >
              <Ionicons name="add" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Item Total */}
        <View style={styles.itemTotal}>
          <Text style={styles.itemTotalLabel}>Total</Text>
          <Text style={styles.itemTotalPrice}>
            KES {(item.price * item.quantity).toLocaleString()}
          </Text>
        </View>
      </View>
    </Swipeable>
  );

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
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearText}>
              {cartItems.length > 0 ? 'Clear All' : ''}
            </Text>
          </TouchableOpacity>
        </View>
        
        {cartItems.length > 0 && (
          <Text style={styles.itemCount}>
            {getUniqueItemCount()} {getUniqueItemCount() === 1 ? 'item' : 'items'} • 
            {getItemCount()} {getItemCount() === 1 ? 'piece' : 'pieces'}
          </Text>
        )}
      </LinearGradient>

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <View style={styles.emptyCart}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse our beauty products and add items to your cart
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Cart Items */}
          <ScrollView 
            style={styles.cartList}
            showsVerticalScrollIndicator={false}
          >
            {cartItems.map((item, index) => renderCartItem(item, index))}

            {/* Customer Information */}
            <View style={styles.customerSection}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.customerInput}>
                <Ionicons name="person-outline" size={20} color={COLORS.textLight} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Customer phone (optional)"
                  placeholderTextColor={COLORS.placeholder}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  onBlur={handleCustomerLookup}
                />
              </View>
            </View>

            {/* Discount Code */}
            <View style={styles.discountSection}>
              <Text style={styles.sectionTitle}>Discount Code</Text>
              <View style={styles.discountInput}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.textLight} />
                <TextInput
                  style={styles.discountTextInput}
                  placeholder="Enter discount code"
                  placeholderTextColor={COLORS.placeholder}
                  value={discountCode}
                  onChangeText={setDiscountCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    discountApplied && styles.appliedButton,
                  ]}
                  onPress={handleApplyDiscount}
                  disabled={discountApplied}
                >
                  <Text style={styles.applyButtonText}>
                    {discountApplied ? 'Applied ✓' : 'Apply'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {discountApplied && (
                <View style={styles.discountBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.discountBadgeText}>
                    {discountCode.toUpperCase()} discount applied!
                  </Text>
                </View>
              )}
            </View>

            {/* Savings Summary */}
            {hasSaleItems() && (
              <View style={styles.savingsCard}>
                <Ionicons name="happy-outline" size={20} color={COLORS.success} />
                <Text style={styles.savingsText}>
                  You're saving KES {getTotalSavings().toLocaleString()} on sale items! 🎉
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Order Summary & Checkout */}
          <View style={styles.footer}>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  KES {getSubtotal().toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (16%)</Text>
                <Text style={styles.summaryValue}>
                  KES {getTax().toLocaleString()}
                </Text>
              </View>
              
              {discountApplied && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: COLORS.success }]}>
                    Discount (10%)
                  </Text>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                    -KES {(getSubtotal() * 0.1).toLocaleString()}
                  </Text>
                </View>
              )}
              
              <View style={styles.divider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  KES {(getTotal() - (discountApplied ? getSubtotal() * 0.1 : 0)).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Checkout Buttons */}
            <View style={styles.checkoutButtons}>
              <TouchableOpacity
                style={styles.cashButton}
                onPress={() => {
                  navigation.navigate('Payment', {
                    paymentMethod: 'cash',
                    total: getTotal() - (discountApplied ? getSubtotal() * 0.1 : 0),
                    subtotal: getSubtotal(),
                    tax: getTax(),
                    discountApplied,
                    discountPercent: discountApplied ? 10 : 0,
                  });
                }}
              >
                <Ionicons name="cash-outline" size={24} color={COLORS.white} />
                <Text style={styles.checkoutButtonText}>Cash</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.mpesaButton}
                onPress={() => {
                  navigation.navigate('Payment', {
                    paymentMethod: 'mpesa',
                    total: getTotal() - (discountApplied ? getSubtotal() * 0.1 : 0),
                    subtotal: getSubtotal(),
                    tax: getTax(),
                    discountApplied,
                    discountPercent: discountApplied ? 10 : 0,
                  });
                }}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={COLORS.white} />
                <Text style={styles.checkoutButtonText}>M-Pesa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
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
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  clearText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.sizes.md,
  },
  itemCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xxl,
    gap: SPACING.sm,
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
    padding: SPACING.md,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  itemImage: {
    width: 70,
    height: 70,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  itemEmoji: {
    fontSize: 30,
  },
  itemDetails: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  itemPrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itemSalePrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.error,
  },
  itemOriginalPrice: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 25,
    textAlign: 'center',
  },
  itemTotal: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemTotalLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  itemTotalPrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  deleteActionText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
  customerSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  customerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
  },
  discountSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  discountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  discountTextInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    textTransform: 'uppercase',
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  appliedButton: {
    backgroundColor: COLORS.success,
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  discountBadgeText: {
    color: COLORS.success,
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  savingsText: {
    flex: 1,
    color: COLORS.success,
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  summaryContainer: {
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkoutButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cashButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  mpesaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
});