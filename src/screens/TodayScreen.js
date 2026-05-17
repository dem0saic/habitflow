import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Plus, Flame, CheckCircle2, Palmtree, Sprout, NotebookPen } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, useTodayCompletions, calcStreak } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import StatTile from '../components/StatTile';
import HabitTileSmall from '../components/HabitTileSmall';
import HabitTileWide from '../components/HabitTileWide';
import AddHabitModal from '../components/AddHabitModal';
import CelebrationModal from '../components/CelebrationModal';
import HabitOptionsSheet from '../components/HabitOptionsSheet';
import PastDayLogSheet from '../components/PastDayLogSheet';
import TutorialOverlay from '../components/TutorialOverlay';
import { lightTap, mediumTap, successBurst } from '../utils/haptics';
import { scheduleDailyReminders, scheduleHabitReminder, cancelHabitReminder } from '../utils/notifications';
import { isPaused } from '../utils/streak';
import { todayKey, formatDisplay } from '../utils/date';

const MILESTONE_DAYS = [7, 14, 30, 60, 100, 200, 365];

function milestoneCopy(streak) {
  if (streak >= 365) return { title: `${streak}-day streak`, subtitle: 'A full year of showing up. That is character.' };
  if (streak >= 200) return { title: `${streak}-day streak`, subtitle: 'Two hundred days in. This is who you are now.' };
  if (streak >= 100) return { title: `${streak}-day streak`, subtitle: 'Triple digits. You earned every single one of these.' };
  if (streak >= 60)  return { title: `${streak}-day streak`, subtitle: 'Sixty days deep. The habit is wired in.' };
  if (streak >= 30)  return { title: `${streak}-day streak`, subtitle: 'A full month. This is no longer a goal — it is a routine.' };
  if (streak >= 14)  return { title: `${streak}-day streak`, subtitle: 'Two weeks of consistency. Momentum is real now.' };
  return { title: `${streak}-day streak`, subtitle: 'A full week. Keep the chain alive.' };
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
  const [pushbackVisible, setPushbackVisible] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const wasAllDoneRef = useRef(false);
  const celebratedMilestonesRef = useRef({});

  // Show the first-run tutorial overlay once per account, on next Today mount
  // after onboardingDone. Skipped if the user has already dismissed it.
  useEffect(() => {
    if (state.onboardingDone && !state.tutorialDismissed) {
      setTutorialOpen(true);
    }
  }, [state.onboardingDone, state.tutorialDismissed]);

  function dismissTutorial() {
    setTutorialOpen(false);
    dispatch({ type: 'DISMISS_TUTORIAL' });
  }

  const { habits } = state;
  const doneCount = habits.filter(h => (todayCompletions[h.id] || 0) >= (h.targetCount || 1)).length;
  const allDone   = habits.length > 0 && doneCount === habits.length;
  const pct = habits.length ? doneCount / habits.length : 0;

  const bestStreak = habits.length
    ? Math.max(...habits.map(h => calcStreak(h, state.completions, state.globalPause)), 0)
    : 0;

  useEffect(() => {
    if (allDone && !wasAllDoneRef.current) {
      wasAllDoneRef.current = true;
      successBurst();
      setTimeout(() => setCelebrate(true), 300);
    }
    if (!allDone) wasAllDoneRef.current = false;
  }, [allDone]);

  // Streak milestones — once per (habit, milestone) per session.
  useEffect(() => {
    if (milestone) return;
    for (const habit of habits) {
      const streak = calcStreak(habit, state.completions, state.globalPause);
      if (!MILESTONE_DAYS.includes(streak)) continue;
      const already = celebratedMilestonesRef.current[habit.id] || [];
      if (already.includes(streak)) continue;
      celebratedMilestonesRef.current[habit.id] = [...already, streak];
      successBurst();
      setTimeout(() => setMilestone({ habit, streak }), 400);
      break;
    }
  }, [habits, state.completions, milestone]);

  function handleToggle(id) {
    const habit = habits.find(h => h.id === id);
    const current = todayCompletions[id] || 0;
    const target = habit?.targetCount || 1;
    // If this tap will complete the habit, give a stronger haptic so the user feels the win
    if (current < target) mediumTap();
    else lightTap();
    dispatch({ type: 'LOG_HABIT', id });
  }
  function handleIncrement(id, delta=1) {
    const habit = habits.find(h => h.id === id);
    const current = todayCompletions[id] || 0;
    const target = habit?.targetCount || 1;
    if (current < target && current + delta >= target) mediumTap();
    else lightTap();
    dispatch({ type: 'LOG_HABIT', id, delta });
  }
  function handleDecrement(id, delta=1) { lightTap(); dispatch({ type: 'LOG_HABIT', id, delta: -delta }); }

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

  // Intercept the "Add habit" button: research shows starting with 1-3 habits
  // sticks far better than 10+. Show a one-time soft pushback at habit #4.
  function attemptOpenAdd() {
    lightTap();
    if (habits.length >= 3 && !state.addHabitNudgeDismissed) {
      setPushbackVisible(true);
    } else {
      setAddVisible(true);
    }
  }

  function acceptPushback() {
    dispatch({ type: 'DISMISS_ADD_HABIT_NUDGE' });
    setPushbackVisible(false);
    setAddVisible(true);
  }

  // Group habits by tile type for grid layout
  const wideHabits  = habits.filter(h => h.type === 'volume' || h.type === 'timer');
  const smallHabits = habits.filter(h => h.type === 'daily'  || h.type === 'negative');

  const todayStr = todayKey();
  const onVacation = !!state.globalPause
    && state.globalPause.start <= todayStr
    && todayStr <= state.globalPause.end;
  function pausedFor(habit) {
    return isPaused(habit, todayStr, state.globalPause);
  }

  // Pair small habits two-up
  const smallRows = [];
  for (let i = 0; i < smallHabits.length; i += 2) {
    smallRows.push(smallHabits.slice(i, i + 2));
  }

  const dateObj = new Date();
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: rs(110) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.weekday}>{weekday}</Text>
            <Text style={styles.monthDay}>{monthDay}</Text>
          </View>
          <TouchableOpacity
            onPress={() => { lightTap(); navigation.navigate('Settings'); }}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Settings size={rs(18)} color={C.textSub} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* Vacation banner — visible when global pause is active */}
        {onVacation && (
          <View style={styles.vacationBanner}>
            <View style={styles.vacationIconWrap}>
              <Palmtree size={rs(16)} color={C.warning} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vacationTitle}>On vacation</Text>
              <Text style={styles.vacationSub}>
                Streaks safe through {formatDisplay(state.globalPause.end)} · end anytime in Settings
              </Text>
            </View>
          </View>
        )}

        {/* Stat strip */}
        {habits.length > 0 && (
          <View style={styles.statStrip}>
            <StatTile
              value={`${doneCount}/${habits.length}`}
              label="DONE"
              accent={allDone ? C.success : C.text}
              Icon={CheckCircle2}
              compact
            />
            <StatTile
              value={`${Math.round(pct * 100)}%`}
              label="COMPLETE"
              accent={allDone ? C.success : C.primary}
              compact
            />
            <StatTile
              value={`${bestStreak}`}
              label="BEST STREAK"
              accent={C.primary}
              Icon={Flame}
              compact
            />
          </View>
        )}

        {/* Add habit inline button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={attemptOpenAdd}
          activeOpacity={0.85}
        >
          <Plus size={rs(16)} color={C.primary} strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add habit</Text>
        </TouchableOpacity>

        {/* Today's note shortcut — only appears once user has habits, so empty state stays clean */}
        {habits.length > 0 && (
          (() => {
            const todayNote = state.notes?.[todayStr];
            return (
              <TouchableOpacity
                style={[styles.noteCard, todayNote ? styles.noteCardFilled : styles.noteCardEmpty]}
                onPress={() => { lightTap(); setNoteSheetOpen(true); }}
                activeOpacity={0.85}
              >
                <NotebookPen
                  size={rs(14)}
                  color={todayNote ? C.primary : C.textMuted}
                  strokeWidth={2.5}
                />
                {todayNote ? (
                  <Text style={styles.noteCardText} numberOfLines={2}>{todayNote}</Text>
                ) : (
                  <Text style={styles.noteCardPlaceholder}>Add a note for today…</Text>
                )}
              </TouchableOpacity>
            );
          })()
        )}

        {/* Empty state */}
        {habits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: rs(44), marginBottom: rs(12) }}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySub}>Tap "Add habit" above to begin</Text>
          </View>
        )}

        {/* Wide habits (volume / timer) */}
        {wideHabits.length > 0 && (
          <View style={styles.section}>
            {wideHabits.map(h => (
              <HabitTileWide
                key={h.id}
                habit={h}
                count={todayCompletions[h.id] || 0}
                paused={pausedFor(h)}
                onIncrement={() => handleIncrement(h.id, h.type === 'timer' ? 5 : 1)}
                onDecrement={() => handleDecrement(h.id, h.type === 'timer' ? 5 : 1)}
                onLongPress={() => { lightTap(); setOptionsHabit(h); }}
              />
            ))}
          </View>
        )}

        {/* Small habits (daily / negative) — paired in 2-column rows */}
        {smallRows.length > 0 && (
          <View style={styles.section}>
            {smallRows.map((row, ri) => (
              <View key={ri} style={styles.smallRow}>
                <HabitTileSmall
                  habit={row[0]}
                  count={todayCompletions[row[0].id] || 0}
                  paused={pausedFor(row[0])}
                  onToggle={() => handleToggle(row[0].id)}
                  onLongPress={() => { lightTap(); setOptionsHabit(row[0]); }}
                />
                {row[1] ? (
                  <HabitTileSmall
                    habit={row[1]}
                    count={todayCompletions[row[1].id] || 0}
                    paused={pausedFor(row[1])}
                    onToggle={() => handleToggle(row[1].id)}
                    onLongPress={() => { lightTap(); setOptionsHabit(row[1]); }}
                  />
                ) : (
                  // Spacer so a lone tile doesn't go full-width
                  <View style={{ flex: 1 }} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

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

      {/* One-time pushback modal: research-backed nudge at habit #4 */}
      <Modal
        visible={pushbackVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPushbackVisible(false)}
      >
        <Pressable style={styles.pushbackOverlay} onPress={() => setPushbackVisible(false)}>
          <Pressable style={styles.pushbackCard}>
            <View style={styles.pushbackIconWrap}>
              <Sprout size={rs(22)} color={C.primary} strokeWidth={2} />
            </View>
            <Text style={styles.pushbackTitle}>Take it slow?</Text>
            <Text style={styles.pushbackBody}>
              Behavioral research shows starting with 1 to 3 habits sticks roughly 3× more often than starting with many. You already have {habits.length}. Let these feel automatic first, then add more.
            </Text>
            <TouchableOpacity
              style={styles.pushbackPrimaryBtn}
              onPress={() => setPushbackVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.pushbackPrimaryText}>Hold off for now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pushbackSecondaryBtn}
              onPress={acceptPushback}
              activeOpacity={0.7}
            >
              <Text style={styles.pushbackSecondaryText}>Add anyway</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <HabitOptionsSheet
        visible={optionsHabit != null}
        habit={optionsHabit}
        onClose={() => setOptionsHabit(null)}
        onEdit={(habit) => { setOptionsHabit(null); setEditingHabit(habit); }}
        onDelete={handleDelete}
        onSetReminder={handleSetReminder}
        onSetPause={(id, pause) => dispatch({ type: 'SET_HABIT_PAUSE', id, pause })}
      />

      {/* Reuses PastDayLogSheet for today; its NOTE input sits at the top */}
      <PastDayLogSheet
        visible={noteSheetOpen}
        date={noteSheetOpen ? todayStr : null}
        onClose={() => setNoteSheetOpen(false)}
      />

      <TutorialOverlay
        visible={tutorialOpen}
        onDismiss={dismissTutorial}
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
    paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(16),
  },
  weekday:  { fontSize: ms(13), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', letterSpacing: 0.4 },
  monthDay: { fontSize: ms(28), fontFamily: C.bold, fontWeight: '700', color: C.text, marginTop: rs(2), letterSpacing: ls(28) },
  iconBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(12),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  statStrip: {
    flexDirection: 'row', gap: rs(8),
    paddingHorizontal: rs(16), marginBottom: rs(16),
  },

  vacationBanner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    marginHorizontal: rs(16), marginBottom: rs(12),
    paddingHorizontal: rs(14), paddingVertical: rs(12),
    backgroundColor: C.warningSoft,
    borderRadius: rs(12),
    borderWidth: 1, borderColor: C.warning,
  },
  vacationIconWrap: {
    width: rs(32), height: rs(32), borderRadius: rs(10),
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  vacationTitle: { fontSize: ms(13), fontFamily: C.bold, fontWeight: '700', color: C.warning, letterSpacing: ls(13) },
  vacationSub:   { fontSize: ms(11), fontFamily: C.reg, fontWeight: '400', color: C.textSub, marginTop: rs(2), letterSpacing: ls(11) },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    marginHorizontal: rs(16), marginBottom: rs(12),
    paddingVertical: rs(11), borderRadius: rs(12),
    borderWidth: 1, borderColor: C.primary,
    backgroundColor: C.primarySoft,
  },
  addBtnText: { fontSize: ms(13), color: C.primary, fontFamily: C.bold, fontWeight: '700', letterSpacing: ls(13) },

  noteCard: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    marginHorizontal: rs(16), marginBottom: rs(14),
    paddingHorizontal: rs(14), paddingVertical: rs(11),
    borderRadius: rs(12), borderWidth: 1,
  },
  noteCardEmpty:  { borderColor: C.border, borderStyle: 'dashed', backgroundColor: 'transparent' },
  noteCardFilled: { borderColor: C.border, backgroundColor: C.card },
  noteCardText: {
    flex: 1, fontSize: ms(12), color: C.text,
    fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(12),
    lineHeight: ms(12) * 1.4,
  },
  noteCardPlaceholder: {
    flex: 1, fontSize: ms(12), color: C.textMuted,
    fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12),
  },

  section: { paddingHorizontal: rs(16) },
  smallRow: { flexDirection: 'row', gap: rs(10), marginBottom: rs(10) },

  emptyState: { alignItems: 'center', paddingTop: rs(60), paddingHorizontal: rs(24) },
  emptyTitle: { fontSize: ms(17), fontFamily: C.bold, fontWeight: '700', color: C.text, marginBottom: rs(6), letterSpacing: ls(17) },
  emptySub:   { fontSize: ms(13), color: C.textMuted, fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13), textAlign: 'center' },

  pushbackOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  pushbackCard: {
    backgroundColor: C.card, borderRadius: rs(18),
    borderWidth: 1, borderColor: C.borderStrong,
    padding: rs(22), width: '100%',
  },
  pushbackIconWrap: {
    width: rs(48), height: rs(48), borderRadius: rs(14),
    backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: rs(14),
  },
  pushbackTitle: { fontSize: ms(18), fontFamily: C.bold, fontWeight: '700', color: C.text, marginBottom: rs(8), letterSpacing: ls(18) },
  pushbackBody:  { fontSize: ms(13), color: C.textSub, lineHeight: ms(20), fontFamily: C.reg, fontWeight: '400', marginBottom: rs(20), letterSpacing: ls(13) },

  pushbackPrimaryBtn: {
    paddingVertical: rs(13), borderRadius: rs(10),
    backgroundColor: C.primary, alignItems: 'center', marginBottom: rs(10),
  },
  pushbackPrimaryText: { fontSize: ms(14), fontFamily: C.bold, fontWeight: '700', color: '#fff', letterSpacing: ls(14) },
  pushbackSecondaryBtn: {
    paddingVertical: rs(11), alignItems: 'center',
  },
  pushbackSecondaryText: { fontSize: ms(13), fontFamily: C.med, fontWeight: '500', color: C.textMuted, letterSpacing: ls(13) },
}; }
