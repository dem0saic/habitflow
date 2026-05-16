# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (scan QR code with Expo Go on phone)
npx expo start

# Start with tunnel (works across networks, needed if phone & PC are on different Wi-Fi)
npx expo start --tunnel

# Target a specific platform directly
npx expo start --android
npx expo start --ios
npx expo start --web
```

On Windows PowerShell use `npx.cmd` instead of `npx` (e.g. `& "C:\Program Files\nodejs\npx.cmd" expo start`).

Install **Expo Go** on the device (iOS App Store / Android Play Store) and scan the QR code. Use `--tunnel` when the phone and dev machine are on different networks.

**Installing packages:** use `--legacy-peer-deps` as a default for any package that has historical peer-dep conflicts in the resolved tree:
```bash
& "C:\Program Files\nodejs\npm.cmd" install --save --legacy-peer-deps <package>
# or for expo-managed packages:
& "C:\Program Files\nodejs\npx.cmd" expo install <package>  # falls back to npm if it errors
```

## Platform notes

- iOS builds require macOS. Use Expo Go for iOS testing on Windows.
- Android emulator requires Android Studio with a configured AVD.
- `newArchEnabled: true` is set in `app.json` (React Native New Architecture is on).

## Environment

Requires a `.env` file at the project root (already present, not committed):
```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Both vars are read by `src/lib/supabase.js` at runtime via `process.env`.

The Edge Functions need an additional secret set **in Supabase** (not in `.env` — it never touches the client):
```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref <ref>
```

To redeploy an Edge Function after editing `supabase/functions/<name>/index.ts`:
```bash
npx supabase functions deploy <name> --project-ref <ref>
```

## Architecture

HabitFlow is an Expo (React Native) habit tracker with Supabase auth and cloud sync. Entry point is `index.js` → `App.js`. Do not edit `index.js`.

### Provider stack (`App.js`)

Fonts are loaded at the top of `App` via `useFonts` (expo-font) before any providers mount. `SplashScreen.preventAutoHideAsync()` is called at module level so the splash stays visible until fonts are ready.

```
SafeAreaProvider
  └─ AuthProvider           ← Supabase session (session, loading, signIn, signUp, signOut, resetPassword, updatePassword, recoveryMode)
       └─ StoreProvider     ← global state + AsyncStorage cache + Supabase sync
            └─ ThemeProvider ← resolves DARK/LIGHT palette → useTheme()
                 └─ InnerApp ← StatusBar + AppNavigator
```

`InnerApp` reads `state.themeMode` directly from the store to drive the active theme.

### Routing (`AppNavigator` in `App.js`)

```js
if (loading || !storeReady) return null;          // wait for both auth AND store to initialise
if (!session || recoveryMode) return <AuthScreen />;
if (!state.onboardingDone)   return <OnboardingScreen />;
return <Tab.Navigator ... />;                     // Today / Challenge / History / Stats (+ hidden Settings)
```

Both `loading` (from `AuthProvider`) and `storeReady` (from `StoreProvider`) must be true before any routing decision is made — this prevents a race condition where a stale Supabase session resolves before the store has loaded `onboardingDone` from AsyncStorage.

`OnboardingScreen` shows a faint "Sign out" link when `session` is present, so users with a stale session can escape back to `AuthScreen`.

### Auth (`src/AuthContext.js`, `src/screens/AuthScreen.js`)

`AuthProvider` wraps the Supabase session lifecycle. `useAuth()` returns:
```js
{ session, loading, signIn, signUp, signOut, resetPassword, updatePassword, deleteAccount, recoveryMode }
```

`deleteAccount()` invokes the `delete-account` Edge Function (which cascades all user rows and removes the `auth.users` row using the service role key) and then calls `signOut()`. On success the `SIGNED_OUT` listener in `StoreProvider` resets local state and `AppNavigator` returns to `AuthScreen`.

`recoveryMode` is a boolean that becomes `true` when Supabase fires the `PASSWORD_RECOVERY` auth event (triggered by the deep link after the user clicks a password-reset email). It resets to `false` on `USER_UPDATED` or `SIGNED_OUT`.

**Forgot-password deep link flow:**
1. User taps "Forgot password?" → `resetPasswordForEmail(email, { redirectTo: 'habitflow://localhost/reset-password' })` sends a Supabase magic link.
2. Tapping the link opens the app via `expo-linking`. `InnerApp` listens with `Linking.addEventListener('url', ...)` and `Linking.getInitialURL()`.
3. The URL contains `#access_token=...&refresh_token=...&type=recovery` in the fragment. The handler calls `supabase.auth.setSession()` with those tokens.
4. Supabase fires `PASSWORD_RECOVERY` → `AuthProvider` sets `recoveryMode = true` → `AppNavigator` renders `<AuthScreen />`.
5. `AuthScreen` detects `recoveryMode` (overrides the `mode` state) and shows the new-password + confirm form. On submit it calls `updatePassword(newPassword)` which calls `supabase.auth.updateUser({ password })` and sets `recoveryMode = false`.

`AuthScreen` has three internal modes (`'signIn' | 'signUp' | 'forgotPassword'`) plus the `recoveryMode` override. The Supabase client (`src/lib/supabase.js`) persists sessions to AsyncStorage with `autoRefreshToken: true`.

The `app.json` scheme is `"habitflow"` — the full redirect URL accepted by Supabase is `habitflow://localhost/reset-password`.

### State management (`src/store.js`)

Single global store via React `useReducer` + `AsyncStorage` (key: `@habitapp_state_v1`) + Supabase sync.

**State shape:**
```js
{
  onboardingDone: boolean,
  themeMode: 'dark' | 'light',
  hapticsEnabled: boolean,          // device-level, not synced to Supabase
  notificationSound: boolean,       // device-level, not synced to Supabase
  habits: [{ id, name, emoji, type, targetCount, reminderTime, createdAt }],
  completions: { 'YYYY-MM-DD': { [habitId]: number } },
  challenge: { id, title, durationDays, startDate, habitIds, completed, rewardClaimed } | null,
}
```

**Habit types:** `daily` (toggle), `volume` (count reps), `timer` (minutes, steps of 5), `negative` (avoidance toggle). The `LOG_HABIT` action toggles `daily`/`negative` and uses `delta` for `volume`/`timer`. Pass `action.date` (a `YYYY-MM-DD` string) to log for a past day; if omitted, defaults to `todayKey()`. The same fallback runs in `syncActionToSupabase` so past-day logs persist to the correct `(habitId, date)` row.

**Exported hooks/helpers:** `useStore()`, `useTodayCompletions()`, `useChallengeProgress(state)`, `calcStreak(habitId, completions)`.

**Initialisation sequence:**
1. Load AsyncStorage cache → `dispatch(LOAD)` → set `storeReady = true` (fast, local)
2. Re-register all habit reminders from cached data
3. If a Supabase session exists, pull remote state and overwrite local; if local has pre-auth habits, migrate them up to Supabase

**`syncedDispatch`** (what `useStore().dispatch` actually is): generates stable IDs for `ADD_HABIT` and `START_CHALLENGE` before dispatching, then calls `syncActionToSupabase` fire-and-forget after every action. All screens use `useStore().dispatch` — none bypass the sync.

`SET_HAPTICS` and `SET_NOTIFICATION_SOUND` are intentionally not handled in `syncActionToSupabase` — both are device-local preferences. `StoreProvider` has `useEffect` hooks watching `state.hapticsEnabled` and `state.notificationSound` that call `setHapticsEnabled()` and `setNotificationSound()` respectively to keep module flags in sync with persisted values on every app start.

### Supabase sync (`src/lib/supabaseSync.js`)

All functions use `supabase.from(table)`:

- `pullUserData(userId)` — fetches all 4 tables in parallel (user_settings, habits, completions, challenges), maps snake_case → camelCase, returns the full state shape
- `pushAllData(userId, state)` — full upload (used for pre-auth migration)
- `pushHabit / deleteHabit / pushCompletion / pushChallenge / deleteChallenge / pushSettings` — granular upserts
- `syncActionToSupabase(action, stateRef)` — called after every dispatch; `stateRef.current` is the state **before** the action ran (needed to compute the new completion count for `LOG_HABIT`)

`deleteHabit` is a **soft delete** — it sets `deleted_at`, never removes the row. `pullUserData` filters with `.is('deleted_at', null)`.

### Supabase database schema

Five tables in the `public` schema, all with RLS enabled. Every table has a policy `auth.uid() = user_id` for ALL operations.

| Table | Primary key | Notable columns |
|---|---|---|
| `user_settings` | `user_id` | `theme_mode`, `onboarding_done` |
| `habits` | `id` (text) | `deleted_at` (soft delete), `reminder_time` (jsonb) |
| `completions` | composite `(user_id, habit_id, date)` | `count` integer |
| `challenges` | `id` (text) | `habit_ids` text[], `completed`, `reward_claimed` |
| `ai_insights` | `id` (uuid) | `type` ('nudge'\|'weekly_summary'\|'monthly_summary'), `content`, `period_start`, `period_end`, `metadata` (jsonb) |

`habits.id` and `challenges.id` are text (timestamp strings from `Date.now().toString()`), not UUIDs. The composite PK on `completions` makes upserts idempotent without specifying `onConflict`.

`ai_insights` is never touched by `supabaseSync.js` — it is read and written exclusively by the Edge Functions.

### Edge Functions (`supabase/functions/`)

Three Supabase Edge Functions invoked via `supabase.functions.invoke()` with the user's JWT. All three set `verify_jwt: true` at the gateway and use the service-role key internally to bypass RLS.

- **`ai-coaching-nudge`** — invoked on `StatsScreen` mount. Checks for a cached row in `ai_insights` where `type='nudge'` and `created_at >= today`. If found, returns it immediately; otherwise reads habits + completions, calls Claude, stores and returns the result. One Claude call per user per day maximum.
- **`ai-reflection-summary`** — invoked when the user taps Weekly or Monthly in StatsScreen. Caches by `(user_id, type, period_start)` so the same period never re-generates. Computes per-habit consistency and weakest day-of-week before calling Claude.
- **`delete-account`** — invoked from `AuthContext.deleteAccount()` (wired into Settings → Account → Delete account). Resolves the caller's `user.id` from the JWT, deletes their rows from all five public tables (`completions`, `challenges`, `habits`, `ai_insights`, `user_settings`), then calls `auth.admin.deleteUser(userId)`. Required by App Store guideline 5.1.1(v). Deploy with `npx supabase functions deploy delete-account --project-ref <ref>`.

`src/lib/aiCoaching.js` is a thin client: `fetchCoachingNudge()` and `fetchReflectionSummary(period)` both get the session, pass the JWT in the Authorization header, and return `data.content`. All error handling is fire-and-forget at the call site (StatsScreen catches silently and shows a retry prompt).

The Edge Function source lives in `supabase/functions/<name>/index.ts` and is written in Deno TypeScript. AI functions import from `npm:@supabase/supabase-js@2` and `npm:@anthropic-ai/sdk` and use `claude-sonnet-4-6`. `delete-account` only needs `@supabase/supabase-js`. All three set `verify_jwt: true` at the gateway level.

**Prompt constraints (do not remove):** Both edge function prompts include the rule `"Never use dashes of any kind (no hyphens, em dashes, or en dashes) anywhere in the response"`. This is intentional — dashes make the output feel AI-generated. If you edit these prompts, preserve this constraint.

**Clearing stale cache:** If prompt changes are deployed but cached rows still return old content, delete the relevant rows: `DELETE FROM ai_insights WHERE type IN ('nudge', 'weekly_summary');`. The next request will regenerate from the updated prompt.

### Theme system (`src/theme.js`, `src/ThemeContext.js`)

`src/theme.js` exports `DARK`, `LIGHT`, `FONTS`, and the `EMOJIS` array (~110 emojis).

**`FONTS` constant** is spread into both `DARK` and `LIGHT`, so font family names are available as `C.*` tokens everywhere `useTheme()` is called:

| Token | Font | Use |
|---|---|---|
| `C.logo` | `RussoOne_400Regular` | Onboarding title "HabitFlow" only |
| `C.reg` | `WorkSans_400Regular` | Body text |
| `C.med` | `WorkSans_500Medium` | Labels, sub-text |
| `C.semi` | `WorkSans_600SemiBold` | Section labels |
| `C.bold` | `WorkSans_700Bold` | Buttons, titles |
| `C.xbold` | `WorkSans_800ExtraBold` | Screen headings, hero numbers |

All six font variants are pre-loaded in `App.js`. If you add a new font, load it there and add a token to `FONTS`.

**Active palette — Warm Editorial:** warm dark surfaces, refined amber accent, sage for streaks, rust for avoidance, brick for danger. `C.primary` is `#D89860` in dark, `#A86C2D` in light. Depth comes from layered surfaces (`bg` → `card` → `cardHigh` / `heroSurface`) and 1px borders — **never use shadows on cards** (the FAB is the only exception).

Tokens beyond the basic surface/text/border set:
- `primarySoft` / `successSoft` / `warningSoft` / `dangerSoft` — rgba tints for badges, soft buttons, banners
- `primaryMuted` — mid-tone amber, used only in the StatsScreen heatmap ramp
- `borderStrong` — 1px dividers between stat cells, outline buttons, bottom-sheet handles

When changing colors, edit `src/theme.js` — it is the single source of truth for the design tokens consumed via `useTheme()`.

**Style pattern used everywhere:**
```js
const C = useTheme();
const styles = makeStyles(C);
// ...
function makeStyles(C) { return { ... }; }
```

Every text style should include `fontFamily: C.<token>`, `fontWeight`, and `letterSpacing: ls(fontSize)`. Avoid hardcoding hex values — use `C.*` tokens. The only legitimate hardcoded colors are gradient stop values inside `LinearGradient`'s `colors` prop.

### Responsive scaling (`src/utils/responsive.js`)

Baseline: iPhone 14 (390×844).
- `rs(n)` — scales to screen width (spacing, sizes, radii).
- `ms(n)` — moderate scale, 0.45 factor (font sizes).
- `vs(n)` — scales to screen height (rarely needed).
- `ls(n)` — letter spacing for a given font size: +0.3 for captions (≤12), 0 for body (13–16), −0.3 for sub-headings (17–22), −0.5 for headings (23–28), −0.8 for display (29+). Pass the same size value you pass to `ms()`.

### Screens (`src/screens/`)

The four main tab screens share the same header pattern: a plain top row (title) followed by a `heroSurface` hero card with 3-column stats, a 3px `primary` top accent strip, and a 1px `borderStrong` border (no shadow, no gradient). Each screen uses `SafeAreaView` from `react-native-safe-area-context` (not from `react-native`).

| Screen | Key data shown |
|---|---|
| `TodayScreen` | Done / Remaining / Complete% + progress bar |
| `ChallengeScreen` | Habit count or Day / Total / Left |
| `HistoryScreen` | Days tracked / Perfect days / This week% |
| `StatsScreen` | Best streak / 7-day avg / Perfect days |

`TodayScreen`'s top row has a single gear icon that calls `navigation.navigate('Settings')` via `useNavigation`. The Settings tab is registered in the Tab.Navigator but hidden from the tab bar (`tabBarButton: () => null`, `tabBarItemStyle: { display: 'none' }`) so it is only reachable via this header button.

**Streak milestones (`TodayScreen`):** a `useEffect` on `state.completions` walks each habit, computes the current streak via `calcStreak`, and fires a `CelebrationModal` (with `type="milestone"`) when the streak equals one of `[7, 14, 30, 60, 100, 200, 365]`. A session ref `celebratedMilestonesRef` tracks which `(habitId, milestone)` pairs already fired this session so the celebration does not repeat after a toggle-off-and-on. The state is intentionally session-only — if you reinstall on a milestone day you will get the celebration again on first sync, which we accept as a feature.

**Past-day logging (`HistoryScreen` + `PastDayLogSheet`):** the 7-day heat row and every row in "All logged days" are tappable. Tapping opens `PastDayLogSheet`, a bottom-sheet that renders each habit with the same control patterns as Today (toggle for daily/negative, +/− stepper for volume/timer) and dispatches `LOG_HABIT` with the explicit `date` field. Future dates are blocked by `openLogger`.

`StatsScreen` includes a GitHub-style contribution graph (`ContributionGraph` component, 16 weeks × 7 days grid, horizontally scrollable) and an **AI Coach** section at the bottom: a daily nudge card (auto-fetched on mount, cached per day) and Weekly/Monthly reflection report buttons (each generates on first tap, cached per period start date). Both use skeleton loading states and call the Edge Functions via `src/lib/aiCoaching.js`.

`SettingsScreen` is the 5th tab (gear icon). It has four grouped card sections:
- **Appearance** — dark/light mode toggle (`SET_THEME`), haptic feedback toggle (`SET_HAPTICS`)
- **Notifications** — daily reminders toggle (reads live from `Notifications.getAllScheduledNotificationsAsync()`); notification sound toggle (`SET_NOTIFICATION_SOUND` — when changed, all active reminders are immediately rescheduled with the new sound/channel setting)
- **Account** — read-only email, Change Password (calls `resetPassword(email)` and shows a timed banner), Sign Out, **Delete account** (opens a confirmation modal that requires typing `delete`; on confirm it calls `useAuth().deleteAccount()` which invokes the `delete-account` Edge Function and then `signOut`s — the app returns to `AuthScreen` via the `SIGNED_OUT` event)
- **App** — View Onboarding (dispatches `RESET_ONBOARDING`), Version (static `1.0.0`)

`OnboardingScreen` uses `useSafeAreaInsets()` for padding and has an animated `AppLogo` (float, breathe, badge bounce — all via RN `Animated` with `useNativeDriver: true`).

### Components (`src/components/`)

- **`AnimatedEmoji`** — renders an emoji with a looping semantic animation based on its meaning (🏃 runs, 🔥 flickers, ❤️ heartbeats, etc.). Props: `emoji`, `size` (optional, defaults to `ms(22)`), `style`. Exports `ANIM_TYPE` map. Used on all screens wherever habit emojis appear. Add new emoji→animation mappings to `ANIM_TYPE` in this file.
- **`HabitCard`** — renders a single habit row for all 4 habit types. The daily/negative card uses `Animated.View` as the outer wrapper (not `TouchableOpacity`) so the bell button and toggle are sibling tap targets and don't interfere. Bell icon (`alarm`/`alarm-outline`) is a dedicated column outside the toggle area; tapping it when active clears the reminder immediately, tapping when inactive opens a time picker.
- **`AddHabitModal`** — bottom-sheet modal for creating/editing habits; has a close (×) button in the fixed header row above the `ScrollView`. Emoji grid uses `ScrollView` with `nestedScrollEnabled` and `maxHeight: rs(258)` (5 rows visible). Default emoji for new habits is 🚀.
- **`HabitOptionsSheet`** — long-press bottom sheet: edit / delete / set reminder (uses `@react-native-community/datetimepicker`).
- **`PastDayLogSheet`** — bottom-sheet opened from `HistoryScreen`. Lists every habit with toggle/stepper controls for a given `date` prop and dispatches `LOG_HABIT` with that date.
- **`CelebrationModal`** — full-screen celebration overlay. `type` (`'daily' | 'challenge' | 'milestone'`) picks the default emoji and button label; optional `emoji` and `actionLabel` props override either. Fired from TodayScreen for all-habits-done and streak milestones, and from ChallengeScreen for reward claims.

### Notifications (`src/utils/notifications.js`)

Two layers:
1. **General** — `scheduleDailyReminders()` schedules `habitflow_morning` (9:00) and `habitflow_evening` (20:00). Only ever cancels these two IDs.
2. **Per-habit** — `scheduleHabitReminder(habitId, ...)` uses identifier `habit_${habitId}`. `cancelHabitReminder(habitId)` cancels only that one.

Android requires `ensureAndroidChannel()` before any scheduling — called at app startup, in `requestPermissions`, and in `scheduleHabitReminder`. The trigger format uses `SchedulableTriggerInputTypes.DAILY`.

**Sound:** A module-level `_soundEnabled` flag (set via `setNotificationSound(bool)`) controls sound for all notifications. On iOS this sets `sound: true/false` per notification content. On Android, sound is channel-level and cannot be changed after channel creation, so two channels are registered: `habitflow-reminders` (with sound) and `habitflow-reminders-silent` (vibrate only). `dailyTrigger()` picks the correct channel ID based on `_soundEnabled`. When the user changes the sound setting in SettingsScreen, all active reminders (daily + per-habit) are cancelled and rescheduled so the new channel/sound takes effect immediately.

### Haptics (`src/utils/haptics.js`)

Exports `lightTap()`, `mediumTap()`, `successBurst()`, and `setHapticsEnabled(bool)`. A module-level `_enabled` flag gates all three feedback functions — when `false`, calls are no-ops. `StoreProvider` calls `setHapticsEnabled(state.hapticsEnabled)` via a `useEffect` whenever that state field changes, keeping the flag current without requiring the functions to read from the store directly.
