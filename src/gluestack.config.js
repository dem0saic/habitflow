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
      // ── Gothic Noir palette (Figma Combination 58) ─────────────────
      // #000000 · #D1D0D0 · #988686 · #5C4E4E
      primary50:  '#F0EEEE',
      primary100: '#EDE8E8',
      primary200: '#D1D0D0',
      primary300: '#B09898',
      primary400: '#A09090',
      primary500: '#988686',
      primary600: '#7A6868',
      primary700: '#5C4E4E',
      primary800: '#3A2E2E',
      primary900: '#2A1F1F',
      primary950: '#161111',

      // ── Success (muted sage) ──────────────────────────────────────
      success300: '#8EC48E',
      success400: '#6B9970',
      success500: '#4A7A5A',
      success600: '#3A6048',

      // ── Semantic accents ──────────────────────────────────────────
      error500:   '#A05050',
      warning500: '#A07860',
      gold500:    '#B09898',
      accent500:  '#D1D0D0',

      // ── Dark-mode raw surfaces ────────────────────────────────────
      darkBg:        '#0A0808',
      darkCard:      '#161111',
      darkCardHigh:  '#221A1A',
      darkBorder:    '#2A2020',
      darkText:      '#D1D0D0',
      darkTextSub:   '#988686',
      darkTextMuted: '#5C4E4E',

      // ── Light-mode raw surfaces ───────────────────────────────────
      lightBg:        '#E8E7E7',
      lightCard:      '#FFFFFF',
      lightCardHigh:  '#F0EEEE',
      lightBorder:    '#C8C4C4',
      lightText:      '#000000',
      lightTextSub:   '#5C4E4E',
      lightTextMuted: '#988686',

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
        background:   '#0A0808',
        card:         '#161111',
        cardHigh:     '#221A1A',
        border:       '#2A2020',
        text:         '#D1D0D0',
        textSub:      '#988686',
        textMuted:    '#5C4E4E',
        success:      '#6B9970',
        primary:      '#988686',
        primaryLight: '#2A1F1F',
        primaryDark:  '#7A6868',
        gold:         '#B09898',
        accent:       '#D1D0D0',
        warning:      '#A07860',
      },
    },
    light: {
      colors: {
        background:   '#E8E7E7',
        card:         '#FFFFFF',
        cardHigh:     '#F0EEEE',
        border:       '#C8C4C4',
        text:         '#000000',
        textSub:      '#5C4E4E',
        textMuted:    '#988686',
        success:      '#4A7A5A',
        primary:      '#5C4E4E',
        primaryLight: '#EDE8E8',
        primaryDark:  '#3A2E2E',
        gold:         '#7A6060',
        accent:       '#988686',
        warning:      '#8A6040',
      },
    },
  },

  components: {},
});
