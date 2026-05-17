import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../ThemeContext';

// HabitFlow brand mark — "Ripple"
//
// Meaning:
//   · the filled center dot is the single daily choice
//   · each concentric ring is the compounding effect of that choice over time
//   · the gradual fade outward reads as continuity, the closed circles as discipline
//
// Universal symbol — every culture reads a ripple. Pure SVG so it's crisp at
// every size. Uses theme tokens so it follows light/dark mode automatically.
//
// Props
//   size — outer width/height in px (default 96)
//   tone — 'default' (primary on cool dark) | 'mono' (currentColor for ghost states)
export default function AppLogo({ size = 96, tone = 'default' }) {
  const C = useTheme();
  const accent = tone === 'mono' ? C.text : C.primary;
  const core   = tone === 'mono' ? C.text : C.primaryStrong;

  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      {/* Outermost ring — the long-tail effect, faintest */}
      <Circle cx="48" cy="48" r="42" stroke={accent} strokeWidth={1.5}  fill="none" opacity={0.22} />
      {/* Middle ring */}
      <Circle cx="48" cy="48" r="30" stroke={accent} strokeWidth={1.75} fill="none" opacity={0.55} />
      {/* Inner ring — the immediate consequence */}
      <Circle cx="48" cy="48" r="18" stroke={core}   strokeWidth={2}    fill="none" />
      {/* Center — the daily choice */}
      <Circle cx="48" cy="48" r="6"  fill={core} />
    </Svg>
  );
}
