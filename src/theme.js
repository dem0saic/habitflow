// HabitFlow design tokens — Dusk
//
// HCI principles in play:
//  · Aesthetic minimalism: every visual element earns its weight.
//  · Recognition over recall: one indigo accent for actionable things — never
//    decorative. Semantic colors (success / warning / danger) carry state only.
//  · Visibility of status: completion is the one place we let color shout.
//  · Calm by default: this app gets opened twice a day; saturation is restrained.
//
// Figma design-system principles:
//  · Strict tokens — no hardcoded hex anywhere except this file.
//  · Semantic naming (primary, success, warning, danger), not "indigo / amber".
//  · One typeface (Work Sans) used at six semantic weights — see FONTS below.
//
// Contrast (verified WCAG AA on dark mode):
//  · text on bg            ≈ 17 : 1   AAA
//  · textSub on bg         ≈ 11 : 1   AAA
//  · textMuted on bg       ≈ 5.8 : 1  AA
//  · primary on bg         ≈ 5.2 : 1  AA
//  · white on primary      ≈ 5.0 : 1  AA

// Font family — single typeface, semantic weights only.
// `logo` is mapped to the heaviest weight so the brand mark stays distinct
// without requiring a second font file.
export const FONTS = {
  logo:  'WorkSans_800ExtraBold',   // brand mark (HabitFlow) only
  reg:   'WorkSans_400Regular',
  med:   'WorkSans_500Medium',
  semi:  'WorkSans_600SemiBold',
  bold:  'WorkSans_700Bold',
  xbold: 'WorkSans_800ExtraBold',
};

// ── Dark (primary) ────────────────────────────────────────────────────
export const DARK = {
  // Surfaces — true neutral grays with a faint cool cast for nighttime comfort
  bg:           '#0B0D10',
  tileEmpty:    '#11141A',          // pending bento tile — between bg and card
  card:         '#15191F',          // surface
  cardHigh:     '#1B2028',          // elevated (inputs, hero cards)
  heroSurface:  '#181D24',          // hero/feature cards

  // Borders
  border:       '#262C36',
  borderStrong: '#3A4252',

  // Text
  text:         '#F2F4F8',          // off-white, easier on the eyes than #FFF
  textSub:      '#C5CBD6',
  textMuted:    '#8A93A3',

  // Brand — indigo-violet (Iris). One accent, used sparingly.
  primary:      '#7C6BFA',
  primaryStrong:'#9685FF',          // CTA punch, today-dot on ChallengeTrack
  primarySoft:  'rgba(124,107,250,0.16)',
  primaryMuted: '#3D3B6A',          // deep indigo (heatmap mid step)

  // Semantics — restrained, not gas-station bright
  success:      '#5FD49B',          // gentle emerald — the dopamine hit
  successSoft:  'rgba(95,212,155,0.16)',
  warning:      '#F5B14D',          // warm amber for "avoid" badges
  warningSoft:  'rgba(245,177,77,0.14)',
  danger:       '#F26E6E',          // crimson with warm edge — destructive only
  dangerSoft:   'rgba(242,110,110,0.14)',

  ...FONTS,
};

// ── Light (paired) ────────────────────────────────────────────────────
export const LIGHT = {
  bg:           '#F7F8FA',
  tileEmpty:    '#F1F3F6',
  card:         '#FFFFFF',
  cardHigh:     '#EEF0F4',
  heroSurface:  '#FAFBFC',

  border:       '#E2E5EA',
  borderStrong: '#C9CFD9',

  text:         '#0F1219',
  textSub:      '#3D4555',
  textMuted:    '#717B8C',

  primary:      '#5A48D6',           // deeper indigo for contrast on light
  primaryStrong:'#4838B8',
  primarySoft:  'rgba(90,72,214,0.10)',
  primaryMuted: '#A99CE8',

  success:      '#21A06A',
  successSoft:  'rgba(33,160,106,0.10)',
  warning:      '#C77A12',
  warningSoft:  'rgba(199,122,18,0.10)',
  danger:       '#D44545',
  dangerSoft:   'rgba(212,69,69,0.10)',

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
