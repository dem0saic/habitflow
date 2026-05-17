// HabitFlow design tokens — Pulse (warm dark · bento direction)
// Warm dark surfaces, vibrant amber-coral accent, brighter sage for streaks.
// Depth via layered surfaces and 1px borders, no card shadows (FAB only).
// 60/30/10: 60 bg · 30 card · 10 primary.

// Font families (loaded in App.js via expo-google-fonts)
export const FONTS = {
  logo:  'RussoOne_400Regular',     // brand mark only
  reg:   'WorkSans_400Regular',
  med:   'WorkSans_500Medium',
  semi:  'WorkSans_600SemiBold',
  bold:  'WorkSans_700Bold',
  xbold: 'WorkSans_800ExtraBold',
};

// ── Dark (primary) ────────────────────────────────────────────────────
export const DARK = {
  // Surfaces
  bg:           '#15110D',
  card:         '#1C1814',          // surface
  cardHigh:     '#241F1A',          // elevated (inputs, hero cards)
  tileEmpty:    '#1A1612',          // pending bento tile (slightly darker for elevation contrast)
  heroSurface:  '#1F1A14',          // hero/feature cards (Stats chart card, etc.)

  // Borders
  border:       '#2E2823',
  borderStrong: '#3D352C',

  // Text
  text:         '#F5EFE6',
  textSub:      '#C6B8A6',
  textMuted:    '#9A8E80',

  // Brand
  primary:      '#E89455',                       // vibrant amber-coral
  primaryStrong:'#F0A56C',                       // FAB / CTA punch
  primarySoft:  'rgba(232,148,85,0.14)',         // tints / badges / soft buttons
  primaryMuted: '#7A5938',                       // mid-tone (heatmap step)

  // Semantics
  success:      '#7AB082',                       // brighter sage — the dopamine hit
  successSoft:  'rgba(122,176,130,0.18)',
  warning:      '#C9784A',                       // rust (avoid-habit accent)
  warningSoft:  'rgba(201,120,74,0.16)',
  danger:       '#C25450',                       // brick (delete / errors)
  dangerSoft:   'rgba(194,84,80,0.14)',

  ...FONTS,
};

// ── Light (paired) ────────────────────────────────────────────────────
export const LIGHT = {
  bg:           '#FAF6F0',
  card:         '#FFFFFF',
  cardHigh:     '#F4EDE2',
  tileEmpty:    '#F7F1E6',
  heroSurface:  '#FFFAF2',

  border:       '#E6DCCC',
  borderStrong: '#D4C7B3',

  text:         '#2A201A',
  textSub:      '#5A4D40',
  textMuted:    '#8A7F70',

  primary:      '#B66A28',
  primaryStrong:'#A8601F',
  primarySoft:  'rgba(182,106,40,0.10)',
  primaryMuted: '#D6A370',

  success:      '#3F8758',
  successSoft:  'rgba(63,135,88,0.12)',
  warning:      '#A14F26',
  warningSoft:  'rgba(161,79,38,0.12)',
  danger:       '#9C3B36',
  dangerSoft:   'rgba(156,59,54,0.10)',

  ...FONTS,
};

export const EMOJIS = [
  // Fitness & Sport
  '🏃','🚴','🏋️','🧘','🤸','🏊','🚶','⛹️','🧗','🤺','🏌️','🎾','⚽','🏀','🥊',
  // Food & Drink
  '💧','🥗','☕','🍵','🫖','🍎','🥦','🥕','🍳','🥤','🫙','🥑','🍇','🥛',
  // Mind & Learning
  '📖','🧠','✍️','📝','🎓','💡','📚','🔬','🎯','📐','🗒️','🔭','💻','🗺️',
  // Music & Arts
  '🎸','🎹','🎨','🎭','🎬','📸','🎵','🎻','🥁','🎤',
  // Home & Lifestyle
  '🧹','🛌','🧺','🪴','🌿','🌱','🏠','🛁','🪥','🧴',
  // Health & Wellness
  '💊','🦷','😴','🩺','❤️','🫀','🧬','🩻','🏥',
  // Finance & Work
  '💼','💰','📊','💳','🗓️','📋','🖊️','📌',
  // Nature & Sky
  '🌙','☀️','🌊','🌸','🌺','🦋','🌈','⭐','🌻','🍃','🌤️','🌑',
  // Motivation & Goals
  '🔥','💪','🏆','🏅','🎊','✨','🙏','⚡','🎖️','🥇',
  // Avoidance / Break habits
  '🚭','📵','🚫','🍺','🎮','📺','🛑',
  // Social & Spiritual
  '🤝','👨‍👩‍👧','📞','🕊️','😊','🤗','🫂',
];
