import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { rs, ms } from '../utils/responsive';

export default function HabitCard({ habit, count, onToggle, onIncrement, onDecrement, onLongPress }) {
  const C = useTheme();
  const styles = makeStyles(C);
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(count >= (habit.targetCount || 1) ? 1 : 0)).current;

  const isDone = count >= (habit.targetCount || 1);

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: isDone ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }, [isDone]);

  function handlePress() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    onToggle?.();
  }

  if (habit.type === 'volume' || habit.type === 'timer') {
    const pct  = Math.min(1, count / habit.targetCount);
    const unit = habit.type === 'timer' ? ' min' : '×';
    return (
      <Animated.View style={[styles.card, isDone && styles.cardDone, { transform: [{ scale }] }]}>
        <TouchableOpacity
          style={styles.row}
          onLongPress={onLongPress}
          activeOpacity={0.8}
        >
          <Text style={styles.emoji}>{habit.emoji}</Text>
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
      </Animated.View>
    );
  }

  const isNegative = habit.type === 'negative';

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      <Animated.View style={[
        styles.card,
        isDone && styles.cardDone,
        isNegative && !isDone && styles.cardNegative,
        { transform: [{ scale }] },
      ]}>
        <View style={styles.row}>
          <Text style={styles.emoji}>{habit.emoji}</Text>
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
              <View style={styles.reminderBadge}>
                <Ionicons name="alarm-outline" size={rs(10)} color={C.textMuted} />
                <Text style={styles.reminderBadgeText}>
                  {(() => {
                    const h = habit.reminderTime.hour % 12 || 12;
                    const m = String(habit.reminderTime.minute).padStart(2, '0');
                    const ampm = habit.reminderTime.hour < 12 ? 'AM' : 'PM';
                    return `${h}:${m} ${ampm}`;
                  })()}
                </Text>
              </View>
            )}
          </View>
          <Animated.View style={[styles.check, isDone && styles.checkDone, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name={isNegative && isDone ? 'shield-checkmark' : 'checkmark'} size={rs(16)} color="#fff" />
          </Animated.View>
          {!isDone && <View style={[styles.checkEmpty, isNegative && styles.checkEmptyNegative]} />}
        </View>
      </Animated.View>
    </TouchableOpacity>
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
  cardDone: { backgroundColor: '#0B2A1E', borderWidth: 1.5, borderColor: C.success },
  cardNegative: { borderColor: C.warning, borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: rs(24), marginRight: rs(12) },
  info: { flex: 1, marginRight: rs(10) },
  name: { fontSize: ms(14), color: C.text, fontWeight: '500' },
  nameDone: { color: C.success, textDecorationLine: 'line-through' },
  progressTrack: {
    height: rs(4), backgroundColor: C.border,
    borderRadius: rs(2), overflow: 'hidden', marginTop: rs(6),
  },
  progressFill: { height: '100%', borderRadius: rs(2) },
  check: {
    width: rs(28), height: rs(28), borderRadius: rs(14),
    backgroundColor: C.success,
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute', right: 0,
  },
  checkEmpty: {
    width: rs(28), height: rs(28), borderRadius: rs(14),
    borderWidth: 2, borderColor: C.border,
    position: 'absolute', right: 0,
  },
  checkDone: {},
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.cardHigh, borderRadius: rs(20),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  typeBadgeText: { fontSize: ms(9), color: C.textMuted, fontWeight: '600' },
  reminderBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3), marginTop: rs(3),
  },
  reminderBadgeText: { fontSize: ms(9), color: C.textMuted },
  checkEmptyNegative: { borderColor: C.warning },
  counter: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  counterBtn: {
    width: rs(30), height: rs(30), borderRadius: rs(15),
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  counterBtnPlus: { backgroundColor: C.primary, borderColor: C.primary },
  counterNum: { fontSize: ms(15), fontWeight: '700', color: C.text, minWidth: rs(36), textAlign: 'center' },
  counterTotal: { fontSize: ms(11), fontWeight: '400', color: C.textMuted },
}; }
