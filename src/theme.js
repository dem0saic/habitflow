// 60-30-10 rule:
//  60% → bg      (dominant background)
//  30% → card    (secondary surfaces — cards, inputs, headers)
//  10% → primary (accent — buttons, active states, progress)

// Winter Chill palette — Figma Combination 91
// Source colors: #B8E3E9 · #93B1B5 · #4F7C82 · #0B2E33

// Font families (loaded in App.js via expo-google-fonts)
export const FONTS = {
  logo:   'RussoOne_400Regular',
  reg:    'WorkSans_400Regular',
  med:    'WorkSans_500Medium',
  semi:   'WorkSans_600SemiBold',
  bold:   'WorkSans_700Bold',
  xbold:  'WorkSans_800ExtraBold',
};

export const DARK = {
  bg: '#071C22',
  card: '#0B2E33',
  cardHigh: '#0F2A32',
  primary: '#93B1B5',
  primaryLight: '#0D2830',
  primaryDark: '#4F7C82',
  accent: '#B8E3E9',
  gold: '#7AAAB4',
  success: '#6B9970',
  warning: '#A07860',
  text: '#B8E3E9',
  textSub: '#93B1B5',
  textMuted: '#4F7C82',
  border: '#1A3840',
  ...FONTS,
};

export const LIGHT = {
  bg: '#E4F4F7',
  card: '#F2FBFC',
  cardHigh: '#DCF0F4',
  primary: '#4F7C82',
  primaryLight: '#C8E8EC',
  primaryDark: '#0B2E33',
  accent: '#93B1B5',
  gold: '#5A9498',
  success: '#4A7A5A',
  warning: '#8A6040',
  text: '#0B2E33',
  textSub: '#4F7C82',
  textMuted: '#93B1B5',
  border: '#BCDDE2',
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
