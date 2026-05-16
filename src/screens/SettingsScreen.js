import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Moon, Smartphone, Bell, Volume2, Mail, KeyRound, LogOut,
  Play, Info, AlertCircle, CheckCircle, ChevronRight,
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useStore } from '../store';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { scheduleDailyReminders, scheduleHabitReminder, requestPermissions, setNotificationSound } from '../utils/notifications';
import { lightTap } from '../utils/haptics';

const APP_VERSION = '1.0.0';

function IconTile({ Icon, color, bg }) {
  return (
    <View style={{
      width: rs(32), height: rs(32), borderRadius: rs(9),
      backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
      marginRight: rs(12),
    }}>
      <Icon size={rs(16)} color={color} strokeWidth={2} />
    </View>
  );
}

export default function SettingsScreen() {
  const { state, dispatch } = useStore();
  const { session, signOut, resetPassword } = useAuth();
  const C = useTheme();
  const styles = makeStyles(C);

  const [remindersOn, setRemindersOn] = useState(null);
  const [banner, setBanner] = useState({ text: '', type: 'info' });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    Notifications.getAllScheduledNotificationsAsync().then(all => {
      setRemindersOn(all.some(n => n.identifier === 'habitflow_morning'));
    });
  }, []);

  function showBanner(text, type = 'info') {
    setBanner({ text, type });
    setTimeout(() => setBanner({ text: '', type: 'info' }), 4000);
  }

  function toggleTheme() {
    lightTap();
    dispatch({ type: 'SET_THEME', mode: state.themeMode === 'dark' ? 'light' : 'dark' });
  }

  function toggleHaptics(value) {
    dispatch({ type: 'SET_HAPTICS', enabled: value });
  }

  async function toggleNotificationSound(value) {
    setNotificationSound(value);
    dispatch({ type: 'SET_NOTIFICATION_SOUND', enabled: value });
    if (remindersOn) {
      await scheduleDailyReminders(state.habits.map(h => h.name));
      await Promise.all(
        state.habits
          .filter(h => h.reminderTime)
          .map(h => scheduleHabitReminder(h.id, h.name, h.emoji, h.reminderTime.hour, h.reminderTime.minute))
      );
    }
  }

  async function toggleReminders(value) {
    setRemindersOn(value);
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        setRemindersOn(false);
        showBanner('Enable notifications in your device settings first.', 'error');
        return;
      }
      await scheduleDailyReminders(state.habits.map(h => h.name));
    } else {
      try { await Notifications.cancelScheduledNotificationAsync('habitflow_morning'); } catch (_) {}
      try { await Notifications.cancelScheduledNotificationAsync('habitflow_evening'); } catch (_) {}
    }
  }

  async function handleChangePassword() {
    const email = session?.user?.email;
    if (!email) return;
    try {
      await resetPassword(email);
      showBanner(`Reset link sent to ${email}`);
    } catch (_) {
      showBanner('Could not send reset link. Try again.', 'error');
    }
  }

  async function handleSignOut() {
    lightTap();
    setSigningOut(true);
    try { await signOut(); } catch (_) {}
    setSigningOut(false);
  }

  function handleViewOnboarding() {
    lightTap();
    dispatch({ type: 'RESET_ONBOARDING' });
  }

  const email = session?.user?.email ?? '';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topRow}>
        <Text style={styles.topLabel}>Settings</Text>
        <Text style={styles.topTitle}>Your preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {!!banner.text && (
          <View style={[styles.banner, banner.type === 'error' ? styles.bannerError : styles.bannerInfo]}>
            {banner.type === 'error'
              ? <AlertCircle size={rs(15)} color={C.danger} strokeWidth={2} style={{ marginRight: rs(8) }} />
              : <CheckCircle size={rs(15)} color={C.primary} strokeWidth={2} style={{ marginRight: rs(8) }} />
            }
            <Text style={[styles.bannerText, banner.type === 'error' ? styles.bannerTextError : styles.bannerTextInfo]}>
              {banner.text}
            </Text>
          </View>
        )}

        {/* Appearance */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <IconTile Icon={Moon} color={C.textSub} bg={C.cardHigh} />
              <Text style={styles.rowLabel}>Dark mode</Text>
            </View>
            <Switch
              value={state.themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#fff"
              ios_backgroundColor={C.border}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <IconTile Icon={Smartphone} color={C.textSub} bg={C.cardHigh} />
              <Text style={styles.rowLabel}>Haptic feedback</Text>
            </View>
            <Switch
              value={state.hapticsEnabled ?? true}
              onValueChange={toggleHaptics}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#fff"
              ios_backgroundColor={C.border}
            />
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <IconTile Icon={Bell} color={C.textSub} bg={C.cardHigh} />
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowLabel}>Daily reminders</Text>
                <Text style={styles.rowSub}>9:00 AM and 8:00 PM</Text>
              </View>
            </View>
            <Switch
              value={!!remindersOn}
              onValueChange={toggleReminders}
              disabled={remindersOn === null}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#fff"
              ios_backgroundColor={C.border}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <IconTile Icon={Volume2} color={C.textSub} bg={C.cardHigh} />
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowLabel}>Notification sound</Text>
                <Text style={styles.rowSub}>Silent uses vibration only</Text>
              </View>
            </View>
            <Switch
              value={state.notificationSound ?? true}
              onValueChange={toggleNotificationSound}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#fff"
              ios_backgroundColor={C.border}
            />
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <IconTile Icon={Mail} color={C.textSub} bg={C.cardHigh} />
              <Text style={styles.rowLabel}>Email</Text>
            </View>
            <Text style={styles.rowValue} numberOfLines={1}>{email}</Text>
          </View>
          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <IconTile Icon={KeyRound} color={C.textSub} bg={C.cardHigh} />
              <Text style={styles.rowLabel}>Change password</Text>
            </View>
            <ChevronRight size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={handleSignOut}
            activeOpacity={0.7}
            disabled={signingOut}
          >
            <View style={styles.rowLeft}>
              <IconTile Icon={LogOut} color={C.danger} bg={C.dangerSoft} />
              <Text style={[styles.rowLabel, { color: C.danger }]}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App */}
        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={handleViewOnboarding}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <IconTile Icon={Play} color={C.textSub} bg={C.cardHigh} />
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowLabel}>View onboarding</Text>
                <Text style={styles.rowSub}>Replay the intro walkthrough</Text>
              </View>
            </View>
            <ChevronRight size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
          </TouchableOpacity>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <IconTile Icon={Info} color={C.textSub} bg={C.cardHigh} />
              <Text style={styles.rowLabel}>Version</Text>
            </View>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return {
    root:     { flex: 1, backgroundColor: C.bg },
    topRow:   { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(16) },
    topLabel: { fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
    topTitle: { fontSize: ms(20), fontFamily: C.bold, fontWeight: '700', color: C.text, marginTop: rs(4), letterSpacing: ls(20) },

    body: { paddingHorizontal: rs(16), paddingBottom: rs(100) },

    banner: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: rs(10), padding: rs(12), borderWidth: 1, marginBottom: rs(16),
    },
    bannerInfo:      { backgroundColor: C.primarySoft, borderColor: C.primary },
    bannerError:     { backgroundColor: C.dangerSoft, borderColor: C.danger },
    bannerText:      { flex: 1, fontSize: ms(12), fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12) },
    bannerTextInfo:  { color: C.primary },
    bannerTextError: { color: C.danger },

    sectionLabel: {
      fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: rs(8), marginLeft: rs(4),
    },
    card: {
      backgroundColor: C.card, borderRadius: rs(14), borderWidth: 1, borderColor: C.border,
      marginBottom: rs(20), overflow: 'hidden',
    },
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: rs(14), paddingVertical: rs(13),
    },
    rowBorder:   { borderBottomWidth: 1, borderBottomColor: C.border },
    rowLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
    rowTextGroup:{ flex: 1 },
    rowLabel:    { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14) },
    rowSub:      { fontSize: ms(11), color: C.textMuted, fontFamily: C.reg, fontWeight: '400', marginTop: rs(2), letterSpacing: ls(11) },
    rowValue:    { fontSize: ms(13), color: C.textMuted, fontFamily: C.reg, fontWeight: '400', maxWidth: '50%', textAlign: 'right', letterSpacing: ls(13) },
  };
}
