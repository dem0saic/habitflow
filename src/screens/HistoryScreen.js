import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { last7Days, formatDisplay } from '../utils/date';

export default function HistoryScreen() {
  const { state } = useStore();
  const C = useTheme();
  const styles = makeStyles(C);
  const { habits, completions } = state;
  const days = last7Days().reverse();

  function pctForDay(dateStr) {
    if (!habits.length) return 0;
    const dayMap = completions[dateStr] || {};
    const done = habits.filter(h => (dayMap[h.id] || 0) >= (h.targetCount || 1)).length;
    return done / habits.length;
  }

  const allDates = Object.keys(completions)
    .filter(d => Object.values(completions[d] || {}).some(v => v > 0))
    .sort((a, b) => b.localeCompare(a));

  const totalDays = allDates.length;
  const perfectDays = allDates.filter(d => {
    if (!habits.length) return false;
    const dayMap = completions[d] || {};
    return habits.every(h => (dayMap[h.id] || 0) >= (h.targetCount || 1));
  }).length;

  const weekPcts = days.map(d => {
    const dayMap = completions[d] || {};
    const done = habits.filter(h => (dayMap[h.id] || 0) >= (h.targetCount || 1)).length;
    return habits.length ? done / habits.length : 0;
  });
  const weekAvg = weekPcts.length ? Math.round(weekPcts.reduce((s, p) => s + p, 0) / weekPcts.length * 100) : 0;

  function cellColor(pct) {
    if (pct === 0)   return C.border;
    if (pct < 0.5)   return C.primarySoft;
    if (pct < 1)     return C.primary;
    return C.success;
  }

  const statusText = totalDays === 0
    ? 'Start tracking to see your history'
    : perfectDays > 0
    ? `${perfectDays} perfect day${perfectDays !== 1 ? 's' : ''} — keep it up`
    : `${totalDays} day${totalDays !== 1 ? 's' : ''} of consistency`;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topRow}>
        <Text style={styles.topLabel}>History</Text>
        <Text style={styles.topTitle}>Your progress log</Text>
      </View>

      {/* Hero card */}
      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopLine} />
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{totalDays}</Text>
              <Text style={styles.heroStatLabel}>Days tracked</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{perfectDays}</Text>
              <Text style={styles.heroStatLabel}>Perfect days</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{weekAvg}<Text style={styles.heroStatUnit}>%</Text></Text>
              <Text style={styles.heroStatLabel}>This week</Text>
            </View>
          </View>
          <Text style={styles.heroStatus}>{statusText}</Text>
        </View>
      </View>

      {/* 7-day heat row */}
      <View style={styles.heatRow}>
        {days.map(d => {
          const pct = pctForDay(d);
          const isToday = d === new Date().toISOString().slice(0, 10);
          return (
            <View key={d} style={styles.heatCell}>
              <View style={[
                styles.heatBox,
                { backgroundColor: cellColor(pct) },
                isToday && styles.heatBoxToday,
              ]} />
              <Text style={[styles.heatLabel, isToday && { color: C.primary, fontFamily: C.bold }]}>
                {new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        {[
          { color: C.border,       label: '0%' },
          { color: C.primarySoft,  label: '1–49%' },
          { color: C.primary,      label: '50–99%' },
          { color: C.success,      label: '100%' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>All logged days</Text>
      <FlatList
        data={allDates}
        keyExtractor={d => d}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>No history yet — start tracking</Text>}
        renderItem={({ item: d }) => {
          const dayMap = completions[d] || {};
          const done = habits.filter(h => (dayMap[h.id] || 0) >= (h.targetCount || 1));
          const pct = habits.length ? done.length / habits.length : 0;
          return (
            <View style={styles.dayRow}>
              <View style={[styles.dayDot, { backgroundColor: pct >= 1 ? C.success : pct > 0 ? C.primary : C.border }]} />
              <View style={styles.dayInfo}>
                <Text style={styles.dayDate}>{formatDisplay(d)}</Text>
                <Text style={styles.daySub}>{done.length}/{habits.length} habits · {Math.round(pct * 100)}%</Text>
              </View>
              {pct >= 1 && (
                <View style={styles.perfectBadge}>
                  <Text style={styles.perfectBadgeText}>PERFECT</Text>
                </View>
              )}
            </View>
          );
        }}
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
  heroStatUnit:    { fontSize: ms(16), fontFamily: C.semi, fontWeight: '600', color: C.textMuted, letterSpacing: 0 },
  heroStatLabel:   { fontSize: ms(11), color: C.textMuted, marginTop: rs(2), fontFamily: C.med, fontWeight: '500', letterSpacing: 0.4, textTransform: 'uppercase' },
  heroStatDivider: { width: 1, backgroundColor: C.borderStrong, marginVertical: rs(8) },
  heroStatus:      { fontSize: ms(12), color: C.textSub, textAlign: 'center', fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12) },

  heatRow:      { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: rs(20), paddingTop: rs(20), paddingBottom: rs(10) },
  heatCell:     { alignItems: 'center', gap: rs(6) },
  heatBox:      { width: rs(32), height: rs(32), borderRadius: rs(8) },
  heatBoxToday: { borderWidth: 1.5, borderColor: C.primary },
  heatLabel:    { fontSize: ms(11), color: C.textMuted, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(11) },

  legend:     { flexDirection: 'row', gap: rs(14), paddingHorizontal: rs(20), marginBottom: rs(20), flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  legendDot:  { width: rs(12), height: rs(12), borderRadius: rs(3) },
  legendText: { fontSize: ms(11), color: C.textMuted, fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },

  sectionLabel: {
    fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: rs(20), marginBottom: rs(10),
  },
  list:  { paddingHorizontal: rs(20), paddingBottom: rs(100) },
  empty: { color: C.textMuted, textAlign: 'center', marginTop: rs(24), fontSize: ms(13), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13) },

  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(12),
    padding: rs(14), marginBottom: rs(8),
    borderWidth: 1, borderColor: C.border,
  },
  dayDot:  { width: rs(8), height: rs(8), borderRadius: rs(4), marginRight: rs(12) },
  dayInfo: { flex: 1 },
  dayDate: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14) },
  daySub:  { fontSize: ms(11), color: C.textMuted, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  perfectBadge: {
    backgroundColor: C.successSoft, borderRadius: rs(6),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
  },
  perfectBadgeText: { fontSize: ms(9), fontFamily: C.bold, fontWeight: '700', color: C.success, letterSpacing: 0.6 },
}; }
