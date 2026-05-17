// Streak + consistency math with two human-friendly twists:
//   * Shields  — a budget of forgiven misses per calendar month (default 2)
//   * Pauses   — explicit date ranges (per-habit or global "vacation mode")
//                where the day doesn't count toward consistency or break the streak

export function isPaused(habit, dateStr, globalPause) {
  if (globalPause && globalPause.start && globalPause.end
      && dateStr >= globalPause.start && dateStr <= globalPause.end) {
    return true;
  }
  const pauses = habit?.pauses;
  if (!Array.isArray(pauses)) return false;
  for (const p of pauses) {
    if (p && p.start && p.end && dateStr >= p.start && dateStr <= p.end) return true;
  }
  return false;
}

// Walk backward from today. Today doesn't count as a miss until midnight passes.
// Paused days are invisible to the algorithm (no streak credit, no break).
// Non-paused misses consume shield budget per calendar month; when the budget
// runs out the streak breaks.
export function calcStreak(habit, completions, globalPause) {
  if (!habit) return 0;
  const target = habit.targetCount || 1;
  const shieldsPerMonth = habit.shieldsPerMonth ?? 2;
  const createdAtKey = habit.createdAt
    ? new Date(habit.createdAt).toISOString().slice(0, 10)
    : null;
  const todayStr = new Date().toISOString().slice(0, 10);

  const shieldsUsed = {};
  let streak = 0;
  const d = new Date();

  // Cap the walk to keep this O(1) on apocalyptic data sets
  for (let i = 0; i < 730; i++) {
    const key = d.toISOString().slice(0, 10);
    if (createdAtKey && key < createdAtKey) break;

    if (isPaused(habit, key, globalPause)) {
      d.setDate(d.getDate() - 1);
      continue;
    }

    const count = completions?.[key]?.[habit.id] || 0;
    if (count >= target) {
      streak++;
    } else if (key === todayStr) {
      // Today not done yet — grace, don't penalize until tomorrow
    } else {
      const monthKey = key.slice(0, 7);
      const used = shieldsUsed[monthKey] || 0;
      if (used < shieldsPerMonth) {
        shieldsUsed[monthKey] = used + 1;
        // Shielded miss preserves the streak but doesn't add to it
      } else {
        break;
      }
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Trajectory metric: % of eligible days in the last 30 that were completed.
// "Eligible" = not paused, and not before habit was created.
// Use this as the headline alongside the raw streak — it survives a missed day.
export function consistency30(habit, completions, globalPause) {
  if (!habit) return { done: 0, eligible: 0, percent: 0 };
  const target = habit.targetCount || 1;
  const createdAtKey = habit.createdAt
    ? new Date(habit.createdAt).toISOString().slice(0, 10)
    : null;
  let done = 0;
  let eligible = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    const key = d.toISOString().slice(0, 10);
    const beforeCreation = createdAtKey && key < createdAtKey;
    if (!beforeCreation && !isPaused(habit, key, globalPause)) {
      eligible++;
      if ((completions?.[key]?.[habit.id] || 0) >= target) done++;
    }
    d.setDate(d.getDate() - 1);
  }
  return {
    done,
    eligible,
    percent: eligible ? Math.round((done / eligible) * 100) : 0,
  };
}
