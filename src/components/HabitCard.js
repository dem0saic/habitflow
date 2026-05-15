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
  const [showBellPicker, setShowBellPicker] = useState(false);
  const [bellDate, setBellDate]             = useState(new Date(2000, 0, 1, 9, 0));

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

  // Bell time-picker — Android shows native dialog inline; iOS uses a centred modal
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
          <TouchableOpacity style={styles.row} onLongPress={onLongPress} activeOpacity={0.8}>
            {/* Emoji */}
            <AnimatedEmoji emoji={habit.emoji} size={rs(24)} style={{ marginRight: rs(12) }} />

            {/* Name + bell + progress */}
            <View style={styles.info}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(3) }}>
                <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>{habit.name}</Text>
                {habit.type === 'timer' && (
                  <View style={styles.typeBadge}>
                    <Ionicons name="timer-outline" size={rs(9)} color={C.textMuted} />
                    <Text style={styles.typeBadgeText}>timer</Text>
                  </View>
                )}
              </View>

              {/* Bell row — inside the long-press-only area, safe from toggle conflict */}
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

            {/* Counter */}
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
        </Animated.View>
        <BellPicker />
      </>
    );
  }

  // ── Daily / Negative card ──────────────────────────────────────────
  const isNegative = habit.type === 'negative';

  return (
    <>
      <Animated.View style={[
        styles.card,
        isDone && styles.cardDone,
        isNegative && !isDone && styles.cardNegative,
        { transform: [{ scale }] },
      ]}>
        <View style={styles.row}>
          {/* Toggle area: emoji + name — this is the only tap target for toggling */}
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            onPress={handlePress}
            onLongPress={onLongPress}
            activeOpacity={0.85}
          >
            <AnimatedEmoji emoji={habit.emoji} size={rs(24)} style={{ marginRight: rs(12) }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>{habit.name}</Text>
                {isNegative && (
                  <View style={[styles.typeBadge, isDone && { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
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

          {/* Bell button — separate from the toggle touchable, no conflict */}
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

          {/* Check circle — stacked inside a fixed-size container */}
          <View style={styles.checkContainer}>
            <Animated.View style={[styles.check, { transform: [{ scale: checkScale }] }]}>
              <Ionicons name={isNegative && isDone ? 'shield-checkmark' : 'checkmark'} size={rs(16)} color="#fff" />
            </Animated.View>
            {!isDone && <View style={[styles.checkEmpty, isNegative && styles.checkEmptyNegative]} />}
          </View>
        </View>
      </Animated.View>
      <BellPicker />
    </>
  );
}

function makeStyles(C) { return {
  card: {
    backgroundColor: C.card,
    borderRadius: rs(18),
    padding: rs(14),
    marginBottom: rs(10),
    borderWidth: 1,
    borderColor: C.border,
  },
  cardDone:     { backgroundColor: '#0B2A1E', borderWidth: 1.5, borderColor: C.success },
  cardNegative: { borderColor: C.warning, borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  info:  { flex: 1, marginRight: rs(8) },
  name:     { fontSize: ms(14), color: C.text, fontFamily: C.med, fontWeight: '500', flexShrink: 1, letterSpacing: ls(14) },
  nameDone: { color: C.success, textDecorationLine: 'line-through' },

  bellIconBtn: {
    width: rs(32), height: rs(32),
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: rs(2),
  },
  bellRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    marginBottom: rs(4),
  },
  bellLabel: { fontSize: ms(9), color: C.primary, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(9) },
  reminderTimeText: { fontSize: ms(9), color: C.textMuted, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(9) },

  checkContainer: { width: rs(28), height: rs(28) },
  check: {
    position: 'absolute', top: 0, left: 0,
    width: rs(28), height: rs(28), borderRadius: rs(14),
    backgroundColor: C.success,
    alignItems: 'center', justifyContent: 'center',
  },
  checkEmpty: {
    position: 'absolute', top: 0, left: 0,
    width: rs(28), height: rs(28), borderRadius: rs(14),
    borderWidth: 2, borderColor: C.border,
  },
  checkEmptyNegative: { borderColor: C.warning },

  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.cardHigh, borderRadius: rs(20),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  typeBadgeText: { fontSize: ms(9), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', letterSpacing: ls(9) },

  progressTrack: {
    height: rs(4), backgroundColor: C.border,
    borderRadius: rs(2), overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: rs(2) },

  counter: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  counterBtn: {
    width: rs(30), height: rs(30), borderRadius: rs(15),
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardHigh,
  },
  counterBtnPlus: { backgroundColor: C.primary, borderColor: C.primary },
  counterNum:   { fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', color: C.text, minWidth: rs(36), textAlign: 'center', letterSpacing: ls(15) },
  counterTotal: { fontSize: ms(11), fontFamily: C.reg, fontWeight: '400', color: C.textMuted, letterSpacing: ls(11) },
}; }
