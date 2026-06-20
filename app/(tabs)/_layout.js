// app/(tabs)/_layout.js
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.grayLight,
        tabBarStyle: {
          backgroundColor: COLORS.primary,
          borderTopColor: COLORS.goldDark,
          borderTopWidth: 1,
          // Much more aggressive padding
          height: 70 + insets.bottom, // Base height + safe area
          paddingBottom: insets.bottom + 15, // Safe area + extra space for labels
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: FONTS.ui.size.tiny,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 5 : 0, // Push labels up on Android
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'android' ? 5 : 0, // Push icons up slightly
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.gold,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: FONTS.ui.size.large,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Daily Bread',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
          headerTitle: 'Daily Devotional',
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: 'Bible',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Study',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
          headerTitle: 'AI Bible Study',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmarks" size={size} color={color} />
          ),
          headerTitle: 'My Library',
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hand-left" size={size} color={color} />
          ),
          headerTitle: 'Prayer Journal',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          headerTitle: 'Settings',
        }}
      />
    </Tabs>
  );
}