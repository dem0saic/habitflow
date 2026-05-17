import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Hand, Shield, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';

// Two-card first-run overlay that teaches the bits a user can't learn from a
// passive look at Today: the long-press menu, and the streak preservation system.
// Mounted by TodayScreen and gated on state.tutorialDismissed.

const CARDS = [
  {
    Icon: Hand,
    title: 'Long-press unlocks everything',
    body:
      'On any habit tile, long-press to edit, set a reminder, pause for a few days, or delete. ' +
      'The sheet that opens is where most of the app lives.',
  },
  {
    Icon: Shield,
    title: 'Streaks that survive real life',
    body:
      'Every habit forgives 2 missed days a month automatically. Travelling for longer? ' +
      'Open Settings and tap Vacation mode to pause everything. Streaks stay safe.',
  },
];

export default function TutorialOverlay({ visible, onDismiss }) {
  const C = useTheme();
  const styles = makeStyles(C);
  const [step, setStep] = useState(0);

  function next() {
    if (step < CARDS.length - 1) setStep(step + 1);
    else onDismiss?.();
  }

  function skip() {
    onDismiss?.();
  }

  // Reset to the first card every time the overlay opens
  useEffect(() => {
    if (visible) setStep(0);
  }, [visible]);

  const card = CARDS[step];
  const isLast = step === CARDS.length - 1;
  const { Icon } = card;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={skip}
    >
      <Pressable style={styles.overlay} onPress={skip}>
        <Pressable style={styles.card}>
          <View style={styles.dots}>
            {CARDS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <View style={styles.iconWrap}>
            <Icon size={rs(26)} color={C.primary} strokeWidth={2} />
          </View>

          <Text style={styles.title}>{card.title}</Text>
          <Text style={styles.body}>{card.body}</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={skip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={next}
              activeOpacity={0.85}
            >
              <Text style={styles.nextText}>{isLast ? 'Got it' : 'Next'}</Text>
              {!isLast && <ChevronRight size={rs(15)} color="#fff" strokeWidth={2.5} />}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Helpful surfaces this overlay does NOT cover (deferred so the overlay stays
// short and skippable): day notes, AI Coach patterns, contribution graph.
// Those are best discovered by exploration once the long-press model is taught.
// If you ever add a third card, keep total length <= 3 — research is clear that
// tutorial drop-off climbs sharply past that point.

function makeStyles(C) {
  return {
    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: rs(24),
    },
    card: {
      width: '100%',
      backgroundColor: C.card, borderRadius: rs(18),
      borderWidth: 1, borderColor: C.borderStrong,
      padding: rs(22),
    },

    dots: { flexDirection: 'row', alignSelf: 'center', gap: rs(6), marginBottom: rs(18) },
    dot:  { height: rs(6), borderRadius: rs(3) },
    dotActive:   { width: rs(20), backgroundColor: C.primary },
    dotInactive: { width: rs(6),  backgroundColor: C.border },

    iconWrap: {
      width: rs(56), height: rs(56), borderRadius: rs(16),
      backgroundColor: C.primarySoft,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: rs(16),
    },

    title: { fontSize: ms(18), fontFamily: C.bold, fontWeight: '700', color: C.text, marginBottom: rs(10), letterSpacing: ls(18) },
    body:  { fontSize: ms(13), color: C.textSub, lineHeight: ms(20), fontFamily: C.reg, fontWeight: '400', marginBottom: rs(22), letterSpacing: ls(13) },

    btnRow: { flexDirection: 'row', gap: rs(10), alignItems: 'center' },
    skipBtn: {
      flex: 1, paddingVertical: rs(13), borderRadius: rs(10),
      borderWidth: 1, borderColor: C.borderStrong, alignItems: 'center',
    },
    skipText: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.textSub, letterSpacing: ls(14) },
    nextBtn: {
      flex: 2, paddingVertical: rs(13), borderRadius: rs(10),
      backgroundColor: C.primary,
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: rs(4),
    },
    nextText: { fontSize: ms(14), fontFamily: C.bold, fontWeight: '700', color: '#fff', letterSpacing: ls(14) },
  };
}
