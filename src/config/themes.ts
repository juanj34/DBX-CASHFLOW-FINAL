export interface ThemeColors {
  name: string;
  // Main backgrounds
  bg: string;
  bgAlt: string;
  card: string;
  cardAlt: string;
  // Borders
  border: string;
  borderAlt: string;
  // Accents
  accent: string;
  accentSecondary: string;
  accentDark: string;
  accentMuted: string;
  // Text
  text: string;
  textMuted: string;
  textHighlight: string;
  // Specific colors
  positive: string;
  negative: string;
  // Chart colors
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
}

// Desert Deco — dark luxury theme with gold/amber accents
export const THEME: ThemeColors = {
  name: 'Desert Deco',
  // Backgrounds
  bg: '#0F1318',
  bgAlt: '#171C24',
  card: '#1C222C',
  cardAlt: '#252C38',
  // Borders
  border: '#2E3542',
  borderAlt: '#48505E',
  // Accents — gold/amber
  accent: '#E8A830',
  accentSecondary: '#C4891F',
  accentDark: '#E8A830',
  accentMuted: 'rgba(232, 168, 48, 0.15)',
  // Text — cream white
  text: '#E8ECF1',
  textMuted: '#7E8A9A',
  textHighlight: '#E8A830',
  // Specific
  positive: '#30B875',
  negative: '#D44040',
  // Charts
  chartPrimary: '#E8A830',
  chartSecondary: '#30B875',
  chartTertiary: '#7E8A9A',
};

// Backward-compatible exports
export type ThemeKey = 'default';
export const THEMES: Record<ThemeKey, ThemeColors> = { default: THEME };
export const DEFAULT_THEME: ThemeKey = 'default';
