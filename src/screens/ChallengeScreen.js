import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, CheckCircle, ChevronRight, AlarmClock, Check } from 'lucide-react-native';
import { useStore, useChallengeProgress, useTodayCompletions } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import CelebrationModal from '../components/CelebrationModal';
import AnimatedEmoji from '../components/AnimatedEmoji';
import { successBurst } from '../utils/haptics';
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
  const daysLeft   = challenge ? Math.max(0, challenge.durationDays - daysPassed) : 0;
  const allDaysComplete = challengeProgress?.every(d => d.allDone);
  const canClaimReward  = allDaysComplete && challenge && !challenge.rewardClaimed;

  function startChallenge(preset) {
    dispatch({ type: 'START_CHALLENGE', title: preset.title, durationDays: preset.durationDays, habitIds: habits.map(h => h.id) });
  }

  function claimReward() {
    successBurst();
    dispatch({ type: 'CLAIM_CHALLENGE_REWARD' });
    setRewardVisible(true);
  }

  const statusText = !challenge
    ? 'Pick a challenge to begin'
    : canClaimReward
    ? 'Complete — claim your reward'
    : challenge.rewardClaimed
    ? 'Challenge conquered'
    : `Keep going — you're building something real`;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topRow}>
        <Text style={styles.topLabel}>Challenges</Text>
        <Text style={styles.topTitle}>
          {!challenge ? 'Push yourself further' : challenge.title}
        </Text>
      </View>

      {/* Hero card */}
      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopLine} />
          {!challenge ? (
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{habits.length}</Text>
                <Text style={styles.heroStatLabel}>Habits</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{PRESETS.length}</Text>
                <Text style={styles.heroStatLabel}>Programs</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>—</Text>
                <Text style={styles.heroStatLabel}>Ready</Text>
              </View>
            </View>
          ) : (
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{Math.min(daysPassed, challenge.durationDays)}</Text>
                <Text style={styles.heroStatLabel}>Day</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{challenge.durationDays}</Text>
                <Text style={styles.heroStatLabel}>Total</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{daysLeft}</Text>
                <Text style={styles.heroStatLabel}>Left</Text>
              </View>
            </View>
          )}
          <Text style={styles.heroStatus}>{statusText}</Text>
        </View>
      </View>

      {!challenge ? (
        <ScrollView contentContainerStyle={styles.presetList} showsVerticalScrollIndicator={false}>
          <Text style={styles.pickLabel}>Choose a challenge</Text>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p.title}
              style={[styles.presetCard, habits.length === 0 && { opacity: 0.45 }]}
              onPress={() => habits.length > 0 && startChallenge(p)}
              activeOpacity={0.75}
            >
              <View style={styles.presetIconWrap}>
                <AnimatedEmoji emoji={p.emoji} size={ms(24)} />
              </View>
              <View style={styles.presetInfo}>
                <Text style={styles.presetTitle}>{p.title}</Text>
                <Text style={styles.presetSub}>{p.desc}</Text>
                <View style={styles.presetMeta}>
                  <View style={styles.presetPill}>
                    <Calendar size={rs(11)} color={C.primary} strokeWidth={2} />
                    <Text style={styles.presetPillText}>{p.durationDays} days</Text>
                  </View>
                  <View style={styles.presetPill}>
                    <CheckCircle size={rs(11)} color={C.primary} strokeWidth={2} />
                    <Text style={styles.presetPillText}>{habits.length} habit{habits.length !== 1 ? 's' : ''}</Text>
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
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

          {/* Day circles */}
          <View style={styles.daysRow}>
            {challengeProgress?.map((day, i) => (
              <View key={day.key} style={[styles.dayCircle, day.allDone && styles.dayCircleDone]}>
                {day.allDone
                  ? <Check size={rs(14)} color="#fff" strokeWidth={3} />
                  : <Text style={styles.dayNum}>{i + 1}</Text>
                }
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Tracked habits</Text>

          {habits.length === 0 ? (
            <View style={styles.noHabitsCard}>
              <Text style={{ fontSize: rs(24), marginBottom: rs(6) }}>🌱</Text>
              <Text style={styles.noHabitsSub}>Add habits on the Today tab to track them here.</Text>
            </View>
          ) : (
            habits.map(h => {
              const count  = todayCompletions[h.id] || 0;
              const target = h.targetCount || 1;
              const isDone = count >= target;
              const pct    = (h.type === 'volume' || h.type === 'timer')
                ? Math.min(1, count / target)
                : (isDone ? 1 : 0);

              return (
                <View key={h.id} style={[styles.habitCard, isDone && styles.habitCardDone]}>
                  <View style={[styles.habitCardEmoji, isDone && { backgroundColor: C.successSoft }]}>
                    <AnimatedEmoji emoji={h.emoji} size={ms(22)} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.habitTopRow}>
                      <Text style={[styles.habitCardName, isDone && { color: C.success }]} numberOfLines={1}>
                        {h.name}
                      </Text>
                      {isDone && (
                        <View style={styles.doneTag}>
                          <Check size={rs(9)} color="#fff" strokeWidth={3} />
                          <Text style={styles.doneTagText}>DONE</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.habitMetaRow}>
                      <View style={styles.typePill}>
                        <Text style={styles.typePillText}>
                          {h.type === 'volume'   ? `${count}/${target}×`
                         : h.type === 'timer'    ? `${count}/${target} min`
                         : h.type === 'negative' ? 'Avoid'
                         : 'Daily'}
                        </Text>
                      </View>
                      {h.reminderTime && (
                        <View style={styles.reminderPill}>
                          <AlarmClock size={rs(10)} color={C.primary} strokeWidth={2.5} />
                          <Text style={styles.reminderPillText}>
                            {(() => {
                              const hr = h.reminderTime.hour % 12 || 12;
                              const mn = String(h.reminderTime.minute).padStart(2, '0');
                              return `${hr}:${mn} ${h.reminderTime.hour < 12 ? 'AM' : 'PM'}`;
                            })()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {(h.type === 'volume' || h.type === 'timer') && (
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, {
                          width: `${pct * 100}%`,
                          backgroundColor: isDone ? C.success : C.primary,
                        }]} />
                      </View>
                    )}
                  </View>

                  <View style={[styles.statusDot, { backgroundColor: isDone ? C.success : C.border }]}>
                    {isDone
                      ? <Check size={rs(12)} color="#fff" strokeWidth={3} />
                      : <View style={{ width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: C.textMuted }} />
                    }
                  </View>
                </View>
              );
            })
          )}

          {canClaimReward && (
            <TouchableOpacity style={styles.claimBtn} onPress={claimReward} activeOpacity={0.88}>
              <Text style={styles.claimBtnText}>Claim your reward</Text>
            </TouchableOpacity>
          )}
          {!challenge.rewardClaimed && (
            <TouchableOpacity style={styles.dismissBtn} onPress={() => dispatch({ type: 'DISMISS_CHALLENGE' })}>
              <Text style={styles.dismissText}>Abandon challenge</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

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
  topRow:   { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(12) },
  topLabel: { fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  topTitle: { fontSize: ms(20), fontFamily: C.bold, fontWeight: '700', color: C.text, marginTop: rs(4), letterSpacing: ls(20) },

  // Hero
  heroWrap: { paddingHorizontal: rs(16), marginBottom: rs(8) },
  heroCard: {
    backgroundColor: C.heroSurface,
    borderRadius: rs(18), padding: rs(20), paddingTop: rs(22),
    borderWidth: 1, borderColor: C.borderStrong,
    overflow: 'hidden',
  },
  heroTopLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: rs(3), backgroundColor: C.primary,
  },
  heroStatsRow:    { flexDirection: 'row', marginBottom: rs(14) },
  heroStat:        { flex: 1, alignItems: 'center' },
  heroStatNum:     { fontSize: ms(28), fontFamily: C.bold, fontWeight: '700', color: C.text, letterSpacing: ls(28) },
  heroStatLabel:   { fontSize: ms(11), color: C.textMuted, marginTop: rs(2), fontFamily: C.med, fontWeight: '500', letterSpacing: 0.4, textTransform: 'uppercase' },
  heroStatDivider: { width: 1, backgroundColor: C.borderStrong, marginVertical: rs(8) },
  heroStatus:      { fontSize: ms(12), color: C.textSub, textAlign: 'center', fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12) },

  presetList: { padding: rs(20), paddingBottom: rs(40) },
  pickLabel: {
    fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: rs(14),
  },
  presetCard: {
    backgroundColor: C.card, borderRadius: rs(14), padding: rs(14),
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    borderWidth: 1, borderColor: C.border, marginBottom: rs(10),
  },
  presetIconWrap: {
    width: rs(48), height: rs(48), borderRadius: rs(14),
    backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  presetInfo:  { flex: 1 },
  presetTitle: { fontSize: ms(15), fontFamily: C.semi, fontWeight: '600', color: C.text, marginBottom: rs(2), letterSpacing: ls(15) },
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

  body: { padding: rs(20), paddingBottom: rs(100) },
  daysRow: { flexDirection: 'row', gap: rs(8), justifyContent: 'center', marginBottom: rs(24), flexWrap: 'wrap' },
  dayCircle: {
    width: rs(42), height: rs(42), borderRadius: rs(21),
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  dayCircleDone: { backgroundColor: C.success, borderColor: C.success },
  dayNum:        { fontSize: ms(13), fontFamily: C.bold, fontWeight: '700', color: C.textMuted, letterSpacing: ls(13) },

  sectionLabel: {
    fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: rs(12),
  },

  habitCard: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: C.card, borderRadius: rs(14),
    padding: rs(14), marginBottom: rs(10),
    borderWidth: 1, borderColor: C.border,
  },
  habitCardDone: { borderColor: C.success, backgroundColor: C.successSoft },
  habitCardEmoji: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: C.cardHigh, alignItems: 'center', justifyContent: 'center',
  },
  habitTopRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: rs(4) },
  habitMetaRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  habitCardName: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, flex: 1, marginRight: rs(6), letterSpacing: ls(14) },
  doneTag: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.success, borderRadius: rs(6),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  doneTagText: { fontSize: ms(8), fontFamily: C.bold, fontWeight: '700', color: '#fff', letterSpacing: 0.6 },
  typePill: {
    backgroundColor: C.cardHigh, borderRadius: rs(6),
    paddingHorizontal: rs(7), paddingVertical: rs(2),
    borderWidth: 1, borderColor: C.border,
  },
  typePillText: { fontSize: ms(10), color: C.textSub, fontFamily: C.med, fontWeight: '500', letterSpacing: 0.2 },
  reminderPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.primarySoft, borderRadius: rs(6),
    paddingHorizontal: rs(7), paddingVertical: rs(2),
  },
  reminderPillText: { fontSize: ms(10), color: C.primary, fontFamily: C.med, fontWeight: '500', letterSpacing: 0.2 },
  progressTrack: {
    height: rs(3), backgroundColor: C.border,
    borderRadius: rs(2), overflow: 'hidden', marginTop: rs(8),
  },
  progressFill: { height: '100%', borderRadius: rs(2) },
  statusDot: {
    width: rs(26), height: rs(26), borderRadius: rs(13),
    alignItems: 'center', justifyContent: 'center',
  },

  claimBtn: {
    backgroundColor: C.primary, borderRadius: rs(12),
    paddingVertical: rs(16), alignItems: 'center', marginTop: rs(20),
  },
  claimBtnText: { fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', color: '#fff', letterSpacing: ls(15) },
  dismissBtn:   { marginTop: rs(14), alignItems: 'center', paddingVertical: rs(8) },
  dismissText:  { color: C.textMuted, fontSize: ms(12), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(12) },
}; }
