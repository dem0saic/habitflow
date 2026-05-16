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

const CHANNEL_ID        = 'habitflow-reminders';
const SILENT_CHANNEL_ID = 'habitflow-reminders-silent';
const MORNING_ID        = 'habitflow_morning';
const EVENING_ID        = 'habitflow_evening';

let _soundEnabled = true;
export function setNotificationSound(enabled) { _soundEnabled = enabled; }

// Android 8.0+ requires a notification channel or notifications are silently dropped.
// Safe to call multiple times — it's a no-op on iOS.
// Two channels are created: one with sound and one silent (Android sound is channel-level
// and cannot be changed after creation, so switching requires a different channel ID).
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Habit Reminders',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F57B51',
    enableVibrate: true,
    showBadge: true,
  });
  await Notifications.setNotificationChannelAsync(SILENT_CHANNEL_ID, {
    name: 'Habit Reminders (Silent)',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F57B51',
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
    ...(Platform.OS === 'android' && { channelId: _soundEnabled ? CHANNEL_ID : SILENT_CHANNEL_ID }),
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
    content: { title: '🌅 HabitFlow', body: morning, sound: _soundEnabled },
    trigger: dailyTrigger(9, 0),
  });

  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_ID,
    content: { title: '🌙 HabitFlow', body: evening, sound: _soundEnabled },
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
      sound: _soundEnabled,
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
