import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';

// Horizontal day-by-day journey track.
// `progress`: array of { key, allDone } (same shape as useChallengeProgress).
// `currentDayIndex`: which day in the progress array is "today" (0-based).
export default function ChallengeTrack({ progress, currentDayIndex }) {
  const C = useTheme();
  const styles = makeStyles(C);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  if (!progress || progress.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {progress.map((day, i) => {
        const isFirst   = i === 0;
        const isToday   = i === currentDayIndex;
        const isPast    = i < currentDayIndex;
        const isFuture  = i > currentDayIndex;

        return (
          <View key={day.key} style={styles.col}>
            {/* Connector line (to previous day) */}
            {!isFirst && (
              <View style={[
                styles.connector,
                { backgroundColor: day.allDone || isPast ? C.success : C.border },
              ]} />
            )}

            <View style={styles.dotWrap}>
              {day.allDone ? (
                <View style={[styles.dot, styles.dotDone]}>
                  <Check size={rs(14)} color="#fff" strokeWidth={3} />
                </View>
              ) : isToday ? (
                <Animated.View style={[styles.dot, styles.dotToday, { opacity: pulseOpacity }]} />
              ) : isFuture ? (
                <View style={[styles.dot, styles.dotFuture]} />
              ) : (
                <View style={[styles.dot, styles.dotMissed]} />
              )}
            </View>

            <Text style={[
              styles.label,
              isToday && { color: C.primary, fontFamily: C.bold, fontWeight: '700' },
            ]}>
              {isToday ? 'TODAY' : `D${i + 1}`}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(C) { return {
  scroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(10),
    paddingVertical: rs(10),
  },
  col: {
    alignItems: 'center',
    width: rs(56),
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: rs(13),  // center of dot
    left: -rs(28),
    width: rs(56),
    height: rs(2),
    zIndex: 0,
  },
  dotWrap: { zIndex: 1 },
  dot: {
    width: rs(28), height: rs(28), borderRadius: rs(14),
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone:   { backgroundColor: C.success },
  dotToday:  { backgroundColor: C.primary, borderWidth: 2, borderColor: C.primaryStrong },
  dotFuture: { borderWidth: 1.5, borderColor: C.borderStrong, backgroundColor: C.card },
  dotMissed: { borderWidth: 1.5, borderColor: C.border,       backgroundColor: C.card },

  label: {
    marginTop: rs(8),
    fontSize: ms(10), color: C.textMuted,
    fontFamily: C.semi, fontWeight: '600',
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
}; }
