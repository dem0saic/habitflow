import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore, useTodayCompletions } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import CelebrationModal from '../components/CelebrationModal';
import HabitOptionsSheet from '../components/HabitOptionsSheet';
import { lightTap, successBurst } from '../utils/haptics';
import { scheduleDailyReminders, scheduleHabitReminder, cancelHabitReminder } from '../utils/notifications';

function formatReminderTime(hour, minute) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

export default function TodayScreen() {
  const navigation = useNavigation();
  const { state, dispatch } = useStore();
  const C = useTheme();
  const styles = makeStyles(C);
  const todayCompletions = useTodayCompletions();
  const [addVisible, setAddVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const [optionsHabit, setOptionsHabit] = useState(null);
  const wasAllDoneRef = useRef(false);

  const { habits } = state;
  const habitsWithReminder = habits.filter(h => h.reminderTime);
  const doneCount = habits.filter(h => (todayCompletions[h.id] || 0) >= (h.targetCount || 1)).length;
  const allDone = habits.length > 0 && doneCount === habits.length;
  useEffect(() => {
    if (allDone && !wasAllDoneRef.current) {
      wasAllDoneRef.current = true;
      successBurst();
      setTimeout(() => setCelebrate(true), 300);
    }
    if (!allDone) wasAllDoneRef.current = false;
  }, [allDone]);

  function handleToggle(id) { lightTap(); dispatch({ type: 'LOG_HABIT', id }); }
  function handleIncrement(id, delta = 1) { lightTap(); dispatch({ type: 'LOG_HABIT', id, delta }); }
  function handleDecrement(id, delta = 1) { lightTap(); dispatch({ type: 'LOG_HABIT', id, delta: -delta }); }

  function handleDelete(id) {
    cancelHabitReminder(id).catch(() => {});
    dispatch({ type: 'DELETE_HABIT', id });
  }

  function handleSetReminder(id, reminderTime) {
    dispatch({ type: 'SET_HABIT_REMINDER', id, reminderTime });
    const habit = habits.find(h => h.id === id);
    if (reminderTime && habit) {
      scheduleHabitReminder(id, habit.name, habit.emoji, reminderTime.hour, reminderTime.minute).catch(() => {});
    } else {
      cancelHabitReminder(id).catch(() => {});
    }
  }

  function handleEdit(updatedHabit) {
    const { name, emoji, type, targetCount, reminderTime, id } = updatedHabit;
    dispatch({ type: 'EDIT_HABIT', id, name, emoji, habitType: type, targetCount, reminderTime });
    const old = habits.find(h => h.id === id);
    if (reminderTime) {
      scheduleHabitReminder(id, name, emoji, reminderTime.hour, reminderTime.minute).catch(() => {});
    } else if (old?.reminderTime) {
      cancelHabitReminder(id).catch(() => {});
    }
  }

  function handleAdd({ name, emoji, type, targetCount, reminderTime }) {
    const id = Date.now().toString();
    dispatch({ type: 'ADD_HABIT', id, name, emoji, habitType: type, targetCount, reminderTime });
    scheduleDailyReminders([...habits.map(h => h.name), name]).catch(() => {});
    if (reminderTime) {
      scheduleHabitReminder(id, name, emoji, reminderTime.hour, reminderTime.minute).catch(() => {});
    }
  }

  const pct = habits.length ? doneCount / habits.length : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const reminderBanner = habitsWithReminder.length > 0 ? (
    <View style={{
      marginHorizontal: rs(0), marginBottom: rs(12),
      backgroundColor: C.card, borderRadius: rs(16),
      borderWidth: 1, borderColor: C.border,
      padding: rs(12),
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(8) }}>
        <Ionicons name="alarm" size={rs(14)} color={C.primary} />
        <Text style={{ fontSize: ms(11), fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {habitsWithReminder.length} Reminder{habitsWithReminder.length !== 1 ? 's' : ''} Active
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: rs(8) }}>
        {habitsWithReminder.map(h => (
          <View key={h.id} style={{
            flexDirection: 'row', alignItems: 'center', gap: rs(6),
            backgroundColor: C.cardHigh, borderRadius: rs(20),
            paddingHorizontal: rs(10), paddingVertical: rs(5),
            marginRight: rs(8), borderWidth: 1, borderColor: C.border,
          }}>
            <Text style={{ fontSize: ms(12) }}>{h.emoji}</Text>
            <Text style={{ fontSize: ms(11), color: C.textSub, fontWeight: '500' }}>
              {formatReminderTime(h.reminderTime.hour, h.reminderTime.minute)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.topGreeting}>{greeting} 👋</Text>
          <Text style={styles.topDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => { lightTap(); dispatch({ type: 'RESET_ONBOARDING' }); }}
            style={styles.iconBtn}
          >
            <Ionicons name="help-circle-outline" size={rs(18)} color={C.textSub} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { lightTap(); navigation.navigate('Settings'); }}
            style={styles.iconBtn}
          >
            <Ionicons name="settings-outline" size={rs(18)} color={C.textSub} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating hero card */}
      <View style={styles.heroWrap}>
        <LinearGradient colors={['#000000', '#3D2E2E']} style={styles.heroCard}>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{doneCount}</Text>
              <Text style={styles.heroStatLabel}>Done</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{habits.length - doneCount}</Text>
              <Text style={styles.heroStatLabel}>Remaining</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{Math.round(pct * 100)}%</Text>
              <Text style={styles.heroStatLabel}>Complete</Text>
            </View>
          </View>
          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, { width: `${pct * 100}%` }]} />
          </View>
          <Text style={styles.heroStatus}>
            {habits.length === 0
              ? 'Add your first habit below'
              : allDone
              ? '🔥 All done — great work today!'
              : `${habits.length - doneCount} habit${habits.length - doneCount !== 1 ? 's' : ''} left for today`}
          </Text>
        </LinearGradient>
      </View>

      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: rs(16), paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={reminderBanner}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: rs(60) }}>
            <Text style={{ fontSize: rs(52), marginBottom: rs(16) }}>🌱</Text>
            <Text style={{ fontSize: ms(18), fontWeight: '700', color: C.text, marginBottom: rs(8) }}>No habits yet</Text>
            <Text style={{ fontSize: ms(14), color: C.textSub }}>Tap + to add your first habit</Text>
          </View>
        }
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            count={todayCompletions[item.id] || 0}
            onToggle={() => handleToggle(item.id)}
            onIncrement={() => handleIncrement(item.id, item.type === 'timer' ? 5 : 1)}
            onDecrement={() => handleDecrement(item.id, item.type === 'timer' ? 5 : 1)}
            onLongPress={() => { lightTap(); setOptionsHabit(item); }}
            onSetReminder={handleSetReminder}
          />
        )}
      />

      <TouchableOpacity
        style={{
          position: 'absolute', bottom: rs(28), right: rs(20),
          width: rs(58), height: rs(58), borderRadius: rs(29),
          backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
          shadowColor: C.primary, shadowOpacity: 0.5, shadowRadius: rs(14),
          shadowOffset: { width: 0, height: rs(4) }, elevation: 8,
        }}
        onPress={() => { lightTap(); setAddVisible(true); }}
      >
        <Ionicons name="add" size={rs(30)} color="#fff" />
      </TouchableOpacity>

      {/* Add new habit */}
      <AddHabitModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={handleAdd}
      />

      {/* Edit existing habit */}
      <AddHabitModal
        visible={editingHabit != null}
        onClose={() => setEditingHabit(null)}
        onAdd={handleEdit}
        editingHabit={editingHabit}
      />

      <HabitOptionsSheet
        visible={optionsHabit != null}
        habit={optionsHabit}
        onClose={() => setOptionsHabit(null)}
        onEdit={(habit) => { setOptionsHabit(null); setEditingHabit(habit); }}
        onDelete={handleDelete}
        onSetReminder={handleSetReminder}
      />

      <CelebrationModal
        visible={celebrate}
        title="All habits done! 🔥"
        subtitle={`Amazing — you completed all ${habits.length} habits today. Keep the streak alive!`}
        onClose={() => setCelebrate(false)}
        type="daily"
      />
    </SafeAreaView>
  );
}

function makeStyles(C) { return {
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(8),
  },
  topGreeting: { fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', textTransform: 'uppercase', letterSpacing: ls(11) },
  topDate: { fontSize: ms(17), fontFamily: C.xbold, fontWeight: '800', color: C.text, marginTop: rs(2), letterSpacing: ls(17) },
  topActions: { flexDirection: 'row', gap: rs(8) },
  iconBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  heroWrap: { paddingHorizontal: rs(16), marginBottom: rs(8) },
  heroCard: {
    borderRadius: rs(24), padding: rs(20),
    shadowColor: '#988686', shadowOpacity: 0.35, shadowRadius: rs(20),
    shadowOffset: { width: 0, height: rs(8) }, elevation: 12,
  },
  heroStatsRow: { flexDirection: 'row', marginBottom: rs(16) },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: ms(26), fontFamily: C.xbold, fontWeight: '800', color: '#fff', letterSpacing: ls(26) },
  heroStatLabel: { fontSize: ms(10), color: 'rgba(255,255,255,0.65)', marginTop: rs(2), fontFamily: C.med, fontWeight: '500', letterSpacing: ls(10) },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: rs(4) },
  heroProgressTrack: { height: rs(6), backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: rs(3), overflow: 'hidden', marginBottom: rs(10) },
  heroProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: rs(3) },
  heroStatus: { fontSize: ms(12), color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12) },
}; }
