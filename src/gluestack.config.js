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
      // ── Winter Chill palette (Figma Combination 91) ────────────────
      // #B8E3E9 · #93B1B5 · #4F7C82 · #0B2E33
      primary50:  '#EAF7F9',
      primary100: '#D4EFF3',
      primary200: '#B8E3E9',
      primary300: '#93B1B5',
      primary400: '#7AA0A8',
      primary500: '#4F7C82',
      primary600: '#3A6470',
      primary700: '#0B2E33',
      primary800: '#091E24',
      primary900: '#0D2830',
      primary950: '#071C22',

      // ── Success (muted sage) ──────────────────────────────────────
      success300: '#8EC48E',
      success400: '#6B9970',
      success500: '#4A7A5A',
      success600: '#3A6048',

      // ── Semantic accents ──────────────────────────────────────────
      error500:   '#A05050',
      warning500: '#A07860',
      gold500:    '#7AAAB4',
      accent500:  '#B8E3E9',

      // ── Dark-mode raw surfaces ────────────────────────────────────
      darkBg:        '#071C22',
      darkCard:      '#0B2E33',
      darkCardHigh:  '#0F2A32',
      darkBorder:    '#1A3840',
      darkText:      '#B8E3E9',
      darkTextSub:   '#93B1B5',
      darkTextMuted: '#4F7C82',

      // ── Light-mode raw surfaces ───────────────────────────────────
      lightBg:        '#E4F4F7',
      lightCard:      '#F2FBFC',
      lightCardHigh:  '#DCF0F4',
      lightBorder:    '#BCDDE2',
      lightText:      '#0B2E33',
      lightTextSub:   '#4F7C82',
      lightTextMuted: '#93B1B5',

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
        background:   '#071C22',
        card:         '#0B2E33',
        cardHigh:     '#0F2A32',
        border:       '#1A3840',
        text:         '#B8E3E9',
        textSub:      '#93B1B5',
        textMuted:    '#4F7C82',
        success:      '#6B9970',
        primary:      '#93B1B5',
        primaryLight: '#0D2830',
        primaryDark:  '#4F7C82',
        gold:         '#7AAAB4',
        accent:       '#B8E3E9',
        warning:      '#A07860',
      },
    },
    light: {
      colors: {
        background:   '#E4F4F7',
        card:         '#F2FBFC',
        cardHigh:     '#DCF0F4',
        border:       '#BCDDE2',
        text:         '#0B2E33',
        textSub:      '#4F7C82',
        textMuted:    '#93B1B5',
        success:      '#4A7A5A',
        primary:      '#4F7C82',
        primaryLight: '#C8E8EC',
        primaryDark:  '#0B2E33',
        gold:         '#5A9498',
        accent:       '#93B1B5',
        warning:      '#8A6040',
      },
    },
  },

  components: {},
});
