import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show alert + sound when app is open (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const CHANNEL_ID  = 'habitflow-reminders';
const MORNING_ID  = 'habitflow_morning';
const EVENING_ID  = 'habitflow_evening';

// Android 8.0+ requires a notification channel or notifications are silently dropped.
// Safe to call multiple times — it's a no-op on iOS.
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Habit Reminders',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#988686',
    enableVibrate: true,
    showBadge: true,
  });
}

export async function requestPermissions() {
  await ensureAndroidChannel();
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}

function dailyTrigger(hour, minute) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
    // Android must route through the channel
    ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
  };
}

/**
 * Re-schedules only the two general morning/evening reminders.
 * Does NOT touch per-habit reminders.
 */
export async function scheduleDailyReminders(habitNames = []) {
  try { await Notifications.cancelScheduledNotificationAsync(MORNING_ID); } catch (_) {}
  try { await Notifications.cancelScheduledNotificationAsync(EVENING_ID); } catch (_) {}

  const morning = habitNames.length
    ? `Good morning! Time to track: ${habitNames.slice(0, 2).join(', ')}${habitNames.length > 2 ? '…' : ''}`
    : 'Good morning! Ready to build your habits today?';

  const evening = habitNames.length
    ? `Don't forget — have you done ${habitNames[0]} yet today?`
    : "Evening check-in: don't let your streak break tonight!";

  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_ID,
    content: { title: '🌅 HabitFlow', body: morning, sound: true },
    trigger: dailyTrigger(9, 0),
  });

  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_ID,
    content: { title: '🌙 HabitFlow', body: evening, sound: true },
    trigger: dailyTrigger(20, 0),
  });
}

export async function scheduleHabitReminder(habitId, habitName, habitEmoji, hour, minute) {
  await ensureAndroidChannel();   // guarantee the channel exists before scheduling
  await cancelHabitReminder(habitId);

  await Notifications.scheduleNotificationAsync({
    identifier: `habit_${habitId}`,
    content: {
      title: `${habitEmoji} Time for "${habitName}"`,
      body: `Your daily reminder — let's keep that streak going! 🔥`,
      sound: true,
    },
    trigger: dailyTrigger(hour, minute),
  });
}

export async function cancelHabitReminder(habitId) {
  try { await Notifications.cancelScheduledNotificationAsync(`habit_${habitId}`); } catch (_) {}
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
