import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Modal, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import AnimatedEmoji from './AnimatedEmoji';

function fmtTime({ hour, minute }) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

export default function HabitCard({ habit, count, onToggle, onIncrement, onDecrement, onLongPress, onSetReminder }) {
  const C = useTheme();
  const styles = makeStyles(C);
  const scale      = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(count >= (habit.targetCount || 1) ? 1 : 0)).current;

  const isDone = count >= (habit.targetCount || 1);
  const isNegative = habit.type === 'negative';
  const [showBellPicker, setShowBellPicker] = useState(false);
  const [bellDate, setBellDate]             = useState(new Date(2000, 0, 1, 9, 0));

  const accentColor = isDone ? C.success : isNegative ? C.warning : C.primary;

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: isDone ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }, [isDone]);

  function pressScale() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
  }

  function handlePress() { pressScale(); onToggle?.(); }

  function handleBellPress() {
    if (habit.reminderTime) {
      onSetReminder?.(habit.id, null);
    } else {
      setBellDate(new Date(2000, 0, 1, 9, 0));
      setShowBellPicker(true);
    }
  }

  function handleBellTimeChange(event, selected) {
    if (Platform.OS === 'android') {
      setShowBellPicker(false);
      if (event.type !== 'dismissed' && selected) {
        onSetReminder?.(habit.id, { hour: selected.getHours(), minute: selected.getMinutes() });
      }
    } else if (selected) {
      setBellDate(selected);
    }
  }

  function handleBellDone() {
    onSetReminder?.(habit.id, { hour: bellDate.getHours(), minute: bellDate.getMinutes() });
    setShowBellPicker(false);
  }

  function BellPicker() {
    return (
      <>
        {showBellPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={bellDate}
            mode="time"
            display="clock"
            onChange={handleBellTimeChange}
          />
        )}
        <Modal
          visible={showBellPicker && Platform.OS === 'ios'}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBellPicker(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowBellPicker(false)}
          >
            <Pressable style={{
              backgroundColor: C.card, borderRadius: rs(20),
              padding: rs(20), width: '80%',
              borderWidth: 1, borderColor: C.border,
            }}>
              <Text style={{ fontSize: ms(15), fontWeight: '700', color: C.text, marginBottom: rs(2) }}>
                {habit.emoji}  Set reminder
              </Text>
              <Text style={{ fontSize: ms(11), color: C.textSub, marginBottom: rs(10) }}>
                Choose a daily notification time
              </Text>
              <DateTimePicker
                value={bellDate}
                mode="time"
                display="spinner"
                onChange={(e, d) => { if (d) setBellDate(d); }}
                textColor={C.text}
                style={{ height: rs(130), width: '100%' }}
              />
              <TouchableOpacity
                style={{ backgroundColor: C.primary, borderRadius: rs(12), padding: rs(14), alignItems: 'center', marginTop: rs(8) }}
                onPress={handleBellDone}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(14) }}>Set Reminder</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  // ── Volume / Timer card ────────────────────────────────────────────
  if (habit.type === 'volume' || habit.type === 'timer') {
    const pct  = Math.min(1, count / habit.targetCount);
    const unit = habit.type === 'timer' ? ' min' : '×';
    return (
      <>
        <Animated.View style={[styles.card, isDone && styles.cardDone, { transform: [{ scale }] }]}>
          <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />
          <View style={styles.cardContent}>
            <TouchableOpacity style={styles.row} onLongPress={onLongPress} activeOpacity={0.8}>
              <View style={[styles.emojiWrap, isDone && styles.emojiWrapDone]}>
                <AnimatedEmoji emoji={habit.emoji} size={rs(22)} />
              </View>

              <View style={styles.info}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(4) }}>
                  <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>{habit.name}</Text>
                  {habit.type === 'timer' && (
                    <View style={styles.typeBadge}>
                      <Ionicons name="timer-outline" size={rs(9)} color={C.textMuted} />
                      <Text style={styles.typeBadgeText}>timer</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={handleBellPress} style={styles.bellRow} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons
                    name={habit.reminderTime ? 'alarm' : 'alarm-outline'}
                    size={rs(11)}
                    color={habit.reminderTime ? C.primary : C.textMuted}
                  />
                  {habit.reminderTime
                    ? <Text style={styles.bellLabel}>{fmtTime(habit.reminderTime)}</Text>
                    : <Text style={[styles.bellLabel, { color: C.textMuted }]}>Set reminder</Text>
                  }
                </TouchableOpacity>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: isDone ? C.success : C.primary }]} />
                </View>
              </View>

              <View style={styles.counter}>
                <TouchableOpacity style={styles.counterBtn} onPress={onDecrement} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="remove" size={rs(18)} color={C.textSub} />
                </TouchableOpacity>
                <Text style={[styles.counterNum, isDone && { color: C.success }]}>
                  {count}<Text style={styles.counterTotal}>/{habit.targetCount}{unit}</Text>
                </Text>
                <TouchableOpacity style={[styles.counterBtn, styles.counterBtnPlus]} onPress={onIncrement} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="add" size={rs(18)} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <BellPicker />
      </>
    );
  }

  // ── Daily / Negative card ──────────────────────────────────────────
  return (
    <>
      <Animated.View style={[
        styles.card,
        isDone && styles.cardDone,
        isNegative && !isDone && styles.cardNegative,
        { transform: [{ scale }] },
      ]}>
        <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.row}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              onPress={handlePress}
              onLongPress={onLongPress}
              activeOpacity={0.85}
            >
              <View style={[styles.emojiWrap, isDone && styles.emojiWrapDone]}>
                <AnimatedEmoji emoji={habit.emoji} size={rs(22)} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                  <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>{habit.name}</Text>
                  {isNegative && (
                    <View style={[styles.typeBadge, isDone && { backgroundColor: 'rgba(107,153,112,0.15)' }]}>
                      <Ionicons name="ban-outline" size={rs(9)} color={isDone ? C.success : C.warning} />
                      <Text style={[styles.typeBadgeText, { color: isDone ? C.success : C.warning }]}>
                        {isDone ? 'Avoided' : 'Avoid'}
                      </Text>
                    </View>
                  )}
                </View>
                {habit.reminderTime && (
                  <Text style={styles.reminderTimeText}>{fmtTime(habit.reminderTime)}</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBellPress}
              style={styles.bellIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={habit.reminderTime ? 'alarm' : 'alarm-outline'}
                size={rs(17)}
                color={habit.reminderTime ? C.primary : C.textMuted}
              />
            </TouchableOpacity>

            <View style={styles.checkContainer}>
              <Animated.View style={[styles.check, isDone && styles.checkDone, { transform: [{ scale: checkScale }] }]}>
                <Ionicons name={isNegative && isDone ? 'shield-checkmark' : 'checkmark'} size={rs(16)} color="#fff" />
              </Animated.View>
              {!isDone && <View style={[styles.checkEmpty, isNegative && styles.checkEmptyNegative]} />}
            </View>
          </View>
        </View>
      </Animated.View>
      <BellPicker />
    </>
  );
}

function makeStyles(C) { return {
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: rs(18),
    marginBottom: rs(10),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: rs(8),
    shadowOffset: { width: 0, height: rs(2) },
    elevation: 2,
  },
  cardDone:     { backgroundColor: '#082218', borderColor: C.success, borderWidth: 1.5 },
  cardNegative: { borderColor: C.warning, borderWidth: 1.5 },

  accentStrip: { width: rs(4) },
  cardContent: { flex: 1, padding: rs(14) },

  row: { flexDirection: 'row', alignItems: 'center' },
  emojiWrap: {
    width: rs(44), height: rs(44), borderRadius: rs(14),
    backgroundColor: C.cardHigh,
    alignItems: 'center', justifyContent: 'center',
    marginRight: rs(12),
  },
  emojiWrapDone: { backgroundColor: 'rgba(107,153,112,0.15)' },

  info:     { flex: 1, marginRight: rs(8) },
  name:     { fontSize: ms(14), color: C.text, fontFamily: C.semi, fontWeight: '600', flexShrink: 1, letterSpacing: ls(14) },
  nameDone: { color: C.success, textDecorationLine: 'line-through' },

  bellIconBtn: {
    width: rs(32), height: rs(32),
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: rs(2),
  },
  bellRow: { flexDirection: 'row', alignItems: 'center', gap: rs(3), marginBottom: rs(6) },
  bellLabel: { fontSize: ms(9), color: C.primary, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(9) },
  reminderTimeText: { fontSize: ms(9), color: C.textMuted, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(9) },

  checkContainer: { width: rs(32), height: rs(32) },
  check: {
    position: 'absolute', top: 0, left: 0,
    width: rs(32), height: rs(32), borderRadius: rs(16),
    backgroundColor: C.success,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: {
    shadowColor: C.success,
    shadowOpacity: 0.55,
    shadowRadius: rs(8),
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  checkEmpty: {
    position: 'absolute', top: 0, left: 0,
    width: rs(32), height: rs(32), borderRadius: rs(16),
    borderWidth: 2, borderColor: C.border,
  },
  checkEmptyNegative: { borderColor: C.warning },

  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.cardHigh, borderRadius: rs(20),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  typeBadgeText: { fontSize: ms(9), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', letterSpacing: ls(9) },

  progressTrack: { height: rs(5), backgroundColor: C.border, borderRadius: rs(3), overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: rs(3) },

  counter: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  counterBtn: {
    width: rs(32), height: rs(32), borderRadius: rs(16),
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardHigh,
  },
  counterBtnPlus: {
    backgroundColor: C.primary, borderColor: C.primary,
    shadowColor: C.primary, shadowOpacity: 0.45,
    shadowRadius: rs(6), shadowOffset: { width: 0, height: rs(2) },
    elevation: 3,
  },
  counterNum:   { fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', color: C.text, minWidth: rs(40), textAlign: 'center', letterSpacing: ls(15) },
  counterTotal: { fontSize: ms(11), fontFamily: C.reg, fontWeight: '400', color: C.textMuted, letterSpacing: ls(11) },
}; }
