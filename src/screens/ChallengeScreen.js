import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Check, ChevronRight, X } from 'lucide-react-native';
import { useStore, useChallengeProgress, useTodayCompletions } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import CelebrationModal from '../components/CelebrationModal';
import ChallengeTrack from '../components/ChallengeTrack';
import AnimatedEmoji from '../components/AnimatedEmoji';
import { successBurst, lightTap } from '../utils/haptics';
import { todayKey, diffDays } from '../utils/date';

const PRESETS = [
  { title: '3-Day Kickstart',    durationDays: 3,  emoji: '🚀', desc: 'Build momentum fast' },
  { title: '7-Day Sprint',       durationDays: 7,  emoji: '⚡', desc: 'One full week of focus' },
  { title: '21-Day Habit Forge', durationDays: 21, emoji: '🏆', desc: 'Wire in the habit for good' },
];

export default function ChallengeScreen() {
  const { state, dispatch } = useStore();
  const C = useTheme();
  const styles = makeStyles(C);
  const [rewardVisible, setRewardVisible] = useState(false);
  const challengeProgress = useChallengeProgress(state);
  const todayCompletions = useTodayCompletions();
  const { challenge, habits } = state;

  const daysPassed = challenge ? Math.min(challenge.durationDays, diffDays(challenge.startDate, todayKey()) + 1) : 0;
  const currentDayIndex = challenge ? Math.max(0, daysPassed - 1) : 0;
  const allDaysComplete = challengeProgress?.every(d => d.allDone);
  const canClaimReward  = allDaysComplete && challenge && !challenge.rewardClaimed;

  function startChallenge(preset) {
    lightTap();
    dispatch({ type: 'START_CHALLENGE', title: preset.title, durationDays: preset.durationDays, habitIds: habits.map(h => h.id) });
  }

  function claimReward() {
    successBurst();
    dispatch({ type: 'CLAIM_CHALLENGE_REWARD' });
    setRewardVisible(true);
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: rs(100) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.topLabel}>Challenges</Text>
          <Text style={styles.topTitle}>
            {!challenge ? 'Push yourself further' : challenge.title}
          </Text>
          {challenge && (
            <Text style={styles.topSub}>
              Day {Math.min(daysPassed, challenge.durationDays)} of {challenge.durationDays}
              {canClaimReward && ' · Complete'}
            </Text>
          )}
        </View>

        {!challenge ? (
          /* No-challenge state: preset cards */
          <View style={styles.body}>
            <Text style={styles.sectionLabel}>Choose a challenge</Text>
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p.title}
                style={[styles.presetCard, habits.length === 0 && { opacity: 0.45 }]}
                onPress={() => habits.length > 0 && startChallenge(p)}
                activeOpacity={0.85}
              >
                <View style={styles.presetEmojiTile}>
                  <AnimatedEmoji emoji={p.emoji} size={ms(30)} />
                </View>
                <View style={styles.presetInfo}>
                  <Text style={styles.presetTitle}>{p.title}</Text>
                  <Text style={styles.presetSub}>{p.desc}</Text>
                  <View style={styles.presetMeta}>
                    <View style={styles.presetPill}>
                      <Calendar size={rs(11)} color={C.primary} strokeWidth={2.5} />
                      <Text style={styles.presetPillText}>{p.durationDays} days</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={rs(18)} color={C.textMuted} strokeWidth={1.75} />
              </TouchableOpacity>
            ))}

            {habits.length === 0 && (
              <View style={styles.noHabitsCard}>
                <Text style={{ fontSize: rs(28), marginBottom: rs(8) }}>🌱</Text>
                <Text style={styles.noHabitsTitle}>No habits yet</Text>
                <Text style={styles.noHabitsSub}>Add habits on the Today tab first, then start a challenge.</Text>
              </View>
            )}
          </View>
        ) : (
          /* Active challenge state */
          <View style={styles.body}>
            {/* Journey track */}
            <View style={styles.trackCard}>
              <ChallengeTrack progress={challengeProgress} currentDayIndex={currentDayIndex} />
            </View>

            {/* Today's habits */}
            <Text style={styles.sectionLabel}>Today's habits</Text>

            {habits.length === 0 ? (
              <View style={styles.noHabitsCard}>
                <Text style={{ fontSize: rs(24), marginBottom: rs(6) }}>🌱</Text>
                <Text style={styles.noHabitsSub}>Add habits on the Today tab to track them here.</Text>
              </View>
            ) : (
              <View style={styles.compactList}>
                {habits.map((h, i) => {
                  const count  = todayCompletions[h.id] || 0;
                  const target = h.targetCount || 1;
                  const isDone = count >= target;
                  return (
                    <View key={h.id} style={[
                      styles.compactRow,
                      i < habits.length - 1 && styles.compactRowBorder,
                    ]}>
                      <Text style={{ fontSize: ms(18), marginRight: rs(12) }}>{h.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.compactName, isDone && { color: C.success }]} numberOfLines={1}>
                          {h.name}
                        </Text>
                        <Text style={styles.compactSub}>
                          {h.type === 'volume'   ? `${count}/${target}×`
                         : h.type === 'timer'    ? `${count}/${target} min`
                         : h.type === 'negative' ? (isDone ? 'Avoided today' : 'Avoid today')
                         : (isDone ? 'Done today' : 'Tap on Today to log')}
                        </Text>
                      </View>
                      <View style={[styles.statusDot, { backgroundColor: isDone ? C.success : C.border }]}>
                        {isDone
                          ? <Check size={rs(12)} color="#fff" strokeWidth={3} />
                          : <View style={{ width: rs(5), height: rs(5), borderRadius: rs(3), backgroundColor: C.textMuted }} />
                        }
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {canClaimReward && (
              <TouchableOpacity style={styles.claimBtn} onPress={claimReward} activeOpacity={0.88}>
                <Text style={styles.claimBtnText}>Claim your reward</Text>
              </TouchableOpacity>
            )}
            {!challenge.rewardClaimed && (
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => dispatch({ type: 'DISMISS_CHALLENGE' })}
                activeOpacity={0.7}
              >
                <X size={rs(13)} color={C.textMuted} strokeWidth={1.75} />
                <Text style={styles.dismissText}>Abandon challenge</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <CelebrationModal
        visible={rewardVisible}
        title="Challenge complete"
        subtitle={`You crushed "${challenge?.title}". Incredible consistency.`}
        onClose={() => setRewardVisible(false)}
        type="challenge"
      />
    </SafeAreaView>
  );
}

function makeStyles(C) { return {
  root:     { flex: 1, backgroundColor: C.bg },
  topRow:   { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(16) },
  topLabel: { fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  topTitle: { fontSize: ms(22), fontFamily: C.bold, fontWeight: '700', color: C.text, marginTop: rs(4), letterSpacing: ls(22) },
  topSub:   { fontSize: ms(12), color: C.textSub, fontFamily: C.med, fontWeight: '500', marginTop: rs(6), letterSpacing: ls(12) },

  body: { paddingHorizontal: rs(16) },

  sectionLabel: {
    fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: rs(10), marginLeft: rs(4),
  },

  // Journey track card
  trackCard: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    paddingVertical: rs(10),
    marginBottom: rs(20),
  },

  // Compact today list
  compactList: {
    backgroundColor: C.card, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  compactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(14), paddingVertical: rs(12),
  },
  compactRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  compactName: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14) },
  compactSub:  { fontSize: ms(11), color: C.textMuted, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  statusDot: {
    width: rs(24), height: rs(24), borderRadius: rs(12),
    alignItems: 'center', justifyContent: 'center',
  },

  // Preset cards (no active challenge)
  presetCard: {
    backgroundColor: C.card, borderRadius: rs(16), padding: rs(16),
    flexDirection: 'row', alignItems: 'center', gap: rs(14),
    borderWidth: 1, borderColor: C.border, marginBottom: rs(10),
  },
  presetEmojiTile: {
    width: rs(56), height: rs(56), borderRadius: rs(16),
    backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  presetInfo:  { flex: 1 },
  presetTitle: { fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', color: C.text, marginBottom: rs(2), letterSpacing: ls(15) },
  presetSub:   { fontSize: ms(12), color: C.textSub, marginBottom: rs(8), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(12) },
  presetMeta:  { flexDirection: 'row', gap: rs(8) },
  presetPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    backgroundColor: C.primarySoft, borderRadius: rs(20),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
  },
  presetPillText: { fontSize: ms(10), fontFamily: C.semi, fontWeight: '600', color: C.primary, letterSpacing: 0.2 },

  noHabitsCard: {
    alignItems: 'center', backgroundColor: C.card, borderRadius: rs(14),
    padding: rs(24), borderWidth: 1, borderColor: C.border, marginTop: rs(8),
  },
  noHabitsTitle: { fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', color: C.text, marginBottom: rs(4), letterSpacing: ls(15) },
  noHabitsSub:   { fontSize: ms(13), color: C.textMuted, textAlign: 'center', lineHeight: ms(20), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13) },

  claimBtn: {
    backgroundColor: C.primary, borderRadius: rs(12),
    paddingVertical: rs(16), alignItems: 'center', marginTop: rs(20),
  },
  claimBtnText: { fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', color: '#fff', letterSpacing: ls(15) },
  dismissBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(5),
    marginTop: rs(14), paddingVertical: rs(8),
  },
  dismissText: { color: C.textMuted, fontSize: ms(12), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(12) },
}; }
