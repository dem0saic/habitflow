import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';

const CONFETTI_COLORS = ['#93B1B5', '#B8E3E9', '#4F7C82', '#6B9970', '#7AAAB4', '#DCF0F4'];
const PARTICLE_COUNT = 24;

function Particle({ color, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  const delay = (index % 8) * 60;
  const x = (Math.sin(index * 1.3) * 140).toFixed(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 280] });
  const opacity = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(index % 2 ? 360 : -360)}deg`] });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute', top: 0,
          backgroundColor: color,
          left: `${30 + (index / PARTICLE_COUNT) * 40}%`,
          transform: [{ translateX: Number(x) * 0.4 }, { translateY }, { rotate }],
          opacity,
          width: index % 3 === 0 ? rs(10) : rs(7),
          height: index % 3 === 0 ? rs(10) : rs(7),
          borderRadius: index % 2 === 0 ? rs(5) : rs(2),
        },
      ]}
    />
  );
}

export default function CelebrationModal({ visible, title, subtitle, onClose, type = 'daily' }) {
  const C = useTheme();
  const styles = makeStyles(C);
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 9 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.5);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.confettiContainer} pointerEvents="none">
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <Particle key={i} index={i} color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]} />
          ))}
        </View>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <Text style={styles.bigEmoji}>{type === 'challenge' ? '🏆' : '🎉'}</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>
              {type === 'challenge' ? 'Claim Reward' : 'Keep it up!'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(C) { return {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,2,20,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.primaryLight,
    borderRadius: rs(28),
    padding: rs(36),
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: rs(24),
    shadowOffset: { width: 0, height: rs(8) },
    elevation: 12,
  },
  bigEmoji: { fontSize: ms(64), marginBottom: rs(16) },
  title: { fontSize: ms(24), fontFamily: C.xbold, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: rs(10), letterSpacing: ls(24) },
  subtitle: { fontSize: ms(15), color: C.textSub, textAlign: 'center', marginBottom: rs(24), lineHeight: ms(22), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(15) },
  btn: {
    backgroundColor: C.primary,
    borderRadius: rs(16),
    paddingVertical: rs(16),
    paddingHorizontal: rs(40),
    marginTop: rs(8),
  },
  btnText: { color: '#fff', fontSize: ms(16), fontFamily: C.bold, fontWeight: '700', letterSpacing: ls(16) },
}; }
