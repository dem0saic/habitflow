import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { AlarmClock, Check, ShieldCheck, Ban, PauseCircle } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import AnimatedEmoji from './AnimatedEmoji';

function fmtTime({ hour, minute }) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

// Square tile for daily / negative habits. Tap to toggle, long-press for options.
// Designed to pair two-up in a row (caller sets width via flex).
export default function HabitTileSmall({ habit, count, onToggle, onLongPress, paused }) {
  const C = useTheme();
  const styles = makeStyles(C);

  const target     = habit.targetCount || 1;
  const isDone     = count >= target;
  const isNegative = habit.type === 'negative';

  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(isDone ? 1 : 0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: isDone ? 1 : 0,
      useNativeDriver: true,
      tension: 200, friction: 10,
    }).start();
  }, [isDone]);

  function handlePress() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, useNativeDriver: true, tension: 260, friction: 9 }),
    ]).start();
    // Quick flash overlay so the tap registers visually even if the state change is subtle
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 320, useNativeDriver: true }).start();
    onToggle?.();
  }

  const accentColor = isDone ? C.success : isNegative ? C.warning : C.primary;
  const flashOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }, paused && { opacity: 0.55 }]}>
      <TouchableOpacity
        style={[
          styles.tile,
          isDone && styles.tileDone,
          isNegative && !isDone && styles.tileNegative,
          paused && styles.tilePaused,
        ]}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.85}
      >
        {/* Tap flash overlay — quick highlight pulse on press */}
        <Animated.View
          pointerEvents="none"
          style={[styles.flashOverlay, { opacity: flashOpacity, backgroundColor: accentColor }]}
        />

        {/* Top row: emoji + reminder bell / pause badge */}
        <View style={styles.topRow}>
          <View style={[styles.emojiWrap, isDone && { backgroundColor: C.successSoft }]}>
            <AnimatedEmoji emoji={habit.emoji} size={rs(22)} />
          </View>
          {paused ? (
            <View style={styles.pausedPill}>
              <PauseCircle size={rs(10)} color={C.warning} strokeWidth={2.5} />
              <Text style={styles.pausedPillText}>PAUSED</Text>
            </View>
          ) : habit.reminderTime ? (
            <View style={styles.bellWrap}>
              <AlarmClock size={rs(11)} color={accentColor} strokeWidth={2.5} />
            </View>
          ) : null}
        </View>

        {/* Habit name */}
        <Text
          style={[styles.name, isDone && styles.nameDone]}
          numberOfLines={2}
        >
          {habit.name}
        </Text>

        {/* Bottom row: status indicator */}
        <View style={styles.bottomRow}>
          {habit.reminderTime ? (
            <Text style={[styles.timeLabel, isDone && { color: C.success }]}>
              {fmtTime(habit.reminderTime)}
            </Text>
          ) : isNegative ? (
            <View style={styles.negTag}>
              <Ban size={rs(9)} color={isDone ? C.success : C.warning} strokeWidth={2} />
              <Text style={[styles.negTagText, { color: isDone ? C.success : C.warning }]}>
                {isDone ? 'AVOIDED' : 'AVOID'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.tapHint, isDone && { color: C.success }]}>
              {isDone ? 'Completed' : 'Tap to log'}
            </Text>
          )}

          <View style={styles.checkContainer}>
            <Animated.View style={[styles.check, { transform: [{ scale: checkScale }] }]}>
              {isNegative && isDone
                ? <ShieldCheck size={rs(13)} color="#fff" strokeWidth={2.5} />
                : <Check size={rs(13)} color="#fff" strokeWidth={3} />
              }
            </Animated.View>
            {!isDone && (
              <View style={[styles.checkEmpty, isNegative && { borderColor: C.warning }]} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function makeStyles(C) { return {
  wrap: { flex: 1 },
  tile: {
    backgroundColor: C.tileEmpty,
    borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    padding: rs(14),
    minHeight: rs(126),
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  tileDone:     { borderColor: C.success, borderWidth: 1.5, backgroundColor: C.successSoft },
  tileNegative: { borderColor: C.warning, borderWidth: 1.5 },
  tilePaused:   { borderColor: C.warning, borderStyle: 'dashed' },
  flashOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: rs(16),
  },
  pausedPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.warningSoft, borderRadius: rs(6),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  pausedPillText: { fontSize: ms(8), color: C.warning, fontFamily: C.bold, fontWeight: '700', letterSpacing: 0.6 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  emojiWrap: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  bellWrap: {
    width: rs(22), height: rs(22), borderRadius: rs(11),
    backgroundColor: C.cardHigh,
    alignItems: 'center', justifyContent: 'center',
  },

  name:     { fontSize: ms(13), fontFamily: C.semi, fontWeight: '600', color: C.text, marginVertical: rs(6), letterSpacing: ls(13), lineHeight: ms(17) },
  nameDone: { color: C.success },

  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(4) },
  timeLabel: { fontSize: ms(10), color: C.primary, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(10) },
  tapHint:   { fontSize: ms(10), color: C.textMuted, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(10) },
  negTag: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.warningSoft, borderRadius: rs(6),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  negTagText: { fontSize: ms(8), fontFamily: C.bold, fontWeight: '700', letterSpacing: 0.6 },

  checkContainer: { width: rs(26), height: rs(26) },
  check: {
    position: 'absolute', top: 0, left: 0,
    width: rs(26), height: rs(26), borderRadius: rs(13),
    backgroundColor: C.success,
    alignItems: 'center', justifyContent: 'center',
  },
  checkEmpty: {
    position: 'absolute', top: 0, left: 0,
    width: rs(26), height: rs(26), borderRadius: rs(13),
    borderWidth: 1.5, borderColor: C.borderStrong,
  },
}; }
