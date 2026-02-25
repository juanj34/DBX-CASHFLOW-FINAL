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

// Desert Deco — clean white theme with gold/amber accents
export const THEME: ThemeColors = {
  name: 'Desert Deco',
  // Backgrounds
  bg: '#FAFAFA',
  bgAlt: '#F3F4F6',
  card: '#FFFFFF',
  cardAlt: '#F3F4F6',
  // Borders
  border: '#E2E5EB',
  borderAlt: '#CBD0D8',
  // Accents — copper-gold
  accent: '#B3893A',
  accentSecondary: '#916B2D',
  accentDark: '#8A6528',
  accentMuted: 'rgba(179, 137, 58, 0.12)',
  // Text — near-black
  text: '#1A2030',
  textMuted: '#64748B',
  textHighlight: '#8A6528',
  // Specific
  positive: '#22915A',
  negative: '#C53030',
  // Charts
  chartPrimary: '#B3893A',
  chartSecondary: '#22915A',
  chartTertiary: '#64748B',
};

// Backward-compatible exports
export type ThemeKey = 'default';
export const THEMES: Record<ThemeKey, ThemeColors> = { default: THEME };
export const DEFAULT_THEME: ThemeKey = 'default';
