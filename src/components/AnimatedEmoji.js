import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { ms } from '../utils/responsive';

// Semantic animation type per emoji
export const ANIM_TYPE = {
  // run — stride: horizontal oscillation + double vertical bounce
  '🏃': 'run', '🚶': 'run',
  // bounce — jumping/sport
  '🤸': 'bounce', '⛹️': 'bounce', '⚽': 'bounce', '🏀': 'bounce',
  '🎾': 'bounce', '🥊': 'bounce', '🧗': 'bounce', '🤺': 'bounce', '🏌️': 'bounce',
  // lift — press overhead: scale + upward shift
  '🏋️': 'lift', '💪': 'lift',
  // swim — side-to-side stroke + tilt
  '🏊': 'swim',
  // cycle — forward lean oscillation
  '🚴': 'cycle',
  // flicker — fire/lightning: rapid irregular scale
  '🔥': 'flicker', '⚡': 'flicker', '💡': 'flicker',
  // heartbeat — double-pulse
  '❤️': 'heartbeat', '🫀': 'heartbeat',
  // spin — continuous 360° rotate
  '☀️': 'spin',
  // orbit — slow arc (celestial bodies)
  '🌙': 'orbit', '🌑': 'orbit',
  // twinkle — scale + opacity flash
  '⭐': 'twinkle', '✨': 'twinkle', '💫': 'twinkle', '🎊': 'twinkle',
  // drip — fall and fade (water drop)
  '💧': 'drip',
  // wave — horizontal sway + tilt (water/swimming)
  '🌊': 'wave',
  // shake — side rotation (music / avoidance)
  '🎵': 'shake', '🎸': 'shake', '🎻': 'shake', '🥁': 'shake',
  '🎤': 'shake', '🎹': 'shake', '🎨': 'shake',
  '🚭': 'shake', '📵': 'shake', '🚫': 'shake', '🛑': 'shake', '📞': 'shake',
  // sway — gentle rotate (nature, lightness)
  '🍃': 'sway', '🦋': 'sway', '🕊️': 'sway', '🌿': 'sway', '🌱': 'sway',
  '🌸': 'sway', '🌺': 'sway', '🌻': 'sway',
  // pulse — smooth scale breathe
  '🧠': 'pulse', '🏆': 'pulse', '🏅': 'pulse', '🎖️': 'pulse',
  '🥇': 'pulse', '🎯': 'pulse', '😊': 'pulse', '🫂': 'pulse', '🙏': 'pulse',
  // launch — upward thrust + fade (rocket)
  '🚀': 'launch',
  // float = default for everything else
};

export default function AnimatedEmoji({ emoji, size, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const type = ANIM_TYPE[emoji] || 'float';
  const fontSize = size ?? ms(22);

  useEffect(() => {
    let loopRef;

    switch (type) {
      case 'run':
        // anim 0→1 loop; X and Y keyframes create running stride
        loopRef = Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
        );
        break;
      case 'bounce':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.delay(650),
        ]));
        break;
      case 'lift':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.delay(500),
        ]));
        break;
      case 'swim':
        loopRef = Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
        );
        break;
      case 'cycle':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        break;
      case 'flicker':
        loopRef = Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 350, easing: Easing.linear, useNativeDriver: true })
        );
        break;
      case 'heartbeat':
        loopRef = Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
        );
        break;
      case 'spin':
        loopRef = Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
        );
        break;
      case 'orbit':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]));
        break;
      case 'twinkle':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 380, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.delay(900),
        ]));
        break;
      case 'drip':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 550, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(900),
        ]));
        break;
      case 'wave':
        loopRef = Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
        );
        break;
      case 'shake':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1,  duration: 90, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -1, duration: 180, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0,  duration: 90, useNativeDriver: true }),
          Animated.delay(950),
        ]));
        break;
      case 'sway':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]));
        break;
      case 'pulse':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(400),
        ]));
        break;
      case 'launch':
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(1200),
        ]));
        break;
      default: // float
        loopRef = Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]));
    }

    loopRef.start();
    return () => loopRef.stop();
  }, []);

  // Derive transforms from the animation value
  let transform = [];
  let opacity;

  switch (type) {
    case 'run': {
      // X oscillates once, Y bounces twice per cycle → stride feel
      const translateX = anim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [-5, 0, 5, 0, -5],
      });
      const translateY = anim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, -4, 0, -4, 0],
      });
      transform = [{ translateX }, { translateY }];
      break;
    }
    case 'bounce': {
      const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -11] });
      transform = [{ translateY }];
      break;
    }
    case 'lift': {
      // contract then press up overhead
      const scale = anim.interpolate({
        inputRange: [0, 0.3, 0.65, 1],
        outputRange: [1, 0.88, 1.22, 1.1],
      });
      const translateY = anim.interpolate({
        inputRange: [0, 0.3, 0.65, 1],
        outputRange: [0, 3, -6, -3],
      });
      transform = [{ scale }, { translateY }];
      break;
    }
    case 'swim': {
      // side-to-side stroke with body tilt
      const translateX = anim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, 5, 0, -5, 0],
      });
      const rotate = anim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '6deg', '0deg', '-6deg', '0deg'],
      });
      transform = [{ translateX }, { rotate }];
      break;
    }
    case 'cycle': {
      // lean forward into the pedal
      const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '-14deg'] });
      transform = [{ rotate }];
      break;
    }
    case 'flicker': {
      // irregular rapid scale to simulate flame/spark
      const scale = anim.interpolate({
        inputRange: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1],
        outputRange: [1, 1.13, 0.95, 1.1, 0.97, 1.12, 1],
      });
      const translateY = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -2, 0] });
      transform = [{ scale }, { translateY }];
      break;
    }
    case 'heartbeat': {
      // lub-DUB — two distinct beats then rest
      const scale = anim.interpolate({
        inputRange: [0, 0.08, 0.16, 0.25, 0.33, 1],
        outputRange: [1, 1.28, 1, 1.18, 1, 1],
      });
      transform = [{ scale }];
      break;
    }
    case 'spin': {
      const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
      transform = [{ rotate }];
      break;
    }
    case 'orbit': {
      const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['-22deg', '22deg'] });
      transform = [{ rotate }];
      break;
    }
    case 'twinkle': {
      const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.38, 1] });
      opacity = anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [1, 0.6, 0.6, 1] });
      transform = [{ scale }];
      break;
    }
    case 'drip': {
      const translateY = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 11, 13] });
      opacity = anim.interpolate({ inputRange: [0, 0.6, 0.95, 1], outputRange: [1, 1, 0, 0] });
      transform = [{ translateY }];
      break;
    }
    case 'wave': {
      const translateX = anim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, 6, 0, -6, 0],
      });
      const rotate = anim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '7deg', '0deg', '-7deg', '0deg'],
      });
      transform = [{ translateX }, { rotate }];
      break;
    }
    case 'shake': {
      const rotate = anim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-16deg', '0deg', '16deg'],
      });
      transform = [{ rotate }];
      break;
    }
    case 'sway': {
      const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] });
      transform = [{ rotate }];
      break;
    }
    case 'pulse': {
      const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.22, 1] });
      transform = [{ scale }];
      break;
    }
    case 'launch': {
      const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
      opacity = anim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] });
      transform = [{ translateY }];
      break;
    }
    default: { // float
      const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
      transform = [{ translateY }];
    }
  }

  const animStyle = opacity !== undefined
    ? { fontSize, transform, opacity }
    : { fontSize, transform };

  return <Animated.Text style={[animStyle, style]}>{emoji}</Animated.Text>;
}
