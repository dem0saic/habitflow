import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCw, Sparkles, Flame, Shield } from 'lucide-react-native';
import { useStore, calcStreak, consistency30 } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { last7Days, formatDisplay } from '../utils/date';
import { isPaused, shieldUsage } from '../utils/streak';
import { heatRamp, rampSwatches } from '../utils/heatmap';
import AnimatedEmoji from '../components/AnimatedEmoji';
import StatTile from '../components/StatTile';
import { fetchCoachingNudge, fetchReflectionSummary } from '../lib/aiCoaching';

function ContributionGraph({ completions, habits, C }) {
  const WEEKS = 16;
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date();

  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

  const grid = [];
  for (let w = 0; w < WEEKS; w++) {
    let monthLabel = null;
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const dateStr = date.toISOString().slice(0, 10);
      if (d === 0 && date.getDate() <= 7) {
        monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      }
      const isFuture = dateStr > todayStr;
      const dayMap = isFuture ? {} : (completions[dateStr] || {});
      const done = habits.filter(h => (dayMap[h.id] || 0) >= (h.targetCount || 1)).length;
      const pct = isFuture ? null : (habits.length ? done / habits.length : 0);
      week.push({ pct, isFuture });
    }
    grid.push({ week, monthLabel });
  }

  const CELL = rs(12);
  const GAP  = rs(3);
  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const RAMP = rampSwatches(C);

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ paddingTop: rs(20), marginRight: GAP }}>
            {DAY_LABELS.map((label, i) => (
              <View key={i} style={{ width: rs(10), height: CELL, marginBottom: i < 6 ? GAP : 0, justifyContent: 'center' }}>
                <Text style={{ fontSize: ms(9), color: [1, 3, 5].includes(i) ? C.textMuted : 'transparent' }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
          {grid.map(({ week, monthLabel }, w) => (
            <View key={w} style={{ marginRight: GAP }}>
              <Text style={{ fontSize: ms(9), color: monthLabel ? C.textMuted : 'transparent', height: rs(18), lineHeight: rs(18), fontFamily: C.med }}>
                {monthLabel || ' '}
              </Text>
              {week.map((cell, d) => (
                <View
                  key={d}
                  style={{
                    width: CELL, height: CELL, borderRadius: rs(3),
                    backgroundColor: cell.isFuture ? 'transparent' : heatRamp(cell.pct, C),
                    marginBottom: d < 6 ? GAP : 0,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP, marginTop: rs(12), justifyContent: 'flex-end' }}>
        <Text style={{ fontSize: ms(9), color: C.textMuted, fontFamily: C.med, marginRight: rs(2) }}>Less</Text>
        {RAMP.map((color, i) => (
          <View key={i} style={{ width: CELL, height: CELL, borderRadius: rs(3), backgroundColor: color }} />
        ))}
        <Text style={{ fontSize: ms(9), color: C.textMuted, fontFamily: C.med, marginLeft: rs(2) }}>More</Text>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const { state } = useStore();
  const C = useTheme();
  const styles = makeStyles(C);
  const { habits, completions } = state;

  const days = last7Days();
  const weekPcts = days.map(d => {
    const dayMap = completions[d] || {};
    const done = habits.filter(h => (dayMap[h.id] || 0) >= (h.targetCount || 1)).length;
    return habits.length ? done / habits.length : 0;
  });

  const totalDaysTracked = Object.keys(completions).filter(d =>
    Object.values(completions[d] || {}).some(v => v > 0)
  ).length;

  const perfectDays = Object.keys(completions).filter(d => {
    if (!habits.length) return false;
    const dayMap = completions[d] || {};
    return habits.every(h => (dayMap[h.id] || 0) >= (h.targetCount || 1));
  }).length;

  const avgCompletion = weekPcts.length
    ? Math.round(weekPcts.reduce((sum, p) => sum + p, 0) / weekPcts.length * 100)
    : 0;

  const bestStreak = habits.length
    ? Math.max(...habits.map(h => calcStreak(h, completions, state.globalPause)), 0)
    : 0;

  const [nudge, setNudge] = useState(null);
  const [nudgeLoading, setNudgeLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchCoachingNudge()
      .then(content => { if (mounted) setNudge(content); })
      .catch(() => {})
      .finally(() => { if (mounted) setNudgeLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function refreshNudge() {
    setNudgeLoading(true);
    try { setNudge(await fetchCoachingNudge()); } catch (_) {}
    setNudgeLoading(false);
  }

  async function loadReport(period) {
    if (reportPeriod === period && report && !reportLoading) return;
    setReportPeriod(period);
    setReport(null);
    setReportLoading(true);
    try { setReport(await fetchReflectionSummary(period)); } catch (_) {}
    setReportLoading(false);
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: rs(100) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.topLabel}>Stats</Text>
          <Text style={styles.topTitle}>Your consistency</Text>
        </View>

        {/* 2×2 stat bento */}
        <View style={styles.bento}>
          <View style={styles.bentoRow}>
            <StatTile value={bestStreak} label="BEST STREAK" Icon={Flame} accent={C.primary} />
            <StatTile value={`${avgCompletion}%`} label="7-DAY AVG" accent={C.text} />
          </View>
          <View style={styles.bentoRow}>
            <StatTile value={totalDaysTracked} label="DAYS TRACKED" accent={C.text} />
            <StatTile value={perfectDays} label="PERFECT DAYS" accent={C.success} />
          </View>
        </View>

        <View style={styles.body}>
          {/* Contribution graph */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>CONTRIBUTION HISTORY</Text>
            <ContributionGraph completions={completions} habits={habits} C={C} />
          </View>

          {/* Per-habit streaks */}
          <Text style={styles.sectionLabel}>Habit streaks</Text>
          {habits.length === 0 && <Text style={styles.empty}>Add habits to see streaks</Text>}
          {habits.map(h => {
            const streak = calcStreak(h, completions, state.globalPause);
            const trajectory = consistency30(h, completions, state.globalPause);
            const shields = shieldUsage(h, completions, state.globalPause);
            const todayStr = new Date().toISOString().slice(0, 10);
            const paused = isPaused(h, todayStr, state.globalPause);
            const activePause = paused
              ? (state.globalPause && state.globalPause.start <= todayStr && todayStr <= state.globalPause.end
                  ? state.globalPause
                  : (h.pauses || []).find(p => p.start <= todayStr && todayStr <= p.end))
              : null;
            const typeLabel =
              h.type === 'volume' ? `Volume · ${h.targetCount}× daily`
            : h.type === 'timer'  ? `Timer · ${h.targetCount} min daily`
            : h.type === 'negative' ? 'Avoidance habit'
            : 'Daily habit';
            return (
              <View key={h.id} style={styles.streakRow}>
                <View style={styles.streakEmojiTile}>
                  <AnimatedEmoji emoji={h.emoji} size={rs(20)} />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakName} numberOfLines={1}>{h.name}</Text>
                  <Text style={styles.streakType} numberOfLines={1}>
                    {activePause
                      ? `Paused through ${formatDisplay(activePause.end)}`
                      : trajectory.eligible > 0
                        ? `${typeLabel} · ${trajectory.done}/${trajectory.eligible} last 30d`
                        : typeLabel}
                  </Text>
                </View>
                <View style={styles.streakBadgeCol}>
                  <View style={styles.streakRowRight}>
                    {shields.used > 0 && !activePause && (
                      <View style={[
                        styles.shieldPill,
                        shields.remaining === 0
                          ? { backgroundColor: C.dangerSoft }
                          : { backgroundColor: C.warningSoft },
                      ]}>
                        <Shield
                          size={rs(10)}
                          color={shields.remaining === 0 ? C.danger : C.warning}
                          strokeWidth={2.5}
                        />
                        <Text style={[
                          styles.shieldPillText,
                          { color: shields.remaining === 0 ? C.danger : C.warning },
                        ]}>
                          {shields.used}/{shields.total}
                        </Text>
                      </View>
                    )}
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakNum}>{streak}</Text>
                      <Text style={styles.streakUnit}>day{streak !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                  {trajectory.eligible > 0 && !activePause && (
                    <Text style={styles.trajectoryPct}>{trajectory.percent}% consistency</Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* AI Coach */}
          <Text style={[styles.sectionLabel, { marginTop: rs(20) }]}>AI Coach</Text>
          <View style={styles.aiNudgeCard}>
            <View style={styles.aiNudgeHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                <Sparkles size={rs(13)} color={C.primary} strokeWidth={2.5} />
                <Text style={styles.aiNudgeTitle}>TODAY'S NUDGE</Text>
              </View>
              <TouchableOpacity onPress={refreshNudge} disabled={nudgeLoading} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <RotateCw size={rs(15)} color={nudgeLoading ? C.textMuted : C.primary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {nudgeLoading ? (
              <View style={styles.aiSkeleton}>
                <View style={[styles.aiSkeletonLine, { width: '95%' }]} />
                <View style={[styles.aiSkeletonLine, { width: '80%' }]} />
                <View style={[styles.aiSkeletonLine, { width: '62%' }]} />
              </View>
            ) : nudge ? (
              <Text style={styles.aiNudgeText}>{nudge}</Text>
            ) : (
              <Text style={styles.aiNudgeError}>Could not load nudge — tap to retry</Text>
            )}
          </View>

          {/* Reflection reports */}
          <Text style={styles.sectionLabel}>Reflection</Text>
          <View style={styles.reportButtons}>
            <TouchableOpacity
              style={[styles.reportBtn, reportPeriod === 'weekly' && styles.reportBtnActive]}
              onPress={() => loadReport('weekly')}
              disabled={reportLoading}
              activeOpacity={0.85}
            >
              <Text style={[styles.reportBtnText, reportPeriod === 'weekly' && styles.reportBtnTextActive]}>
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reportBtn, reportPeriod === 'monthly' && styles.reportBtnActive]}
              onPress={() => loadReport('monthly')}
              disabled={reportLoading}
              activeOpacity={0.85}
            >
              <Text style={[styles.reportBtnText, reportPeriod === 'monthly' && styles.reportBtnTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>
          </View>
          {(reportLoading || report) && (
            <View style={styles.reportCard}>
              <Text style={styles.reportPeriodLabel}>
                {reportPeriod === 'weekly' ? 'WEEKLY REFLECTION' : 'MONTHLY REFLECTION'}
              </Text>
              {reportLoading ? (
                <View style={styles.aiSkeleton}>
                  <View style={[styles.aiSkeletonLine, { width: '100%' }]} />
                  <View style={[styles.aiSkeletonLine, { width: '90%' }]} />
                  <View style={[styles.aiSkeletonLine, { width: '85%' }]} />
                  <View style={[styles.aiSkeletonLine, { width: '70%' }]} />
                </View>
              ) : (
                <Text style={styles.reportText}>{report}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) { return {
  root:     { flex: 1, backgroundColor: C.bg },
  topRow:   { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(16) },
  topLabel: { fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  topTitle: { fontSize: ms(22), fontFamily: C.bold, fontWeight: '700', color: C.text, marginTop: rs(4), letterSpacing: ls(22) },

  // 2x2 bento
  bento:    { paddingHorizontal: rs(16), gap: rs(8), marginBottom: rs(16) },
  bentoRow: { flexDirection: 'row', gap: rs(8) },

  body: { paddingHorizontal: rs(16) },

  chartCard: {
    backgroundColor: C.card, borderRadius: rs(14), padding: rs(16), marginBottom: rs(20),
    borderWidth: 1, borderColor: C.border,
  },
  chartTitle: { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textMuted, marginBottom: rs(12), letterSpacing: 0.8 },

  sectionLabel: { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: rs(10), marginLeft: rs(4) },
  empty:        { color: C.textMuted, textAlign: 'center', fontSize: ms(13), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13) },

  streakRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: C.card,
    borderRadius: rs(14), padding: rs(14), marginBottom: rs(8),
    borderWidth: 1, borderColor: C.border,
  },
  streakEmojiTile: {
    width: rs(40), height: rs(40), borderRadius: rs(11),
    backgroundColor: C.cardHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  streakInfo: { flex: 1 },
  streakName: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14) },
  streakType: { fontSize: ms(11), color: C.textMuted, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  streakBadgeCol: { alignItems: 'flex-end', gap: rs(4) },
  streakRowRight: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  streakBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: rs(4),
    backgroundColor: C.primarySoft, borderRadius: rs(10),
    paddingHorizontal: rs(10), paddingVertical: rs(6),
  },
  streakNum:  { fontSize: ms(18), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: ls(18) },
  streakUnit: { fontSize: ms(10), fontFamily: C.med, fontWeight: '500', color: C.primary, letterSpacing: 0.2 },
  trajectoryPct: { fontSize: ms(10), fontFamily: C.med, fontWeight: '500', color: C.textMuted, letterSpacing: ls(10) },
  shieldPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    borderRadius: rs(8), paddingHorizontal: rs(6), paddingVertical: rs(3),
  },
  shieldPillText: { fontSize: ms(10), fontFamily: C.bold, fontWeight: '700', letterSpacing: 0.4 },

  aiNudgeCard: {
    backgroundColor: C.card, borderRadius: rs(14), padding: rs(16), marginBottom: rs(20),
    borderWidth: 1, borderColor: C.primary,
  },
  aiNudgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(12) },
  aiNudgeTitle:  { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: 0.8 },
  aiNudgeText:   { fontSize: ms(14), fontFamily: C.reg, fontWeight: '400', color: C.text, lineHeight: ms(14) * 1.6, letterSpacing: ls(14) },
  aiNudgeError:  { fontSize: ms(13), fontFamily: C.reg, fontWeight: '400', color: C.textMuted, letterSpacing: ls(13) },

  aiSkeleton:     { gap: rs(8) },
  aiSkeletonLine: { height: rs(12), backgroundColor: C.border, borderRadius: rs(4) },

  reportButtons: { flexDirection: 'row', gap: rs(10), marginBottom: rs(14) },
  reportBtn: {
    flex: 1, paddingVertical: rs(11), borderRadius: rs(10),
    borderWidth: 1, borderColor: C.borderStrong, alignItems: 'center',
    backgroundColor: C.card,
  },
  reportBtnActive:     { backgroundColor: C.primary, borderColor: C.primary },
  reportBtnText:       { fontSize: ms(13), fontFamily: C.semi, fontWeight: '600', color: C.textSub, letterSpacing: ls(13) },
  reportBtnTextActive: { color: '#fff' },

  reportCard: {
    backgroundColor: C.card, borderRadius: rs(14), padding: rs(16), marginBottom: rs(20),
    borderWidth: 1, borderColor: C.primary,
  },
  reportPeriodLabel: { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: 0.8, marginBottom: rs(10) },
  reportText:        { fontSize: ms(14), fontFamily: C.reg, fontWeight: '400', color: C.text, lineHeight: ms(14) * 1.6, letterSpacing: ls(14) },
}; }
