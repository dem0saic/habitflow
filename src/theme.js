// HabitFlow design tokens — Warm Editorial
// Warm dark surfaces, refined amber accent, sage for streaks.
// Depth via layered surfaces and 1px borders, no card shadows.
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
  heroSurface:  '#1F1A14',          // hero/feature cards

  // Borders
  border:       '#2E2823',
  borderStrong: '#3D352C',

  // Text
  text:         '#F5EFE6',
  textSub:      '#C6B8A6',
  textMuted:    '#9A8E80',

  // Brand
  primary:      '#D89860',                       // amber
  primarySoft:  'rgba(216,152,96,0.14)',         // tints / badges / soft buttons
  primaryMuted: '#7A5938',                       // mid-tone (heatmap step)

  // Semantics
  success:      '#6B9970',                       // sage
  successSoft:  'rgba(107,153,112,0.16)',
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
  heroSurface:  '#FFFAF2',

  border:       '#E6DCCC',
  borderStrong: '#D4C7B3',

  text:         '#2A201A',
  textSub:      '#5A4D40',
  textMuted:    '#8A7F70',

  primary:      '#A86C2D',
  primarySoft:  'rgba(168,108,45,0.10)',
  primaryMuted: '#C99A6C',

  success:      '#4A7A5A',
  successSoft:  'rgba(74,122,90,0.12)',
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
