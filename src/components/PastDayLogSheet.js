import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, ScrollView,
} from 'react-native';
import { Check, Minus, Plus, Ban, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { useStore } from '../store';
import { rs, ms, ls } from '../utils/responsive';
import { formatDisplay } from '../utils/date';
import AnimatedEmoji from './AnimatedEmoji';
import { lightTap } from '../utils/haptics';

export default function PastDayLogSheet({ visible, date, onClose }) {
  const C = useTheme();
  const { state, dispatch } = useStore();
  const styles = makeStyles(C);

  if (!date) return null;

  const { habits, completions } = state;
  const dayMap = completions[date] || {};

  function toggle(habit) {
    lightTap();
    dispatch({ type: 'LOG_HABIT', id: habit.id, date });
  }

  function bump(habit, delta) {
    lightTap();
    dispatch({ type: 'LOG_HABIT', id: habit.id, date, delta });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>LOGGING FOR</Text>
            <Text style={styles.headerDate}>{formatDisplay(date)}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ maxHeight: rs(440) }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: rs(36), marginBottom: rs(10) }}>🌱</Text>
              <Text style={styles.emptyText}>No habits to log</Text>
            </View>
          ) : (
            habits.map(habit => {
              const target = habit.targetCount || 1;
              const count  = dayMap[habit.id] || 0;
              const isDone = count >= target;
              const isNegative = habit.type === 'negative';

              if (habit.type === 'volume' || habit.type === 'timer') {
                const unit = habit.type === 'timer' ? ' min' : '×';
                const delta = habit.type === 'timer' ? 5 : 1;
                return (
                  <View key={habit.id} style={[styles.row, isDone && styles.rowDone]}>
                    <View style={[styles.emojiTile, isDone && { backgroundColor: C.successSoft }]}>
                      <AnimatedEmoji emoji={habit.emoji} size={rs(20)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>
                        {habit.name}
                      </Text>
                      <Text style={styles.targetText}>
                        {count}<Text style={{ color: C.textMuted }}>/{target}{unit}</Text>
                      </Text>
                    </View>
                    <View style={styles.counter}>
                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => bump(habit, -delta)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Minus size={rs(15)} color={C.textSub} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.counterBtn, styles.counterBtnPlus]}
                        onPress={() => bump(habit, delta)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Plus size={rs(15)} color="#fff" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              // daily / negative
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.row,
                    isDone && styles.rowDone,
                    isNegative && !isDone && styles.rowNegative,
                  ]}
                  onPress={() => toggle(habit)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.emojiTile, isDone && { backgroundColor: C.successSoft }]}>
                    <AnimatedEmoji emoji={habit.emoji} size={rs(20)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <Text style={styles.targetText}>
                      {isNegative ? (isDone ? 'Avoided' : 'Avoid this habit') : (isDone ? 'Completed' : 'Tap to mark complete')}
                    </Text>
                  </View>
                  <View style={[styles.check, isDone ? styles.checkDone : null]}>
                    {isDone ? (
                      isNegative
                        ? <ShieldCheck size={rs(14)} color="#fff" strokeWidth={2.5} />
                        : <Check size={rs(14)} color="#fff" strokeWidth={3} />
                    ) : isNegative ? (
                      <Ban size={rs(13)} color={C.warning} strokeWidth={2} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function makeStyles(C) { return {
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.card,
    borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20),
    borderTopWidth: 1, borderColor: C.borderStrong,
    paddingHorizontal: rs(20), paddingTop: rs(10), paddingBottom: rs(36),
  },
  handle: {
    width: rs(36), height: rs(4), borderRadius: rs(2),
    backgroundColor: C.borderStrong, alignSelf: 'center', marginBottom: rs(16),
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: rs(16),
  },
  headerLabel: { fontSize: ms(10), fontFamily: C.bold, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8 },
  headerDate:  { fontSize: ms(17), fontFamily: C.bold, fontWeight: '700', color: C.text, marginTop: rs(2), letterSpacing: ls(17) },
  doneText:    { fontSize: ms(14), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: ls(14) },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: C.cardHigh, borderRadius: rs(12),
    paddingHorizontal: rs(12), paddingVertical: rs(10),
    marginBottom: rs(8),
    borderWidth: 1, borderColor: C.border,
  },
  rowDone:     { borderColor: C.success, backgroundColor: C.successSoft },
  rowNegative: { borderColor: C.warning, backgroundColor: C.warningSoft },

  emojiTile: {
    width: rs(36), height: rs(36), borderRadius: rs(10),
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  name:       { fontSize: ms(13), fontFamily: C.semi, fontWeight: '600', color: C.text, letterSpacing: ls(13) },
  nameDone:   { color: C.success, textDecorationLine: 'line-through', textDecorationColor: C.success },
  targetText: { fontSize: ms(10), fontFamily: C.med, fontWeight: '500', color: C.textSub, marginTop: rs(2), letterSpacing: ls(10) },

  check: {
    width: rs(28), height: rs(28), borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.borderStrong,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkDone: { backgroundColor: C.success, borderColor: C.success },

  counter:    { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  counterBtn: {
    width: rs(28), height: rs(28), borderRadius: rs(8),
    borderWidth: 1, borderColor: C.borderStrong,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  counterBtnPlus: { backgroundColor: C.primary, borderColor: C.primary },

  emptyState: { alignItems: 'center', paddingVertical: rs(40) },
  emptyText:  { fontSize: ms(13), color: C.textMuted, fontFamily: C.reg, fontWeight: '400', letterSpacing: ls(13) },
}; }
