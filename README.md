# HabitFlow

A cross-platform habit tracker built with Expo (React Native) and Supabase. Track daily habits, log volume and timer-based activities, run multi-day challenges, and sync everything to the cloud.

## Features

- **Four habit types** — daily (toggle), volume (reps), timer (minutes), negative (avoidance)
- **Challenges** — 3-day, 7-day, and 21-day streaks with a reward on completion
- **Cloud sync** — every action syncs to Supabase in real time; data loads from the cloud on sign-in
- **Per-habit reminders** — time-picker per habit plus general morning/evening nudges
- **Dark / light theme** — Gothic Noir palette, persisted per account

## Getting started

### Prerequisites

- Node.js 18+
- [Expo Go](https://expo.dev/go) installed on your iOS or Android device
- A Supabase project (see below)

### Environment

Create a `.env` file at the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

### Install & run

```bash
npm install --legacy-peer-deps
npx expo start          # scan QR with Expo Go
npx expo start --tunnel # use if phone and PC are on different networks
```

On Windows PowerShell, replace `npx` with `npx.cmd`.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 (New Architecture) |
| Auth & DB | Supabase (email auth + Postgres) |
| State | React `useReducer` + AsyncStorage + Supabase sync |
| Navigation | React Navigation v7 (bottom tabs) |
| UI | Custom components, gluestack-style, expo-linear-gradient |
| Fonts | Russo One, Work Sans (via expo-google-fonts) |
| Notifications | expo-notifications (daily + per-habit) |

## Auth flow

1. Sign up with email and password → confirm via email link
2. Sign in → app pulls your habits, completions, and challenge from Supabase
3. Every action (add, edit, delete, log, challenge) syncs automatically
4. Pre-auth data created before signing in is migrated to Supabase on first login

## Project structure

```
App.js                  # Provider stack + tab navigator
src/
  AuthContext.js        # Supabase session context
  ThemeContext.js       # DARK/LIGHT palette context
  store.js              # Global state, AsyncStorage, Supabase sync dispatch
  lib/
    supabase.js         # Supabase client
    supabaseSync.js     # pull/push helpers + per-action sync
  screens/
    AuthScreen.js       # Sign in / sign up
    OnboardingScreen.js # First-run walkthrough
    TodayScreen.js      # Main habit list
    ChallengeScreen.js  # Active challenge view
    HistoryScreen.js    # Completion calendar
    StatsScreen.js      # Streaks + contribution graph
  components/
    HabitCard.js        # Single habit row (all 4 types)
    AddHabitModal.js    # Create / edit habit sheet
    HabitOptionsSheet.js# Long-press: edit / delete / reminder
    CelebrationModal.js # All-done / reward overlay
    AnimatedEmoji.js    # Semantic emoji animations
  theme.js              # Color palettes, font tokens, emoji list
  utils/
    responsive.js       # rs() ms() vs() ls() scaling helpers
    notifications.js    # Schedule / cancel reminders
    date.js             # todayKey(), dateKey(), addDays(), etc.
```

## Database schema (Supabase)

All tables are in the `public` schema with RLS enabled. Every row is scoped to the authenticated user via `auth.uid() = user_id`.

| Table | PK | Notes |
|---|---|---|
| `user_settings` | `user_id` | `theme_mode`, `onboarding_done` |
| `habits` | `id` (text) | Soft-deleted via `deleted_at`; `reminder_time` stored as jsonb |
| `completions` | `(user_id, habit_id, date)` | Composite PK makes upserts idempotent |
| `challenges` | `id` (text) | `habit_ids` text array |
