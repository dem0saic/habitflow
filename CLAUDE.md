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

## Platform notes

- iOS builds require macOS. Use Expo Go for iOS testing on Windows.
- Android emulator requires Android Studio with a configured AVD.
- `newArchEnabled: true` is set in `app.json` (React Native New Architecture is on).

## Architecture

HabitFlow is an Expo (React Native) habit tracker. The entry point is `index.js` → `App.js`. Do not edit `index.js`.

### Provider stack (`App.js`)

```
SafeAreaProvider
  └─ StoreProvider          ← global state + AsyncStorage persistence
       └─ GluestackWrapper  ← gluestack-style colorMode (reads state.themeMode directly)
            └─ ThemeProvider ← resolves DARK/LIGHT palette → useTheme()
                 └─ InnerApp ← StatusBar + AppNavigator
```

`InnerApp` reads `state.themeMode` directly from the store — **do not use `useColorMode()` from `@gluestack-style/react`**, it sets a module-level flag on first render and never updates.

### State management (`src/store.js`)

Single global store via React `useReducer` + `AsyncStorage` (key: `@habitapp_state_v1`).

**State shape:**
```js
{
  onboardingDone: boolean,
  themeMode: 'dark' | 'light',
  habits: [{ id, name, emoji, type, targetCount, reminderTime, createdAt }],
  completions: { 'YYYY-MM-DD': { [habitId]: number } },
  challenge: { id, title, durationDays, startDate, habitIds, completed, rewardClaimed } | null,
}
```

**Habit types:** `daily` (toggle), `volume` (count reps), `timer` (minutes, steps of 5), `negative` (avoidance toggle). The `LOG_HABIT` action toggles `daily`/`negative` and uses `delta` for `volume`/`timer`.

**Exported hooks/helpers:** `useStore()`, `useTodayCompletions()`, `useChallengeProgress(state)`, `calcStreak(habitId, completions)`.

On every cold start, the store re-registers all habit reminders from AsyncStorage to fix stale notification triggers.

### Theme system (`src/theme.js`, `src/ThemeContext.js`)

`src/theme.js` exports `DARK` and `LIGHT` color palettes and the `EMOJIS` array (~110 emojis). `ThemeProvider` picks the active palette based on `state.themeMode`. All screens/components call `useTheme()` to get the color object `C` and pass it into `makeStyles(C)`.

**Active palette — Gothic Noir (Figma Combination 58):** `#000000` · `#D1D0D0` · `#988686` · `#5C4E4E`. `C.primary` is `#988686` (muted mauve) in dark mode and `#5C4E4E` (dark taupe) in light mode. `C.text` is `#D1D0D0` (light gray) in dark, `#000000` in light. The same palette is mirrored in `src/gluestack.config.js` under `themes.dark` and `themes.light`.

When changing colors, update **both** `src/theme.js` and `src/gluestack.config.js` together — they must stay in sync.

**Style pattern used everywhere:**
```js
const C = useTheme();
const styles = makeStyles(C);
// ...
function makeStyles(C) { return { ... }; }
```

Avoid hardcoding hex values in screens — use `C.*` tokens. The only legitimate hardcoded colors are gradient stop values (which can't reference `C` inside `LinearGradient`'s `colors` prop array).

### Screens (`src/screens/`)

All four main screens share the same header pattern: a plain top row (title + action buttons) followed by a floating `LinearGradient` hero card with 3-column stats. Each screen uses `SafeAreaView` from `react-native-safe-area-context` (not from `react-native`).

| Screen | Hero card gradient | Key data shown |
|---|---|---|
| `TodayScreen` | `#000000 → #3D2E2E` | Done / Remaining / Complete% + progress bar |
| `ChallengeScreen` | `#000000 → #5C4E4E` | Habit count or Day / Total / Left |
| `HistoryScreen` | `#000000 → #5C4E4E` | Days tracked / Perfect days / This week% |
| `StatsScreen` | `#000000 → #988686` | Best streak / 7-day avg / Perfect days |

`StatsScreen` includes a GitHub-style contribution graph (`ContributionGraph` component, 16 weeks × 7 days grid, horizontally scrollable).

`OnboardingScreen` uses `useSafeAreaInsets()` for padding and has an animated `AppLogo` (float, breathe, badge bounce — all via RN `Animated` with `useNativeDriver: true`).

### Components (`src/components/`)

- **`HabitCard`** — renders a single habit row; handles all 4 habit types with type-specific UI (toggle, counter +/−, timer +5/−5, negative avoidance).
- **`AddHabitModal`** — bottom-sheet modal for creating/editing habits; 2×2 type grid, collapsible emoji grid picker.
- **`HabitOptionsSheet`** — long-press bottom sheet: edit / delete / set reminder (uses `@react-native-community/datetimepicker`).
- **`CelebrationModal`** — full-screen celebration overlay triggered on all-habits-done or challenge reward claim.

### Notifications (`src/utils/notifications.js`)

Two layers of notifications:
1. **General** — `scheduleDailyReminders()` schedules `habitflow_morning` (9:00) and `habitflow_evening` (20:00). Only cancels these two IDs, never per-habit reminders.
2. **Per-habit** — `scheduleHabitReminder(habitId, ...)` uses identifier `habit_${habitId}`. `cancelHabitReminder(habitId)` cancels only that one.

Android requires `ensureAndroidChannel()` before any scheduling — called in 3 places: app startup, `requestPermissions`, and `scheduleHabitReminder`. The trigger format uses `SchedulableTriggerInputTypes.DAILY`.

### Responsive scaling (`src/utils/responsive.js`)

Baseline: iPhone 14 (390×844).
- `rs(n)` — scales to screen width (use for spacing, sizes, radii).
- `ms(n)` — moderate scale with 0.45 factor (use for font sizes).
- `vs(n)` — scales to screen height (rarely needed).
