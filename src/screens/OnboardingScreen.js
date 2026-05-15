import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms } from '../utils/responsive';
import { requestPermissions, scheduleDailyReminders } from '../utils/notifications';
import AnimatedEmoji from '../components/AnimatedEmoji';

const { width } = Dimensions.get('window');

const STEPS = [
  { emoji: '✅', title: 'Track daily habits', body: 'Check off habits each day and build streaks that keep you consistent.' },
  { emoji: '🔥', title: 'Earn rewards', body: 'Complete all your habits in a day and watch the celebration — plus haptic feedback to feel the win.' },
  { emoji: '🏆', title: 'Conquer challenges', body: 'Take on 3-day, 7-day, or 21-day challenges. Finish them and unlock a special reward.' },
];

function AppLogo() {
  const floatAnim    = useRef(new Animated.Value(0)).current;
  const outerPulse   = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const flamePulse   = useRef(new Animated.Value(1)).current;
  const trophyPulse  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spring entrance
    Animated.spring(entranceAnim, {
      toValue: 1, tension: 55, friction: 7, useNativeDriver: true,
    }).start();

    // Gentle float up-down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    // Outer ring breathe (scale pulse)
    Animated.loop(
      Animated.sequence([
        Animated.timing(outerPulse, { toValue: 1.09, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(outerPulse, { toValue: 1,    duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    // Flame badge: periodic pop-bounce
    Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(flamePulse, { toValue: 1.4, duration: 160, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(flamePulse, { toValue: 1,   duration: 300, easing: Easing.out(Easing.ease),   useNativeDriver: true }),
        Animated.delay(2600),
      ]),
    ).start();

    // Trophy badge: offset bounce
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
      alignItems: 'center', marginBottom: rs(2),
      transform: [{ translateY: floatAnim }, { scale: entranceAnim }],
    }}>
      {/* Outermost glow ring — breathes */}
      <Animated.View style={{
        width: rs(108), height: rs(108), borderRadius: rs(54),
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: outerPulse }],
      }}>
        {/* Middle ring */}
        <View style={{
          width: rs(88), height: rs(88), borderRadius: rs(44),
          backgroundColor: 'rgba(255,255,255,0.08)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Icon tile */}
          <View style={{
            width: rs(70), height: rs(70), borderRadius: rs(22),
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.30)',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#fff', shadowOpacity: 0.15, shadowRadius: rs(12),
            shadowOffset: { width: 0, height: 0 },
          }}>
            <View style={{
              position: 'absolute',
              width: rs(54), height: rs(54), borderRadius: rs(16),
              backgroundColor: 'rgba(124,58,237,0.45)',
            }} />
            <Ionicons name="checkmark-done" size={rs(36)} color="#fff" />
          </View>
        </View>
      </Animated.View>

      {/* Flame badge — top-right, periodic pop */}
      <Animated.View style={{
        position: 'absolute', top: rs(2), right: rs(10),
        width: rs(28), height: rs(28), borderRadius: rs(14),
        backgroundColor: '#988686',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
        shadowColor: '#988686', shadowOpacity: 0.9, shadowRadius: rs(8), shadowOffset: { width: 0, height: 0 },
        transform: [{ scale: flamePulse }],
      }}>
        <Ionicons name="flame" size={rs(14)} color="#fff" />
      </Animated.View>

      {/* Trophy badge — bottom-left, offset pop */}
      <Animated.View style={{
        position: 'absolute', bottom: rs(2), left: rs(10),
        width: rs(24), height: rs(24), borderRadius: rs(12),
        backgroundColor: '#D1D0D0',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
        shadowColor: '#D1D0D0', shadowOpacity: 0.8, shadowRadius: rs(6), shadowOffset: { width: 0, height: 0 },
        transform: [{ scale: trophyPulse }],
      }}>
        <Ionicons name="trophy" size={rs(12)} color="#fff" />
      </Animated.View>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const { dispatch, state } = useStore();
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
      {/* Always light so time/battery/Wi-Fi icons are white on the dark gradient */}
      <StatusBar style="light" />
      <LinearGradient
        colors={['#000000', '#2A1A1A', '#5C4E4E']}
        style={[styles.root, { paddingTop: insets.top + rs(28), paddingBottom: Math.max(insets.bottom, rs(12)) + rs(16) }]}
      >
        <AppLogo />
        <Text style={styles.logoText}>HabitFlow</Text>
        <Text style={styles.tagline}>Build better habits, every day</Text>

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
        >
          {STEPS.map((step, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              <AnimatedEmoji emoji={step.emoji} size={ms(68)} style={{ marginBottom: rs(20) }} />
              <Text style={styles.slideTitle}>{step.title}</Text>
              <Text style={styles.slideBody}>{step.body}</Text>
            </View>
          ))}
        </Animated.ScrollView>

        <View style={styles.dots}>
          {STEPS.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
            const scale  = scrollX.interpolate({ inputRange, outputRange: [0.8, 1.4, 0.8], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[styles.dot, { opacity, transform: [{ scale }] }]} />;
          })}
        </View>

        <TouchableOpacity style={styles.btn} onPress={finish}>
          <Text style={styles.btnText}>
            {state.onboardingDone
              ? 'Back to App'
              : 'Get Started — Start 3-Day Challenge'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </>
  );
}

function makeStyles(C) { return {
  /* paddingTop/paddingBottom are applied inline using insets */
  root: { flex: 1, alignItems: 'center' },
  logoText: { color: '#fff', fontSize: ms(28), fontWeight: '900', letterSpacing: 1, marginTop: rs(10) },
  tagline:  {
    color: 'rgba(255,255,255,0.55)', fontSize: ms(11), letterSpacing: 2,
    textTransform: 'uppercase', marginTop: rs(6), marginBottom: rs(8),
  },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(44) },
  slideEmoji: { fontSize: ms(68), marginBottom: rs(20) },
  slideTitle: { fontSize: ms(22), fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: rs(10) },
  slideBody:  { fontSize: ms(14), color: 'rgba(255,255,255,0.78)', textAlign: 'center', lineHeight: ms(22) },
  dots: { flexDirection: 'row', gap: rs(8), marginTop: rs(4), marginBottom: rs(24) },
  dot:  { width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: '#fff' },
  btn: {
    backgroundColor: '#fff',
    borderRadius: rs(18),
    paddingVertical: rs(18),
    paddingHorizontal: rs(32),
    marginHorizontal: rs(24),
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  btnText: { color: C.primary, fontSize: ms(15), fontWeight: '700' },
}; }
