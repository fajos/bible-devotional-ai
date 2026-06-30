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
  READING_PLAN: 'reading_plan_reminder',
  VOTD: 'votd_reminder',
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

  let title, body;
  switch (type) {
    case REMINDER_TYPES.PRAYER:
      title = "Time for Prayer";
      body = "Take a moment to talk to God and review your journal.";
      break;
    case REMINDER_TYPES.READING_PLAN:
      title = "Daily Bible Reading";
      body = "Your daily portion of the Word is waiting for you.";
      break;
    case REMINDER_TYPES.DEVOTIONAL:
    default:
      title = "Daily Devotional";
      body = "Start your day with God. Your daily devotional is ready.";
      break;
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
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
  if (settings[type]) {
    if (settings[type].identifier) {
      await Notifications.cancelScheduledNotificationAsync(settings[type].identifier);
    }
    // Handle array of identifiers (for batch scheduling like VOTD)
    if (Array.isArray(settings[type].identifiers)) {
      for (const id of settings[type].identifiers) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
    settings[type].enabled = false;
    settings[type].identifier = null;
    settings[type].identifiers = null;
    await store.setCachedData('notification_settings', settings);
  }
}

/**
 * Schedules Verse of the Day notifications for the next 7 days.
 */
export async function scheduleVOTDReminders(hour, minute) {
  const { getOrGenerateVOTD, refillVOTDCache } = require('./devotionalEngine');

  await cancelReminder(REMINDER_TYPES.VOTD);

  const hasPermission = await requestPermissions();
  if (!hasPermission) return false;

  // Ensure we have 7 days of content
  await refillVOTDCache();

  const identifiers = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + i);

    // Set the specific time
    scheduledDate.setHours(hour, minute, 0, 0);

    // If the time has already passed for today, skip to tomorrow
    if (i === 0 && scheduledDate <= new Date()) {
      continue;
    }

    const votd = await getOrGenerateVOTD(scheduledDate);
    if (!votd) continue;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Verse of the Day: ${votd.reference}`,
        body: votd.reflection,
        data: {
          type: REMINDER_TYPES.VOTD,
          date: scheduledDate.toDateString()
        },
      },
      trigger: scheduledDate,
    });
    identifiers.push(identifier);
  }

  // Save identifiers to store
  const settings = await store.getCachedData('notification_settings') || {};
  settings[REMINDER_TYPES.VOTD] = {
    identifiers,
    hour,
    minute,
    enabled: true
  };
  await store.setCachedData('notification_settings', settings);

  return identifiers.length > 0;
}

/**
 * Refreshes all active notifications. Useful to call on app startup.
 */
export async function refreshNotifications() {
  const settings = await store.getCachedData('notification_settings') || {};

  if (settings[REMINDER_TYPES.VOTD]?.enabled) {
    const { hour, minute } = settings[REMINDER_TYPES.VOTD];
    await scheduleVOTDReminders(hour, minute);
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
