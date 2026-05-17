import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, ScrollView, TextInput,
} from 'react-native';
import { Check, Minus, Plus, Ban, ShieldCheck, NotebookPen } from 'lucide-react-native';
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

  const savedNote = (date && state.notes?.[date]) || '';
  const [noteDraft, setNoteDraft] = useState(savedNote);
  const lastSavedRef = useRef(savedNote);
  const debounceRef = useRef(null);

  // Sync the draft when the sheet opens for a new date
  useEffect(() => {
    if (!visible || !date) return;
    setNoteDraft(savedNote);
    lastSavedRef.current = savedNote;
  }, [visible, date]);

  // Debounced persist — fires 700ms after the user stops typing
  useEffect(() => {
    if (!date || noteDraft === lastSavedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch({ type: 'SET_DAY_NOTE', date, note: noteDraft });
      lastSavedRef.current = noteDraft;
    }, 700);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [noteDraft, date]);

  function handleClose() {
    // Force-flush any pending debounce so notes persist even if user closes fast
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (date && noteDraft !== lastSavedRef.current) {
      dispatch({ type: 'SET_DAY_NOTE', date, note: noteDraft });
      lastSavedRef.current = noteDraft;
    }
    onClose();
  }

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>LOGGING FOR</Text>
            <Text style={styles.headerDate}>{formatDisplay(date)}</Text>
          </View>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ maxHeight: rs(480) }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Day note */}
          <View style={styles.noteWrap}>
            <View style={styles.noteHeader}>
              <NotebookPen size={rs(13)} color={C.primary} strokeWidth={2.5} />
              <Text style={styles.noteHeaderText}>NOTE</Text>
              {savedNote ? <View style={styles.noteSavedDot} /> : null}
            </View>
            <TextInput
              style={styles.noteInput}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Anything worth remembering about this day? (travel, sick, busy…)"
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

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

  noteWrap: {
    backgroundColor: C.cardHigh, borderRadius: rs(12),
    paddingHorizontal: rs(12), paddingTop: rs(10), paddingBottom: rs(8),
    marginBottom: rs(14),
    borderWidth: 1, borderColor: C.border,
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(6) },
  noteHeaderText: { fontSize: ms(10), fontFamily: C.bold, fontWeight: '700', color: C.primary, letterSpacing: 0.8 },
  noteSavedDot: {
    width: rs(6), height: rs(6), borderRadius: rs(3),
    backgroundColor: C.primary, marginLeft: rs(2),
  },
  noteInput: {
    fontSize: ms(13), fontFamily: C.reg, fontWeight: '400',
    color: C.text, letterSpacing: ls(13),
    minHeight: rs(56), maxHeight: rs(140),
    paddingVertical: rs(4), paddingHorizontal: 0,
    lineHeight: ms(13) * 1.4,
  },
}; }
