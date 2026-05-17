import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { todayKey } from '../utils/date';
import StatTile from '../components/StatTile';
import MonthCalendar from '../components/MonthCalendar';
import PastDayLogSheet from '../components/PastDayLogSheet';
import { lightTap } from '../utils/haptics';

function pad(n) { return n < 10 ? `0${n}` : `${n}`; }

export default function HistoryScreen() {
  const { state } = useStore();
  const C = useTheme();
  const styles = makeStyles(C);
  const { habits, completions, notes } = state;
  const today = todayKey();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [editDate, setEditDate] = useState(null);

  function changeMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 0)  { m = 11; y -= 1; }
    if (m > 11) { m = 0;  y += 1; }
    setYear(y);
    setMonth(m);
  }

  function openLogger(dateStr) {
    if (dateStr > today) return;
    lightTap();
    setEditDate(dateStr);
  }

  // Stats for the currently-viewed month
  const monthStats = useMemo(() => {
    const prefix = `${year}-${pad(month + 1)}-`;
    const monthDates = Object.keys(completions).filter(d => d.startsWith(prefix));
    const trackedDays = monthDates.filter(d =>
      Object.values(completions[d] || {}).some(v => v > 0)
    );
    const perfectDays = monthDates.filter(d => {
      if (!habits.length) return false;
      const dayMap = completions[d] || {};
      return habits.every(h => (dayMap[h.id] || 0) >= (h.targetCount || 1));
    });

    let avg = 0;
    if (trackedDays.length > 0 && habits.length > 0) {
      const sum = trackedDays.reduce((acc, d) => {
        const dayMap = completions[d] || {};
        const done = habits.filter(h => (dayMap[h.id] || 0) >= (h.targetCount || 1)).length;
        return acc + (done / habits.length);
      }, 0);
      avg = Math.round((sum / trackedDays.length) * 100);
    }
    return {
      tracked: trackedDays.length,
      perfect: perfectDays.length,
      avg,
    };
  }, [year, month, completions, habits]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: rs(100) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.topLabel}>History</Text>
          <Text style={styles.topTitle}>Your progress log</Text>
        </View>

        {/* Month calendar */}
        <View style={styles.section}>
          <MonthCalendar
            year={year}
            month={month}
            completions={completions}
            habits={habits}
            notes={notes}
            onSelectDay={openLogger}
            onChangeMonth={changeMonth}
            todayStr={today}
          />
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.border }]} />
            <Text style={styles.legendText}>None</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.primarySoft }]} />
            <Text style={styles.legendText}>{'< 50%'}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.primary }]} />
            <Text style={styles.legendText}>{'< 100%'}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.success }]} />
            <Text style={styles.legendText}>Perfect</Text>
          </View>
        </View>

        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>Tap any past day to log or add a note · dotted days have notes</Text>
        </View>

        {/* This month stats */}
        <Text style={styles.sectionLabel}>This month</Text>
        <View style={styles.statStrip}>
          <StatTile value={monthStats.tracked} label="DAYS TRACKED" compact />
          <StatTile value={monthStats.perfect} label="PERFECT" accent={C.success} compact />
          <StatTile value={`${monthStats.avg}%`} label="AVG COMPLETE" accent={C.primary} compact />
        </View>
      </ScrollView>

      <PastDayLogSheet
        visible={editDate != null}
        date={editDate}
        onClose={() => setEditDate(null)}
      />
    </SafeAreaView>
  );
}

function makeStyles(C) { return {
  root:     { flex: 1, backgroundColor: C.bg },
  topRow:   { paddingHorizontal: rs(20), paddingTop: rs(8), paddingBottom: rs(16) },
  topLabel: { fontSize: ms(11), color: C.textMuted, fontFamily: C.semi, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  topTitle: { fontSize: ms(22), fontFamily: C.bold, fontWeight: '700', color: C.text, marginTop: rs(4), letterSpacing: ls(22) },

  section: { paddingHorizontal: rs(16), marginBottom: rs(14) },

  legendRow: {
    flexDirection: 'row', gap: rs(14), flexWrap: 'wrap',
    paddingHorizontal: rs(20), marginBottom: rs(10),
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  legendDot:  { width: rs(10), height: rs(10), borderRadius: rs(3) },
  legendText: { fontSize: ms(10), color: C.textMuted, fontFamily: C.med, fontWeight: '500', letterSpacing: ls(10) },

  tapHint: { paddingHorizontal: rs(20), marginBottom: rs(20) },
  tapHintText: { fontSize: ms(11), color: C.textMuted, fontFamily: C.reg, fontWeight: '400', fontStyle: 'italic', letterSpacing: ls(11) },

  sectionLabel: {
    fontSize: ms(11), fontFamily: C.bold, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: rs(10), marginLeft: rs(20),
  },
  statStrip: {
    flexDirection: 'row', gap: rs(8),
    paddingHorizontal: rs(16), marginBottom: rs(16),
  },
}; }
