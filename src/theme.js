// 60-30-10 rule:
//  60% → bg      (dominant background)
//  30% → card    (secondary surfaces — cards, inputs, headers)
//  10% → primary (accent — buttons, active states, progress)

// Gothic Noir palette — Figma Combination 58
// Source colors: #000000 · #D1D0D0 · #988686 · #5C4E4E

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
  bg: '#0A0808',
  card: '#161111',
  cardHigh: '#221A1A',
  primary: '#988686',
  primaryLight: '#2A1F1F',
  primaryDark: '#7A6868',
  accent: '#D1D0D0',
  gold: '#B09898',
  success: '#6B9970',
  warning: '#A07860',
  text: '#D1D0D0',
  textSub: '#988686',
  textMuted: '#5C4E4E',
  border: '#2A2020',
  ...FONTS,
};

export const LIGHT = {
  bg: '#E8E7E7',
  card: '#FFFFFF',
  cardHigh: '#F0EEEE',
  primary: '#5C4E4E',
  primaryLight: '#EDE8E8',
  primaryDark: '#3A2E2E',
  accent: '#988686',
  gold: '#7A6060',
  success: '#4A7A5A',
  warning: '#8A6040',
  text: '#000000',
  textSub: '#5C4E4E',
  textMuted: '#988686',
  border: '#C8C4C4',
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
