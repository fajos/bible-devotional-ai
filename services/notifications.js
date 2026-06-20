// services/notifications.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import store from './store';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const REMINDER_TYPES = {
  PRAYER: 'prayer_reminder',
  DEVOTIONAL: 'devotional_reminder',
};

/**
 * Requests notification permissions from the user.
 */
export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * Schedules a daily notification.
 */
export async function scheduleDailyReminder(type, hour, minute) {
  // First, cancel any existing notifications of this type
  await cancelReminder(type);

  const hasPermission = await requestPermissions();
  if (!hasPermission) return false;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: type === REMINDER_TYPES.PRAYER ? "Time for Prayer" : "Daily Devotional",
      body: type === REMINDER_TYPES.PRAYER
        ? "Take a moment to talk to God and review your journal."
        : "Start your day with God. Your daily devotional is ready.",
      data: { type },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });

  // Save the identifier and settings to store
  const settings = await store.getCachedData('notification_settings') || {};
  settings[type] = {
    identifier,
    hour,
    minute,
    enabled: true
  };
  await store.setCachedData('notification_settings', settings);

  return identifier;
}

/**
 * Cancels a specific reminder type.
 */
export async function cancelReminder(type) {
  const settings = await store.getCachedData('notification_settings') || {};
  if (settings[type] && settings[type].identifier) {
    await Notifications.cancelScheduledNotificationAsync(settings[type].identifier);
    settings[type].enabled = false;
    settings[type].identifier = null;
    await store.setCachedData('notification_settings', settings);
  }
}

/**
 * Gets the current notification settings.
 */
export async function getReminderSettings() {
  return await store.getCachedData('notification_settings') || {};
}

export default {
  requestPermissions,
  scheduleDailyReminder,
  cancelReminder,
  getReminderSettings,
  REMINDER_TYPES,
};
