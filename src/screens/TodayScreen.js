import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlarmClock, Settings, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, useTodayCompletions, calcStreak } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import CelebrationModal from '../components/CelebrationModal';
import HabitOptionsSheet from '../components/HabitOptionsSheet';
import { lightTap, successBurst } from '../utils/haptics';
import { scheduleDailyReminders, scheduleHabitReminder, cancelHabitReminder } from '../utils/notifications';

const MILESTONE_DAYS = [7, 14, 30, 60, 100, 200, 365];

function milestoneCopy(streak) {
  if (streak >= 365) return { title: `${streak}-day streak`,  subtitle: 'A full year of showing up. That is character.' };
  if (streak >= 200) return { title: `${streak}-day streak`,  subtitle: 'Two hundred days in. This is who you are now.' };
  if (streak >= 100) return { title: `${streak}-day streak`,  subtitle: 'Triple digits. You earned every single one of these.' };
  if (streak >= 60)  return { title: `${streak}-day streak`,  subtitle: 'Sixty days deep. The habit is wired in.' };
  if (streak >= 30)  return { title: `${streak}-day streak`,  subtitle: 'A full month. This is no longer a goal — it is a routine.' };
  if (streak >= 14)  return { title: `${streak}-day streak`,  subtitle: 'Two weeks of consistency. Momentum is real now.' };
  return { title: `${streak}-day streak`, subtitle: 'A full week. Keep the chain alive.' };
}

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
  const [milestone, setMilestone] = useState(null);
  const [optionsHabit, setOptionsHabit] = useState(null);
  const wasAllDoneRef = useRef(false);
  const celebratedMilestonesRef = useRef({});

  const { habits } = state;
  const habitsWithReminder = habits.filter(h => h.reminderTime);
  const doneCount = habits.filter(h => (todayCompletions[h.id] || 0) >= (h.targetCount || 1)).length;
  const allDone   = habits.length > 0 && doneCount === habits.length;

  useEffect(() => {
    if (allDone && !wasAllDoneRef.current) {
      wasAllDoneRef.current = true;
      successBurst();
      setTimeout(() => setCelebrate(true), 300);
    }
    if (!allDone) wasAllDoneRef.current = false;
  }, [allDone]);

  // Streak milestones — fire once per (habit, milestone) per session.
  // We rely on streak === milestone (the day it crosses) to avoid celebrating
  // every render past the threshold.
  useEffect(() => {
    if (milestone) return;
    for (const habit of habits) {
      const streak = calcStreak(habit.id, state.completions);
      if (!MILESTONE_DAYS.includes(streak)) continue;
      const already = celebratedMilestonesRef.current[habit.id] || [];
      if (already.includes(streak)) continue;
      celebratedMilestonesRef.current[habit.id] = [...already, streak];
      successBurst();
      setTimeout(() => setMilestone({ habit, streak }), 400);
      break;
    }
  }, [habits, state.completions, milestone]);

  function handleToggle(id)              { lightTap(); dispatch({ type: 'LOG_HABIT', id }); }
  function handleIncrement(id, delta=1)  { lightTap(); dispatch({ type: 'LOG_HABIT', id, delta }); }
  function handleDecrement(id, delta=1)  { lightTap(); dispatch({ type: 'LOG_HABIT', id, delta: -delta }); }

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

  const statusText = habits.length === 0
    ? 'Add your first habit to begin'
    : allDone
    ? `All done — great work today`
    : `${habits.length - doneCount} habit${habits.length - doneCount !== 1 ? 's' : ''} left for today`;

  const reminderBanner = habitsWithReminder.length > 0 ? (
    <View style={styles.reminderBanner}>
      <View style={styles.reminderBannerHeader}>
        <AlarmClock size={rs(12)} color={C.primary} strokeWidth={2.5} />
        <Text style={styles.reminderBannerLabel}>
          {habitsWithReminder.length} REMINDER{habitsWithReminder.length !== 1 ? 'S' : ''} ACTIVE
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {habitsWithReminder.map(h => (
          <View key={h.id} style={styles.reminderChip}>
            <Text style={{ fontSize: ms(12) }}>{h.emoji}</Text>
            <Text style={styles.reminderChipText}>
              {formatReminderTime(h.reminderTime.hour, h.reminderTime.minute)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topGreeting}>{greeting}</Text>
          <Text style={styles.topDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { lightTap(); navigation.navigate('Settings'); }}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <Settings size={rs(18)} color={C.textSub} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      {/* Hero card */}
      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopLine} />
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatNum, allDone && { color: C.success }]}>{doneCount}</Text>
              <Text style={styles.heroStatLabel}>Done</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{habits.length - doneCount}</Text>
              <Text style={styles.heroStatLabel}>Remaining</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{Math.round(pct * 100)}<Text style={styles.heroStatUnit}>%</Text></Text>
              <Text style={styles.heroStatLabel}>Complete</Text>
            </View>
          </View>
          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, {
              width: `${pct * 100}%`,
              backgroundColor: allDone ? C.success : C.primary,
            }]} />
          </View>
          <Text style={styles.heroStatus}>{statusText}</Text>
        </View>
      </View>

      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: rs(16), paddingBottom: rs(110) }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={reminderBanner}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: rs(44), marginBottom: rs(12) }}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first habit</Text>
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
        style={styles.fab}
        onPress={() => { lightTap(); setAddVisible(true); }}
        activeOpacity={0.88}
      >
        <Plus size={rs(26)} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <AddHabitModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={handleAdd}
      />

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
        title="All habits done"
        subtitle={`You completed all ${habits.length} habits today. Keep the streak alive.`}
        onClose={() => setCelebrate(false)}
        type="daily"
      />

      <CelebrationModal
        visible={milestone != null}
        type="milestone"
        emoji={milestone?.habit?.emoji}
        title={milestone ? milestoneCopy(milestone.streak).title : ''}
        subtitle={milestone ? `${milestone.habit.name} — ${milestoneCopy(milestone.streak).subtitle}` : ''}
        actionLabel="Nice"
        onClose={() => setMilestone(null)}
      />
    </SafeAreaView>
  );
}

function makeStyles(C) { return {
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(12),
  },
  topGreeting: {
    fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  topDate: { fontSize: ms(20), fontFamily: C.bold, fontWeight: '700', color: C.text, marginTop: rs(4), letterSpacing: ls(20) },
  iconBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(12),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  heroWrap: { paddingHorizontal: rs(16), marginBottom: rs(8) },
  heroCard: {
    backgroundColor: C.heroSurface,
    borderRadius: rs(18),
    padding: rs(20),
    paddingTop: rs(22),
    borderWidth: 1, borderColor: C.borderStrong,
    overflow: 'hidden',
  },
  heroTopLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: rs(3), backgroundColor: C.primary,
  },
  heroStatsRow:    { flexDirection: 'row', marginBottom: rs(18) },
  heroStat:        { flex: 1, alignItems: 'center' },
  heroStatNum:     { fontSize: ms(30), fontFamily: C.bold, fontWeight: '700', color: C.text, letterSpacing: ls(30) },
  heroStatUnit:    { fontSize: ms(18), fontFamily: C.semi, fontWeight: '600', color: C.textMuted, letterSpacing: 0 },
  heroStatLabel:   { fontSize: ms(11), color: C.textMuted, marginTop: rs(2), fontFamily: C.med, fontWeight: '500', letterSpacing: 0.4, textTransform: 'uppercase' },
  heroStatDivider: { width: 1, backgroundColor: C.borderStrong, marginVertical: rs(8) },
  heroProgressTrack: { height: rs(6), backgroundColor: C.border, borderRadius: rs(3), overflow: 'hidden', marginBottom: rs(12) },
  heroProgressFill:  { height: '100%', borderRadius: rs(3) },
  heroStatus: { fontSize: ms(12), color: C.textSub, textAlign: 'center', fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12) },

  // Reminder banner
  reminderBanner: {
    marginBottom: rs(12),
    backgroundColor: C.card, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border,
    padding: rs(12),
  },
  reminderBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(8) },
  reminderBannerLabel:  { fontSize: ms(10), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: 0.8 },
  reminderChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    backgroundColor: C.cardHigh, borderRadius: rs(20),
    paddingHorizontal: rs(10), paddingVertical: rs(5),
    marginRight: rs(8), borderWidth: 1, borderColor: C.border,
  },
  reminderChipText: { fontSize: ms(11), color: C.textSub, fontFamily: C.med, fontWeight: '500' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: rs(60) },
  emptyTitle: { fontSize: ms(17), fontFamily: C.bold, fontWeight: '700', color: C.text, marginBottom: rs(6), letterSpacing: ls(17) },
  emptySub:   { fontSize: ms(13), color: C.textMuted, fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13) },

  // FAB
  fab: {
    position: 'absolute', bottom: rs(28), right: rs(20),
    width: rs(56), height: rs(56), borderRadius: rs(28),
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: rs(10),
    shadowOffset: { width: 0, height: rs(4) }, elevation: 6,
  },
}; }
