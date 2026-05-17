# HabitFlow

A cross-platform habit tracker built with Expo (React Native) and Supabase. Track daily habits, log volume and timer-based activities, run multi-day challenges, get an AI-generated daily nudge, and sync everything to the cloud.

## Features

- **Four habit types** — daily (toggle), volume (reps), timer (minutes), negative (avoidance)
- **Bento dashboard** — habits live as varied tiles (square pairs for toggles, full-width with progress for counters); each screen has its own layout
- **Past-day logging** — tap any past day in the month calendar to back-fill a missed log
- **Challenges** — 3-day, 7-day, and 21-day journeys with a reward on completion and a visual progress track
- **Streak milestones** — celebrations at 7, 14, 30, 60, 100, 200, and 365 days
- **Streak shields** — 2 forgiven misses per calendar month per habit, applied automatically so one off day doesn't reset months of work
- **Vacation mode** — pause one habit (long-press → Pause) or all habits at once (Settings → Vacation mode) for a date range; streaks survive the gap
- **"Take it slow" pushback** — a one-time soft warning when adding a 4th habit, citing the behavioral finding that starting with 1-3 sticks ~3× more often (users who confirm "Add anyway" are trusted forever after)
- **Trajectory metric** — every habit shows "X/Y last 30d · Z% consistency" alongside the raw streak so a single miss doesn't feel like failure
- **Pattern-aware AI Coach** — daily nudge detects per-habit weekday patterns ("you tend to miss meditation on Wednesdays — what's different?") instead of just praising streaks; plus weekly/monthly reflection summaries. All powered by Claude via Supabase Edge Functions.
- **Cloud sync** — every action syncs to Supabase in real time; data loads from the cloud on sign-in
- **Per-habit reminders** — time-picker per habit plus general morning/evening nudges
- **Account deletion** — required by App Store guidelines; cascades all user rows server-side
- **Dark / light theme** — Dusk palette (cool neutral dark with an indigo-violet accent, WCAG AA contrast), persisted per account

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

The AI Coach Edge Functions also need an Anthropic API key set as a Supabase secret (server-side only, never in `.env`):

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref <your-ref>
```

### Install & run

```bash
npm install --legacy-peer-deps
npx expo start          # scan QR with Expo Go
npx expo start --tunnel # use if phone and PC are on different networks
```

On Windows PowerShell, replace `npx` with `npx.cmd`.

### Deploy Edge Functions

After editing anything under `supabase/functions/<name>/`:

```bash
npx supabase login                                  # one-time, interactive
npx supabase functions deploy <name> --project-ref <your-ref>
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 (New Architecture) |
| Auth & DB | Supabase (email auth + Postgres + Edge Functions) |
| State | React `useReducer` + AsyncStorage + Supabase sync |
| Navigation | React Navigation v7 (bottom tabs) |
| UI | Custom components, `lucide-react-native` icons |
| Fonts | Work Sans (body, five weights, `expo-google-fonts`) + Chopera (custom OTF, brand wordmark only) |
| Notifications | `expo-notifications` (daily + per-habit, dual Android channels for silent/sound) |
| AI | Anthropic Claude (server-side via Supabase Edge Functions) |

## Auth flow

1. Sign up with email and password → confirm via email link
2. Sign in → app pulls your habits, completions, and challenge from Supabase
3. Every action (add, edit, delete, log, challenge) syncs automatically
4. Pre-auth data created before signing in is migrated to Supabase on first login
5. Forgot password → tap the email link → app deep-links into the recovery flow
6. Delete account → typing `delete` to confirm cascades all data and removes the auth user

## Project structure

```
App.js                       # Provider stack + tab navigator
src/
  AuthContext.js             # Supabase session context (+ deleteAccount)
  ThemeContext.js            # DARK/LIGHT palette context
  store.js                   # Global state, AsyncStorage, Supabase sync dispatch
  lib/
    supabase.js              # Supabase client
    supabaseSync.js          # pull/push helpers + per-action sync
    aiCoaching.js            # Thin client for Edge Functions
  screens/
    AuthScreen.js            # Sign in / sign up / forgot password / recovery
    OnboardingScreen.js      # First-run walkthrough
    TodayScreen.js           # Bento grid of habit tiles
    ChallengeScreen.js       # Journey track + today's challenge habits
    HistoryScreen.js         # Month calendar + this-month stats
    StatsScreen.js           # Stat bento + contribution graph + AI Coach
    SettingsScreen.js        # Preferences + account management
  components/
    HabitTileSmall.js        # Square tile (daily / negative), paired two-up
    HabitTileWide.js         # Full-width tile (volume / timer) with stepper
    StatTile.js              # Generic bento stat cell
    MonthCalendar.js         # Month grid for HistoryScreen
    ChallengeTrack.js        # Horizontal journey of dots for ChallengeScreen
    AddHabitModal.js         # Create / edit habit bottom-sheet
    HabitOptionsSheet.js     # Long-press: edit / reminder / pause / delete
    PastDayLogSheet.js       # Log habits retroactively for a past date
    CelebrationModal.js      # All-done / reward / milestone overlay
    AnimatedEmoji.js         # Semantic emoji animations
  theme.js                   # Pulse palette, font tokens, emoji list
  utils/
    responsive.js            # rs() ms() vs() ls() scaling helpers
    notifications.js         # Schedule / cancel reminders, dual Android channels
    haptics.js               # lightTap / mediumTap / successBurst with kill switch
    date.js                  # todayKey(), dateKey(), addDays(), diffDays()
    heatmap.js               # Shared completion-pct → color ramp
    streak.js                # calcStreak + consistency30 with shields & pauses
supabase/
  functions/
    ai-coaching-nudge/       # Daily Claude nudge, cached per (user, day)
    ai-reflection-summary/   # Weekly / monthly Claude reflection, cached per period
    delete-account/          # Cascades user rows + auth.users delete
```

## Database schema (Supabase)

All tables are in the `public` schema with RLS enabled. Every row is scoped to the authenticated user via `auth.uid() = user_id`.

| Table | PK | Notes |
|---|---|---|
| `user_settings` | `user_id` | `theme_mode`, `onboarding_done`, `global_pause` (jsonb — vacation mode), `add_habit_nudge_dismissed` (boolean — pushback acknowledged) |
| `habits` | `id` (text) | Soft-deleted via `deleted_at`; `reminder_time` jsonb; `shields_per_month` int (default 2); `pauses` jsonb array of `{start, end}` |
| `completions` | `(user_id, habit_id, date)` | Composite PK makes upserts idempotent |
| `challenges` | `id` (text) | `habit_ids` text array |
| `ai_insights` | `id` (uuid) | `type` ∈ {`nudge`, `weekly_summary`, `monthly_summary`}; written only by Edge Functions |

For architecture details — provider stack, reducer behavior, sync model, theme tokens, and per-screen anatomy — see [`CLAUDE.md`](./CLAUDE.md).
