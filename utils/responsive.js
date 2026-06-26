import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on standard iPhone 11 Pro/12/13/14 width
const baseWidth = 375;

export const scale = (size) => (SCREEN_WIDTH / baseWidth) * size;

export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Responsive Font Size
 */
export const rf = (size) => {
  const newSize = (SCREEN_WIDTH / baseWidth) * size;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Check if the device is a tablet
 */
export const isTablet = SCREEN_WIDTH >= 600;

/**
 * Screen dimensions helpers
 */
export const windowWidth = SCREEN_WIDTH;
export const windowHeight = SCREEN_HEIGHT;

export const horizontalPadding = isTablet ? (SCREEN_WIDTH - 600) / 2 + 20 : 16;
