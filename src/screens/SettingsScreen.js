import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useStore } from '../store';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { scheduleDailyReminders, requestPermissions } from '../utils/notifications';

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
    dispatch({ type: 'SET_THEME', mode: state.themeMode === 'dark' ? 'light' : 'dark' });
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
    setSigningOut(true);
    try { await signOut(); } catch (_) {}
    setSigningOut(false);
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
            <Text style={[styles.bannerText, banner.type === 'error' ? styles.bannerTextError : styles.bannerTextInfo]}>
              {banner.text}
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark mode</Text>
            <Switch
              value={state.themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowTextGroup}>
              <Text style={styles.rowLabel}>Daily reminders</Text>
              <Text style={styles.rowSub}>9:00 AM and 8:00 PM</Text>
            </View>
            <Switch
              value={!!remindersOn}
              onValueChange={toggleReminders}
              disabled={remindersOn === null}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{email}</Text>
          </View>
          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Change Password</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={handleSignOut}
            activeOpacity={0.7}
            disabled={signingOut}
          >
            <Text style={[styles.rowLabel, styles.danger]}>
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return {
    root: { flex: 1, backgroundColor: C.bg },
    topRow: { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(12) },
    topLabel: { fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', textTransform: 'uppercase', letterSpacing: ls(11) },
    topTitle: { fontSize: ms(17), fontFamily: C.xbold, fontWeight: '800', color: C.text, marginTop: rs(2), letterSpacing: ls(17) },
    body: { paddingHorizontal: rs(16), paddingBottom: rs(100) },
    banner: {
      borderRadius: rs(12), padding: rs(14), borderWidth: 1, marginBottom: rs(16),
    },
    bannerInfo: { backgroundColor: C.primary + '22', borderColor: C.primary + '55' },
    bannerError: { backgroundColor: 'rgba(255,107,107,0.12)', borderColor: 'rgba(255,107,107,0.25)' },
    bannerText: { fontSize: ms(13), fontFamily: C.med, fontWeight: '500', letterSpacing: ls(13) },
    bannerTextInfo: { color: C.primary },
    bannerTextError: { color: '#ff6b6b' },
    sectionLabel: {
      fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textSub,
      textTransform: 'uppercase', letterSpacing: ls(11), marginBottom: rs(8), marginLeft: rs(4),
    },
    card: {
      backgroundColor: C.card, borderRadius: rs(18), borderWidth: 1, borderColor: C.border,
      marginBottom: rs(20), overflow: 'hidden',
    },
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: rs(18), paddingVertical: rs(16),
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    rowTextGroup: { flex: 1 },
    rowLabel: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14) },
    rowSub: { fontSize: ms(11), color: C.textMuted, fontFamily: C.reg, fontWeight: '400', marginTop: rs(2), letterSpacing: ls(11) },
    rowValue: { fontSize: ms(13), color: C.textMuted, fontFamily: C.reg, fontWeight: '400', maxWidth: '55%', textAlign: 'right', letterSpacing: ls(13) },
    rowChevron: { fontSize: ms(22), color: C.textMuted, lineHeight: ms(24) },
    danger: { color: '#ff6b6b' },
  };
}
