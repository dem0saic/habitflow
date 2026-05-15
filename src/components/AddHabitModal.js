import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, Switch,
  Pressable, ScrollView, KeyboardAvoidingView, Platform,
  Animated, Easing,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { EMOJIS } from '../theme';
import { rs, ms } from '../utils/responsive';

// Animation presets per emoji — everything not listed gets 'float'
const ANIM_TYPE = {
  // bounce — physical movement
  '🏃': 'bounce', '🚴': 'bounce', '🏋️': 'bounce', '🤸': 'bounce', '🏊': 'bounce',
  '🚶': 'bounce', '⛹️': 'bounce', '🧗': 'bounce', '🤺': 'bounce', '🏌️': 'bounce',
  '🎾': 'bounce', '⚽': 'bounce', '🏀': 'bounce', '🥊': 'bounce', '🦋': 'bounce',
  // spin — circular / orbital
  '🌙': 'spin', '☀️': 'spin', '⭐': 'spin', '🌑': 'spin', '🌈': 'spin',
  '🌊': 'spin', '🌸': 'spin', '🌺': 'spin', '🌻': 'spin', '🌤️': 'spin',
  // pulse — energy / intensity
  '🔥': 'pulse', '💪': 'pulse', '❤️': 'pulse', '⚡': 'pulse', '✨': 'pulse',
  '💡': 'pulse', '🫀': 'pulse', '🏆': 'pulse', '🏅': 'pulse', '🎊': 'pulse',
  '🎯': 'pulse', '🥇': 'pulse', '🎖️': 'pulse',
  // shake — sound / music / alert
  '🎸': 'shake', '🎹': 'shake', '🎵': 'shake', '🎻': 'shake', '🥁': 'shake',
  '🎤': 'shake', '🎨': 'shake', '🎭': 'shake', '🎬': 'shake', '📸': 'shake',
};

function AnimatedEmoji({ emoji, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  const type = ANIM_TYPE[emoji] || 'float';

  useEffect(() => {
    const stagger = (index * 60) % 500;
    let loopRef = null;

    const timer = setTimeout(() => {
      if (type === 'bounce') {
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 370, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 370, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.delay(700),
        ]));
      } else if (type === 'spin') {
        loopRef = Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true })
        );
      } else if (type === 'pulse') {
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(350),
        ]));
      } else if (type === 'shake') {
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue:  1,  duration: 85, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -1,  duration: 85, useNativeDriver: true }),
          Animated.timing(anim, { toValue:  1,  duration: 85, useNativeDriver: true }),
          Animated.timing(anim, { toValue:  0,  duration: 85, useNativeDriver: true }),
          Animated.delay(1000),
        ]));
      } else {
        // float — gentle bob for everything else
        const dur = 1400 + (index % 6) * 160;
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]));
      }
      loopRef.start();
    }, stagger);

    return () => { clearTimeout(timer); if (loopRef) loopRef.stop(); };
  }, []);

  let transform;
  if (type === 'bounce') {
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
    transform = [{ translateY }];
  } else if (type === 'spin') {
    const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    transform = [{ rotate }];
  } else if (type === 'pulse') {
    const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] });
    transform = [{ scale }];
  } else if (type === 'shake') {
    const rotate = anim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-18deg', '0deg', '18deg'] });
    transform = [{ rotate }];
  } else {
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
    transform = [{ translateY }];
  }

  return <Animated.Text style={{ fontSize: ms(22), transform }}>{emoji}</Animated.Text>;
}

function formatTime(date) {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = date.getHours() < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

const DEFAULT_REMINDER = new Date(2000, 0, 1, 9, 0);

/**
 * Dual-purpose modal: add a new habit (no `editingHabit`) or edit an
 * existing one (`editingHabit` prop provided). When editing, `onAdd`
 * receives the full updated habit object including the original `id`.
 */
export default function AddHabitModal({ visible, onClose, onAdd, editingHabit }) {
  const C = useTheme();
  const styles = makeStyles(C);
  const isEditing = !!editingHabit;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✅');
  const [type, setType] = useState('daily');
  const [targetCount, setTargetCount] = useState(3);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState(DEFAULT_REMINDER);
  const [showPicker, setShowPicker] = useState(false);
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);

  // Populate fields when modal opens
  useEffect(() => {
    if (!visible) return;
    if (editingHabit) {
      setName(editingHabit.name);
      setEmoji(editingHabit.emoji || '✅');
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
    setEmoji('✅');
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
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>{isEditing ? 'Edit Habit' : 'New Habit'}</Text>

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

            {/* Preview row — tap to expand/collapse the grid */}
            <TouchableOpacity
              style={[styles.emojiPreviewRow, showEmojiGrid && styles.emojiPreviewRowOpen]}
              onPress={() => setShowEmojiGrid(v => !v)}
              activeOpacity={0.75}
            >
              {/* Large emoji tile */}
              <View style={styles.emojiDisplayTile}>
                <Text style={{ fontSize: ms(30) }}>{emoji}</Text>
              </View>

              {/* Label */}
              <View style={{ flex: 1, marginLeft: rs(14) }}>
                <Text style={styles.emojiPreviewTitle}>Habit emoji</Text>
                <Text style={styles.emojiPreviewSub}>
                  {showEmojiGrid ? 'Close picker' : `Browse ${EMOJIS.length} emojis`}
                </Text>
              </View>

              {/* Action badge */}
              <View style={[styles.emojiActionBadge, showEmojiGrid && styles.emojiActionBadgeOpen]}>
                <Ionicons
                  name={showEmojiGrid ? 'close' : 'apps-outline'}
                  size={rs(16)}
                  color={showEmojiGrid ? C.primary : C.textSub}
                />
              </View>
            </TouchableOpacity>

            {/* Collapsible emoji grid — no nested ScrollView, outer form scroll handles it */}
            {showEmojiGrid && (
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
            )}

            {/* Type */}
            <Text style={styles.label}>Habit type</Text>
            <View style={styles.typeGrid}>
              {[
                { key: 'daily',    icon: 'checkmark-circle-outline', label: 'Daily',   sub: 'Check off once per day' },
                { key: 'volume',   icon: 'repeat-outline',           label: 'Volume',  sub: 'Count reps / sessions'  },
                { key: 'timer',    icon: 'timer-outline',            label: 'Timer',   sub: 'Track minutes per day'  },
                { key: 'negative', icon: 'ban-outline',              label: 'Avoid',   sub: 'Break a bad habit'      },
              ].map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
                  onPress={() => {
                    setType(t.key);
                    if (t.key === 'timer')  setTargetCount(20);
                    if (t.key === 'volume') setTargetCount(3);
                  }}
                >
                  <Ionicons
                    name={t.icon}
                    size={rs(20)}
                    color={type === t.key ? '#fff' : C.textSub}
                    style={{ marginBottom: rs(4) }}
                  />
                  <Text style={[styles.typeBtnText, type === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
                  <Text style={[styles.typeBtnSub, type === t.key && { color: 'rgba(255,255,255,0.6)' }]}>{t.sub}</Text>
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
                    <Ionicons name="remove" size={rs(18)} color={C.text} />
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
                    <Ionicons name="add" size={rs(18)} color={C.text} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── Daily Reminder ───────────────────────────────── */}
            <Text style={styles.label}>Daily Reminder</Text>

            <View style={styles.reminderToggleRow}>
              <Ionicons
                name={reminderEnabled ? 'alarm' : 'alarm-outline'}
                size={rs(20)}
                color={reminderEnabled ? C.primary : C.textMuted}
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
                <Ionicons name="time-outline" size={rs(16)} color={C.primary} />
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
    backgroundColor: C.border, alignSelf: 'center', marginBottom: rs(20),
  },
  scrollContent: { paddingBottom: rs(40) },
  title: { fontSize: ms(20), fontWeight: '700', color: C.text, marginBottom: rs(20) },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14),
    padding: rs(14), fontSize: ms(15), color: C.text,
    backgroundColor: C.cardHigh, marginBottom: rs(20),
  },
  label: {
    fontSize: ms(12), fontWeight: '700', color: C.textSub,
    marginBottom: rs(10), textTransform: 'uppercase', letterSpacing: 0.5,
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
  emojiPreviewTitle: { fontSize: ms(14), fontWeight: '700', color: C.text },
  emojiPreviewSub:   { fontSize: ms(11), color: C.textSub, marginTop: rs(3) },
  emojiActionBadge: {
    width: rs(36), height: rs(36), borderRadius: rs(11),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiActionBadgeOpen: { backgroundColor: C.primaryLight, borderColor: C.primary },
  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: rs(6),
    backgroundColor: C.cardHigh, borderRadius: rs(16),
    padding: rs(12), borderWidth: 1.5, borderColor: C.border,
    marginBottom: rs(20),
  },
  emojiGridBtn: {
    width: rs(42), height: rs(42), borderRadius: rs(10),
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  emojiGridBtnActive: { backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary },
  emojiGridText: { fontSize: ms(22) },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginBottom: rs(20) },
  typeBtn: {
    width: '47%', padding: rs(12), borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.cardHigh,
  },
  typeBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  typeBtnText: { fontSize: ms(13), fontWeight: '700', color: C.text },
  typeBtnTextActive: { color: '#fff' },
  typeBtnSub: { fontSize: ms(10), color: C.textMuted, marginTop: rs(2) },
  countRow: { marginBottom: rs(20) },
  countControls: { flexDirection: 'row', alignItems: 'center', gap: rs(16) },
  countBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardHigh,
  },
  countNum: { fontSize: ms(20), fontWeight: '700', color: C.primary, minWidth: rs(40), textAlign: 'center' },
  reminderToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    backgroundColor: C.cardHigh, borderRadius: rs(14),
    padding: rs(14), borderWidth: 1.5, borderColor: C.border,
    marginBottom: rs(10),
  },
  reminderToggleLabel: { flex: 1, fontSize: ms(14), color: C.textSub, fontWeight: '500' },
  changeTimeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    alignSelf: 'flex-start', marginBottom: rs(14),
    paddingVertical: rs(6), paddingHorizontal: rs(12),
    backgroundColor: C.primaryLight, borderRadius: rs(20),
  },
  changeTimeBtnText: { fontSize: ms(13), fontWeight: '600', color: C.primary },
  pickerCard: {
    backgroundColor: C.cardHigh, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border,
    marginBottom: rs(14), overflow: 'hidden',
  },
  pickerDoneBtn: {
    alignItems: 'flex-end', paddingHorizontal: rs(16), paddingVertical: rs(10),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  pickerDoneText: { fontSize: ms(14), fontWeight: '700', color: C.primary },
  addBtn: {
    backgroundColor: C.primary, borderRadius: rs(16),
    padding: rs(18), alignItems: 'center', marginTop: rs(8),
  },
  addBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
}; }
