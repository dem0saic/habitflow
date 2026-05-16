import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCw, Sparkles } from 'lucide-react-native';
import { useStore, calcStreak } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { last7Days } from '../utils/date';
import AnimatedEmoji from '../components/AnimatedEmoji';
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

  function cellColor(pct) {
    if (pct === null) return 'transparent';
    if (pct === 0)    return C.border;
    if (pct < 0.33)   return C.primarySoft;
    if (pct < 0.67)   return C.primaryMuted;
    if (pct < 1)      return C.primary;
    return C.success;
  }

  const CELL = rs(12);
  const GAP  = rs(3);
  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const RAMP = [C.border, C.primarySoft, C.primaryMuted, C.primary, C.success];

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
                    backgroundColor: cell.isFuture ? 'transparent' : cellColor(cell.pct),
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

  const perfectDays = Object.keys(completions).filter(d => {
    if (!habits.length) return false;
    const dayMap = completions[d] || {};
    return habits.every(h => (dayMap[h.id] || 0) >= (h.targetCount || 1));
  }).length;

  const avgCompletion = weekPcts.length
    ? Math.round(weekPcts.reduce((sum, p) => sum + p, 0) / weekPcts.length * 100)
    : 0;

  const bestStreak = habits.length
    ? Math.max(...habits.map(h => calcStreak(h.id, completions)), 0)
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

  const statusText = bestStreak === 0
    ? 'Complete habits daily to build streaks'
    : bestStreak >= 7
    ? `${bestStreak}-day streak — incredible`
    : `Best streak: ${bestStreak} day${bestStreak !== 1 ? 's' : ''}`;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topRow}>
        <Text style={styles.topLabel}>Stats</Text>
        <Text style={styles.topTitle}>Your consistency</Text>
      </View>

      {/* Hero */}
      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopLine} />
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{bestStreak}</Text>
              <Text style={styles.heroStatLabel}>Best streak</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{avgCompletion}<Text style={styles.heroStatUnit}>%</Text></Text>
              <Text style={styles.heroStatLabel}>7-day avg</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{perfectDays}</Text>
              <Text style={styles.heroStatLabel}>Perfect days</Text>
            </View>
          </View>
          <Text style={styles.heroStatus}>{statusText}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Contribution graph */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Contribution history</Text>
          <ContributionGraph completions={completions} habits={habits} C={C} />
        </View>

        {/* Habit streaks */}
        <Text style={styles.sectionLabel}>Habit streaks</Text>
        {habits.length === 0 && <Text style={styles.empty}>Add habits to see streaks</Text>}
        {habits.map(h => {
          const streak = calcStreak(h.id, completions);
          return (
            <View key={h.id} style={styles.streakRow}>
              <View style={styles.streakEmojiTile}>
                <AnimatedEmoji emoji={h.emoji} size={rs(20)} />
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakName} numberOfLines={1}>{h.name}</Text>
                <Text style={styles.streakType}>
                  {h.type === 'volume' ? `Volume · ${h.targetCount}× daily`
                 : h.type === 'timer'  ? `Timer · ${h.targetCount} min daily`
                 : h.type === 'negative' ? 'Avoidance habit'
                 : 'Daily habit'}
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakNum}>{streak}</Text>
                <Text style={styles.streakUnit}>day{streak !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          );
        })}

        {/* AI Coach */}
        <Text style={[styles.sectionLabel, { marginTop: rs(8) }]}>AI Coach</Text>
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
        <Text style={[styles.sectionLabel, { marginTop: rs(4) }]}>Reflection</Text>
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
      </ScrollView>
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
  heroStatUnit:    { fontSize: ms(16), fontFamily: C.semi, fontWeight: '600', color: C.textMuted, letterSpacing: 0 },
  heroStatLabel:   { fontSize: ms(11), color: C.textMuted, marginTop: rs(2), fontFamily: C.med, fontWeight: '500', letterSpacing: 0.4, textTransform: 'uppercase' },
  heroStatDivider: { width: 1, backgroundColor: C.borderStrong, marginVertical: rs(8) },
  heroStatus:      { fontSize: ms(12), color: C.textSub, textAlign: 'center', fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12) },

  body: { padding: rs(20), paddingBottom: rs(100) },
  chartCard: {
    backgroundColor: C.card, borderRadius: rs(14), padding: rs(16), marginBottom: rs(20),
    borderWidth: 1, borderColor: C.border,
  },
  chartTitle:   { fontSize: ms(12), fontFamily: C.bold, fontWeight: '700', color: C.textMuted, marginBottom: rs(14), textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionLabel: { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: rs(12) },
  empty:        { color: C.textMuted, textAlign: 'center', fontSize: ms(13), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13) },

  streakRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: C.card,
    borderRadius: rs(14), padding: rs(14), marginBottom: rs(8),
    borderWidth: 1, borderColor: C.border,
  },
  streakEmojiTile: {
    width: rs(38), height: rs(38), borderRadius: rs(11),
    backgroundColor: C.cardHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  streakInfo: { flex: 1 },
  streakName: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14) },
  streakType: { fontSize: ms(11), color: C.textMuted, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  streakBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: rs(4),
    backgroundColor: C.primarySoft, borderRadius: rs(10),
    paddingHorizontal: rs(10), paddingVertical: rs(6),
  },
  streakNum:  { fontSize: ms(18), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: ls(18) },
  streakUnit: { fontSize: ms(10), fontFamily: C.med, fontWeight: '500', color: C.primary, letterSpacing: 0.2 },

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
