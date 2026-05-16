import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCheck, Trophy, Rocket, CheckCircle, Flag } from 'lucide-react-native';
import { useStore } from '../store';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { requestPermissions, scheduleDailyReminders } from '../utils/notifications';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    emoji: '✅',
    title: 'Track daily habits',
    body:  'Check off habits each day and build streaks that keep you consistent.',
    Icon:  CheckCircle,
  },
  {
    emoji: '🔥',
    title: 'Earn rewards',
    body:  'Complete all habits in a day and unlock a celebration with haptic feedback.',
    Icon:  Trophy,
  },
  {
    emoji: '🏆',
    title: 'Conquer challenges',
    body:  'Take on 3, 7 or 21-day challenges and claim a well-earned reward.',
    Icon:  Flag,
  },
];

function AppLogo({ C }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1, tension: 55, friction: 8, useNativeDriver: true,
    }).start();
  }, []);

  const styles = logoStyles(C);

  return (
    <Animated.View style={{
      alignItems: 'center',
      transform: [{ scale: entrance }],
    }}>
      <View style={styles.outerRing}>
        <View style={styles.innerRing}>
          <View style={styles.iconTile}>
            <CheckCheck size={rs(34)} color={C.primary} strokeWidth={2.5} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function logoStyles(C) { return {
  outerRing: {
    width: rs(108), height: rs(108), borderRadius: rs(54),
    backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  innerRing: {
    width: rs(86), height: rs(86), borderRadius: rs(43),
    backgroundColor: C.cardHigh,
    borderWidth: 1.5, borderColor: C.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  iconTile: {
    width: rs(66), height: rs(66), borderRadius: rs(20),
    backgroundColor: C.primarySoft,
    borderWidth: 1.5, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
}; }

export default function OnboardingScreen() {
  const { dispatch, state } = useStore();
  const { session, signOut } = useAuth();
  const C = useTheme();
  const styles = makeStyles(C);
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  function finish() {
    requestPermissions()
      .then(granted => granted && scheduleDailyReminders(state.habits.map(h => h.name)))
      .catch(() => {});
    dispatch({ type: 'SET_ONBOARDING_DONE' });
    if (!state.challenge) {
      dispatch({
        type: 'START_CHALLENGE',
        title: '3-Day Kickstart',
        durationDays: 3,
        habitIds: state.habits.map(h => h.id),
      });
    }
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={[styles.root, { paddingTop: insets.top + rs(20), paddingBottom: Math.max(insets.bottom, rs(12)) + rs(16) }]}>

        {/* Soft warm radial in the bottom corner */}
        <View style={{
          position: 'absolute',
          bottom: -rs(80), right: -rs(80),
          width: rs(300), height: rs(300), borderRadius: rs(150),
          backgroundColor: C.primary, opacity: 0.07,
        }} />

        {/* Header */}
        <View style={styles.header}>
          <AppLogo C={C} />
          <View style={styles.brandRow}>
            <Text style={styles.logoText}>HabitFlow</Text>
          </View>
          <Text style={styles.tagline}>Your daily habits · your best self</Text>
        </View>

        {/* Slides */}
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {STEPS.map((step, i) => {
            const { Icon } = step;
            return (
              <View key={i} style={[styles.slide, { width }]}>
                <View style={styles.slideIconWrap}>
                  <View style={styles.slideIconInner}>
                    <Icon size={rs(40)} color={C.primary} strokeWidth={1.75} />
                  </View>
                </View>

                <View style={styles.stepPill}>
                  <View style={styles.stepDot} />
                  <Text style={styles.stepPillText}>
                    STEP {i + 1} OF {STEPS.length}
                  </Text>
                </View>

                <Text style={styles.slideTitle}>{step.title}</Text>
                <Text style={styles.slideBody}>{step.body}</Text>
              </View>
            );
          })}
        </Animated.ScrollView>

        {/* Dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth  = scrollX.interpolate({ inputRange, outputRange: [rs(7), rs(24), rs(7)], extrapolate: 'clamp' });
            const opacity   = scrollX.interpolate({ inputRange, outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.btn} onPress={finish} activeOpacity={0.88}>
            <Rocket size={rs(17)} color="#fff" strokeWidth={2} style={{ marginRight: rs(8) }} />
            <Text style={styles.btnText}>
              {state.onboardingDone ? 'Back to app' : 'Get started'}
            </Text>
          </TouchableOpacity>
          {!state.onboardingDone && (
            <Text style={styles.challengeHint}>Kicks off your 3-Day Challenge automatically</Text>
          )}
        </View>

        {session && (
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

function makeStyles(C) { return {
  root: { flex: 1, alignItems: 'center', backgroundColor: C.bg },

  header:   { alignItems: 'center', paddingBottom: rs(4) },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(16) },
  logoText: {
    color: C.text, fontSize: ms(32),
    fontFamily: C.logo, letterSpacing: 3,
  },
  tagline: {
    color: C.textMuted, fontSize: ms(11), letterSpacing: 1.4,
    textTransform: 'uppercase', marginTop: rs(8),
    fontFamily: C.med, fontWeight: '500',
  },

  slide: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: rs(32),
  },
  slideIconWrap: {
    width: rs(120), height: rs(120), borderRadius: rs(60),
    backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: rs(24),
  },
  slideIconInner: {
    width: rs(92), height: rs(92), borderRadius: rs(46),
    backgroundColor: C.cardHigh,
    borderWidth: 1.5, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    borderRadius: rs(20),
    backgroundColor: C.primarySoft,
    paddingHorizontal: rs(12), paddingVertical: rs(5),
    marginBottom: rs(16),
  },
  stepDot:      { width: rs(5), height: rs(5), borderRadius: rs(3), backgroundColor: C.primary },
  stepPillText: { fontSize: ms(10), fontFamily: C.bold, fontWeight: '700', letterSpacing: 0.8, color: C.primary },
  slideTitle: {
    fontSize: ms(24), color: C.text, textAlign: 'center', marginBottom: rs(12),
    fontFamily: C.bold, fontWeight: '700', letterSpacing: ls(24),
  },
  slideBody: {
    fontSize: ms(14), color: C.textSub, textAlign: 'center', lineHeight: ms(22),
    fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(14),
  },

  dots: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(24) },
  dot:  { height: rs(7), borderRadius: rs(4), backgroundColor: C.primary },

  ctaWrap: { paddingHorizontal: rs(24), alignSelf: 'stretch', alignItems: 'center' },
  btn: {
    backgroundColor: C.primary,
    borderRadius: rs(14),
    paddingVertical: rs(17),
    alignSelf: 'stretch', alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: ms(15), fontWeight: '700', fontFamily: C.bold, letterSpacing: ls(15) },
  challengeHint: {
    color: C.textMuted, fontSize: ms(11), marginTop: rs(10),
    fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11), textAlign: 'center',
  },

  signOutBtn:  { marginTop: rs(14), paddingVertical: rs(8), alignItems: 'center' },
  signOutText: { color: C.textMuted, fontSize: ms(12), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(12) },
}; }
