import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import { heatColor } from '../utils/heatmap';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n) { return n < 10 ? `0${n}` : `${n}`; }

// Builds an array of date strings (YYYY-MM-DD) representing the calendar grid
// for `year`/`month` (zero-indexed month). Pads with nulls for blank leading
// cells so the grid always starts on Sunday.
function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const leadBlanks = first.getDay();   // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < leadBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  }
  return cells;
}

export default function MonthCalendar({
  year, month,           // zero-indexed month
  completions, habits,
  notes,                 // { 'YYYY-MM-DD': string } — used for the note dot indicator
  onSelectDay,
  onChangeMonth,         // called with delta (+1 / -1)
  todayStr,
}) {
  const C = useTheme();
  const styles = makeStyles(C);

  const cells = buildGrid(year, month);
  const now = new Date();
  const isCurrentOrLater = (year > now.getFullYear()) ||
                           (year === now.getFullYear() && month >= now.getMonth());

  function pctForDay(dateStr) {
    if (!habits.length) return 0;
    const dayMap = completions[dateStr] || {};
    const done = habits.filter(h => (dayMap[h.id] || 0) >= (h.targetCount || 1)).length;
    return done / habits.length;
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{MONTH_NAMES[month]} {year}</Text>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => onChangeMonth?.(-1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={rs(16)} color={C.textSub} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, isCurrentOrLater && { opacity: 0.35 }]}
            onPress={() => !isCurrentOrLater && onChangeMonth?.(1)}
            disabled={isCurrentOrLater}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronRight size={rs(16)} color={C.textSub} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Day-of-week labels */}
      <View style={styles.weekRow}>
        {DAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.dayLabel}>{label}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {cells.map((dateStr, i) => {
          if (!dateStr) return <View key={i} style={styles.cell} />;
          const pct = pctForDay(dateStr);
          const isToday  = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const dayNum   = parseInt(dateStr.slice(-2), 10);

          const hasNote = !!(notes && notes[dateStr]);

          return (
            <TouchableOpacity
              key={i}
              style={styles.cell}
              onPress={() => !isFuture && onSelectDay?.(dateStr)}
              activeOpacity={isFuture ? 1 : 0.7}
              disabled={isFuture}
            >
              <View style={[
                styles.cellInner,
                { backgroundColor: isFuture ? 'transparent' : heatColor(pct, C) },
                isToday && styles.cellToday,
                isFuture && styles.cellFuture,
              ]}>
                <Text style={[
                  styles.dayNum,
                  pct >= 0.5 && !isFuture && { color: '#fff' },
                  isFuture && { color: C.textMuted },
                  isToday && { fontFamily: C.bold, fontWeight: '700' },
                ]}>
                  {dayNum}
                </Text>
                {hasNote && !isFuture && (
                  <View style={[
                    styles.noteDot,
                    // Contrast against dark fills — use white when the cell is filled-ish
                    pct >= 0.5 ? { backgroundColor: '#fff' } : { backgroundColor: C.primary },
                  ]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(C) { return {
  card: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    padding: rs(14),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(12) },
  title:  { fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', color: C.text, letterSpacing: ls(15) },
  navRow: { flexDirection: 'row', gap: rs(4) },
  navBtn: {
    width: rs(30), height: rs(30), borderRadius: rs(9),
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cardHigh,
  },
  weekRow: { flexDirection: 'row', marginBottom: rs(4) },
  dayLabel: {
    flex: 1, textAlign: 'center',
    fontSize: ms(10), color: C.textMuted,
    fontFamily: C.bold, fontWeight: '700',
    letterSpacing: 0.6, textTransform: 'uppercase',
    paddingVertical: rs(4),
  },
  grid:  { flexDirection: 'row', flexWrap: 'wrap' },
  cell:  { width: `${100 / 7}%`, aspectRatio: 1, padding: rs(2) },
  cellInner: {
    flex: 1, borderRadius: rs(8),
    alignItems: 'center', justifyContent: 'center',
  },
  cellToday:  { borderWidth: 1.5, borderColor: C.primary },
  cellFuture: { backgroundColor: 'transparent' },
  dayNum: {
    fontSize: ms(12), color: C.text,
    fontFamily: C.med, fontWeight: '500',
    letterSpacing: ls(12),
  },
  noteDot: {
    position: 'absolute', bottom: rs(3), alignSelf: 'center',
    width: rs(4), height: rs(4), borderRadius: rs(2),
  },
}; }
