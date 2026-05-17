import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pencil, ChevronRight, AlarmClock, XCircle, Trash2, PauseCircle, PlayCircle, Shield } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { useStore } from '../store';
import { rs, ms, ls } from '../utils/responsive';
import { todayKey, formatDisplay } from '../utils/date';
import { shieldUsage } from '../utils/streak';

function formatTime(hour, minute) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

function defaultPauseDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

export default function HabitOptionsSheet({
  visible, habit, onClose, onEdit, onDelete, onSetReminder, onSetPause,
}) {
  const C = useTheme();
  const { state } = useStore();
  const styles = makeStyles(C);
  const [showPicker, setShowPicker] = useState(false);
  const [showPausePicker, setShowPausePicker] = useState(false);
  const [pauseDraft, setPauseDraft] = useState(defaultPauseDate);

  if (!habit) return null;

  const activePause = (habit.pauses || [])[0] || null;
  const shields = shieldUsage(habit, state.completions, state.globalPause);
  const shieldTone = shields.remaining === 0 ? C.danger : shields.used > 0 ? C.warning : C.success;
  const shieldBg   = shields.remaining === 0 ? C.dangerSoft : shields.used > 0 ? C.warningSoft : C.successSoft;

  const hasReminder = habit.reminderTime != null;
  const reminderDate = hasReminder
    ? new Date(2000, 0, 1, habit.reminderTime.hour, habit.reminderTime.minute)
    : new Date(2000, 0, 1, 9, 0);

  function handleTimeChange(event, selected) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selected) {
      onSetReminder(habit.id, { hour: selected.getHours(), minute: selected.getMinutes() });
    }
  }

  function handleClose() {
    setShowPicker(false);
    setShowPausePicker(false);
    onClose();
  }

  function openPausePicker() {
    setPauseDraft(defaultPauseDate());
    setShowPausePicker(true);
  }

  function handlePauseChange(event, selected) {
    // Android calendar dismisses on its own and only fires when the user picks
    if (Platform.OS === 'android') {
      setShowPausePicker(false);
      if (event.type === 'dismissed' || !selected) return;
      const end = selected.toISOString().slice(0, 10);
      if (end < todayKey()) return;
      onSetPause?.(habit.id, { start: todayKey(), end });
      return;
    }
    // iOS spinner: just update the draft; don't dispatch on every scroll
    if (selected) setPauseDraft(selected);
  }

  function confirmPause() {
    setShowPausePicker(false);
    if (!pauseDraft) return;
    const end = pauseDraft.toISOString().slice(0, 10);
    if (end < todayKey()) return;
    onSetPause?.(habit.id, { start: todayKey(), end });
  }

  function handleResume() {
    onSetPause?.(habit.id, null);
  }

  const typeLabel =
    habit.type === 'volume'   ? `Volume · ${habit.targetCount}× daily`
  : habit.type === 'timer'    ? `Timer · ${habit.targetCount} min daily`
  : habit.type === 'negative' ? 'Avoidance habit'
  : 'Daily habit';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Habit identity */}
        <View style={styles.habitRow}>
          <Text style={styles.habitEmoji}>{habit.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
            <Text style={styles.habitType}>{typeLabel}</Text>
          </View>
        </View>

        {/* Streak shields status — discoverability for an otherwise silent feature */}
        <View style={[styles.shieldRow, { backgroundColor: shieldBg }]}>
          <Shield size={rs(13)} color={shieldTone} strokeWidth={2.5} />
          <Text style={[styles.shieldText, { color: shieldTone }]}>
            {shields.remaining === 0
              ? `All ${shields.total} shields used this month`
              : shields.used === 0
                ? `${shields.total} streak shields ready this month`
                : `${shields.remaining} of ${shields.total} shields left this month`}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Edit habit */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => { onEdit(habit); handleClose(); }}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: C.primarySoft }]}>
            <Pencil size={rs(15)} color={C.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Edit habit</Text>
            <Text style={styles.actionSub}>Change name, emoji, type or reminder</Text>
          </View>
          <ChevronRight size={rs(16)} color={C.textMuted} strokeWidth={1.75} />
        </TouchableOpacity>

        {/* Reminder */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: hasReminder ? C.successSoft : C.cardHigh }]}>
            <AlarmClock
              size={rs(15)}
              color={hasReminder ? C.success : C.textSub}
              strokeWidth={hasReminder ? 2.5 : 1.75}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>
              {hasReminder ? 'Change reminder' : 'Set reminder'}
            </Text>
            <Text style={styles.actionSub}>
              {hasReminder
                ? `Currently ${formatTime(habit.reminderTime.hour, habit.reminderTime.minute)}`
                : 'Add a daily push notification'}
            </Text>
          </View>
          {hasReminder ? (
            <TouchableOpacity
              onPress={() => onSetReminder(habit.id, null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <XCircle size={rs(18)} color={C.textMuted} strokeWidth={1.75} />
            </TouchableOpacity>
          ) : (
            <ChevronRight size={rs(16)} color={C.textMuted} strokeWidth={1.75} />
          )}
        </TouchableOpacity>

        {/* iOS inline picker */}
        {showPicker && Platform.OS === 'ios' && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={reminderDate}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              textColor={C.text}
              style={{ height: rs(120) }}
            />
            <TouchableOpacity style={styles.pickerDone} onPress={() => setShowPicker(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
        {showPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={reminderDate}
            mode="time"
            display="clock"
            onChange={handleTimeChange}
          />
        )}

        {/* Pause / Resume */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => activePause ? handleResume() : openPausePicker()}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: activePause ? C.warningSoft : C.cardHigh }]}>
            {activePause
              ? <PlayCircle size={rs(15)} color={C.warning} strokeWidth={2.5} />
              : <PauseCircle size={rs(15)} color={C.textSub} strokeWidth={1.75} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>
              {activePause ? 'Resume habit' : 'Pause habit'}
            </Text>
            <Text style={styles.actionSub}>
              {activePause
                ? `Paused through ${formatDisplay(activePause.end)}`
                : 'Skip without breaking your streak'}
            </Text>
          </View>
          <ChevronRight size={rs(16)} color={C.textMuted} strokeWidth={1.75} />
        </TouchableOpacity>

        {showPausePicker && Platform.OS === 'ios' && (
          <View style={styles.pickerWrap}>
            <Text style={styles.pickerHeading}>
              Resume on {formatDisplay(pauseDraft.toISOString().slice(0, 10))}
            </Text>
            <DateTimePicker
              value={pauseDraft}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={handlePauseChange}
              textColor={C.text}
              style={{ height: rs(120) }}
            />
            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={styles.pickerCancel}
                onPress={() => setShowPausePicker(false)}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerConfirm}
                onPress={confirmPause}
              >
                <Text style={styles.pickerConfirmText}>Confirm pause</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {showPausePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={pauseDraft}
            mode="date"
            display="calendar"
            minimumDate={new Date()}
            onChange={handlePauseChange}
          />
        )}

        <View style={styles.divider} />

        {/* Delete */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => { onDelete(habit.id); handleClose(); }}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: C.dangerSoft }]}>
            <Trash2 size={rs(15)} color={C.danger} strokeWidth={2} />
          </View>
          <Text style={[styles.actionTitle, { color: C.danger }]}>Delete habit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function makeStyles(C) { return {
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.card,
    borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20),
    borderTopWidth: 1, borderColor: C.borderStrong,
    paddingHorizontal: rs(20), paddingTop: rs(10), paddingBottom: rs(36),
  },
  handle: {
    width: rs(36), height: rs(4), borderRadius: rs(2),
    backgroundColor: C.borderStrong, alignSelf: 'center', marginBottom: rs(20),
  },
  habitRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: rs(12), marginBottom: rs(12),
  },
  habitEmoji: { fontSize: ms(28) },
  habitName:  { fontSize: ms(16), fontFamily: C.bold, fontWeight: '700', color: C.text, letterSpacing: ls(16) },
  habitType:  { fontSize: ms(11), color: C.textMuted, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  shieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    paddingHorizontal: rs(12), paddingVertical: rs(9),
    borderRadius: rs(10), marginTop: rs(8), marginBottom: rs(4),
  },
  shieldText: { fontSize: ms(11), fontFamily: C.semi, fontWeight: '600', letterSpacing: ls(11), flex: 1 },
  divider:    { height: 1, backgroundColor: C.border, marginVertical: rs(8) },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    paddingVertical: rs(12), paddingHorizontal: rs(4),
  },
  actionIcon: {
    width: rs(34), height: rs(34), borderRadius: rs(10),
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14) },
  actionSub:   { fontSize: ms(11), color: C.textMuted, marginTop: rs(1), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  pickerWrap: {
    backgroundColor: C.cardHigh, borderRadius: rs(12),
    marginVertical: rs(8), overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  pickerHeading: {
    fontSize: ms(12), fontFamily: C.bold, fontWeight: '700', color: C.primary,
    textAlign: 'center', paddingTop: rs(10), paddingBottom: rs(4),
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  pickerDone: {
    alignItems: 'flex-end', paddingHorizontal: rs(16), paddingVertical: rs(10),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  pickerDoneText: { fontSize: ms(14), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: ls(14) },
  pickerActions: {
    flexDirection: 'row', gap: rs(8),
    paddingHorizontal: rs(10), paddingVertical: rs(10),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  pickerCancel: {
    flex: 1, paddingVertical: rs(10), borderRadius: rs(8),
    borderWidth: 1, borderColor: C.borderStrong, alignItems: 'center',
  },
  pickerCancelText: { fontSize: ms(13), fontFamily: C.semi, fontWeight: '600', color: C.textSub, letterSpacing: ls(13) },
  pickerConfirm: {
    flex: 2, paddingVertical: rs(10), borderRadius: rs(8),
    backgroundColor: C.primary, alignItems: 'center',
  },
  pickerConfirmText: { fontSize: ms(13), fontFamily: C.bold, fontWeight: '700', color: '#fff', letterSpacing: ls(13) },
  cancelBtn:      { alignItems: 'center', paddingVertical: rs(14), marginTop: rs(4) },
  cancelBtnText:  { fontSize: ms(14), color: C.textMuted, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(14) },
}; }
