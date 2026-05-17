// HabitFlow design tokens — Deep Aqua (cool dark · bento direction)
// Deep ocean surfaces, vibrant teal accent, fresh green for streaks.
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
  bg:           '#07111A',
  tileEmpty:    '#0B1721',          // pending bento tile — between bg and card
  card:         '#0E1A25',          // surface
  cardHigh:     '#142632',          // elevated (inputs, hero cards)
  heroSurface:  '#0F2230',          // hero/feature cards

  // Borders
  border:       '#1E3441',
  borderStrong: '#2A4555',

  // Text
  text:         '#EAF4F8',
  textSub:      '#A8C0CC',
  textMuted:    '#6B8294',

  // Brand
  primary:      '#2DD4BF',                       // vibrant teal
  primaryStrong:'#5EEAD4',                       // brighter teal for CTA punch
  primarySoft:  'rgba(45,212,191,0.16)',         // tints / badges / soft buttons
  primaryMuted: '#1A7468',                       // deep teal (heatmap mid step)

  // Semantics
  success:      '#4ADE80',                       // fresh green — the dopamine hit
  successSoft:  'rgba(74,222,128,0.18)',
  warning:      '#FBBF24',                       // amber (avoid-habit accent)
  warningSoft:  'rgba(251,191,36,0.16)',
  danger:       '#F87171',                       // cool red (delete / errors)
  dangerSoft:   'rgba(248,113,113,0.14)',

  ...FONTS,
};

// ── Light (paired) ────────────────────────────────────────────────────
export const LIGHT = {
  bg:           '#F0F7FA',
  tileEmpty:    '#E9F2F6',
  card:         '#FFFFFF',
  cardHigh:     '#E4F0F5',
  heroSurface:  '#FBFEFF',

  border:       '#D0DEE6',
  borderStrong: '#B5C9D4',

  text:         '#07111A',
  textSub:      '#2A4555',
  textMuted:    '#6B8294',

  primary:      '#0E9888',
  primaryStrong:'#097A6B',
  primarySoft:  'rgba(14,152,136,0.10)',
  primaryMuted: '#5DBBA9',

  success:      '#16A34A',
  successSoft:  'rgba(22,163,74,0.12)',
  warning:      '#D97706',
  warningSoft:  'rgba(217,119,6,0.12)',
  danger:       '#DC2626',
  dangerSoft:   'rgba(220,38,38,0.10)',

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
