import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { requestPermissions, scheduleDailyReminders } from '../utils/notifications';
import AnimatedEmoji from '../components/AnimatedEmoji';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    emoji: '✅',
    title: 'Track daily habits',
    body: 'Check off habits each day and build streaks that keep you consistent.',
    color: '#F57B51',
    icon: 'checkmark-circle-outline',
  },
  {
    emoji: '🔥',
    title: 'Earn rewards',
    body: 'Complete all habits in a day and unlock a celebration with haptic feedback.',
    color: '#FBBC58',
    icon: 'trophy-outline',
  },
  {
    emoji: '🏆',
    title: 'Conquer challenges',
    body: 'Take on 3, 7, or 21-day challenges and claim your well-earned reward.',
    color: '#F57B51',
    icon: 'flag-outline',
  },
];

function AppLogo() {
  const floatAnim    = useRef(new Animated.Value(0)).current;
  const outerPulse   = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const flamePulse   = useRef(new Animated.Value(1)).current;
  const trophyPulse  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(entranceAnim, {
      toValue: 1, tension: 55, friction: 7, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(outerPulse, { toValue: 1.08, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(outerPulse, { toValue: 1,    duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(flamePulse, { toValue: 1.4, duration: 160, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(flamePulse, { toValue: 1,   duration: 300, easing: Easing.out(Easing.ease),   useNativeDriver: true }),
        Animated.delay(2600),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(3400),
        Animated.timing(trophyPulse, { toValue: 1.3, duration: 160, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(trophyPulse, { toValue: 1,   duration: 300, easing: Easing.out(Easing.ease),   useNativeDriver: true }),
        Animated.delay(2200),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={{
      alignItems: 'center',
      transform: [{ translateY: floatAnim }, { scale: entranceAnim }],
    }}>
      {/* Outer glow ring */}
      <Animated.View style={{
        width: rs(112), height: rs(112), borderRadius: rs(56),
        backgroundColor: 'rgba(245,123,81,0.08)',
        alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: outerPulse }],
      }}>
        {/* Middle ring */}
        <View style={{
          width: rs(90), height: rs(90), borderRadius: rs(45),
          backgroundColor: 'rgba(245,123,81,0.12)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Icon tile */}
          <View style={{
            width: rs(70), height: rs(70), borderRadius: rs(22),
            backgroundColor: 'rgba(245,123,81,0.20)',
            borderWidth: 1.5, borderColor: 'rgba(245,123,81,0.40)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{
              position: 'absolute',
              width: rs(54), height: rs(54), borderRadius: rs(16),
              backgroundColor: 'rgba(245,123,81,0.25)',
            }} />
            <Ionicons name="checkmark-done" size={rs(36)} color="#fff" />
          </View>
        </View>
      </Animated.View>

      {/* Flame badge */}
      <Animated.View style={{
        position: 'absolute', top: rs(2), right: rs(8),
        width: rs(28), height: rs(28), borderRadius: rs(14),
        backgroundColor: '#F57B51',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
        transform: [{ scale: flamePulse }],
      }}>
        <Ionicons name="flame" size={rs(14)} color="#fff" />
      </Animated.View>

      {/* Trophy badge */}
      <Animated.View style={{
        position: 'absolute', bottom: rs(2), left: rs(8),
        width: rs(24), height: rs(24), borderRadius: rs(12),
        backgroundColor: '#FBBC58',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
        transform: [{ scale: trophyPulse }],
      }}>
        <Ionicons name="trophy" size={rs(12)} color="#fff" />
      </Animated.View>
    </Animated.View>
  );
}

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
      <LinearGradient
        colors={['#061519', '#0B2A32', '#0D3040']}
        style={[styles.root, { paddingTop: insets.top + rs(20), paddingBottom: Math.max(insets.bottom, rs(12)) + rs(16) }]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <AppLogo />
          <View style={styles.brandRow}>
            <Text style={styles.logoText}>HabitFlow</Text>
            <View style={styles.logoTag}>
              <Text style={styles.logoTagText}>HABIT TRACKER</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Your daily habits, your best self</Text>
        </View>

        {/* ── Feature slides ── */}
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
          {STEPS.map((step, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              {/* Large emoji circle */}
              <View style={[styles.slideCircle, {
                borderColor: step.color + '55',
                backgroundColor: step.color + '15',
              }]}>
                <View style={[styles.slideCircleInner, {
                  backgroundColor: step.color + '22',
                }]}>
                  <AnimatedEmoji emoji={step.emoji} size={ms(64)} />
                </View>
              </View>

              {/* Step number */}
              <View style={[styles.stepPill, {
                backgroundColor: step.color + '20',
                borderColor: step.color + '50',
              }]}>
                <View style={[styles.stepDot, { backgroundColor: step.color }]} />
                <Text style={[styles.stepPillText, { color: step.color }]}>
                  Step {i + 1} of {STEPS.length}
                </Text>
              </View>

              <Text style={styles.slideTitle}>{step.title}</Text>
              <Text style={styles.slideBody}>{step.body}</Text>
            </View>
          ))}
        </Animated.ScrollView>

        {/* ── Animated dots ── */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth  = scrollX.interpolate({ inputRange, outputRange: [rs(8), rs(26), rs(8)], extrapolate: 'clamp' });
            const opacity   = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            const bgColor   = scrollX.interpolate({ inputRange, outputRange: ['#ffffff', '#F57B51', '#ffffff'], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: bgColor }]}
              />
            );
          })}
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.btn} onPress={finish} activeOpacity={0.85}>
            <Ionicons name="rocket-outline" size={rs(18)} color="#fff" style={{ marginRight: rs(8) }} />
            <Text style={styles.btnText}>
              {state.onboardingDone ? 'Back to App' : 'Get Started'}
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
      </LinearGradient>
    </>
  );
}

function makeStyles(C) { return {
  root: { flex: 1, alignItems: 'center' },

  header: { alignItems: 'center', paddingBottom: rs(4) },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginTop: rs(12) },
  logoText: {
    color: '#fff', fontSize: ms(36),
    fontFamily: C.logo, letterSpacing: 3,
  },
  logoTag: {
    backgroundColor: 'rgba(245,123,81,0.18)',
    borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: 'rgba(245,123,81,0.40)',
  },
  logoTagText: {
    color: '#F57B51', fontSize: ms(8), fontFamily: C.bold,
    fontWeight: '700', letterSpacing: 1.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.45)', fontSize: ms(11), letterSpacing: 1.5,
    textTransform: 'uppercase', marginTop: rs(8),
    fontFamily: C.med, fontWeight: '500',
  },

  slide: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: rs(32),
  },
  slideCircle: {
    width: rs(140), height: rs(140), borderRadius: rs(70),
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: rs(24),
  },
  slideCircleInner: {
    width: rs(110), height: rs(110), borderRadius: rs(55),
    alignItems: 'center', justifyContent: 'center',
  },
  stepPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    borderRadius: rs(20), borderWidth: 1,
    paddingHorizontal: rs(14), paddingVertical: rs(6),
    marginBottom: rs(16),
  },
  stepDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  stepPillText: { fontSize: ms(11), fontFamily: C.semi, fontWeight: '600', letterSpacing: 1 },
  slideTitle: {
    fontSize: ms(26), color: '#fff', textAlign: 'center', marginBottom: rs(12),
    fontFamily: C.xbold, fontWeight: '800', letterSpacing: ls(26),
  },
  slideBody: {
    fontSize: ms(15), color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: ms(24),
    fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(15),
  },

  dots: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(20) },
  dot:  { height: rs(8), borderRadius: rs(4), backgroundColor: '#fff' },

  ctaWrap: { paddingHorizontal: rs(24), alignSelf: 'stretch', alignItems: 'center' },
  btn: {
    backgroundColor: '#F57B51',
    borderRadius: rs(18),
    paddingVertical: rs(18),
    alignSelf: 'stretch', alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: rs(8),
    shadowOffset: { width: 0, height: rs(3) }, elevation: 5,
  },
  btnText: { color: '#fff', fontSize: ms(16), fontWeight: '700', fontFamily: C.bold, letterSpacing: ls(16) },
  challengeHint: {
    color: 'rgba(255,255,255,0.35)', fontSize: ms(11), marginTop: rs(10),
    fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11), textAlign: 'center',
  },

  signOutBtn: { marginTop: rs(14), paddingVertical: rs(8), alignItems: 'center' },
  signOutText: { color: 'rgba(255,255,255,0.28)', fontSize: ms(12), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(12) },
}; }
