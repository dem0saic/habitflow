import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from './utils/date';
import { scheduleHabitReminder, scheduleDailyReminders, ensureAndroidChannel, setNotificationSound } from './utils/notifications';
import { setHapticsEnabled } from './utils/haptics';
import { supabase } from './lib/supabase';
import { pullUserData, pushAllData, syncActionToSupabase } from './lib/supabaseSync';

const STORAGE_KEY = '@habitapp_state_v1';

const defaultState = {
  onboardingDone: false,
  themeMode: 'dark',
  hapticsEnabled: true,
  notificationSound: true,
  habits: [],
  completions: {},  // { 'YYYY-MM-DD': { [habitId]: number } }
  challenge: null,  // { id, title, durationDays, startDate, habitIds, completed, rewardClaimed }
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
        createdAt: new Date().toISOString(),
      };
      return { ...state, habits: [...state.habits, habit] };
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
          } else if ((localState.habits?.length || 0) > 0) {
            // User has pre-auth local data — migrate it up to Supabase
            pushAllData(session.user.id, localState).catch(() => {});
          }
        }
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
        }
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

export function calcStreak(habitId, completions) {
  let streak = 0;
  let d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (completions[key]?.[habitId]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
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
