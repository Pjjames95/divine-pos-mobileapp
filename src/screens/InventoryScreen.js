// src/screens/InventoryScreen.js
/**
 * Inventory Management Screen
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../database/DatabaseContext';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../styles/theme';

export default function InventoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedFilter, products]);

  const loadInventory = async () => {
    try {
      if (db && db.isReady) {
        const allProducts = await db.getProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        
        // Count low stock and out of stock
        const lowStock = allProducts.filter(p => p.quantity > 0 && p.quantity <= p.min_stock_level);
        const outOfStock = allProducts.filter(p => p.quantity <= 0);
        setLowStockCount(lowStock.length);
        setOutOfStockCount(outOfStock.length);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      );
    }

    // Apply filter
    switch (selectedFilter) {
      case 'low_stock':
        filtered = filtered.filter(p => p.quantity > 0 && p.quantity <= p.min_stock_level);
        break;
      case 'out_of_stock':
        filtered = filtered.filter(p => p.quantity <= 0);
        break;
      case 'in_stock':
        filtered = filtered.filter(p => p.quantity > 0);
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadInventory();
    setIsRefreshing(false);
  };

  const handleUpdateStock = (product) => {
    Alert.prompt
      ? Alert.prompt(
          'Update Stock',
          `Current stock: ${product.quantity}\nEnter new quantity:`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Update',
              onPress: (value) => {
                const newQty = parseInt(value);
                if (!isNaN(newQty) && newQty >= 0) {
                  // Update stock in database
                  Alert.alert('Success', `Stock updated to ${newQty}`);
                  loadInventory();
                }
              },
            },
          ],
          'plain-text',
          product.quantity.toString()
        )
      : Alert.alert(
          'Update Stock',
          `Current stock: ${product.quantity}`,
          [{ text: 'OK' }]
        );
  };

  const filters = [
    { id: 'all', label: 'All', icon: 'cube-outline' },
    { id: 'in_stock', label: 'In Stock', icon: 'checkmark-circle-outline' },
    { id: 'low_stock', label: `Low Stock (${lowStockCount})`, icon: 'warning-outline' },
    { id: 'out_of_stock', label: `Out of Stock (${outOfStockCount})`, icon: 'close-circle-outline' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📦 Inventory</Text>
        <Text style={styles.headerSubtitle}>
          {products.length} products total
        </Text>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={COLORS.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={selectedFilter === filter.id ? COLORS.white : COLORS.textLight}
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List */}
      <ScrollView
        style={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productItem}
              onPress={() => handleUpdateStock(product)}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                {product.brand && (
                  <Text style={styles.productBrand}>{product.brand}</Text>
                )}
                <Text style={styles.productCategory}>{product.category}</Text>
              </View>
              
              <View style={styles.stockInfo}>
                <Text style={[
                  styles.stockQuantity,
                  {
                    color: product.quantity <= 0 ? COLORS.error :
                           product.quantity <= product.min_stock_level ? COLORS.warning :
                           COLORS.success,
                  }
                ]}>
                  {product.quantity}
                </Text>
                <Text style={styles.stockLabel}>in stock</Text>
                
                {product.quantity <= product.min_stock_level && product.quantity > 0 && (
                  <View style={styles.lowStockBadge}>
                    <Text style={styles.lowStockText}>Low</Text>
                  </View>
                )}
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ))
        )}
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
    paddingVertical: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: SPACING.sm,
  },
  filtersContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  productsList: {
    flex: 1,
    padding: SPACING.md,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  productInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  productName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  productBrand: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
  },
  stockInfo: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stockQuantity: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
  },
  stockLabel: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  lowStockBadge: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 2,
  },
  lowStockText: {
    fontSize: 9,
    color: COLORS.warning,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textLight,
  },
});