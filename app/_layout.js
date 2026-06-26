// app/_layout.js
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { REMINDER_TYPES, requestPermissions } from '../services/notifications';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';

function RootLayoutContent() {
  const router = useRouter();
  const notificationSubscription = useRef();
  const { colors, isDarkMode } = useAppTheme();

  useEffect(() => {
    requestPermissions();

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    notificationSubscription.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationSubscription.current) {
        notificationSubscription.current.remove();
      }
    };
  }, []);

  const handleNotificationResponse = (response) => {
    try {
      const data = response.notification.request.content.data;
      if (data?.type === REMINDER_TYPES.PRAYER) {
        setTimeout(() => router.push('/prayer'), 100);
      } else if (data?.type === REMINDER_TYPES.DEVOTIONAL) {
        setTimeout(() => router.push('/(tabs)'), 100);
      }
    } catch (error) {
      console.log('Notification handling error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.gold,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerBackTitleVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="devotional/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="verse-compare/[reference]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="bible-reader/[bibleId]"
          options={{ headerShown: false }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
});