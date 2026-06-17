// app/_layout.js
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
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