// src/styles/theme.js
/**
 * Beauty Shop POS - Theme Configuration
 * Complete color scheme and styling for the beauty shop app
 */

export const COLORS = {
  // Primary brand colors
  primary: '#FF69B4',        // Hot Pink
  primaryLight: '#FFB6C1',   // Light Pink
  primaryDark: '#FF1493',    // Deep Pink
  
  // Secondary colors
  secondary: '#FFB6C1',      // Light Pink
  accent: '#FF1493',         // Deep Pink
  gold: '#FFD700',           // Gold for premium feel
  roseGold: '#B76E79',       // Rose Gold
  
  // Functional colors
  success: '#4CAF50',        // Green
  successLight: '#E8F5E9',   // Light Green
  warning: '#FF9800',        // Orange
  warningLight: '#FFF3E0',   // Light Orange
  error: '#F44336',          // Red
  errorLight: '#FFEBEE',     // Light Red
  info: '#2196F3',           // Blue
  infoLight: '#E3F2FD',      // Light Blue
  
  // Neutral colors
  white: '#FFFFFF',
  background: '#FFF5F7',     // Very Light Pink
  surface: '#FFFFFF',
  border: '#FFE4E1',         // Misty Rose
  divider: '#F0F0F0',
  
  // Text colors
  text: '#333333',
  textLight: '#666666',
  textDark: '#1A1A1A',
  placeholder: '#999999',
  
  // Beauty category colors
  makeup: '#FF69B4',
  skincare: '#87CEEB',
  haircare: '#DDA0DD',
  nails: '#FFB6C1',
  fragrance: '#FFD700',
  bathBody: '#98FB98',
  tools: '#C0C0C0',
  
  // Gradient colors
  gradient: {
    pink: ['#FF69B4', '#FF1493'],
    gold: ['#FFD700', '#FFA500'],
    purple: ['#DDA0DD', '#DA70D6'],
    blue: ['#87CEEB', '#4169E1'],
  }
};

export const FONTS = {
  regular: {
    fontFamily: 'System',
    fontWeight: '400',
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500',
  },
  bold: {
    fontFamily: 'System',
    fontWeight: '700',
  },
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    title: 28,
    header: 32,
  }
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 25,
  round: 50,
};