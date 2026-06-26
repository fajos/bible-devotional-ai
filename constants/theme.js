// constants/theme.js
import { rf, moderateScale, isTablet } from '../utils/responsive';

export { isTablet };

export const COLORS = {
  // Primary palette
  primary: '#1B1B3A',      // Deep navy - main background
  primaryLight: '#2D2D5E', // Lighter navy
  primaryDark: '#0F0F25',  // Darker navy
  
  // Gold accents - represents divinity
  gold: '#D4AF37',         // Rich gold
  goldLight: '#F4D03F',    // Light gold for highlights
  goldDark: '#B8960C',     // Dark gold for depth
  
  // Secondary
  secondary: '#6C63FF',    // Soft purple - spiritual
  secondaryLight: '#8B85FF',
  
  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F5F5FA',
  gray: '#8E8E93',
  grayLight: '#C7C7CC',
  grayDark: '#48484A',
  black: '#000000',
  
  // Functional
  success: '#4CD964',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  
  // Bible paper texture
  parchment: '#F5E6CC',
  parchmentDark: '#E8D5B7',
  
  // Gradients
  gradientStart: '#1B1B3A',
  gradientEnd: '#2D2D5E',
  goldGradient: ['#D4AF37', '#F4D03F'],
};

export const FONTS = {
  // For scripture - serif adds traditional feel
  scripture: {
    regular: 'serif',       // System serif as fallback
    bold: 'serif',
    size: {
      small: rf(16),
      medium: rf(18),
      large: rf(22),
      xlarge: rf(28),
    }
  },
  
  // For UI elements - clean sans-serif
  ui: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    size: {
      tiny: rf(12),
      small: rf(14),
      medium: rf(16),
      large: rf(18),
      xlarge: rf(24),
      title: rf(32),
    }
  }
};

export const SPACING = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  }
};