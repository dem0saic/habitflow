import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, Switch,
  Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  XCircle, LayoutGrid, X, CheckCircle, Repeat2, Timer, Ban,
  AlarmClock, Clock, Minus, Plus,
} from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { EMOJIS } from '../theme';
import { rs, ms, ls } from '../utils/responsive';
import AnimatedEmoji from './AnimatedEmoji';

function formatTime(date) {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = date.getHours() < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

const DEFAULT_REMINDER = new Date(2000, 0, 1, 9, 0);

const TYPE_OPTIONS = [
  { key: 'daily',    Icon: CheckCircle, label: 'Daily',   sub: 'Check off once per day' },
  { key: 'volume',   Icon: Repeat2,     label: 'Volume',  sub: 'Count reps / sessions'  },
  { key: 'timer',    Icon: Timer,       label: 'Timer',   sub: 'Track minutes per day'  },
  { key: 'negative', Icon: Ban,         label: 'Avoid',   sub: 'Break a bad habit'      },
];

export default function AddHabitModal({ visible, onClose, onAdd, editingHabit }) {
  const C = useTheme();
  const styles = makeStyles(C);
  const isEditing = !!editingHabit;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🚀');
  const [type, setType] = useState('daily');
  const [targetCount, setTargetCount] = useState(3);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState(DEFAULT_REMINDER);
  const [showPicker, setShowPicker] = useState(false);
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editingHabit) {
      setName(editingHabit.name);
      setEmoji(editingHabit.emoji || '🚀');
      setType(editingHabit.type || 'daily');
      setTargetCount(editingHabit.targetCount || 1);
      if (editingHabit.reminderTime) {
        setReminderEnabled(true);
        setReminderDate(new Date(2000, 0, 1, editingHabit.reminderTime.hour, editingHabit.reminderTime.minute));
      } else {
        setReminderEnabled(false);
        setReminderDate(DEFAULT_REMINDER);
      }
    } else {
      reset();
    }
    setShowPicker(false);
    setShowEmojiGrid(false);
  }, [visible]);

  function reset() {
    setName('');
    setEmoji('🚀');
    setType('daily');
    setTargetCount(3);
    setReminderEnabled(false);
    setReminderDate(DEFAULT_REMINDER);
    setShowPicker(false);
    setShowEmojiGrid(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    if (!name.trim()) return;
    const reminderTime = reminderEnabled
      ? { hour: reminderDate.getHours(), minute: reminderDate.getMinutes() }
      : null;
    onAdd({
      ...(editingHabit || {}),
      name: name.trim(),
      emoji,
      type,
      targetCount,
      reminderTime,
    });
    reset();
    onClose();
  }

  function handleTimeChange(event, selected) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selected) setReminderDate(selected);
  }

  function toggleReminder(val) {
    setReminderEnabled(val);
    if (val) setShowPicker(true);
    else setShowPicker(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.overlay} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>{isEditing ? 'Edit Habit' : 'New Habit'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <XCircle size={rs(28)} color={C.textMuted} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >

            {/* Name */}
            <TextInput
              style={styles.input}
              placeholder="e.g. Walk 10,000 steps"
              placeholderTextColor={C.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus={!isEditing}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {/* Emoji */}
            <Text style={styles.label}>Pick an emoji</Text>

            <TouchableOpacity
              style={[styles.emojiPreviewRow, showEmojiGrid && styles.emojiPreviewRowOpen]}
              onPress={() => setShowEmojiGrid(v => !v)}
              activeOpacity={0.75}
            >
              <View style={styles.emojiDisplayTile}>
                <Text style={{ fontSize: ms(30) }}>{emoji}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: rs(14) }}>
                <Text style={styles.emojiPreviewTitle}>Habit emoji</Text>
                <Text style={styles.emojiPreviewSub}>
                  {showEmojiGrid ? 'Close picker' : `Browse ${EMOJIS.length} emojis`}
                </Text>
              </View>

              <View style={[styles.emojiActionBadge, showEmojiGrid && styles.emojiActionBadgeOpen]}>
                {showEmojiGrid
                  ? <X size={rs(16)} color={C.primary} strokeWidth={2.5} />
                  : <LayoutGrid size={rs(16)} color={C.textSub} strokeWidth={1.75} />
                }
              </View>
            </TouchableOpacity>

            {showEmojiGrid && (
              <ScrollView
                style={styles.emojiGridScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.emojiGrid}>
                  {EMOJIS.map((e, i) => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.emojiGridBtn, emoji === e && styles.emojiGridBtnActive]}
                      onPress={() => { setEmoji(e); setShowEmojiGrid(false); }}
                    >
                      <AnimatedEmoji emoji={e} index={i} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Type */}
            <Text style={styles.label}>Habit type</Text>
            <View style={styles.typeGrid}>
              {TYPE_OPTIONS.map(({ key, Icon, label, sub }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.typeBtn, type === key && styles.typeBtnActive]}
                  onPress={() => {
                    setType(key);
                    if (key === 'timer')  setTargetCount(20);
                    if (key === 'volume') setTargetCount(3);
                  }}
                >
                  <Icon
                    size={rs(20)}
                    color={type === key ? '#fff' : C.textSub}
                    strokeWidth={type === key ? 2.5 : 1.75}
                    style={{ marginBottom: rs(4) }}
                  />
                  <Text style={[styles.typeBtnText, type === key && styles.typeBtnTextActive]}>{label}</Text>
                  <Text style={[styles.typeBtnSub, type === key && { color: 'rgba(255,255,255,0.6)' }]}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Target for volume / timer */}
            {(type === 'volume' || type === 'timer') && (
              <View style={styles.countRow}>
                <Text style={styles.label}>
                  {type === 'timer' ? 'Daily target (minutes)' : 'Daily target'}
                </Text>
                <View style={styles.countControls}>
                  <TouchableOpacity
                    style={styles.countBtn}
                    onPress={() => setTargetCount(
                      type === 'timer' ? Math.max(5, targetCount - 5) : Math.max(2, targetCount - 1)
                    )}
                  >
                    <Minus size={rs(18)} color={C.text} strokeWidth={2} />
                  </TouchableOpacity>
                  <Text style={styles.countNum}>
                    {type === 'timer' ? `${targetCount} min` : `${targetCount}×`}
                  </Text>
                  <TouchableOpacity
                    style={styles.countBtn}
                    onPress={() => setTargetCount(
                      type === 'timer' ? Math.min(180, targetCount + 5) : Math.min(99, targetCount + 1)
                    )}
                  >
                    <Plus size={rs(18)} color={C.text} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── Daily Reminder ───────────────────────────────── */}
            <Text style={styles.label}>Daily Reminder</Text>

            <View style={styles.reminderToggleRow}>
              <AlarmClock
                size={rs(20)}
                color={reminderEnabled ? C.primary : C.textMuted}
                strokeWidth={reminderEnabled ? 2.5 : 1.75}
              />
              <Text style={[styles.reminderToggleLabel, reminderEnabled && { color: C.text }]}>
                {reminderEnabled ? `Remind me at ${formatTime(reminderDate)}` : 'No reminder'}
              </Text>
              <Switch
                value={reminderEnabled}
                onValueChange={toggleReminder}
                trackColor={{ false: C.border, true: C.primaryLight }}
                thumbColor={reminderEnabled ? C.primary : C.textMuted}
                ios_backgroundColor={C.border}
              />
            </View>

            {reminderEnabled && !showPicker && (
              <TouchableOpacity style={styles.changeTimeBtn} onPress={() => setShowPicker(true)}>
                <Clock size={rs(16)} color={C.primary} strokeWidth={2} />
                <Text style={styles.changeTimeBtnText}>Change time</Text>
              </TouchableOpacity>
            )}

            {reminderEnabled && showPicker && Platform.OS === 'ios' && (
              <View style={styles.pickerCard}>
                <DateTimePicker
                  value={reminderDate}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor={C.text}
                  style={{ height: rs(130), width: '100%' }}
                />
                <TouchableOpacity style={styles.pickerDoneBtn} onPress={() => setShowPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {reminderEnabled && showPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={reminderDate}
                mode="time"
                display="clock"
                onChange={handleTimeChange}
              />
            )}

            <TouchableOpacity style={styles.addBtn} onPress={handleSubmit}>
              <Text style={styles.addBtnText}>{isEditing ? 'Save Changes' : 'Add Habit'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(C) { return {
  kav: { flex: 1, justifyContent: 'flex-end' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: rs(28),
    borderTopRightRadius: rs(28),
    paddingHorizontal: rs(24),
    paddingTop: rs(12),
    paddingBottom: rs(8),
    maxHeight: '92%',
  },
  handle: {
    width: rs(40), height: rs(4), borderRadius: rs(2),
    backgroundColor: C.border, alignSelf: 'center', marginBottom: rs(16),
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: rs(20),
  },
  closeBtn: {
    width: rs(36), height: rs(36), alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingBottom: rs(40) },
  title: { fontSize: ms(20), fontFamily: C.bold, fontWeight: '700', color: C.text, letterSpacing: ls(20) },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14),
    padding: rs(14), fontSize: ms(15), color: C.text,
    backgroundColor: C.cardHigh, marginBottom: rs(20),
    fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(15),
  },
  label: {
    fontSize: ms(12), fontFamily: C.bold, fontWeight: '700', color: C.textSub,
    marginBottom: rs(10), textTransform: 'uppercase', letterSpacing: ls(12),
  },
  emojiPreviewRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.cardHigh, borderRadius: rs(18),
    padding: rs(14), borderWidth: 1.5, borderColor: C.border,
    marginBottom: rs(10),
  },
  emojiPreviewRowOpen: { borderColor: C.primary },
  emojiDisplayTile: {
    width: rs(58), height: rs(58), borderRadius: rs(18),
    backgroundColor: C.primaryLight,
    borderWidth: 1.5, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiPreviewTitle: { fontSize: ms(14), fontFamily: C.bold, fontWeight: '700', color: C.text, letterSpacing: ls(14) },
  emojiPreviewSub:   { fontSize: ms(11), color: C.textSub, marginTop: rs(3), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  emojiActionBadge: {
    width: rs(36), height: rs(36), borderRadius: rs(11),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiActionBadgeOpen: { backgroundColor: C.primaryLight, borderColor: C.primary },
  emojiGridScroll: {
    backgroundColor: C.cardHigh, borderRadius: rs(16),
    borderWidth: 1.5, borderColor: C.border,
    marginBottom: rs(20),
    maxHeight: rs(258),
  },
  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: rs(10), paddingTop: rs(10), paddingBottom: rs(4),
  },
  emojiGridBtn: {
    width: rs(42), height: rs(42), borderRadius: rs(10),
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
    margin: rs(3),
  },
  emojiGridBtnActive: { backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginBottom: rs(20) },
  typeBtn: {
    width: '47%', padding: rs(12), borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.cardHigh,
  },
  typeBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  typeBtnText: { fontSize: ms(13), fontFamily: C.bold, fontWeight: '700', color: C.text, letterSpacing: ls(13) },
  typeBtnTextActive: { color: '#fff' },
  typeBtnSub: { fontSize: ms(10), color: C.textMuted, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(10) },
  countRow: { marginBottom: rs(20) },
  countControls: { flexDirection: 'row', alignItems: 'center', gap: rs(16) },
  countBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardHigh,
  },
  countNum: { fontSize: ms(20), fontFamily: C.bold, fontWeight: '700', color: C.primary, minWidth: rs(40), textAlign: 'center', letterSpacing: ls(20) },
  reminderToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    backgroundColor: C.cardHigh, borderRadius: rs(14),
    padding: rs(14), borderWidth: 1.5, borderColor: C.border,
    marginBottom: rs(10),
  },
  reminderToggleLabel: { flex: 1, fontSize: ms(14), color: C.textSub, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(14) },
  changeTimeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    alignSelf: 'flex-start', marginBottom: rs(14),
    paddingVertical: rs(6), paddingHorizontal: rs(12),
    backgroundColor: C.primaryLight, borderRadius: rs(20),
  },
  changeTimeBtnText: { fontSize: ms(13), fontFamily: C.semi, fontWeight: '600', color: C.primary, letterSpacing: ls(13) },
  pickerCard: {
    backgroundColor: C.cardHigh, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border,
    marginBottom: rs(14), overflow: 'hidden',
  },
  pickerDoneBtn: {
    alignItems: 'flex-end', paddingHorizontal: rs(16), paddingVertical: rs(10),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  pickerDoneText: { fontSize: ms(14), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: ls(14) },
  addBtn: {
    backgroundColor: C.primary, borderRadius: rs(16),
    padding: rs(18), alignItems: 'center', marginTop: rs(8),
  },
  addBtnText: { color: '#fff', fontSize: ms(16), fontFamily: C.bold, fontWeight: '700', letterSpacing: ls(16) },
}; }
