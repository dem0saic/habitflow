import { supabase } from './supabase';
import { todayKey } from '../utils/date';

// ─── Pull all user data from Supabase ────────────────────────────────────────
export async function pullUserData(userId) {
  const [settingsRes, habitsRes, completionsRes, challengeRes, notesRes] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('habits').select('*').eq('user_id', userId).is('deleted_at', null),
    supabase.from('completions').select('*').eq('user_id', userId),
    supabase.from('challenges').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(1),
    supabase.from('day_notes').select('date, note').eq('user_id', userId),
  ]);

  const habits = (habitsRes.data || []).map(h => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    type: h.type,
    targetCount: h.target_count,
    reminderTime: h.reminder_time,
    shieldsPerMonth: h.shields_per_month ?? 2,
    pauses: Array.isArray(h.pauses) ? h.pauses : [],
    createdAt: h.created_at,
  }));

  const completions = {};
  for (const row of (completionsRes.data || [])) {
    if (!completions[row.date]) completions[row.date] = {};
    completions[row.date][row.habit_id] = row.count;
  }

  const notes = {};
  for (const row of (notesRes.data || [])) {
    if (row.note) notes[row.date] = row.note;
  }

  const raw = challengeRes.data?.[0];
  const challenge = raw ? {
    id: raw.id,
    title: raw.title,
    durationDays: raw.duration_days,
    startDate: raw.start_date,
    habitIds: raw.habit_ids,
    completed: raw.completed,
    rewardClaimed: raw.reward_claimed,
  } : null;

  return {
    onboardingDone: settingsRes.data?.onboarding_done ?? false,
    themeMode: settingsRes.data?.theme_mode ?? 'dark',
    globalPause: settingsRes.data?.global_pause ?? null,
    addHabitNudgeDismissed: settingsRes.data?.add_habit_nudge_dismissed ?? false,
    tutorialDismissed: settingsRes.data?.tutorial_dismissed ?? false,
    habits,
    completions,
    notes,
    challenge,
  };
}

export async function pushDayNote(userId, date, note) {
  await supabase.from('day_notes').upsert({
    user_id: userId,
    date,
    note,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteDayNote(userId, date) {
  await supabase.from('day_notes').delete().eq('user_id', userId).eq('date', date);
}

// ─── Push helpers ─────────────────────────────────────────────────────────────
export async function pushHabit(userId, habit) {
  await supabase.from('habits').upsert({
    id: habit.id,
    user_id: userId,
    name: habit.name,
    emoji: habit.emoji,
    type: habit.type,
    target_count: habit.targetCount,
    reminder_time: habit.reminderTime,
    shields_per_month: habit.shieldsPerMonth ?? 2,
    pauses: habit.pauses ?? [],
    created_at: habit.createdAt,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteHabit(habitId) {
  await supabase.from('habits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', habitId);
}

export async function pushCompletion(userId, habitId, date, count) {
  await supabase.from('completions').upsert({ user_id: userId, habit_id: habitId, date, count });
}

export async function pushChallenge(userId, challenge) {
  await supabase.from('challenges').upsert({
    id: challenge.id,
    user_id: userId,
    title: challenge.title,
    duration_days: challenge.durationDays,
    start_date: challenge.startDate,
    habit_ids: challenge.habitIds,
    completed: challenge.completed,
    reward_claimed: challenge.rewardClaimed,
  });
}

export async function deleteChallenge(challengeId) {
  await supabase.from('challenges').delete().eq('id', challengeId);
}

export async function pushSettings(userId, state) {
  await supabase.from('user_settings').upsert({
    user_id: userId,
    theme_mode: state.themeMode,
    onboarding_done: state.onboardingDone,
    global_pause: state.globalPause ?? null,
    add_habit_nudge_dismissed: state.addHabitNudgeDismissed ?? false,
    tutorial_dismissed: state.tutorialDismissed ?? false,
    updated_at: new Date().toISOString(),
  });
}

export async function pushAllData(userId, state) {
  await pushSettings(userId, state);
  await Promise.all((state.habits || []).map(h => pushHabit(userId, h)));

  const rows = [];
  for (const [date, dayMap] of Object.entries(state.completions || {})) {
    for (const [habitId, count] of Object.entries(dayMap)) {
      if (count > 0) rows.push({ user_id: userId, habit_id: habitId, date, count });
    }
  }
  if (rows.length > 0) await supabase.from('completions').upsert(rows);

  const noteRows = [];
  for (const [date, note] of Object.entries(state.notes || {})) {
    if (note && note.trim()) noteRows.push({ user_id: userId, date, note: note.trim() });
  }
  if (noteRows.length > 0) await supabase.from('day_notes').upsert(noteRows);

  if (state.challenge) await pushChallenge(userId, state.challenge);
}

// ─── Action-based sync (called after every dispatch) ─────────────────────────
// stateRef.current is the state BEFORE the action ran, which is exactly what
// we need to compute deltas (e.g. toggling a LOG_HABIT count).
export async function syncActionToSupabase(action, stateRef) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const userId = user.id;
  const s = stateRef.current;

  switch (action.type) {
    case 'ADD_HABIT':
      await pushHabit(userId, {
        id: action.id,
        name: action.name,
        emoji: action.emoji || '✅',
        type: action.habitType || 'daily',
        targetCount: action.targetCount || 1,
        reminderTime: action.reminderTime || null,
        shieldsPerMonth: 2,
        pauses: [],
        createdAt: new Date().toISOString(),
      });
      break;

    case 'EDIT_HABIT': {
      const h = s.habits.find(x => x.id === action.id);
      if (h) await pushHabit(userId, {
        ...h,
        name: action.name,
        emoji: action.emoji,
        type: action.habitType || action.type,
        targetCount: action.targetCount,
        reminderTime: action.reminderTime ?? h.reminderTime,
      });
      break;
    }

    case 'SET_HABIT_REMINDER': {
      const h = s.habits.find(x => x.id === action.id);
      if (h) await pushHabit(userId, { ...h, reminderTime: action.reminderTime });
      break;
    }

    case 'DELETE_HABIT':
      await deleteHabit(action.id);
      break;

    case 'LOG_HABIT': {
      const date = action.date || todayKey();
      const dayMap = s.completions[date] || {};
      const habit = s.habits.find(x => x.id === action.id);
      let newCount;
      if (habit?.type === 'daily' || habit?.type === 'negative') {
        newCount = dayMap[action.id] ? 0 : 1;
      } else {
        newCount = Math.max(0, (dayMap[action.id] || 0) + (action.delta || 1));
      }
      await pushCompletion(userId, action.id, date, newCount);
      break;
    }

    case 'START_CHALLENGE':
      await pushChallenge(userId, {
        id: action.id,
        title: action.title,
        durationDays: action.durationDays,
        startDate: todayKey(),
        habitIds: action.habitIds,
        completed: false,
        rewardClaimed: false,
      });
      break;

    case 'CLAIM_CHALLENGE_REWARD':
      if (s.challenge) await pushChallenge(userId, { ...s.challenge, completed: true, rewardClaimed: true });
      break;

    case 'DISMISS_CHALLENGE':
      if (s.challenge) await deleteChallenge(s.challenge.id);
      break;

    case 'SET_ONBOARDING_DONE':
      await pushSettings(userId, { ...s, onboardingDone: true });
      break;

    case 'SET_THEME':
      await pushSettings(userId, { ...s, themeMode: action.mode });
      break;

    case 'SET_HABIT_PAUSE': {
      const h = s.habits.find(x => x.id === action.id);
      if (h) {
        const nextPauses = action.pause == null ? [] : [action.pause];
        await pushHabit(userId, { ...h, pauses: nextPauses });
      }
      break;
    }

    case 'SET_GLOBAL_PAUSE':
      await pushSettings(userId, { ...s, globalPause: action.pause || null });
      break;

    case 'DISMISS_ADD_HABIT_NUDGE':
      await pushSettings(userId, { ...s, addHabitNudgeDismissed: true });
      break;

    case 'DISMISS_TUTORIAL':
      await pushSettings(userId, { ...s, tutorialDismissed: true });
      break;

    case 'RESET_TUTORIAL':
      await pushSettings(userId, { ...s, tutorialDismissed: false });
      break;

    case 'SET_DAY_NOTE': {
      const trimmed = (action.note || '').trim();
      if (trimmed) {
        await pushDayNote(userId, action.date, trimmed);
      } else {
        await deleteDayNote(userId, action.date);
      }
      break;
    }
  }
}
