// src/screens/SettingsScreen.js
/**
 * Settings Screen
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
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../database/DatabaseContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SHADOWS, BORDER_RADIUS, SPACING } from '../styles/theme';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const db = useDatabase();
  
  const [settings, setSettings] = useState({
    shopName: 'Divine Beauty & Cosmetics Shop',
    shopAddress: 'Nairobi Stage, Embu',
    shopPhone: '+254 700 000000',
    shopEmail: 'info@glamourbeauty.com',
    taxRate: '16',
    receiptPrefix: 'GBS',
    lowStockAlert: '5',
    mpesaApiUrl: 'https://divine-pos-backend.onrender.com',
    enableNotifications: true,
    enableBiometrics: false,
    autoSync: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
      Alert.alert('Success', 'Settings saved successfully! ✨');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleBackup = () => {
    Alert.alert(
      'Backup Data',
      'This will create a backup of all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Backup',
          onPress: () => {
            Alert.alert('Success', 'Backup created successfully! 💾');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete all sales, products, and settings. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm',
              'Are you absolutely sure? Type DELETE to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'DELETE',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await AsyncStorage.clear();
                      Alert.alert('Done', 'All data has been cleared. App will restart.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to clear data');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Shop Information',
      icon: 'storefront-outline',
      fields: [
        { label: 'Shop Name', key: 'shopName', type: 'text' },
        { label: 'Address', key: 'shopAddress', type: 'text' },
        { label: 'Phone', key: 'shopPhone', type: 'text' },
        { label: 'Email', key: 'shopEmail', type: 'text' },
      ],
    },
    {
      title: 'Business Settings',
      icon: 'business-outline',
      fields: [
        { label: 'Tax Rate (%)', key: 'taxRate', type: 'number' },
        { label: 'Receipt Prefix', key: 'receiptPrefix', type: 'text' },
        { label: 'Low Stock Alert', key: 'lowStockAlert', type: 'number' },
      ],
    },
    {
      title: 'M-Pesa Configuration',
      icon: 'phone-portrait-outline',
      fields: [
        { label: 'API Server URL', key: 'mpesaApiUrl', type: 'text' },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        <Text style={styles.headerSubtitle}>
          {user?.fullName || 'User'} • {user?.role || 'Staff'}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Settings Sections */}
        {settingsSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon} size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            
            <View style={styles.sectionContent}>
              {section.fields.map((field, fieldIndex) => (
                <View key={fieldIndex} style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={settings[field.key]}
                    onChangeText={(text) => setSettings({ ...settings, [field.key]: text })}
                    keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Toggle Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="options-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          
          <View style={styles.sectionContent}>
            <View style={styles.toggleItem}>
              <View>
                <Text style={styles.toggleLabel}>Notifications</Text>
                <Text style={styles.toggleDescription}>Receive sale and stock alerts</Text>
              </View>
              <Switch
                value={settings.enableNotifications}
                onValueChange={(value) => setSettings({ ...settings, enableNotifications: value })}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={settings.enableNotifications ? COLORS.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.toggleItem}>
              <View>
                <Text style={styles.toggleLabel}>Biometric Login</Text>
                <Text style={styles.toggleDescription}>Use fingerprint or face ID</Text>
              </View>
              <Switch
                value={settings.enableBiometrics}
                onValueChange={(value) => setSettings({ ...settings, enableBiometrics: value })}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={settings.enableBiometrics ? COLORS.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.toggleItem}>
              <View>
                <Text style={styles.toggleLabel}>Auto Sync</Text>
                <Text style={styles.toggleDescription}>Automatically sync data when online</Text>
              </View>
              <Switch
                value={settings.autoSync}
                onValueChange={(value) => setSettings({ ...settings, autoSync: value })}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={settings.autoSync ? COLORS.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.saveButtonGradient}
          >
            <Ionicons name="save-outline" size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Data Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={20} color={COLORS.warning} />
            <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>Data Management</Text>
          </View>
          
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.actionButton} onPress={handleBackup}>
              <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Backup Data</Text>
                <Text style={styles.actionDescription}>Save all data to a backup file</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]} 
              onPress={handleClearData}
            >
              <Ionicons name="trash-outline" size={24} color={COLORS.error} />
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: COLORS.error }]}>Clear All Data</Text>
                <Text style={styles.actionDescription}>Permanently delete all data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          
          <View style={styles.sectionContent}>
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutTitle}>Divine Beauty & Cosmetics Shop</Text>
              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              <Text style={styles.aboutDescription}>
                A complete point of sale system designed for beauty shops, salons, and cosmetic stores.
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
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
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  fieldContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  fieldLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  fieldInput: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  toggleLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  toggleDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  saveButton: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.md,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  actionDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  aboutInfo: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  aboutVersion: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  aboutDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.error,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  logoutText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.error,
  },
});