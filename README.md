# HabitFlow

A habit tracking app built with Expo and React Native. Track daily habits, build streaks, and conquer multi-day challenges — with a Gothic Noir aesthetic and smooth animations throughout.

## Features

### Habit Types
- **Daily** — simple toggle, done or not done
- **Volume** — rep counter with +/− buttons (e.g. push-ups, glasses of water)
- **Timer** — time-based in 5-minute steps (e.g. meditation, reading)
- **Negative** — avoidance tracking (e.g. no sugar, no social media)

### Challenges
Start a 3-day, 7-day, or 21-day challenge. The app auto-starts a 3-Day Kickstart on first launch. Complete all habits every day within the window to claim the reward and trigger a celebration.

### Stats & History
- **Today** — progress bar showing Done / Remaining / Completion %
- **History** — calendar heatmap of daily completion
- **Stats** — GitHub-style 16-week contribution graph, best streak, 7-day average, perfect day count

### Notifications
- Morning reminder at 9:00 AM and evening check-in at 8:00 PM
- Per-habit reminders at a custom time you set via long-press → Set Reminder

### Theming
Full dark/light mode toggle. Default theme is **Gothic Noir** — a muted monochrome palette (`#000000` · `#D1D0D0` · `#988686` · `#5C4E4E`) from Figma Combination 58.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81.5 |
| Navigation | React Navigation (bottom tabs) |
| State | React `useReducer` + `AsyncStorage` |
| Styling | `@gluestack-style/react` + custom theme system |
| Notifications | `expo-notifications` |
| Animations | React Native `Animated` API |
| Icons | `@expo/vector-icons` (Ionicons) |

## Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Install & Run

```bash
git clone https://github.com/dem0saic/habitflow.git
cd habitflow
npm install
npx expo start
```

Scan the QR code with Expo Go. If your phone and computer are on different networks, use:

```bash
npx expo start --tunnel
```

### Platform Notes
- **iOS**: requires macOS for native builds; use Expo Go for testing on Windows
- **Android**: requires Android Studio with a configured AVD for emulator testing
- React Native New Architecture is enabled (`newArchEnabled: true`)

## Project Structure

```
src/
├── screens/          # TodayScreen, ChallengeScreen, HistoryScreen, StatsScreen, OnboardingScreen
├── components/       # HabitCard, AddHabitModal, HabitOptionsSheet, CelebrationModal
├── utils/
│   ├── notifications.js   # Expo notifications (general + per-habit)
│   └── responsive.js      # rs() / ms() scaling helpers
├── store.js          # Global state (useReducer + AsyncStorage)
├── theme.js          # DARK / LIGHT color palettes
├── ThemeContext.js   # useTheme() hook
└── gluestack.config.js    # gluestack-ui token + theme config
```

## License

MIT
