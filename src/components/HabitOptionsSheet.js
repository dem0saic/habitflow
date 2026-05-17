import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pencil, ChevronRight, AlarmClock, XCircle, Trash2, PauseCircle, PlayCircle } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { todayKey, formatDisplay } from '../utils/date';

function formatTime(hour, minute) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

export default function HabitOptionsSheet({
  visible, habit, onClose, onEdit, onDelete, onSetReminder, onSetPause,
}) {
  const C = useTheme();
  const styles = makeStyles(C);
  const [showPicker, setShowPicker] = useState(false);
  const [showPausePicker, setShowPausePicker] = useState(false);

  if (!habit) return null;

  const activePause = (habit.pauses || [])[0] || null;

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

  function handlePauseChange(event, selected) {
    if (Platform.OS === 'android') setShowPausePicker(false);
    if (event.type === 'dismissed') return;
    if (selected) {
      const end = selected.toISOString().slice(0, 10);
      const start = todayKey();
      if (end < start) return;
      onSetPause?.(habit.id, { start, end });
    }
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
          onPress={() => activePause ? handleResume() : setShowPausePicker(true)}
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
            <DateTimePicker
              value={(() => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                return d;
              })()}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={handlePauseChange}
              textColor={C.text}
              style={{ height: rs(120) }}
            />
            <TouchableOpacity style={styles.pickerDone} onPress={() => setShowPausePicker(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
        {showPausePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={(() => {
              const d = new Date();
              d.setDate(d.getDate() + 7);
              return d;
            })()}
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
  pickerDone: {
    alignItems: 'flex-end', paddingHorizontal: rs(16), paddingVertical: rs(10),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  pickerDoneText: { fontSize: ms(14), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: ls(14) },
  cancelBtn:      { alignItems: 'center', paddingVertical: rs(14), marginTop: rs(4) },
  cancelBtnText:  { fontSize: ms(14), color: C.textMuted, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(14) },
}; }
