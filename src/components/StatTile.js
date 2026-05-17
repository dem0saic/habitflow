import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';

// Generic bento stat cell. Renders a big number/value above a small label.
// `accent` color highlights the value (defaults to text). `icon` is an optional
// Lucide component rendered to the left of the value.
export default function StatTile({ value, label, accent, Icon, compact = false }) {
  const C = useTheme();
  const styles = makeStyles(C, compact);
  const valueColor = accent || C.text;

  return (
    <View style={styles.tile}>
      <View style={styles.valueRow}>
        {Icon && <Icon size={compact ? rs(15) : rs(17)} color={valueColor} strokeWidth={2.5} style={{ marginRight: rs(5) }} />}
        <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function makeStyles(C, compact) { return {
  tile: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border,
    paddingVertical: compact ? rs(12) : rs(16),
    paddingHorizontal: rs(12),
    alignItems: 'center', justifyContent: 'center',
  },
  valueRow: { flexDirection: 'row', alignItems: 'center' },
  value: {
    fontSize: compact ? ms(20) : ms(26),
    fontFamily: C.bold, fontWeight: '700',
    letterSpacing: ls(compact ? 20 : 26),
  },
  label: {
    fontSize: ms(10), color: C.textMuted,
    marginTop: rs(4),
    fontFamily: C.med, fontWeight: '500',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
}; }
