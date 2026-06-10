// src/screens/CustomersScreen.js
/**
 * Customers Management Screen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../styles/theme';

export default function CustomersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  // Sample customers data
  const [customers] = useState([
    {
      id: '1',
      name: 'Jane Muthoni',
      phone: '0712 345 678',
      email: 'jane@email.com',
      totalPurchases: 25000,
      visitCount: 12,
      lastVisit: '2024-01-15',
      skinType: 'Normal',
      preferences: 'Prefers natural products',
    },
    {
      id: '2',
      name: 'Mary Wanjiku',
      phone: '0723 456 789',
      email: 'mary@email.com',
      totalPurchases: 18000,
      visitCount: 8,
      lastVisit: '2024-01-14',
      skinType: 'Oily',
      preferences: 'Loves fragrances',
    },
    {
      id: '3',
      name: 'Grace Akinyi',
      phone: '0734 567 890',
      email: 'grace@email.com',
      totalPurchases: 35000,
      visitCount: 20,
      lastVisit: '2024-01-16',
      skinType: 'Dry',
      preferences: 'Skincare enthusiast',
    },
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>👥 Customers</Text>
        <Text style={styles.headerSubtitle}>
          {customers.length} registered customers
        </Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor={COLORS.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.customerList}>
        {customers.map((customer) => (
          <TouchableOpacity key={customer.id} style={styles.customerCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>
                {customer.name.charAt(0)}
              </Text>
            </View>
            
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerPhone}>{customer.phone}</Text>
              <View style={styles.customerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    KES {customer.totalPurchases.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Total Purchases</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{customer.visitCount}</Text>
                  <Text style={styles.statLabel}>Visits</Text>
                </View>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
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
  customerList: {
    flex: 1,
    padding: SPACING.md,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  customerStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textLight,
  },
});