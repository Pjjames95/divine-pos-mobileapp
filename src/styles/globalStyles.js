// src/styles/globalStyles.js
/**
 * Global styles for the Beauty Shop POS app
 */
import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SHADOWS, SPACING, BORDER_RADIUS } from './theme';

export const GlobalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  
  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardElevated: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  
  // Product card
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    margin: SPACING.xs,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  successButton: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  
  // Text styles
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  caption: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  
  // Input styles
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  
  // Badge styles
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // List item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
  },
});