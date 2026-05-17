// Shared completion-percentage → color mapping for heat cells.
// Used by MonthCalendar (HistoryScreen) and ContributionGraph (StatsScreen).

// 4-step ramp: empty → light tint → solid → done
export function heatColor(pct, C) {
  if (pct == null)  return 'transparent';
  if (pct === 0)    return C.border;
  if (pct < 0.5)    return C.primarySoft;
  if (pct < 1)      return C.primary;
  return C.success;
}

// 5-step ramp used by the GitHub-style contribution graph
export function heatRamp(pct, C) {
  if (pct == null)  return 'transparent';
  if (pct === 0)    return C.border;
  if (pct < 0.33)   return C.primarySoft;
  if (pct < 0.67)   return C.primaryMuted;
  if (pct < 1)      return C.primary;
  return C.success;
}

export function rampSwatches(C) {
  return [C.border, C.primarySoft, C.primaryMuted, C.primary, C.success];
}
