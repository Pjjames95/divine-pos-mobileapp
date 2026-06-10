// src/screens/ReportsScreen.js
/**
 * Reports Dashboard Screen
 * Displays sales reports, analytics, and business insights
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../database/DatabaseContext';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function ReportsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (db && db.isReady) {
        const dailyReport = await db.getDailyReport(today);
        setReportData({
          daily: dailyReport,
          // Add more report types as needed
        });
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const periods = [
    { id: 'today', label: 'Today', icon: 'today-outline' },
    { id: 'yesterday', label: 'Yesterday', icon: 'calendar-outline' },
    { id: 'week', label: 'This Week', icon: 'calendar-outline' },
    { id: 'month', label: 'This Month', icon: 'calendar-outline' },
    { id: 'custom', label: 'Custom', icon: 'options-outline' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { id: 'sales', label: 'Sales', icon: 'cash-outline' },
    { id: 'products', label: 'Products', icon: 'cube-outline' },
    { id: 'payment', label: 'Payment', icon: 'card-outline' },
  ];

  const renderPeriodSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.periodContainer}
    >
      {periods.map((period) => (
        <TouchableOpacity
          key={period.id}
          style={[
            styles.periodButton,
            selectedPeriod === period.id && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period.id)}
        >
          <Ionicons
            name={period.icon}
            size={16}
            color={selectedPeriod === period.id ? COLORS.white : COLORS.textLight}
          />
          <Text
            style={[
              styles.periodText,
              selectedPeriod === period.id && styles.periodTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tabButton,
            selectedTab === tab.id && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab(tab.id)}
        >
          <Ionicons
            name={tab.icon}
            size={20}
            color={selectedTab === tab.id ? COLORS.primary : COLORS.textLight}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === tab.id && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.overviewContainer}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF0F5' }]}>
          <Text style={styles.summaryIcon}>💰</Text>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
            KES {reportData?.daily?.summary?.totalSales?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.summaryChange}>+12% from yesterday</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#F0FFF0' }]}>
          <Text style={styles.summaryIcon}>🛒</Text>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            {reportData?.daily?.summary?.totalTransactions || 0}
          </Text>
          <Text style={styles.summaryChange}>+5% from yesterday</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF5E6' }]}>
          <Text style={styles.summaryIcon}>💵</Text>
          <Text style={styles.summaryLabel}>Cash Sales</Text>
          <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
            KES {reportData?.daily?.summary?.cashSales?.toLocaleString() || '0'}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#F0F8FF' }]}>
          <Text style={styles.summaryIcon}>📱</Text>
          <Text style={styles.summaryLabel}>M-Pesa Sales</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            KES {reportData?.daily?.summary?.mpesaSales?.toLocaleString() || '0'}
          </Text>
        </View>
      </View>

      {/* Average Sale Card */}
      <View style={styles.avgSaleCard}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.avgSaleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.avgSaleLabel}>Average Sale Value</Text>
          <Text style={styles.avgSaleValue}>
            KES {reportData?.daily?.summary?.avgSale?.toLocaleString() || '0'}
          </Text>
          <View style={styles.avgSaleInfo}>
            <Ionicons name="information-circle" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.avgSaleInfoText}>
              Based on today's transactions
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderSalesTab = () => (
    <View style={styles.salesContainer}>
      <Text style={styles.sectionTitle}>Sales Breakdown</Text>
      
      {/* Sales by Hour */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Sales by Hour</Text>
        <View style={styles.barChart}>
          {/* Simplified bar chart representation */}
          {[20, 35, 45, 60, 80, 100, 90, 75, 65, 50, 40, 30].map((value, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.bar, { height: value, backgroundColor: COLORS.primary }]} />
              <Text style={styles.barLabel}>{index + 8}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.recentTransactions}>
        <Text style={styles.chartTitle}>Recent Transactions</Text>
        {[
          { id: '1', time: '10:30 AM', amount: 2500, method: 'cash' },
          { id: '2', time: '11:15 AM', amount: 4800, method: 'mpesa' },
          { id: '3', time: '12:00 PM', amount: 1500, method: 'cash' },
          { id: '4', time: '1:45 PM', amount: 6500, method: 'mpesa' },
          { id: '5', time: '2:30 PM', amount: 3200, method: 'cash' },
        ].map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTime}>{transaction.time}</Text>
              <View style={styles.transactionMethod}>
                <Ionicons
                  name={transaction.method === 'cash' ? 'cash-outline' : 'phone-portrait-outline'}
                  size={14}
                  color={transaction.method === 'cash' ? COLORS.success : '#4CAF50'}
                />
                <Text style={styles.transactionMethodText}>
                  {transaction.method === 'cash' ? 'Cash' : 'M-Pesa'}
                </Text>
              </View>
            </View>
            <Text style={styles.transactionAmount}>
              KES {transaction.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderProductsTab = () => (
    <View style={styles.productsContainer}>
      <Text style={styles.sectionTitle}>Top Selling Products</Text>
      
      {(reportData?.daily?.topProducts || [
        { productName: 'Matte Lipstick', totalQuantity: 15, totalRevenue: 37500 },
        { productName: 'Face Cream', totalQuantity: 12, totalRevenue: 14400 },
        { productName: 'Hair Treatment', totalQuantity: 10, totalRevenue: 18000 },
        { productName: 'Body Lotion', totalQuantity: 8, totalRevenue: 7600 },
        { productName: 'Perfume', totalQuantity: 5, totalRevenue: 22500 },
      ]).map((product, index) => (
        <View key={index} style={styles.productRankItem}>
          <View style={styles.productRank}>
            <Text style={[
              styles.rankNumber,
              index < 3 && { color: COLORS.gold }
            ]}>
              #{index + 1}
            </Text>
          </View>
          <View style={styles.productRankInfo}>
            <Text style={styles.productRankName}>{product.productName || product.product_name}</Text>
            <Text style={styles.productRankQty}>
              {product.totalQuantity || product.total_quantity} units sold
            </Text>
          </View>
          <Text style={styles.productRankRevenue}>
            KES {(product.totalRevenue || product.total_revenue).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderPaymentTab = () => (
    <View style={styles.paymentContainer}>
      <Text style={styles.sectionTitle}>Payment Methods</Text>
      
      {/* Payment Method Comparison */}
      <View style={styles.paymentComparison}>
        <View style={[styles.paymentCard, { backgroundColor: '#F0FFF0' }]}>
          <Ionicons name="cash-outline" size={32} color={COLORS.success} />
          <Text style={styles.paymentLabel}>Cash</Text>
          <Text style={styles.paymentValue}>
            {reportData?.daily?.summary?.cashSales ? 
              `${((reportData.daily.summary.cashSales / reportData.daily.summary.totalSales) * 100).toFixed(1)}%` :
              '60%'
            }
          </Text>
          <Text style={styles.paymentAmount}>
            KES {reportData?.daily?.summary?.cashSales?.toLocaleString() || '15,000'}
          </Text>
        </View>

        <View style={[styles.paymentCard, { backgroundColor: '#F0F8FF' }]}>
          <Ionicons name="phone-portrait-outline" size={32} color="#4CAF50" />
          <Text style={styles.paymentLabel}>M-Pesa</Text>
          <Text style={styles.paymentValue}>
            {reportData?.daily?.summary?.mpesaSales ?
              `${((reportData.daily.summary.mpesaSales / reportData.daily.summary.totalSales) * 100).toFixed(1)}%` :
              '40%'
            }
          </Text>
          <Text style={styles.paymentAmount}>
            KES {reportData?.daily?.summary?.mpesaSales?.toLocaleString() || '10,000'}
          </Text>
        </View>
      </View>

      {/* Export Options */}
      <View style={styles.exportSection}>
        <Text style={styles.exportTitle}>Export Report</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
            <Text style={styles.exportButtonText}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="grid-outline" size={24} color={COLORS.success} />
            <Text style={styles.exportButtonText}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="print-outline" size={24} color={COLORS.warning} />
            <Text style={styles.exportButtonText}>Print</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📊 Reports & Analytics</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </LinearGradient>

      {/* Period Selector */}
      {renderPeriodSelector()}

      {/* Tab Selector */}
      {renderTabSelector()}

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'sales' && renderSalesTab()}
          {selectedTab === 'products' && renderProductsTab()}
          {selectedTab === 'payment' && renderPaymentTab()}
        </ScrollView>
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
  periodContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    marginRight: SPACING.sm,
    gap: 4,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  periodTextActive: {
    color: COLORS.white,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
  },
  overviewContainer: {
    gap: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  summaryIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  summaryChange: {
    fontSize: 11,
    color: COLORS.success,
  },
  avgSaleCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  avgSaleGradient: {
    padding: SPACING.xl,
  },
  avgSaleLabel: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.sm,
  },
  avgSaleValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  avgSaleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  avgSaleInfoText: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  salesContainer: {
    gap: SPACING.md,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  chartTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: SPACING.xl,
  },
  barContainer: {
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: 20,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    color: COLORS.textLight,
  },
  recentTransactions: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  transactionInfo: {
    gap: 4,
  },
  transactionTime: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  transactionMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionMethodText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  transactionAmount: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  productsContainer: {
    gap: SPACING.sm,
  },
  productRankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  productRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rankNumber: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  productRankInfo: {
    flex: 1,
  },
  productRankName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  productRankQty: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  productRankRevenue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  paymentContainer: {
    gap: SPACING.md,
  },
  paymentComparison: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  paymentCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  paymentLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  paymentValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  paymentAmount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  exportSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  exportTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  exportButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportButtonText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
});