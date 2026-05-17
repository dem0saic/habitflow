import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { AlarmClock, Timer, Minus, Plus } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import AnimatedEmoji from './AnimatedEmoji';

function fmtTime({ hour, minute }) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}

// Full-width tile for volume / timer habits. Inline progress + stepper.
export default function HabitTileWide({ habit, count, onIncrement, onDecrement, onLongPress }) {
  const C = useTheme();
  const styles = makeStyles(C);

  const target = habit.targetCount || 1;
  const isDone = count >= target;
  const pct    = Math.min(1, count / target);
  const unit   = habit.type === 'timer' ? ' min' : '×';
  const isTimer = habit.type === 'timer';

  const scale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: pct,
      useNativeDriver: false,
      tension: 90, friction: 13,
    }).start();
  }, [pct]);

  function bump(delta) {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.98, duration: 60, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    if (delta > 0) onIncrement?.();
    else onDecrement?.();
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.tile, isDone && styles.tileDone, { transform: [{ scale }] }]}>
      <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.95} style={{ flex: 1 }}>
        <View style={styles.row}>
          <View style={[styles.emojiWrap, isDone && { backgroundColor: C.successSoft }]}>
            <AnimatedEmoji emoji={habit.emoji} size={rs(22)} />
          </View>

          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>
                {habit.name}
              </Text>
              {isTimer && (
                <View style={styles.typeBadge}>
                  <Timer size={rs(9)} color={C.textMuted} strokeWidth={2} />
                  <Text style={styles.typeBadgeText}>TIMER</Text>
                </View>
              )}
              {habit.reminderTime && (
                <View style={styles.bellInline}>
                  <AlarmClock size={rs(10)} color={C.primary} strokeWidth={2.5} />
                  <Text style={styles.bellText}>{fmtTime(habit.reminderTime)}</Text>
                </View>
              )}
            </View>

            <View style={styles.countLabel}>
              <Text style={[styles.countNum, isDone && { color: C.success }]}>
                {count}
              </Text>
              <Text style={styles.countTotal}>
                /{target}{unit}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <Animated.View style={[
                styles.progressFill,
                { width: progressWidth, backgroundColor: isDone ? C.success : C.primary },
              ]} />
            </View>
          </View>

          <View style={styles.counter}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => bump(-1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Minus size={rs(15)} color={C.textSub} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.counterBtn, styles.counterBtnPlus]}
              onPress={() => bump(1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Plus size={rs(15)} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function makeStyles(C) { return {
  tile: {
    backgroundColor: C.tileEmpty,
    borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    padding: rs(14),
    marginBottom: rs(10),
  },
  tileDone: { borderColor: C.success, borderWidth: 1.5, backgroundColor: C.successSoft },

  row: { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(4), flexWrap: 'wrap' },

  emojiWrap: {
    width: rs(46), height: rs(46), borderRadius: rs(13),
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
    marginRight: rs(12),
  },

  info: { flex: 1, marginRight: rs(8) },
  name: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14), flexShrink: 1 },
  nameDone: { color: C.success },

  countLabel: { flexDirection: 'row', alignItems: 'baseline', marginBottom: rs(6) },
  countNum:   { fontSize: ms(18), fontFamily: C.bold, fontWeight: '700', color: C.text, letterSpacing: ls(18) },
  countTotal: { fontSize: ms(11), fontFamily: C.reg, fontWeight: '400', color: C.textMuted, letterSpacing: ls(11), marginLeft: rs(2) },

  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.cardHigh, borderRadius: rs(6),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  typeBadgeText: { fontSize: ms(8), color: C.textMuted, fontFamily: C.bold, fontWeight: '700', letterSpacing: 0.6 },

  bellInline: { flexDirection: 'row', alignItems: 'center', gap: rs(3) },
  bellText: { fontSize: ms(10), fontFamily: C.med, fontWeight: '500', color: C.primary, letterSpacing: ls(10) },

  progressTrack: { height: rs(5), backgroundColor: C.border, borderRadius: rs(3), overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: rs(3) },

  counter: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  counterBtn: {
    width: rs(30), height: rs(30), borderRadius: rs(9),
    borderWidth: 1, borderColor: C.borderStrong,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  counterBtnPlus: { backgroundColor: C.primary, borderColor: C.primary },
}; }
