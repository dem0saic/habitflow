import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
    if (pct < 0.33)   return C.primaryLight;
    if (pct < 0.67)   return C.primaryDark;
    if (pct < 1)      return C.primary;
    return C.success;
  }

  const CELL = rs(12);
  const GAP  = rs(3);
  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row' }}>
          {/* Day labels column */}
          <View style={{ paddingTop: rs(20), marginRight: GAP }}>
            {DAY_LABELS.map((label, i) => (
              <View key={i} style={{ width: rs(10), height: CELL, marginBottom: i < 6 ? GAP : 0, justifyContent: 'center' }}>
                <Text style={{ fontSize: ms(9), color: [1, 3, 5].includes(i) ? C.textMuted : 'transparent' }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
          {/* Week columns */}
          {grid.map(({ week, monthLabel }, w) => (
            <View key={w} style={{ marginRight: GAP }}>
              <Text style={{ fontSize: ms(9), color: monthLabel ? C.textSub : 'transparent', height: rs(18), lineHeight: rs(18) }}>
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
      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP, marginTop: rs(10), justifyContent: 'flex-end' }}>
        <Text style={{ fontSize: ms(9), color: C.textMuted }}>Less</Text>
        {[C.border, C.primaryLight, C.primaryDark, C.primary, C.success].map((color, i) => (
          <View key={i} style={{ width: CELL, height: CELL, borderRadius: rs(3), backgroundColor: color }} />
        ))}
        <Text style={{ fontSize: ms(9), color: C.textMuted }}>More</Text>
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

  return (
    <SafeAreaView style={styles.root}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.topLabel}>Stats</Text>
          <Text style={styles.topTitle}>Your consistency</Text>
        </View>
      </View>

      {/* Floating hero card */}
      <View style={styles.heroWrap}>
        <LinearGradient colors={['#061519', '#2A5E70']} style={styles.heroCard}>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{bestStreak}</Text>
              <Text style={styles.heroStatLabel}>Best streak</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{avgCompletion}%</Text>
              <Text style={styles.heroStatLabel}>7-day avg</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{perfectDays}</Text>
              <Text style={styles.heroStatLabel}>Perfect days</Text>
            </View>
          </View>
          <Text style={styles.heroStatus}>
            {bestStreak === 0
              ? 'Complete habits daily to build streaks'
              : bestStreak >= 7
              ? `🔥 ${bestStreak}-day streak — incredible!`
              : `🔥 Best streak: ${bestStreak} day${bestStreak !== 1 ? 's' : ''}`}
          </Text>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Contribution history</Text>
          <ContributionGraph completions={completions} habits={habits} C={C} />
        </View>

        <Text style={styles.sectionLabel}>Habit streaks</Text>
        {habits.length === 0 && <Text style={styles.empty}>Add habits to see streaks.</Text>}
        {habits.map(h => {
          const streak = calcStreak(h.id, completions);
          return (
            <View key={h.id} style={styles.streakRow}>
              <AnimatedEmoji emoji={h.emoji} size={rs(22)} style={{ marginRight: rs(12) }} />
              <View style={styles.streakInfo}>
                <Text style={styles.streakName}>{h.name}</Text>
                <Text style={styles.streakType}>{h.type === 'volume' ? `Volume · ${h.targetCount}× daily` : 'Daily'}</Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakNum}>{streak}</Text>
                <AnimatedEmoji emoji="🔥" size={rs(18)} />
              </View>
            </View>
          );
        })}

        {/* ── AI Coach ── */}
        <Text style={[styles.sectionLabel, { marginTop: rs(8) }]}>AI Coach</Text>
        <View style={styles.aiNudgeCard}>
          <View style={styles.aiNudgeHeader}>
            <Text style={styles.aiNudgeTitle}>✦ Today's nudge</Text>
            <TouchableOpacity onPress={refreshNudge} disabled={nudgeLoading} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="reload-outline" size={rs(16)} color={nudgeLoading ? C.textMuted : C.primary} />
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
            <Text style={styles.aiNudgeError}>Could not load nudge — tap ↺ to retry.</Text>
          )}
        </View>

        {/* ── Reflection reports ── */}
        <Text style={[styles.sectionLabel, { marginTop: rs(4) }]}>Reflection</Text>
        <View style={styles.reportButtons}>
          <TouchableOpacity
            style={[styles.reportBtn, reportPeriod === 'weekly' && styles.reportBtnActive]}
            onPress={() => loadReport('weekly')}
            disabled={reportLoading}
          >
            <Text style={[styles.reportBtnText, reportPeriod === 'weekly' && styles.reportBtnTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportBtn, reportPeriod === 'monthly' && styles.reportBtnActive]}
            onPress={() => loadReport('monthly')}
            disabled={reportLoading}
          >
            <Text style={[styles.reportBtnText, reportPeriod === 'monthly' && styles.reportBtnTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
        {(reportLoading || report) && (
          <View style={styles.reportCard}>
            <Text style={styles.reportPeriodLabel}>
              {reportPeriod === 'weekly' ? 'Weekly Reflection' : 'Monthly Reflection'}
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
  root: { flex: 1, backgroundColor: C.bg },
  topRow: { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(8) },
  topLabel: { fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', textTransform: 'uppercase', letterSpacing: ls(11) },
  topTitle: { fontSize: ms(17), fontFamily: C.xbold, fontWeight: '800', color: C.text, marginTop: rs(2), letterSpacing: ls(17) },
  heroWrap: { paddingHorizontal: rs(16), marginBottom: rs(8) },
  heroCard: {
    borderRadius: rs(24), padding: rs(24),
    shadowColor: '#F57B51', shadowOpacity: 0.4, shadowRadius: rs(24),
    shadowOffset: { width: 0, height: rs(8) }, elevation: 14,
  },
  heroStatsRow: { flexDirection: 'row', marginBottom: rs(16) },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: ms(38), fontFamily: C.xbold, fontWeight: '800', color: '#fff', letterSpacing: ls(26) },
  heroStatLabel: { fontSize: ms(11), color: 'rgba(255,255,255,0.6)', marginTop: rs(4), fontFamily: C.med, fontWeight: '500', letterSpacing: ls(11) },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: rs(6) },
  heroStatus: { fontSize: ms(12), color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12) },
  body: { padding: rs(20), paddingBottom: 100 },
  chartCard: {
    backgroundColor: C.card, borderRadius: rs(18), padding: rs(18), marginBottom: rs(20),
    borderWidth: 1, borderColor: C.border,
  },
  chartTitle: { fontSize: ms(13), fontFamily: C.bold, fontWeight: '700', color: C.text, marginBottom: rs(14), letterSpacing: ls(13) },
  sectionLabel: { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: ls(11), marginBottom: rs(12) },
  empty: { color: C.textSub, textAlign: 'center', fontSize: ms(13), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13) },
  streakRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: rs(16), padding: rs(16), marginBottom: rs(10),
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: rs(6),
    shadowOffset: { width: 0, height: rs(2) }, elevation: 1,
  },
  streakInfo: { flex: 1 },
  streakName: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14) },
  streakType: { fontSize: ms(11), color: C.textSub, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    backgroundColor: C.primary + '18', borderRadius: rs(12),
    paddingHorizontal: rs(10), paddingVertical: rs(6),
  },
  streakNum: { fontSize: ms(22), fontFamily: C.xbold, fontWeight: '800', color: C.primary, letterSpacing: ls(20) },
  aiNudgeCard: {
    backgroundColor: C.card, borderRadius: rs(18), padding: rs(18), marginBottom: rs(20),
    borderWidth: 1, borderColor: C.primary + '40',
  },
  aiNudgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(12) },
  aiNudgeTitle: { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: ls(11), textTransform: 'uppercase' },
  aiNudgeText: { fontSize: ms(14), fontFamily: C.reg, fontWeight: '400', color: C.text, lineHeight: ms(14) * 1.6, letterSpacing: ls(14) },
  aiNudgeError: { fontSize: ms(13), fontFamily: C.reg, fontWeight: '400', color: C.textMuted, letterSpacing: ls(13) },
  aiSkeleton: { gap: rs(8) },
  aiSkeletonLine: { height: rs(14), backgroundColor: C.border, borderRadius: rs(4) },
  reportButtons: { flexDirection: 'row', gap: rs(10), marginBottom: rs(14) },
  reportBtn: {
    flex: 1, paddingVertical: rs(10), borderRadius: rs(12),
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  reportBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  reportBtnText: { fontSize: ms(13), fontFamily: C.semi, fontWeight: '600', color: C.textSub, letterSpacing: ls(13) },
  reportBtnTextActive: { color: '#fff' },
  reportCard: {
    backgroundColor: C.card, borderRadius: rs(18), padding: rs(18), marginBottom: rs(20),
    borderWidth: 1, borderColor: C.primary + '40',
  },
  reportPeriodLabel: { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: ls(11), textTransform: 'uppercase', marginBottom: rs(10) },
  reportText: { fontSize: ms(14), fontFamily: C.reg, fontWeight: '400', color: C.text, lineHeight: ms(14) * 1.6, letterSpacing: ls(14) },
}; }
