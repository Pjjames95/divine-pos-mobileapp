// src/screens/HomeScreen.js
/**
 * Main POS Home Screen with Product Grid
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../database/DatabaseContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../styles/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.xl * 2 - SPACING.sm) / 2;

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌸' },
  { id: '💄 Makeup', name: 'Makeup', icon: '💄' },
  { id: '💆 Skincare', name: 'Skincare', icon: '💆' },
  { id: '💇 Hair Care', name: 'Hair', icon: '💇' },
  { id: '💅 Nails', name: 'Nails', icon: '💅' },
  { id: '🧴 Fragrances', name: 'Scents', icon: '🧴' },
  { id: '🛁 Bath & Body', name: 'Bath', icon: '🛁' },
  { id: '✨ Tools', name: 'Tools', icon: '✨' },
];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { addToCart, cartItems, getItemCount, getTotal } = useCart();
  const { user } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      if (db && db.isReady) {
        const productsData = await db.getProducts();
        setProducts(productsData);
        setFilteredProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.brand && product.brand.toLowerCase().includes(query)) ||
        (product.barcode && product.barcode.includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadProducts();
    setIsRefreshing(false);
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const handleBarcodeScan = (barcode) => {
    // In a real app, implement barcode scanning
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      handleAddToCart(product);
    } else {
      Alert.alert('Not Found', 'No product found with this barcode');
    }
  };

  const getCategoryIcon = (category) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat ? cat.icon : '💄';
  };

  const renderProductCard = ({ item: product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleAddToCart(product)}
      activeOpacity={0.7}
    >
      {/* Sale Badge */}
      {product.is_sale === 1 && (
        <View style={styles.saleBadge}>
          <Text style={styles.saleBadgeText}>SALE</Text>
        </View>
      )}

      {/* New Badge */}
      {product.is_new === 1 && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}

      {/* Product Emoji/Image */}
      <View style={styles.productImageContainer}>
        <Text style={styles.productEmoji}>
          {getCategoryIcon(product.category)}
        </Text>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        
        {product.brand && (
          <Text style={styles.productBrand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}

        {/* Price */}
        <View style={styles.priceContainer}>
          {product.is_sale === 1 && product.sale_price ? (
            <>
              <Text style={styles.salePrice}>
                KES {product.sale_price.toLocaleString()}
              </Text>
              <Text style={styles.originalPrice}>
                KES {product.price.toLocaleString()}
              </Text>
            </>
          ) : (
            <Text style={styles.productPrice}>
              KES {product.price.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Stock Indicator */}
        <View style={styles.stockContainer}>
          <View style={[
            styles.stockDot,
            {
              backgroundColor: 
                product.quantity > 10 ? COLORS.success :
                product.quantity > 0 ? COLORS.warning :
                COLORS.error
            }
          ]} />
          <Text style={[
            styles.stockText,
            {
              color:
                product.quantity > 10 ? COLORS.success :
                product.quantity > 0 ? COLORS.warning :
                COLORS.error
            }
          ]}>
            {product.quantity > 10 ? 'In Stock' :
             product.quantity > 0 ? `${product.quantity} left` :
             'Out of Stock'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemActive,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryName,
        selectedCategory === item.id && styles.categoryNameActive,
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="cart" size={24} color={COLORS.white} />
            {getItemCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {getItemCount() > 99 ? '99+' : getItemCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands, barcode..."
            placeholderTextColor={COLORS.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => setShowBarcodeScanner(true)}>
            <MaterialCommunityIcons name="barcode-scan" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Quick Stats */}
      {getItemCount() > 0 && (
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Items</Text>
            <Text style={styles.statValue}>{getItemCount()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>
              KES {getTotal().toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsGrid}
        columnWrapperStyle={styles.productsRow}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading products...' : 'No products found'}
            </Text>
          </View>
        }
      />
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
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.sizes.sm,
  },
  userName: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
  },
  cartButton: {
    position: 'relative',
    padding: SPACING.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  categoriesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesList: {
    paddingHorizontal: SPACING.md,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
  },
  categoryItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  categoryNameActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  statValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    gap: 4,
  },
  viewCartText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  productsGrid: {
    padding: SPACING.sm,
  },
  productsRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saleBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 1,
  },
  saleBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 1,
  },
  newBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  productImageContainer: {
    height: 120,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 50,
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
    height: 40,
  },
  productBrand: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  priceContainer: {
    marginBottom: SPACING.xs,
  },
  productPrice: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  salePrice: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.error,
  },
  originalPrice: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textLight,
  },
});