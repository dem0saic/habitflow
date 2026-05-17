import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from './utils/date';
import { scheduleHabitReminder, scheduleDailyReminders, ensureAndroidChannel, setNotificationSound, registerAllReminders, registerPushToken } from './utils/notifications';
import { setHapticsEnabled } from './utils/haptics';
import { supabase } from './lib/supabase';
import { pullUserData, pushAllData, syncActionToSupabase } from './lib/supabaseSync';
import { calcStreak as calcStreakImpl, consistency30 as consistency30Impl } from './utils/streak';

const STORAGE_KEY = '@habitapp_state_v1';

const defaultState = {
  onboardingDone: false,
  themeMode: 'dark',
  hapticsEnabled: true,
  notificationSound: true,
  habits: [],
  completions: {},  // { 'YYYY-MM-DD': { [habitId]: number } }
  notes: {},        // { 'YYYY-MM-DD': string } — free-text notes attached to a day
  challenge: null,  // { id, title, durationDays, startDate, habitIds, completed, rewardClaimed }
  globalPause: null, // { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' } | null — vacation mode for all habits
  addHabitNudgeDismissed: false, // user has acknowledged "research says 1-3 sticks better" at least once
  tutorialDismissed: false, // user has dismissed the on-Today first-run tutorial overlay
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD': return { ...defaultState, ...action.payload };

    case 'SET_ONBOARDING_DONE':
      return { ...state, onboardingDone: true };

    case 'RESET_ONBOARDING':
      return { ...state, onboardingDone: false };

    case 'SET_THEME':
      return { ...state, themeMode: action.mode };

    case 'SET_HAPTICS':
      return { ...state, hapticsEnabled: action.enabled };

    case 'SET_NOTIFICATION_SOUND':
      return { ...state, notificationSound: action.enabled };

    case 'ADD_HABIT': {
      const habit = {
        id: action.id || Date.now().toString(),
        name: action.name,
        emoji: action.emoji || '✅',
        type: action.habitType || 'daily',
        targetCount: action.targetCount || 1,
        reminderTime: action.reminderTime || null,
        shieldsPerMonth: 2,
        pauses: [],
        createdAt: new Date().toISOString(),
      };
      return { ...state, habits: [...state.habits, habit] };
    }

    case 'SET_HABIT_PAUSE': {
      // action.pause: { start, end } to add, or null to clear all pauses for this habit
      return {
        ...state,
        habits: state.habits.map(h => {
          if (h.id !== action.id) return h;
          if (action.pause == null) return { ...h, pauses: [] };
          return { ...h, pauses: [action.pause] };
        }),
      };
    }

    case 'SET_GLOBAL_PAUSE':
      return { ...state, globalPause: action.pause || null };

    case 'DISMISS_ADD_HABIT_NUDGE':
      return { ...state, addHabitNudgeDismissed: true };

    case 'DISMISS_TUTORIAL':
      return { ...state, tutorialDismissed: true };

    case 'RESET_TUTORIAL':
      return { ...state, tutorialDismissed: false };

    case 'SET_DAY_NOTE': {
      const notes = { ...state.notes };
      const trimmed = (action.note || '').trim();
      if (trimmed) {
        notes[action.date] = trimmed;
      } else {
        delete notes[action.date];
      }
      return { ...state, notes };
    }

    case 'EDIT_HABIT': {
      return {
        ...state,
        habits: state.habits.map(h =>
          h.id === action.id
            ? { ...h, name: action.name, emoji: action.emoji, type: action.habitType || action.type, targetCount: action.targetCount, reminderTime: action.reminderTime ?? h.reminderTime }
            : h
        ),
      };
    }

    case 'SET_HABIT_REMINDER': {
      return {
        ...state,
        habits: state.habits.map(h =>
          h.id === action.id ? { ...h, reminderTime: action.reminderTime } : h
        ),
      };
    }

    case 'DELETE_HABIT': {
      const habits = state.habits.filter(h => h.id !== action.id);
      const completions = {};
      for (const day of Object.keys(state.completions)) {
        const copy = { ...state.completions[day] };
        delete copy[action.id];
        completions[day] = copy;
      }
      return { ...state, habits, completions };
    }

    case 'LOG_HABIT': {
      const date = action.date || todayKey();
      const dayMap = { ...(state.completions[date] || {}) };
      const habit = state.habits.find(h => h.id === action.id);
      if (!habit) return state;

      if (habit.type === 'daily' || habit.type === 'negative') {
        dayMap[action.id] = dayMap[action.id] ? 0 : 1;
      } else {
        // 'volume' and 'timer'
        const delta = action.delta || 1;
        const current = dayMap[action.id] || 0;
        const next = Math.max(0, current + delta);
        dayMap[action.id] = next;
      }
      return {
        ...state,
        completions: { ...state.completions, [date]: dayMap },
      };
    }

    case 'START_CHALLENGE': {
      return {
        ...state,
        challenge: {
          id: action.id || Date.now().toString(),
          title: action.title,
          durationDays: action.durationDays,
          startDate: todayKey(),
          habitIds: action.habitIds,
          completed: false,
          rewardClaimed: false,
        },
      };
    }

    case 'CLAIM_CHALLENGE_REWARD':
      if (!state.challenge) return state;
      return {
        ...state,
        challenge: { ...state.challenge, completed: true, rewardClaimed: true },
      };

    case 'DISMISS_CHALLENGE':
      return { ...state, challenge: null };

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [storeReady, setStoreReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    async function init() {
      // Load local AsyncStorage cache immediately for a snappy first paint
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      let localState = defaultState;
      if (raw) {
        try { localState = JSON.parse(raw); } catch (_) {}
      }
      dispatch({ type: 'LOAD', payload: localState });
      setStoreReady(true);

      // Re-register notifications from cached data
      const habits = localState.habits || [];
      ensureAndroidChannel().then(() => {
        habits.forEach(h => {
          if (h.reminderTime) {
            scheduleHabitReminder(h.id, h.name, h.emoji, h.reminderTime.hour, h.reminderTime.minute).catch(() => {});
          }
        });
        scheduleDailyReminders(habits.map(h => h.name)).catch(() => {});
      });

      // Pull remote data if the user is already signed in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const remoteState = await pullUserData(session.user.id).catch(() => null);
        if (remoteState) {
          if (remoteState.habits.length > 0 || remoteState.onboardingDone) {
            dispatch({ type: 'LOAD', payload: remoteState });
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState)).catch(() => {});
            // Remote habits may have different reminderTime than local cache —
            // re-register so OS schedules match the server source of truth.
            registerAllReminders(remoteState.habits).catch(() => {});
          } else if ((localState.habits?.length || 0) > 0) {
            // User has pre-auth local data — migrate it up to Supabase
            pushAllData(session.user.id, localState).catch(() => {});
          }
        }
        // Register this device for remote push (fire-and-forget; safe in Expo Go — returns null)
        registerPushToken(session.user.id).catch(() => {});
      }
    }

    init();

    // Keep local state in sync when the user signs in or out mid-session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const remoteState = await pullUserData(session.user.id).catch(() => null);
        if (remoteState && (remoteState.habits.length > 0 || remoteState.onboardingDone)) {
          dispatch({ type: 'LOAD', payload: remoteState });
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState)).catch(() => {});
          registerAllReminders(remoteState.habits).catch(() => {});
        }
        registerPushToken(session.user.id).catch(() => {});
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOAD', payload: defaultState });
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persist local cache on every state change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // Keep haptics module flag in sync with stored preference
  useEffect(() => {
    setHapticsEnabled(state.hapticsEnabled ?? true);
  }, [state.hapticsEnabled]);

  // Keep notification sound module flag in sync with stored preference
  useEffect(() => {
    setNotificationSound(state.notificationSound ?? true);
  }, [state.notificationSound]);

  // Wrapped dispatch: ensures generated IDs are stable, then syncs to Supabase
  function syncedDispatch(action) {
    let a = action;
    if (a.type === 'ADD_HABIT' && !a.id) a = { ...a, id: Date.now().toString() };
    if (a.type === 'START_CHALLENGE' && !a.id) a = { ...a, id: Date.now().toString() };
    dispatch(a);
    syncActionToSupabase(a, stateRef).catch(() => {});
  }

  return (
    <StoreContext.Provider value={{ state, dispatch: syncedDispatch, storeReady }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}

// Derived helpers
export function useTodayCompletions() {
  const { state } = useStore();
  return state.completions[todayKey()] || {};
}

// Back-compat wrapper. Old call sites pass (habitId, completions); newer ones
// pass the full habit object and the global pause so shields + pauses apply.
export function calcStreak(habitOrId, completions, globalPause) {
  if (typeof habitOrId === 'string') {
    // Legacy signature — we don't have the habit object here, so use minimal defaults
    return calcStreakImpl({ id: habitOrId, targetCount: 1, shieldsPerMonth: 0, pauses: [] }, completions, null);
  }
  return calcStreakImpl(habitOrId, completions, globalPause);
}

export function consistency30(habit, completions, globalPause) {
  return consistency30Impl(habit, completions, globalPause);
}

export function useChallengeProgress(state) {
  if (!state.challenge) return null;
  const { startDate, durationDays } = state.challenge;
  const habits = state.habits;
  const days = [];
  for (let i = 0; i < durationDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const dayCompletions = state.completions[key] || {};
    const allDone = habits.length > 0 && habits.every(h =>
      (dayCompletions[h.id] || 0) >= (h.targetCount || 1)
    );
    days.push({ key, allDone });
  }
  return days;
}
