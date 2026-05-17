import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

// Show alert + sound when app is open (foreground).
// expo-notifications SDK 51+ split shouldShowAlert into shouldShowBanner +
// shouldShowList. shouldShowAlert is kept for back-compat with older runtimes.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
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

// Re-schedules every habit reminder from the given habit list. Called after a
// Supabase pull replaces local habits so OS-scheduled times stay in sync with
// whatever the server says.
export async function registerAllReminders(habits = []) {
  await ensureAndroidChannel();
  for (const h of habits) {
    if (h?.reminderTime?.hour != null && h?.reminderTime?.minute != null) {
      try {
        await scheduleHabitReminder(h.id, h.name, h.emoji, h.reminderTime.hour, h.reminderTime.minute);
      } catch (_) { /* fire-and-forget per habit */ }
    }
  }
}

// Registers this device's Expo push token with Supabase so the server can
// invoke `send-push` to reach the user even when the app is closed.
// Returns the token on success, or null if push is not available (Expo Go,
// simulator/emulator, permission denied, no EAS projectId).
export async function registerPushToken(userId) {
  if (!userId) return null;
  if (!Device.isDevice) return null;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('[push] No EAS projectId — run `npx eas init` to enable remote push');
    return null;
  }
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return null;
    await supabase.from('push_tokens').upsert({
      token,
      user_id: userId,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token' });
    return token;
  } catch (e) {
    console.warn('[push] registerPushToken failed:', e?.message || e);
    return null;
  }
}
