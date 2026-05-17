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

**`lucide-react-native` v1.16.0 alias caveat:** the project imports several legacy icon names (`Home`, `BarChart2`, `AlertCircle`, `CheckCircle`, `HelpCircle`, `XCircle`) that are re-exported as aliases for the new circle-prefixed names (`House`, `ChartNoAxesColumn`, `CircleAlert`, etc.). If you bump the package, run `grep -rE "from 'lucide-react-native'" src/ App.js` and verify every import still resolves before assuming the build passes.

**No test / lint / typecheck is set up.** There is no `npm test`, no ESLint config, no TypeScript. Don't waste time searching — those gaps are deliberate-for-now, not hidden somewhere.

**EAS Build / Submit** (configured in `eas.json`):
```bash
npx eas build --profile development --platform android   # dev client for on-device debugging
npx eas build --profile preview     --platform ios       # simulator-only iOS build
npx eas build --profile production  --platform all       # store-ready binaries (autoIncrement on)
npx eas submit --profile production --platform ios       # requires Apple credentials in eas.json
npx eas submit --profile production --platform android   # requires ./play-service-account.json
```
The `submit.production.ios` block in `eas.json` ships with `REPLACE_WITH_…` placeholders for `appleId`, `ascAppId`, and `appleTeamId` — submit will fail until those are filled in. Android submit reads `./play-service-account.json` (gitignored). Do not commit either credential.

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

The first deploy on any machine will fail with `401 Unauthorized` until you authenticate the CLI. The login flow is interactive (opens a browser), so you cannot run it from a non-interactive shell — run `npx supabase login` yourself first.

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
  habits: [{ id, name, emoji, type, targetCount, reminderTime, shieldsPerMonth, pauses, createdAt }],
  completions: { 'YYYY-MM-DD': { [habitId]: number } },
  notes: { 'YYYY-MM-DD': string },  // free-text day notes (max 500 chars enforced in UI)
  challenge: { id, title, durationDays, startDate, habitIds, completed, rewardClaimed } | null,
  globalPause: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' } | null,  // vacation mode for all habits
  addHabitNudgeDismissed: boolean,  // user has dismissed the "start with 1-3 habits" pushback at least once
  tutorialDismissed: boolean,       // user has dismissed the first-run TutorialOverlay
}
```

**Habit types:** `daily` (toggle), `volume` (count reps), `timer` (minutes, steps of 5), `negative` (avoidance toggle). The `LOG_HABIT` action toggles `daily`/`negative` and uses `delta` for `volume`/`timer`. Pass `action.date` (a `YYYY-MM-DD` string) to log for a past day; if omitted, defaults to `todayKey()`. The same fallback runs in `syncActionToSupabase` so past-day logs persist to the correct `(habitId, date)` row.

**Exported hooks/helpers:** `useStore()`, `useTodayCompletions()`, `useChallengeProgress(state)`, `calcStreak(habit, completions, globalPause)`, `consistency30(habit, completions, globalPause)`. Both streak helpers are thin re-exports from `src/utils/streak.js` — see **Streak preservation** below.

**Initialisation sequence:**
1. Load AsyncStorage cache → `dispatch(LOAD)` → set `storeReady = true` (fast, local)
2. Re-register all habit reminders from cached data
3. If a Supabase session exists, pull remote state and overwrite local; if local has pre-auth habits, migrate them up to Supabase

**`syncedDispatch`** (what `useStore().dispatch` actually is): generates stable IDs for `ADD_HABIT` and `START_CHALLENGE` before dispatching, then calls `syncActionToSupabase` fire-and-forget after every action. All screens use `useStore().dispatch` — none bypass the sync.

`SET_HAPTICS` and `SET_NOTIFICATION_SOUND` are intentionally not handled in `syncActionToSupabase` — both are device-local preferences. `StoreProvider` has `useEffect` hooks watching `state.hapticsEnabled` and `state.notificationSound` that call `setHapticsEnabled()` and `setNotificationSound()` respectively to keep module flags in sync with persisted values on every app start.

`SET_HABIT_PAUSE`, `SET_GLOBAL_PAUSE`, and `DISMISS_ADD_HABIT_NUDGE` ARE synced — the first two are load-bearing for streak math on every device, and the third prevents the same nudge from re-firing across reinstalls.

### Streak preservation (`src/utils/streak.js`)

Two mechanisms keep streaks alive across real life so the user doesn't ragequit after one missed day (the #1 churn driver in the habit-tracker market). `calcStreak` walks backward from today and applies them in this order:

1. **Pauses** — date ranges where the day is *invisible* to the algorithm. No streak credit, no break. Two sources, both checked by `isPaused(habit, dateStr, globalPause)`:
   - `habit.pauses: [{ start, end }]` — per-habit pause, set from `HabitOptionsSheet` → "Pause habit" via `dispatch({ type: 'SET_HABIT_PAUSE', id, pause })`. Pass `pause: null` to resume.
   - `state.globalPause: { start, end }` — vacation mode for all habits, set from `SettingsScreen` → "Vacation mode" via `dispatch({ type: 'SET_GLOBAL_PAUSE', pause })`.
2. **Shields** — a per-habit budget of forgiven misses per **calendar month** (`habit.shieldsPerMonth`, default 2). When `calcStreak` hits a missed non-paused day, it spends a shield if the month's budget isn't exhausted; if exhausted, the streak breaks. Shields don't *add* to the streak — they bridge it (Duolingo-style). The budget is computed implicitly on every read; we do not persist "shield used on day X" anywhere.
3. **Today grace** — if today isn't logged yet, that's not treated as a miss. The algorithm just skips it. As soon as midnight passes, today becomes yesterday and the shield/break logic applies normally.

`consistency30(habit, completions, globalPause)` returns `{done, eligible, percent}` for the last 30 days **excluding pauses** — surfaced as "X/Y last 30d · Z% consistency" in StatsScreen per-habit rows. This is the "trajectory" metric that survives a missed day, the headline that should grow in importance as the user matures past raw streak counting.

`shieldUsage(habit, completions, globalPause)` returns `{used, remaining, total}` for the **current calendar month**. It walks the same backward path as `calcStreak` and stops counting at the same break point, so a habit whose streak broke last week reports `used: 0` for this month (the misses aren't being shielded by the active streak anymore). Surfaced in `HabitOptionsSheet` as an always-visible coloured info row ("2 streak shields ready this month" / "1 of 2 shields left this month" / "All 2 shields used this month") and on `StatsScreen` per-habit rows as a small Shield-icon pill (only rendered when `used > 0`; amber while shields remain, red when the budget is exhausted).

**Server-side parity:** `supabase/functions/ai-coaching-nudge/index.ts` reimplements the same `isPaused` + `calcStreak` algorithm so the AI coach reads the same streak the user sees. Any change to the client streak rules must be mirrored there or the AI will give contradictory advice ("you broke your streak!" while the app shows it intact).

`calcStreak` in `src/store.js` is a back-compat wrapper: if called with `(habitId: string, completions)` (the legacy signature) it falls back to a zero-shield, no-pause computation. All current call sites pass the full habit object — the wrapper exists only as a safety net for stray imports.

### Supabase sync (`src/lib/supabaseSync.js`)

All functions use `supabase.from(table)`:

- `pullUserData(userId)` — fetches all 4 tables in parallel (user_settings, habits, completions, challenges), maps snake_case → camelCase, returns the full state shape
- `pushAllData(userId, state)` — full upload (used for pre-auth migration)
- `pushHabit / deleteHabit / pushCompletion / pushChallenge / deleteChallenge / pushSettings` — granular upserts
- `syncActionToSupabase(action, stateRef)` — called after every dispatch; `stateRef.current` is the state **before** the action ran (needed to compute the new completion count for `LOG_HABIT`)

`deleteHabit` is a **soft delete** — it sets `deleted_at`, never removes the row. `pullUserData` filters with `.is('deleted_at', null)`.

### Supabase database schema

Seven tables in the `public` schema, all with RLS enabled. Every table has a policy `auth.uid() = user_id` for ALL operations.

| Table | Primary key | Notable columns |
|---|---|---|
| `user_settings` | `user_id` | `theme_mode`, `onboarding_done`, `global_pause` (jsonb, vacation mode), `add_habit_nudge_dismissed` (boolean, pushback acknowledged), `tutorial_dismissed` (boolean, on-Today tutorial overlay seen) |
| `habits` | `id` (text) | `deleted_at` (soft delete), `reminder_time` (jsonb), `shields_per_month` (int, default 2), `pauses` (jsonb array of `{start,end}`) |
| `completions` | composite `(user_id, habit_id, date)` | `count` integer |
| `day_notes` | composite `(user_id, date)` | `note` text — free-text notes attached to a single day, surfaced in HistoryScreen and fed to ai-reflection-summary |
| `challenges` | `id` (text) | `habit_ids` text[], `completed`, `reward_claimed` |
| `ai_insights` | `id` (uuid) | `type` ('nudge'\|'weekly_summary'\|'monthly_summary'), `content`, `period_start`, `period_end`, `metadata` (jsonb) |
| `push_tokens` | `token` (text) | `user_id` (FK cascade), `platform` ('ios'\|'android'\|'web'), `updated_at`. One row per device per token. |

`habits.id` and `challenges.id` are text (timestamp strings from `Date.now().toString()`), not UUIDs. The composite PK on `completions` makes upserts idempotent without specifying `onConflict`. `push_tokens.token` is the PK (not user_id) so a single user can have multiple devices registered; `on delete cascade` on `user_id` cleans up the rows when an account is deleted.

`ai_insights` and `push_tokens` are never touched by `supabaseSync.js` — they are read and written exclusively by the Edge Functions and (for tokens) by `registerPushToken` in `src/utils/notifications.js`.

### Edge Functions (`supabase/functions/`)

Four Supabase Edge Functions invoked via `supabase.functions.invoke()` with the user's JWT. All four set `verify_jwt: true` at the gateway and use the service-role key internally to bypass RLS.

- **`ai-coaching-nudge`** — invoked on `StatsScreen` mount. Checks for a cached row in `ai_insights` where `type='nudge'` and `created_at >= today`. If found, returns it immediately; otherwise reads habits + completions + `user_settings.global_pause`, calls Claude, stores and returns the result. One Claude call per user per day maximum. Computes a `weakestWeekday` pattern per habit (≥14 days old, ≥3 occurrences on that weekday, ≥30% worse than the habit's overall rate); if any habit has a pattern, the strongest one is fed to Claude with instructions to lead the nudge with a curious question ("what's different about Wednesdays?") rather than streak praise. The streak passed to Claude uses the same shield+pause-aware algorithm as the client so the AI doesn't contradict what the UI shows. **After inserting the new nudge into `ai_insights`, fire-and-forget invokes `send-push`** (truncated to 140 chars, title "Your coach has a note for you") so the user gets the nudge on their lock screen even if they don't open StatsScreen.
- **`ai-reflection-summary`** — invoked when the user taps Weekly or Monthly in StatsScreen. Caches by `(user_id, type, period_start)` so the same period never re-generates. Computes per-habit consistency and weakest day-of-week, AND pulls `day_notes` for the period so the AI can reference the user's own context ("the travel days clearly slowed momentum, but you bounced back"). The prompt instructs Claude to weave notes in naturally, never quote them verbatim.
- **`send-push`** — server-side push sender. Takes `{ user_id, title?, body, data? }`, looks up `push_tokens` rows for that user, POSTs them in batches of 100 to `https://exp.host/--/api/v2/push/send` (the unauthenticated Expo push API — no API key needed). Tickets with `details.error === "DeviceNotRegistered"` cause the corresponding token row to be deleted, so the table self-cleans when users uninstall. Currently invoked by `ai-coaching-nudge`; future triggers (streak-break warnings, weekly summary ready, etc.) should also call this function rather than duplicating the Expo HTTP plumbing. Deploy with `npx supabase functions deploy send-push --project-ref <ref>`.
- **`delete-account`** — invoked from `AuthContext.deleteAccount()` (wired into Settings → Account → Delete account). Resolves the caller's `user.id` from the JWT, deletes their rows from all seven public tables (`completions`, `challenges`, `habits`, `day_notes`, `ai_insights`, `push_tokens`, `user_settings`), then calls `auth.admin.deleteUser(userId)`. The `push_tokens` cascade is redundant with the FK `on delete cascade` but kept in the explicit list to prevent drift if the FK is ever changed. Required by App Store guideline 5.1.1(v). Deploy with `npx supabase functions deploy delete-account --project-ref <ref>`.

`src/lib/aiCoaching.js` is a thin client: `fetchCoachingNudge()` and `fetchReflectionSummary(period)` both get the session, pass the JWT in the Authorization header, and return `data.content`. All error handling is fire-and-forget at the call site (StatsScreen catches silently and shows a retry prompt).

The Edge Function source lives in `supabase/functions/<name>/index.ts` and is written in Deno TypeScript. AI functions import from `npm:@supabase/supabase-js@2` and `npm:@anthropic-ai/sdk` and use `claude-sonnet-4-6`. `delete-account` and `send-push` only need `@supabase/supabase-js`. All four set `verify_jwt: true` at the gateway level — both user JWTs and the service-role key are accepted, which is what allows `ai-coaching-nudge` to invoke `send-push` server-to-server.

**Prompt constraints (do not remove):** Both edge function prompts include the rule `"Never use dashes of any kind (no hyphens, em dashes, or en dashes) anywhere in the response"`. This is intentional — dashes make the output feel AI-generated. If you edit these prompts, preserve this constraint.

**Clearing stale cache:** If prompt changes are deployed but cached rows still return old content, delete the relevant rows: `DELETE FROM ai_insights WHERE type IN ('nudge', 'weekly_summary');`. The next request will regenerate from the updated prompt.

### Theme system (`src/theme.js`, `src/ThemeContext.js`)

`src/theme.js` exports `DARK`, `LIGHT`, `FONTS`, and the `EMOJIS` array (~110 emojis).

**`FONTS` constant** is spread into both `DARK` and `LIGHT`, so font family names are available as `C.*` tokens everywhere `useTheme()` is called. Two typefaces, with strict boundaries:

| Token | Font | Use |
|---|---|---|
| `C.logo`  | `Chopera`                | **Brand mark only** — "HabitFlow" wordmark on AuthScreen + OnboardingScreen. Do not use elsewhere |
| `C.reg`   | `WorkSans_400Regular`    | Body text |
| `C.med`   | `WorkSans_500Medium`     | Labels, sub-text |
| `C.semi`  | `WorkSans_600SemiBold`   | Section labels |
| `C.bold`  | `WorkSans_700Bold`       | Buttons, titles |
| `C.xbold` | `WorkSans_800ExtraBold`  | Display headlines, hero numbers |

Chopera is a decorative display face shipped as a custom asset (`assets/Chopera.otf`) and loaded by family name in `App.js`'s `useFonts` call. Reserved exclusively for the HabitFlow wordmark — keeping it isolated means the brand always stands apart from body and UI labels. Chopera renders cleaner with a touch of positive letter-spacing (`+0.5` to `+0.8` at display sizes) — calibrated values live at the call sites in AuthScreen and OnboardingScreen.

**License caveat**: Chopera ships under the FSLA (Free Style License Agreement) which is non-commercial only. See `assets/FSLA_NonCommercial_License.html`. A commercial license is required before App Store / Play Store submission — link to purchase is in `assets/Get Commercial License.url`.

All five Work Sans weights are loaded from `@expo-google-fonts/work-sans`; Chopera is loaded via `require('./assets/Chopera.otf')` in the same `useFonts` call. If you add another asset font, follow the same pattern.

### Brand mark

`src/components/AppLogo.js` is the canonical mark — an animated "ripple":

- Three static concentric rings (radii 18 / 30 / 42, fading outward) form the body — these are the **discipline**, the structure of returning every day
- A center filled dot is the **daily choice**
- The center pulses (scale 1 → 1.14 → 1, 2.8s cycle) at the moment each ripple is born — that pulse IS the choice being made today
- A ring emanates outward from the inner static ring, growing through the outer rings as it fades — that is the **consequence** of the daily choice rippling through your life

The animation IS the meaning. Watching it for a few seconds you read: small act at the center → wave outward touching everything. Universal symbol, rendered with static `react-native-svg` rings + `Animated.View` for the emanating ring and pulsing dot. Native-driver animations — runs at 60fps without touching the JS thread per frame.

Props: `size` (default 96), `animate` (default true — set false for static icon contexts), `tone` (`'default'` uses primary; `'mono'` uses text color for ghost states). Used in a vertical lockup with the wordmark on AuthScreen (`size=rs(64)`) and OnboardingScreen (`size=rs(108)`). Do not introduce a competing icon to represent the brand — any "HabitFlow logo" surface should use this component.

**Active palette — Dusk (cool neutral dark, indigo-violet accent):** the design system is built on HCI principles (calm by default, recognition over recall, AA-contrast minimums) and Figma's strict-token discipline. `C.primary` is `#7C6BFA` in dark, `#5A48D6` in light — a single accent used *only* for actionable things. Decorative color is not allowed; semantic colors (`success` / `warning` / `danger`) carry state only.

Depth comes from layered surfaces (`bg` → `tileEmpty` → `card` → `cardHigh` / `heroSurface`) and 1px borders — **never use shadows on cards** (the FAB exception was retired with the bento rewrite).

Tokens beyond the basic surface/text/border set:
- `primaryStrong` — `#9685FF` (dark) / `#4838B8` (light). Extra-punch for CTAs that need to pop (today dot on ChallengeTrack, etc.)
- `primarySoft` / `successSoft` / `warningSoft` / `dangerSoft` — rgba tints for badges, soft buttons, banners, done-state tile fills
- `primaryMuted` — deep indigo, used only in the 5-step heatmap ramp (StatsScreen contribution graph)
- `tileEmpty` — sits between `bg` and `card`, the background for "pending" habit tiles so they read as a recessed surface against the soft elevations
- `borderStrong` — 1px dividers between stat cells, outline buttons, bottom-sheet handles
- `warning` is amber (`#F5B14D` dark) — cautionary, used for the "Avoid" badge on negative habits. `danger` is crimson (`#F26E6E` dark) — used only for destructive actions (delete habit, delete account)

Contrast ratios on dark mode are verified WCAG AA or better — see the comment block at the top of `src/theme.js`. When proposing new colors, run the same check.

The heatmap ramp lives in `src/utils/heatmap.js` (`heatColor` for the 4-step calendar/cell ramp, `heatRamp` for the 5-step contribution graph ramp, `rampSwatches` for legends). MonthCalendar and ContributionGraph both import from here — never duplicate the color-step logic at call sites.

When changing colors, edit `src/theme.js` — it is the single source of truth for the design tokens consumed via `useTheme()`.

### Style conventions

Every screen and component follows the same pattern: pull tokens once at the top, build a styles object via a `makeStyles(C)` factory, render.

```js
const C = useTheme();
const styles = makeStyles(C);
// ...
function makeStyles(C) { return { ... }; }
```

Every text style should include `fontFamily: C.<token>`, `fontWeight`, and `letterSpacing: ls(fontSize)`. Avoid hardcoding hex values — use `C.*` tokens.

### Responsive scaling (`src/utils/responsive.js`)

Baseline: iPhone 14 (390×844).
- `rs(n)` — scales to screen width (spacing, sizes, radii).
- `ms(n)` — moderate scale, 0.45 factor (font sizes).
- `vs(n)` — scales to screen height (rarely needed).
- `ls(n)` — letter spacing for a given font size: +0.3 for captions (≤12), 0 for body (13–16), −0.3 for sub-headings (17–22), −0.5 for headings (23–28), −0.8 for display (29+). Pass the same size value you pass to `ms()`.

### Screens (`src/screens/`) — bento direction ("Pulse")

Each screen earns its own layout instead of templating a hero card. The shared header is a top-row with a small uppercase label + a larger title; no two screens look identical below that.

| Screen | Lead element |
|---|---|
| `TodayScreen` | Date headline + 3-up `StatTile` strip + inline "Add habit" button + bento grid of habit tiles (`HabitTileWide` for volume/timer, paired `HabitTileSmall` for daily/negative) |
| `ChallengeScreen` | `ChallengeTrack` (horizontal journey of dots with connecting line) + today's habits as a compact list |
| `HistoryScreen` | `MonthCalendar` grid with prev/next nav + `StatTile` strip below for this-month stats |
| `StatsScreen` | 2×2 `StatTile` bento (best streak / 7-day avg / days tracked / perfect days) + `ContributionGraph` card + per-habit streak rows (subtitle shows `X/Y last 30d` or `Paused through {date}`; secondary `% consistency` line under the streak pill) + AI Coach |

`TodayScreen`'s top row has a single gear icon that calls `navigation.navigate('Settings')` via `useNavigation`. The Settings tab is registered in the Tab.Navigator but hidden from the tab bar (`tabBarButton: () => null`, `tabBarItemStyle: { display: 'none' }`) so it is only reachable via this header button. There is no FAB on Today — the inline "Add habit" button above the grid is the only entry point.

**"Take it slow?" pushback (`TodayScreen`):** the Add habit button is routed through `attemptOpenAdd`, which intercepts when `habits.length >= 3 && !state.addHabitNudgeDismissed` and shows a one-time soft-warning modal citing the behavioral-science finding that starting with 1-3 habits sticks ~3× more often than starting with many. "Hold off for now" dismisses the modal but does not flip the flag (user gets the nudge again on a future attempt); "Add anyway" dispatches `DISMISS_ADD_HABIT_NUDGE` (persisted to `user_settings.add_habit_nudge_dismissed`) and opens AddHabitModal. The flag is one-way — once set, the user is trusted forever. Returning users who already have 4+ habits will see the pushback exactly once on their next Add tap, which we accept as low-cost noise.

**Today's-note shortcut (`TodayScreen`):** a small card sits below the "Add habit" button (gated on `habits.length > 0` so the empty state stays clean). Dashed border + "Add a note for today…" placeholder when empty, solid card with the note text (2-line truncation) when filled. Tap opens `PastDayLogSheet` with `date={todayStr}` — reusing the existing sheet means the NOTE input is right at the top of the modal and the rest of the sheet still works as a backfill surface if the user wants to confirm any habit toggles for today. No separate component, no duplication.

**First-run tutorial overlay (`TutorialOverlay` + `TodayScreen`):** a two-card overlay that teaches the things a user can't learn from a passive look at Today — the long-press menu and the streak preservation system (shields + vacation). TodayScreen's `useEffect` opens it whenever `state.onboardingDone && !state.tutorialDismissed`, so it fires once on the next Today mount after onboarding and never again. "Skip" or "Got it" both dispatch `DISMISS_TUTORIAL` (persisted to `user_settings.tutorial_dismissed`). A "Replay tutorial" row in Settings → App dispatches `RESET_TUTORIAL` and shows a banner telling the user the overlay will reappear when they next open Today. Card count is intentionally capped at 2; if a third is ever added, keep total ≤ 3 — tutorial drop-off climbs sharply past that point.

**Habit tiles**: small (square, daily/negative, paired two-up) and wide (full-width, volume/timer with inline progress + stepper). Tap a small tile to toggle. Long-press any tile to open `HabitOptionsSheet`. Done state: tile fills with `successSoft`, border switches to bright `success`.

**Streak milestones (`TodayScreen`):** a `useEffect` on `state.completions` walks each habit, computes the current streak via `calcStreak`, and fires a `CelebrationModal` (with `type="milestone"`) when the streak equals one of `[7, 14, 30, 60, 100, 200, 365]`. A session ref `celebratedMilestonesRef` tracks which `(habitId, milestone)` pairs already fired this session so the celebration does not repeat after a toggle-off-and-on. The state is intentionally session-only — if you reinstall on a milestone day you will get the celebration again on first sync, which we accept as a feature.

**Past-day logging (`HistoryScreen` + `PastDayLogSheet`):** tap any past cell in `MonthCalendar` to open `PastDayLogSheet`, a bottom-sheet that renders each habit with the same control patterns as Today (toggle for daily/negative, +/− stepper for volume/timer) and dispatches `LOG_HABIT` with the explicit `date` field. Future dates and future months are blocked.

`SettingsScreen` is the 5th tab (gear icon). It has five grouped card sections:
- **Appearance** — dark/light mode toggle (`SET_THEME`), haptic feedback toggle (`SET_HAPTICS`)
- **Vacation mode** — single tappable row that opens a date picker for "Start vacation" (sets `state.globalPause`) or shows "On vacation · Streaks safe through {date}" with tap-to-end. Dispatches `SET_GLOBAL_PAUSE`. The pause is honored by `calcStreak` and `consistency30` across every habit — see **Streak preservation**.
- **Notifications** — daily reminders toggle (reads live from `Notifications.getAllScheduledNotificationsAsync()`); notification sound toggle (`SET_NOTIFICATION_SOUND` — when changed, all active reminders are immediately rescheduled with the new sound/channel setting)
- **Account** — read-only email, Change Password (calls `resetPassword(email)` and shows a timed banner), Sign Out, **Delete account** (opens a confirmation modal that requires typing `delete`; on confirm it calls `useAuth().deleteAccount()` which invokes the `delete-account` Edge Function and then `signOut`s — the app returns to `AuthScreen` via the `SIGNED_OUT` event)
- **App** — View Onboarding (dispatches `RESET_ONBOARDING`), Replay Tutorial (dispatches `RESET_TUTORIAL` and surfaces a banner; overlay reappears on next Today mount), Version (static `1.0.0`)

`OnboardingScreen` uses `useSafeAreaInsets()` for padding and renders an animated `AppLogo` (single entrance spring — ambient orbiting-badge loops were intentionally removed to keep framerate predictable).

### Components (`src/components/`)

- **`AnimatedEmoji`** — renders an emoji with a looping semantic animation based on its meaning (🏃 runs, 🔥 flickers, ❤️ heartbeats, etc.). Props: `emoji`, `size` (optional, defaults to `ms(22)`), `style`. Exports `ANIM_TYPE` map. Used on all screens wherever habit emojis appear. Add new emoji→animation mappings to `ANIM_TYPE` in this file.
- **`HabitTileSmall`** — square tile for daily/negative habits, designed to pair two-up. Tap to toggle (with press scale animation), long-press for options. Done state: tile fills `successSoft` + bright `success` border + animated check pip.
- **`HabitTileWide`** — full-width tile for volume/timer habits. Inline progress bar (animated spring on update), +/− stepper at right. Long-press for options. No tap-to-toggle (use the stepper).
- **`StatTile`** — generic bento stat cell. Props: `value`, `label`, `accent`, `Icon`, `compact`. Used in the Today stat strip (compact) and the StatsScreen 2×2 bento (full).
- **`MonthCalendar`** — month grid for HistoryScreen. Props: `year`, `month`, `completions`, `habits`, `notes`, `onSelectDay`, `onChangeMonth`, `todayStr`. Cell colors come from `heatColor()` in `src/utils/heatmap.js`. Days with a `notes[dateStr]` entry render a small dot at the bottom of the cell (white on filled cells, `C.primary` on light ones). Next-month button is disabled when viewing the current or a future month.
- **`ChallengeTrack`** — horizontal journey track. Props: `progress` (array of `{ key, allDone }` from `useChallengeProgress`), `currentDayIndex`. Filled green dots for completed days, pulsing primary dot for today, hollow dots for upcoming, hollow muted dots for missed past days. Connector line between dots colored by completion.
- **`AddHabitModal`** — bottom-sheet modal for creating/editing habits; has a close (×) button in the fixed header row above the `ScrollView`. Emoji grid uses `ScrollView` with `nestedScrollEnabled` and `maxHeight: rs(258)` (5 rows visible). Default emoji for new habits is 🚀.
- **`HabitOptionsSheet`** — long-press bottom sheet: edit / set reminder / pause / delete (uses `@react-native-community/datetimepicker`). Header shows a coloured shield-status row driven by `shieldUsage(habit, state.completions, state.globalPause)` (green when full, amber as shields are used, red when exhausted). The pause row reads `habit.pauses[0]` to flip between "Pause habit" (opens a date picker to set the resume date, starts today) and "Resume habit" (clears the pause). Both go through the `onSetPause(id, pause)` prop which TodayScreen wires to `dispatch({ type: 'SET_HABIT_PAUSE', id, pause })`.
- **`PastDayLogSheet`** — bottom-sheet opened from `HistoryScreen` (and from `TodayScreen` via the today's-note shortcut). Lists every habit with toggle/stepper controls for a given `date` prop and dispatches `LOG_HABIT` with that date. Also exposes a multi-line **NOTE** TextInput at the top (max 500 chars) — text is held in local state and persisted via `SET_DAY_NOTE` on a 700ms debounce, with a force-flush on close so a fast dismiss doesn't drop the note. Do NOT wrap in `KeyboardAvoidingView` — Metro chokes on that wrapper here (tag balance is correct but the parser still errors); the iOS keyboard does overlay the sheet temporarily but the note text is preserved.
- **`CelebrationModal`** — full-screen celebration overlay. `type` (`'daily' | 'challenge' | 'milestone'`) picks the default emoji and button label; optional `emoji` and `actionLabel` props override either. Fired from TodayScreen for all-habits-done and streak milestones, and from ChallengeScreen for reward claims.

### Notifications (`src/utils/notifications.js`)

Two layers:
1. **General** — `scheduleDailyReminders()` schedules `habitflow_morning` (9:00) and `habitflow_evening` (20:00). Only ever cancels these two IDs.
2. **Per-habit** — `scheduleHabitReminder(habitId, ...)` uses identifier `habit_${habitId}`. `cancelHabitReminder(habitId)` cancels only that one.

Android requires `ensureAndroidChannel()` before any scheduling — called at app startup, in `requestPermissions`, and in `scheduleHabitReminder`. The trigger format uses `SchedulableTriggerInputTypes.DAILY`.

**Sound:** A module-level `_soundEnabled` flag (set via `setNotificationSound(bool)`) controls sound for all notifications. On iOS this sets `sound: true/false` per notification content. On Android, sound is channel-level and cannot be changed after channel creation, so two channels are registered: `habitflow-reminders` (with sound) and `habitflow-reminders-silent` (vibrate only). `dailyTrigger()` picks the correct channel ID based on `_soundEnabled`. When the user changes the sound setting in SettingsScreen, all active reminders (daily + per-habit) are cancelled and rescheduled so the new channel/sound takes effect immediately.

**Foreground handler:** `setNotificationHandler` at the top of the file returns both the SDK 51+ keys (`shouldShowBanner` + `shouldShowList`) and the legacy `shouldShowAlert`. The legacy key is no-op on current runtimes but is kept for back-compat with older clients — do not drop it.

**Re-registration after Supabase pull:** `registerAllReminders(habits)` is called by `StoreProvider` after every Supabase pull (init + `SIGNED_IN`) because the pull replaces local habits with whatever the server says. Without it, a stale local schedule outlives the new habit data and the user gets reminders for habits that no longer exist (or no reminder for a new one).

**Remote push (`registerPushToken` + `push_tokens` table + `send-push` function):**

Push tokens are obtained via `Notifications.getExpoPushTokenAsync({ projectId })` and stored in `public.push_tokens` keyed by token (one row per device). `registerPushToken(userId)` is called by `StoreProvider` after every successful Supabase pull (init + `SIGNED_IN`) and gates on four things: `Device.isDevice` (skip simulators), `getPermissionsAsync().status === 'granted'`, a resolvable EAS `projectId`, and a non-null token from Expo. Any failure returns `null` silently — push registration must never block app startup.

The `projectId` is read from `Constants.expoConfig?.extra?.eas?.projectId` (set by running `npx eas init` once — it writes to `app.json`). Until that runs, `registerPushToken` logs a one-line warning and returns null; everything else still works.

Server-to-client delivery goes through the `send-push` Edge Function — never POST to `exp.host` directly from app code. To trigger a push from another Edge Function:

```ts
supabase.functions.invoke("send-push", {
  body: { user_id, title: "…", body: "…", data: { type: "nudge" } }
}).catch(() => {});
```

Fire-and-forget. The function handles batching, DeviceNotRegistered cleanup, and per-platform channel selection.

**Critical: Expo Go cannot receive remote push.** As of SDK 53+, the Expo Go app is no longer a valid push recipient on Android, and reliability has dropped on iOS. To test push end-to-end the user must build a development client (`npx eas build --profile development --platform android`) and install the resulting APK. Local scheduled notifications are also unreliable in Expo Go — same fix. If something seems "not working" with notifications, step zero is always: are you on a dev build?

### Haptics (`src/utils/haptics.js`)

Exports `lightTap()`, `mediumTap()`, `successBurst()`, and `setHapticsEnabled(bool)`. A module-level `_enabled` flag gates all three feedback functions — when `false`, calls are no-ops. `StoreProvider` calls `setHapticsEnabled(state.hapticsEnabled)` via a `useEffect` whenever that state field changes, keeping the flag current without requiring the functions to read from the store directly.

## Launch / store submission

App identity is fixed in `app.json`:
- iOS `bundleIdentifier`: `com.dem0saic.habitflow`, `buildNumber: "1"`, `ITSAppUsesNonExemptEncryption: false` (HabitFlow only hits Supabase + Anthropic over standard HTTPS — no custom crypto, so the encryption export declaration is unchecked)
- Android `package`: `com.dem0saic.habitflow`, `versionCode: 1`
- `userInterfaceStyle: "automatic"` lets the OS theme follow the user's system setting until they override it in the in-app Appearance toggle
- `primaryColor: "#7C6BFA"` matches `C.primary` in dark mode — keep these in lockstep if the palette changes

Reference docs at the repo root (not loaded at runtime, used for store submission):
- **`PRIVACY.md`** — plain-English privacy policy. Must be hosted at a public URL before App Store / Play Store submission (both stores require a link, not a file upload). The Account Deletion section is what satisfies App Store guideline 5.1.1(v).
- **`STORE_LISTING.md`** — copy + asset checklist for both stores (description, keywords, screenshot specs, EAS env setup). Read this before generating any store-facing marketing copy so the voice stays consistent.

**Pre-submission blockers** (none are wired into the build — they bite at store-review time):
1. **Chopera font license** — current FSLA is non-commercial only (see `assets/FSLA_NonCommercial_License.html`). A commercial license must be purchased before either store submission, or the brand wordmark has to be swapped for a different font.
2. **Real 1024×1024 app icon** + Adaptive icon foreground — `assets/icon.png` and `assets/adaptive-icon.png` are still Expo defaults.
3. **Screenshots** — STORE_LISTING.md lists the required sizes per device class; capture from a real build, not Expo Go.
4. **Hosted PRIVACY.md URL** — both store consoles need this filled in.
5. **`eas.json` placeholders** — fill the three `REPLACE_WITH_…` Apple values and drop a real `play-service-account.json` at the repo root (already in `.gitignore`).
