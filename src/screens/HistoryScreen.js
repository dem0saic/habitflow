import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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

  return (
    <SafeAreaView style={styles.root}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.topLabel}>History</Text>
          <Text style={styles.topTitle}>Your progress log</Text>
        </View>
      </View>

      {/* Floating hero card */}
      <View style={styles.heroWrap}>
        <LinearGradient colors={['#071C22', '#2A5560']} style={styles.heroCard}>
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
              <Text style={styles.heroStatNum}>{weekAvg}%</Text>
              <Text style={styles.heroStatLabel}>This week</Text>
            </View>
          </View>
          <Text style={styles.heroStatus}>
            {totalDays === 0
              ? 'Start tracking to see your history'
              : perfectDays > 0
              ? `⭐ ${perfectDays} perfect day${perfectDays !== 1 ? 's' : ''} — keep it up!`
              : `📅 ${totalDays} day${totalDays !== 1 ? 's' : ''} of consistency`}
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.heatRow}>
        {days.map(d => {
          const pct = pctForDay(d);
          const isToday = d === new Date().toISOString().slice(0, 10);
          return (
            <View key={d} style={styles.heatCell}>
              <View style={[
                styles.heatBox,
                { backgroundColor: pct === 0 ? C.border : pct < 0.5 ? C.primaryLight : pct < 1 ? C.primary : C.success },
                isToday && styles.heatBoxToday,
              ]} />
              <Text style={[styles.heatLabel, isToday && { color: C.primary, fontWeight: '700' }]}>
                {new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        {[
          { color: C.border, label: '0%' },
          { color: C.primaryLight, label: '1–49%' },
          { color: C.primary, label: '50–99%' },
          { color: C.success, label: '100%' },
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
        ListEmptyComponent={<Text style={styles.empty}>No history yet — start tracking!</Text>}
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
              {pct >= 1 && <Text style={styles.perfectBadge}>Perfect</Text>}
            </View>
          );
        }}
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
    shadowColor: '#93B1B5', shadowOpacity: 0.35, shadowRadius: rs(20),
    shadowOffset: { width: 0, height: rs(8) }, elevation: 12,
  },
  heroStatsRow: { flexDirection: 'row', marginBottom: rs(12) },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: ms(26), fontFamily: C.xbold, fontWeight: '800', color: '#fff', letterSpacing: ls(26) },
  heroStatLabel: { fontSize: ms(10), color: 'rgba(255,255,255,0.65)', marginTop: rs(2), fontFamily: C.med, fontWeight: '500', letterSpacing: ls(10) },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: rs(4) },
  heroStatus: { fontSize: ms(12), color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontFamily: C.med, fontWeight: '500', letterSpacing: ls(12) },
  heatRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: rs(20), paddingTop: rs(20), paddingBottom: rs(10) },
  heatCell: { alignItems: 'center', gap: rs(6) },
  heatBox: { width: rs(34), height: rs(34), borderRadius: rs(10) },
  heatBoxToday: { borderWidth: 2, borderColor: C.primary },
  heatLabel: { fontSize: ms(11), color: C.textSub, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(11) },
  legend: { flexDirection: 'row', gap: rs(14), paddingHorizontal: rs(20), marginBottom: rs(16), flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  legendDot: { width: rs(12), height: rs(12), borderRadius: rs(3) },
  legendText: { fontSize: ms(11), color: C.textSub, fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  sectionLabel: { fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: ls(11), paddingHorizontal: rs(20), marginBottom: rs(10) },
  list: { paddingHorizontal: rs(20), paddingBottom: 100 },
  empty: { color: C.textSub, textAlign: 'center', marginTop: rs(24), fontSize: ms(13), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13) },
  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(14),
    padding: rs(14), marginBottom: rs(10),
    borderWidth: 1, borderColor: C.border,
  },
  dayDot: { width: rs(10), height: rs(10), borderRadius: rs(5), marginRight: rs(12) },
  dayInfo: { flex: 1 },
  dayDate: { fontSize: ms(14), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(14) },
  daySub: { fontSize: ms(11), color: C.textSub, marginTop: rs(2), fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(11) },
  perfectBadge: { fontSize: ms(10), fontFamily: C.bold, fontWeight: '700', color: C.success, backgroundColor: C.primaryLight, paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(8), letterSpacing: ls(10) },
}; }
