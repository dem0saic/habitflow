import { createConfig } from '@gluestack-style/react';

/**
 * HabitFlow gluestack-ui theme config.
 *
 * `tokens`  — raw design-system palette (named colors, spacing, radii, etc.)
 * `themes`  — semantic color maps per color mode; StyledProvider applies the
 *             matching theme when `colorMode` prop changes on GluestackUIProvider.
 *
 * Raw hex values are used in `themes` (not `$token` refs) for guaranteed
 * runtime resolution with this version of @gluestack-style/react.
 */
export const gluestackUIConfig = createConfig({
  aliases: {
    bg:      'backgroundColor',
    p:       'padding',
    px:      'paddingHorizontal',
    py:      'paddingVertical',
    pt:      'paddingTop',
    pb:      'paddingBottom',
    m:       'margin',
    mx:      'marginHorizontal',
    my:      'marginVertical',
    mt:      'marginTop',
    mb:      'marginBottom',
    rounded: 'borderRadius',
  },

  tokens: {
    colors: {
      // ── Color Palette 62 — Bonfire · Backlight · Golden Rambler · Nocturnal Sea ──
      // Source colors: #F57B51 · #FDF6F0 · #FBBC58 · #095D6A
      primary50:  '#FEF3EE',
      primary100: '#FEE4D8',
      primary200: '#FCC4A8',
      primary300: '#F99A78',
      primary400: '#F57B51',
      primary500: '#C8502A',
      primary600: '#9A3818',
      primary700: '#5C2810',
      primary800: '#3A1408',
      primary900: '#200A04',
      primary950: '#061519',

      // ── Success (muted sage) ──────────────────────────────────────
      success300: '#8EC48E',
      success400: '#6B9970',
      success500: '#4A7A5A',
      success600: '#3A6048',

      // ── Semantic accents ──────────────────────────────────────────
      error500:   '#E8302A',
      warning500: '#E8302A',
      gold500:    '#FBBC58',
      accent500:  '#FDF6F0',

      // ── Dark-mode raw surfaces ────────────────────────────────────
      darkBg:        '#061519',
      darkCard:      '#0A2830',
      darkCardHigh:  '#0D3040',
      darkBorder:    '#163848',
      darkText:      '#FDF6F0',
      darkTextSub:   '#FBBC58',
      darkTextMuted: '#3D7A86',

      // ── Light-mode raw surfaces ───────────────────────────────────
      lightBg:        '#FDF6F0',
      lightCard:      '#FFFFFF',
      lightCardHigh:  '#FEF0E6',
      lightBorder:    '#EAD8CC',
      lightText:      '#095D6A',
      lightTextSub:   '#C8502A',
      lightTextMuted: '#7A9EA5',

      white:       '#FFFFFF',
      black:       '#000000',
      transparent: 'transparent',
    },

    space: {
      '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10,
      '3': 12, '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28,
      '8': 32, '9': 36, '10': 40, '12': 48, '14': 56, '16': 64,
    },

    radii: {
      none: 0, xs: 4, sm: 6, md: 8, lg: 12,
      xl: 16, '2xl': 20, '3xl': 24, '4xl': 28, full: 9999,
    },

    fontSizes: {
      '2xs': 10, xs: 12, sm: 14, md: 16, lg: 18,
      xl: 20, '2xl': 24, '3xl': 28, '4xl': 32,
    },

    fontWeights: {
      hairline: '100', thin: '200', light: '300', normal: '400',
      medium: '500', semibold: '600', bold: '700', extrabold: '800', black: '900',
    },

    lineHeights: {
      '2xs': 16, xs: 18, sm: 20, md: 22, lg: 24, xl: 28, '2xl': 32,
    },

    letterSpacings: {
      xs: -0.4, sm: -0.2, md: 0, lg: 0.2, xl: 0.4, '2xl': 1.6,
    },

    opacity: {
      0: 0, 5: 0.05, 10: 0.1, 20: 0.2, 25: 0.25, 30: 0.3,
      40: 0.4, 50: 0.5, 60: 0.6, 70: 0.7, 75: 0.75, 80: 0.8,
      90: 0.9, 100: 1,
    },

    borderWidths: { 0: 0, hairline: 0.5, thin: 1, light: 2, normal: 3 },
  },

  /**
   * Semantic color maps — raw hex values so StyledProvider can apply them
   * directly when `colorMode` on GluestackUIProvider changes.
   *
   * These mirror the DARK / LIGHT objects in src/theme.js, making gluestack
   * the authoritative source of truth for the design token palette.
   */
  themes: {
    dark: {
      colors: {
        background:   '#061519',
        card:         '#0A2830',
        cardHigh:     '#0D3040',
        border:       '#163848',
        text:         '#FDF6F0',
        textSub:      '#FBBC58',
        textMuted:    '#3D7A86',
        success:      '#6B9970',
        primary:      '#F57B51',
        primaryLight: '#5C2810',
        primaryDark:  '#C8502A',
        gold:         '#FBBC58',
        accent:       '#FDF6F0',
        warning:      '#E8302A',
      },
    },
    light: {
      colors: {
        background:   '#FDF6F0',
        card:         '#FFFFFF',
        cardHigh:     '#FEF0E6',
        border:       '#EAD8CC',
        text:         '#095D6A',
        textSub:      '#C8502A',
        textMuted:    '#7A9EA5',
        success:      '#4A7A5A',
        primary:      '#C8502A',
        primaryLight: '#FEE4D8',
        primaryDark:  '#8C3018',
        gold:         '#FBBC58',
        accent:       '#FBBC58',
        warning:      '#E8302A',
      },
    },
  },

  components: {},
});
