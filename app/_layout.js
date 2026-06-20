// app/_layout.js
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../constants/theme';
import { requestPermissions, REMINDER_TYPES } from '../services/notifications';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Request notification permissions on mount
    requestPermissions();

    // Check for notification that might have triggered the app launch (Cold Start)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    // Handle notification clicks while app is running
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => subscription.remove();
  }, []);

  const handleNotificationResponse = (response) => {
    const data = response.notification.request.content.data;
    if (data?.type === REMINDER_TYPES.PRAYER) {
      router.push('/prayer');
    } else if (data?.type === REMINDER_TYPES.DEVOTIONAL) {
      router.push('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <Stack
        screenOptions={{
          // Global header styling
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.gold,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerBackTitleVisible: false,
          
          // Content styling
          contentStyle: {
            backgroundColor: COLORS.offWhite,
          },
          
          // Animations
          animation: 'slide_from_right',
          
          // Gesture handling
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
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="verse-compare/[reference]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="bible-reader/[bibleId]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
});