import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

const ThemeContext = createContext();

const DARK_MODE_KEY = 'dark_mode_enabled';

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(DARK_MODE_KEY);
      if (saved !== null) {
        setIsDarkMode(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load theme preference', e);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(newValue));
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const theme = {
    isDarkMode,
    colors: isDarkMode ? {
      ...COLORS,
      background: COLORS.primaryDark,
      surface: COLORS.primary,
      text: COLORS.white,
      textSecondary: COLORS.grayLight,
      border: COLORS.primaryLight,
      card: COLORS.primary,
      offWhite: '#121212',
      white: '#1E1E1E',
      grayLight: '#333333',
      parchment: '#2C2C2E',
      parchmentDark: '#1C1C1E',
    } : {
      ...COLORS,
      background: COLORS.offWhite,
      surface: COLORS.white,
      text: COLORS.primary,
      textSecondary: COLORS.gray,
      border: COLORS.offWhite,
      card: COLORS.white,
      offWhite: COLORS.offWhite,
      white: COLORS.white,
      grayLight: COLORS.grayLight,
      parchment: COLORS.parchment,
      parchmentDark: COLORS.parchmentDark,
    },
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
