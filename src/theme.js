// 60-30-10 rule:
//  60% → bg      (dominant background)
//  30% → card    (secondary surfaces — cards, inputs, headers)
//  10% → primary (accent — buttons, active states, progress)

// Color Palette 62 — Bonfire · Backlight · Golden Rambler · Nocturnal Sea
// Source colors: #F57B51 · #FDF6F0 · #FBBC58 · #095D6A

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
  bg: '#061519',
  card: '#0A2830',
  cardHigh: '#0D3040',
  primary: '#F57B51',
  primaryLight: '#5C2810',
  primaryDark: '#C8502A',
  accent: '#FDF6F0',
  gold: '#FBBC58',
  success: '#6B9970',
  warning: '#E8302A',
  text: '#FDF6F0',
  textSub: '#FBBC58',
  textMuted: '#3D7A86',
  border: '#163848',
  ...FONTS,
};

export const LIGHT = {
  bg: '#FDF6F0',
  card: '#FFFFFF',
  cardHigh: '#FEF0E6',
  primary: '#C8502A',
  primaryLight: '#FEE4D8',
  primaryDark: '#8C3018',
  accent: '#FBBC58',
  gold: '#FBBC58',
  success: '#4A7A5A',
  warning: '#E8302A',
  text: '#095D6A',
  textSub: '#C8502A',
  textMuted: '#7A9EA5',
  border: '#EAD8CC',
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
