import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

  const daysPassed  = challenge ? Math.min(challenge.durationDays, diffDays(challenge.startDate, todayKey()) + 1) : 0;
  const daysLeft    = challenge ? Math.max(0, challenge.durationDays - daysPassed) : 0;
  const allDaysComplete  = challengeProgress?.every(d => d.allDone);
  const canClaimReward   = allDaysComplete && challenge && !challenge.rewardClaimed;

  function startChallenge(preset) {
    dispatch({ type: 'START_CHALLENGE', title: preset.title, durationDays: preset.durationDays, habitIds: habits.map(h => h.id) });
  }

  function claimReward() {
    successBurst();
    dispatch({ type: 'CLAIM_CHALLENGE_REWARD' });
    setRewardVisible(true);
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.topLabel}>Challenges</Text>
          <Text style={styles.topTitle}>
            {!challenge ? 'Push yourself further' : challenge.title}
          </Text>
        </View>
      </View>

      {/* Floating hero card */}
      <View style={styles.heroWrap}>
        <LinearGradient colors={['#071C22', '#2A5560']} style={styles.heroCard}>
          {!challenge ? (
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{habits.length}</Text>
                <Text style={styles.heroStatLabel}>Habits</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{PRESETS.length}</Text>
                <Text style={styles.heroStatLabel}>Challenges</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>🏅</Text>
                <Text style={styles.heroStatLabel}>Ready to go</Text>
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
          <Text style={styles.heroStatus}>
            {!challenge
              ? '🏆 Pick a challenge to begin'
              : canClaimReward
              ? '🎊 Complete! Claim your reward!'
              : challenge.rewardClaimed
              ? '🏅 Challenge conquered — well done!'
              : `Keep going — you're building something real.`}
          </Text>
        </LinearGradient>
      </View>

      {!challenge ? (
        /* ── Preset picker ─────────────────────────────────────── */
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
                <AnimatedEmoji emoji={p.emoji} size={ms(26)} />
              </View>
              <View style={styles.presetInfo}>
                <Text style={styles.presetTitle}>{p.title}</Text>
                <Text style={styles.presetSub}>{p.desc}</Text>
                <View style={styles.presetMeta}>
                  <View style={styles.presetPill}>
                    <Ionicons name="calendar-outline" size={rs(11)} color={C.gold} />
                    <Text style={styles.presetPillText}>{p.durationDays} days</Text>
                  </View>
                  <View style={styles.presetPill}>
                    <Ionicons name="checkmark-circle-outline" size={rs(11)} color={C.gold} />
                    <Text style={styles.presetPillText}>{habits.length} habit{habits.length !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={rs(20)} color={C.textMuted} />
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
        /* ── Active challenge ──────────────────────────────────── */
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

          {/* Day circles */}
          <View style={styles.daysRow}>
            {challengeProgress?.map((day, i) => (
              <View key={day.key} style={[styles.dayCircle, day.allDone && styles.dayCircleDone]}>
                <Text style={[styles.dayNum, day.allDone && styles.dayNumDone]}>
                  {day.allDone ? '✓' : i + 1}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.motiveLine}>
            {canClaimReward
              ? '🎊 Challenge complete! Claim your reward!'
              : allDaysComplete && challenge.rewardClaimed
                ? '🏅 Challenge conquered — well done!'
                : `Keep going — you're building something real.`}
          </Text>

          {/* ── Tracked habits ─────────────────────────────── */}
          <Text style={styles.sectionLabel}>Tracked habits</Text>

          {habits.length === 0 ? (
            <View style={styles.noHabitsCard}>
              <Text style={{ fontSize: rs(24), marginBottom: rs(6) }}>🌱</Text>
              <Text style={styles.noHabitsSub}>Add habits on the Today tab to track them here.</Text>
            </View>
          ) : (
            habits.map(h => {
              const count   = todayCompletions[h.id] || 0;
              const target  = h.targetCount || 1;
              const isDone  = count >= target;
              const pct     = (h.type === 'volume' || h.type === 'timer') ? Math.min(1, count / target) : (isDone ? 1 : 0);

              return (
                <View key={h.id} style={[styles.habitCard, isDone && styles.habitCardDone]}>
                  {/* Left: emoji + info */}
                  <View style={styles.habitCardEmoji}>
                    <AnimatedEmoji emoji={h.emoji} size={ms(24)} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: rs(4) }}>
                      <Text style={[styles.habitCardName, isDone && { color: C.success }]} numberOfLines={1}>
                        {h.name}
                      </Text>
                      {isDone && (
                        <View style={styles.doneTag}>
                          <Ionicons name="checkmark" size={rs(10)} color="#fff" />
                          <Text style={styles.doneTagText}>Done</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                      {/* Type pill */}
                      <View style={styles.typePill}>
                        <Text style={styles.typePillText}>
                          {h.type === 'volume'   ? `${count}/${target}×`
                         : h.type === 'timer'    ? `${count}/${target} min`
                         : h.type === 'negative' ? 'Avoid'
                         : 'Daily'}
                        </Text>
                      </View>
                      {/* Reminder indicator */}
                      {h.reminderTime && (
                        <View style={styles.reminderPill}>
                          <Ionicons name="alarm-outline" size={rs(10)} color={C.primary} />
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

                    {/* Progress bar for volume and timer habits */}
                    {(h.type === 'volume' || h.type === 'timer') && (
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, {
                          width: `${pct * 100}%`,
                          backgroundColor: isDone ? C.success : C.gold,
                        }]} />
                      </View>
                    )}
                  </View>

                  {/* Right: status icon */}
                  <View style={[styles.statusDot, { backgroundColor: isDone ? C.success : C.border }]}>
                    {isDone
                      ? <Ionicons name="checkmark" size={rs(14)} color="#fff" />
                      : <View style={{ width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: C.textMuted }} />
                    }
                  </View>
                </View>
              );
            })
          )}

          {/* Action buttons */}
          {canClaimReward && (
            <TouchableOpacity style={styles.claimBtn} onPress={claimReward}>
              <Text style={styles.claimBtnText}>🏆 Claim Your Reward</Text>
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
        title="Challenge Complete!"
        subtitle={`You crushed the "${challenge?.title}"!\nIncredible consistency — you should be proud.`}
        onClose={() => setRewardVisible(false)}
        type="challenge"
      />
    </SafeAreaView>
  );
}

function makeStyles(C) { return {
  root: { flex: 1, backgroundColor: C.bg },
  topRow: { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(8) },
  topLabel: { fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', textTransform: 'uppercase', letterSpacing: ls(11) },
  topTitle: { fontSize: ms(17), fontFamily: C.xbold, fontWeight: '800', color: C.text, marginTop: rs(2), letterSpacing: ls(17) },
  heroWrap: { paddingHorizontal: rs(16), marginBottom: rs(8) },
  heroCard: {
    borderRadius: rs(24), padding: rs(20),
    shadowColor: '#4F7C82', shadowOpacity: 0.35, shadowRadius: rs(20),
    shadowOffset: { width: 0, height: rs(8) }, elevation: 12,
  },
  heroStatsRow: { flexDirection: 'row', marginBottom: rs(12) },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: ms(26), fontFamily: C.xbold, fontWeight: '800', color: '#fff', letterSpacing: ls(26) },
  heroStatLabel: { fontSize: ms(10), color: 'rgba(255,255,255,0.65)', marginTop: rs(2), fontFamily: C.med, fontWeight: '500', letterSpacing: ls(10) },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: rs(4) },
  heroStatus: { fontSize: ms(12), color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12) },

  presetList:  { padding: rs(20), paddingBottom: rs(40) },
  pickLabel:   { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: ls(11), marginBottom: rs(14) },
  presetCard: {
    backgroundColor: C.card, borderRadius: rs(18), padding: rs(16),
    flexDirection: 'row', alignItems: 'center', gap: rs(14),
    borderWidth: 1, borderColor: C.border, marginBottom: rs(12),
  },
  presetIconWrap: {
    width: rs(52), height: rs(52), borderRadius: rs(16),
    backgroundColor: C.cardHigh, alignItems: 'center', justifyContent: 'center',
  },
  presetInfo:   { flex: 1 },
  presetTitle:  { fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', color: C.text, marginBottom: rs(2), letterSpacing: ls(15) },
  presetSub:    { fontSize: ms(12), color: C.textSub, marginBottom: rs(8), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(12) },
  presetMeta:   { flexDirection: 'row', gap: rs(8) },
  presetPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    backgroundColor: 'rgba(251,191,36,0.12)', borderRadius: rs(20),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
  },
  presetPillText: { fontSize: ms(10), fontFamily: C.semi, fontWeight: '600', color: C.gold, letterSpacing: ls(10) },

  noHabitsCard: {
    alignItems: 'center', backgroundColor: C.card, borderRadius: rs(18),
    padding: rs(24), borderWidth: 1, borderColor: C.border, marginTop: rs(8),
  },
  noHabitsTitle: { fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', color: C.text, marginBottom: rs(4), letterSpacing: ls(15) },
  noHabitsSub:   { fontSize: ms(13), color: C.textSub, textAlign: 'center', lineHeight: ms(20), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13) },

  body: { padding: rs(20), paddingBottom: 100 },
  daysRow: { flexDirection: 'row', gap: rs(8), justifyContent: 'center', marginBottom: rs(20), flexWrap: 'wrap' },
  dayCircle: {
    width: rs(44), height: rs(44), borderRadius: rs(22),
    borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  dayCircleDone: { backgroundColor: C.success, borderColor: C.success },
  dayNum:        { fontSize: ms(14), fontFamily: C.bold, fontWeight: '700', color: C.textMuted, letterSpacing: ls(14) },
  dayNumDone:    { color: '#fff' },
  motiveLine: {
    fontSize: ms(13), color: C.textSub, textAlign: 'center',
    marginBottom: rs(24), lineHeight: ms(20), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13),
  },
  sectionLabel: {
    fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textSub,
    textTransform: 'uppercase', letterSpacing: ls(11), marginBottom: rs(12),
  },

  habitCard: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: C.card, borderRadius: rs(16),
    padding: rs(14), marginBottom: rs(10),
    borderWidth: 1, borderColor: C.border,
  },
  habitCardDone: { borderColor: C.success, backgroundColor: '#141010' },
  habitCardEmoji: {
    width: rs(44), height: rs(44), borderRadius: rs(12),
    backgroundColor: C.cardHigh, alignItems: 'center', justifyContent: 'center',
  },
  habitCardName: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, flex: 1, marginRight: rs(6), letterSpacing: ls(14) },
  doneTag: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.success, borderRadius: rs(20),
    paddingHorizontal: rs(7), paddingVertical: rs(2),
  },
  doneTagText: { fontSize: ms(9), fontFamily: C.bold, fontWeight: '700', color: '#fff', letterSpacing: ls(9) },
  typePill: {
    backgroundColor: C.cardHigh, borderRadius: rs(20),
    paddingHorizontal: rs(8), paddingVertical: rs(2),
    borderWidth: 1, borderColor: C.border,
  },
  typePillText: { fontSize: ms(10), color: C.textSub, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(10) },
  reminderPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.primaryLight, borderRadius: rs(20),
    paddingHorizontal: rs(8), paddingVertical: rs(2),
  },
  reminderPillText: { fontSize: ms(10), color: C.primary, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(10) },
  progressTrack: {
    height: rs(3), backgroundColor: C.border,
    borderRadius: rs(2), overflow: 'hidden', marginTop: rs(6),
  },
  progressFill: { height: '100%', borderRadius: rs(2) },
  statusDot: {
    width: rs(28), height: rs(28), borderRadius: rs(14),
    alignItems: 'center', justifyContent: 'center',
  },

  claimBtn: {
    backgroundColor: C.gold, borderRadius: rs(16),
    padding: rs(18), alignItems: 'center', marginTop: rs(24),
  },
  claimBtnText: { fontSize: ms(15), fontFamily: C.xbold, fontWeight: '800', color: '#fff', letterSpacing: ls(15) },
  dismissBtn:   { marginTop: rs(16), alignItems: 'center' },
  dismissText:  { color: C.textMuted, fontSize: ms(12), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(12) },
}; }
