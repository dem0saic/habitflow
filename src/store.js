import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from './utils/date';
import { scheduleHabitReminder, scheduleDailyReminders, ensureAndroidChannel } from './utils/notifications';

const STORAGE_KEY = '@habitapp_state_v1';

const defaultState = {
  onboardingDone: false,
  themeMode: 'dark',
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
      const today = todayKey();
      const dayMap = { ...(state.completions[today] || {}) };
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
        completions: { ...state.completions, [today]: dayMap },
      };
    }

    case 'START_CHALLENGE': {
      return {
        ...state,
        challenge: {
          id: Date.now().toString(),
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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const loaded = JSON.parse(raw);
          dispatch({ type: 'LOAD', payload: loaded });
          // Re-register all habit reminders using the fixed scheduler every app start.
          // This ensures old broken-format triggers are replaced with the correct ones.
          const habits = loaded.habits || [];
          ensureAndroidChannel().then(() => {
            habits.forEach(h => {
              if (h.reminderTime) {
                scheduleHabitReminder(h.id, h.name, h.emoji, h.reminderTime.hour, h.reminderTime.minute).catch(() => {});
              }
            });
            scheduleDailyReminders(habits.map(h => h.name)).catch(() => {});
          });
        } catch (_) {}
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
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
