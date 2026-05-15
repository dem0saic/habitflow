import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { rs, ms } from '../utils/responsive';

function fmtTime({ hour, minute }) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

export default function HabitCard({ habit, count, onToggle, onIncrement, onDecrement, onLongPress, onSetReminder }) {
  const C = useTheme();
  const styles = makeStyles(C);
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(count >= (habit.targetCount || 1) ? 1 : 0)).current;

  const isDone = count >= (habit.targetCount || 1);
  const [showBellPicker, setShowBellPicker] = useState(false);
  const [bellDate, setBellDate] = useState(new Date(2000, 0, 1, 9, 0));

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
      <>
        <Animated.View style={[styles.card, isDone && styles.cardDone, { transform: [{ scale }] }]}>
          <TouchableOpacity
            style={styles.row}
            onLongPress={onLongPress}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{habit.emoji}</Text>
            <View style={styles.info}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(2) }}>
                <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>{habit.name}</Text>
                {habit.type === 'timer' && (
                  <View style={styles.typeBadge}>
                    <Ionicons name="timer-outline" size={rs(9)} color={C.textMuted} />
                    <Text style={styles.typeBadgeText}>timer</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={handleBellPress} style={styles.bellBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons
                  name={habit.reminderTime ? 'alarm' : 'alarm-outline'}
                  size={rs(11)}
                  color={habit.reminderTime ? C.primary : C.border}
                />
                {habit.reminderTime && (
                  <Text style={styles.reminderBadgeText}>{fmtTime(habit.reminderTime)}</Text>
                )}
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
        </Animated.View>
        {renderBellPicker()}
      </>
    );
  }

  const isNegative = habit.type === 'negative';

  function renderBellPicker() {
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
                {habit.emoji} Set reminder
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

  return (
    <>
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
              <TouchableOpacity onPress={handleBellPress} style={styles.bellBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons
                  name={habit.reminderTime ? 'alarm' : 'alarm-outline'}
                  size={rs(11)}
                  color={habit.reminderTime ? C.primary : C.border}
                />
                {habit.reminderTime && (
                  <Text style={styles.reminderBadgeText}>{fmtTime(habit.reminderTime)}</Text>
                )}
              </TouchableOpacity>
            </View>
            <Animated.View style={[styles.check, isDone && styles.checkDone, { transform: [{ scale: checkScale }] }]}>
              <Ionicons name={isNegative && isDone ? 'shield-checkmark' : 'checkmark'} size={rs(16)} color="#fff" />
            </Animated.View>
            {!isDone && <View style={[styles.checkEmpty, isNegative && styles.checkEmptyNegative]} />}
          </View>
        </Animated.View>
      </TouchableOpacity>
      {renderBellPicker()}
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
  bellBtn: {
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
