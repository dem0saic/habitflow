import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../ThemeContext';

// HabitFlow brand mark — "Ripple" (animated)
//
// Meaning:
//   · the filled center dot is the single daily choice
//   · the gentle pulse on every cycle is that choice being made today
//   · the ring emanating outward through the static structure is the
//     compounding effect of that choice rippling through your life
//   · the three static rings are the discipline of returning every day —
//     the structure that holds the practice in place
//
// The animation is the meaning. Watching it for a few seconds you understand:
// each small act at the center sends a wave outward that touches everything.
//
// Props
//   size    — outer width/height in px (default 96)
//   animate — set false for static rendering (icons, small chrome)
//   tone    — 'default' uses primary; 'mono' uses text color (ghost states)
export default function AppLogo({ size = 96, animate = true, tone = 'default' }) {
  const C = useTheme();
  const accent = tone === 'mono' ? C.text : C.primary;
  const core   = tone === 'mono' ? C.text : C.primaryStrong;

  const ripple = useRef(new Animated.Value(0)).current;
  const pulse  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;

    const CYCLE = 2800;   // ms per ripple — slow, meditative

    // Continuous emanating ripple — grows out from the inner ring,
    // fades through the outer rings, restarts.
    const rippleLoop = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: CYCLE,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );

    // Gentle pulse on the center dot — fires at the moment each ripple is
    // born, so the eye reads: choice (pulse) → consequence (ripple).
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.14,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: CYCLE - 220,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    rippleLoop.start();
    pulseLoop.start();
    return () => { rippleLoop.stop(); pulseLoop.stop(); };
  }, [animate]);

  // Emanating ring starts at the inner static ring (~37.5% of total) and
  // grows out to roughly the outermost (~88%).
  const emanatingBase = size * 0.375;
  const emanatingStyle = {
    position: 'absolute',
    width: emanatingBase,
    height: emanatingBase,
    borderRadius: emanatingBase / 2,
    borderWidth: Math.max(1, size * 0.018),
    borderColor: accent,
    transform: [{
      scale: ripple.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.35],
      }),
    }],
    opacity: ripple.interpolate({
      inputRange: [0, 0.1, 1],
      outputRange: [0, 0.75, 0],
    }),
  };

  // Center dot — 12.5% of total size
  const dotSize = size * 0.125;

  return (
    <View style={{
      width: size, height: size,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Static ring structure (the discipline) */}
      <Svg width={size} height={size} viewBox="0 0 96 96" style={{ position: 'absolute' }}>
        <Circle cx="48" cy="48" r="42" stroke={accent} strokeWidth={1.5}  fill="none" opacity={0.18} />
        <Circle cx="48" cy="48" r="30" stroke={accent} strokeWidth={1.75} fill="none" opacity={0.42} />
        <Circle cx="48" cy="48" r="18" stroke={core}   strokeWidth={2}    fill="none" />
      </Svg>

      {/* Animated emanating ring (the consequence) */}
      {animate && <Animated.View style={emanatingStyle} />}

      {/* Center pulsing dot (the choice) */}
      <Animated.View style={{
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
        backgroundColor: core,
        transform: [{ scale: pulse }],
      }} />
    </View>
  );
}
