import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Modal, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AlarmClock, Timer, Ban, ShieldCheck, Check, Minus, Plus } from 'lucide-react-native';
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
  const target     = habit.targetCount || 1;
  const isDone     = count >= target;
  const isNegative = habit.type === 'negative';
  const checkScale = useRef(new Animated.Value(isDone ? 1 : 0)).current;

  const [showBellPicker, setShowBellPicker] = useState(false);
  const [bellDate, setBellDate] = useState(new Date(2000, 0, 1, 9, 0));

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
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
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
          <DateTimePicker value={bellDate} mode="time" display="clock" onChange={handleBellTimeChange} />
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
              backgroundColor: C.card, borderRadius: rs(18),
              padding: rs(20), width: '82%',
              borderWidth: 1, borderColor: C.borderStrong,
            }}>
              <Text style={{ fontSize: ms(15), fontWeight: '700', color: C.text, marginBottom: rs(2), fontFamily: C.bold }}>
                {habit.emoji}  Set reminder
              </Text>
              <Text style={{ fontSize: ms(11), color: C.textMuted, marginBottom: rs(10), fontFamily: C.reg }}>
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
                style={{ backgroundColor: C.primary, borderRadius: rs(12), paddingVertical: rs(13), alignItems: 'center', marginTop: rs(8) }}
                onPress={handleBellDone}
                activeOpacity={0.88}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(14), fontFamily: C.bold }}>Set reminder</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  // ── Volume / Timer card ────────────────────────────────────────────
  if (habit.type === 'volume' || habit.type === 'timer') {
    const pct  = Math.min(1, count / target);
    const unit = habit.type === 'timer' ? ' min' : '×';
    return (
      <>
        <Animated.View style={[styles.card, isDone && styles.cardDone, { transform: [{ scale }] }]}>
          <TouchableOpacity style={styles.row} onLongPress={onLongPress} activeOpacity={0.85}>
            <View style={[styles.emojiTile, isDone && styles.emojiTileDone]}>
              <AnimatedEmoji emoji={habit.emoji} size={rs(20)} />
            </View>

            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>{habit.name}</Text>
                {habit.type === 'timer' && (
                  <View style={styles.typeBadge}>
                    <Timer size={rs(9)} color={C.textMuted} strokeWidth={2} />
                    <Text style={styles.typeBadgeText}>TIMER</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={handleBellPress} style={styles.bellRow} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <AlarmClock
                  size={rs(11)}
                  color={habit.reminderTime ? C.primary : C.textMuted}
                  strokeWidth={habit.reminderTime ? 2.5 : 1.75}
                />
                <Text style={[styles.bellLabel, !habit.reminderTime && { color: C.textMuted }]}>
                  {habit.reminderTime ? fmtTime(habit.reminderTime) : 'Set reminder'}
                </Text>
              </TouchableOpacity>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: isDone ? C.success : C.primary }]} />
              </View>
            </View>

            <View style={styles.counter}>
              <TouchableOpacity style={styles.counterBtn} onPress={onDecrement} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Minus size={rs(16)} color={C.textSub} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={[styles.counterNum, isDone && { color: C.success }]}>
                {count}<Text style={styles.counterTotal}>/{target}{unit}</Text>
              </Text>
              <TouchableOpacity style={[styles.counterBtn, styles.counterBtnPlus]} onPress={onIncrement} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Plus size={rs(16)} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
        <View style={styles.row}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            onPress={handlePress}
            onLongPress={onLongPress}
            activeOpacity={0.85}
          >
            <View style={[styles.emojiTile, isDone && styles.emojiTileDone]}>
              <AnimatedEmoji emoji={habit.emoji} size={rs(20)} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>{habit.name}</Text>
                {isNegative && (
                  <View style={[styles.typeBadge, isDone && { backgroundColor: C.successSoft }]}>
                    <Ban size={rs(9)} color={isDone ? C.success : C.warning} strokeWidth={2} />
                    <Text style={[styles.typeBadgeText, { color: isDone ? C.success : C.warning }]}>
                      {isDone ? 'AVOIDED' : 'AVOID'}
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
            <AlarmClock
              size={rs(16)}
              color={habit.reminderTime ? C.primary : C.textMuted}
              strokeWidth={habit.reminderTime ? 2.5 : 1.75}
            />
          </TouchableOpacity>

          <View style={styles.checkContainer}>
            <Animated.View style={[styles.check, { transform: [{ scale: checkScale }] }]}>
              {isNegative && isDone
                ? <ShieldCheck size={rs(14)} color="#fff" strokeWidth={2.5} />
                : <Check size={rs(14)} color="#fff" strokeWidth={3} />
              }
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
    borderRadius: rs(14),
    marginBottom: rs(10),
    borderWidth: 1,
    borderColor: C.border,
    padding: rs(14),
  },
  cardDone:     { borderColor: C.success, backgroundColor: C.successSoft },
  cardNegative: { borderColor: C.warning, backgroundColor: C.warningSoft },

  row:     { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(4) },

  emojiTile: {
    width: rs(38), height: rs(38), borderRadius: rs(11),
    backgroundColor: C.cardHigh,
    alignItems: 'center', justifyContent: 'center',
    marginRight: rs(12),
  },
  emojiTileDone: { backgroundColor: C.successSoft },

  info:     { flex: 1, marginRight: rs(8) },
  name:     { fontSize: ms(14), color: C.text, fontFamily: C.semi, fontWeight: '600', flexShrink: 1, letterSpacing: ls(14) },
  nameDone: { color: C.success, textDecorationLine: 'line-through', textDecorationColor: C.success },

  bellIconBtn: {
    width: rs(32), height: rs(32),
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: rs(2),
  },
  bellRow:   { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginBottom: rs(6) },
  bellLabel: { fontSize: ms(10), color: C.primary, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(10) },
  reminderTimeText: { fontSize: ms(10), color: C.textMuted, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(10) },

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
    borderWidth: 1.5, borderColor: C.borderStrong,
  },
  checkEmptyNegative: { borderColor: C.warning },

  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.cardHigh, borderRadius: rs(6),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  typeBadgeText: { fontSize: ms(8), color: C.textMuted, fontFamily: C.bold, fontWeight: '700', letterSpacing: 0.6 },

  progressTrack: { height: rs(4), backgroundColor: C.border, borderRadius: rs(2), overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: rs(2) },

  counter: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  counterBtn: {
    width: rs(28), height: rs(28), borderRadius: rs(8),
    borderWidth: 1, borderColor: C.borderStrong,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  counterBtnPlus: {
    backgroundColor: C.primary, borderColor: C.primary,
  },
  counterNum:   { fontSize: ms(14), fontFamily: C.bold, fontWeight: '700', color: C.text, minWidth: rs(48), textAlign: 'center', letterSpacing: ls(14) },
  counterTotal: { fontSize: ms(10), fontFamily: C.reg, fontWeight: '400', color: C.textMuted, letterSpacing: ls(10) },
}; }
