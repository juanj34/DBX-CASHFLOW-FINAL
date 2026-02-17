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

// Single blue/white theme
export const THEME: ThemeColors = {
  name: 'Default',
  // Backgrounds
  bg: '#F8FAFC',
  bgAlt: '#F1F5F9',
  card: '#FFFFFF',
  cardAlt: '#F8FAFC',
  // Borders
  border: '#E2E8F0',
  borderAlt: '#CBD5E1',
  // Accents
  accent: '#2563EB',
  accentSecondary: '#1E40AF',
  accentMuted: 'rgba(37, 99, 235, 0.1)',
  // Text
  text: '#0F172A',
  textMuted: '#64748B',
  textHighlight: '#2563EB',
  // Specific
  positive: '#16A34A',
  negative: '#DC2626',
  // Charts
  chartPrimary: '#2563EB',
  chartSecondary: '#1E40AF',
  chartTertiary: '#94A3B8',
};

// Backward-compatible exports for gradual migration
export type ThemeKey = 'default';
export const THEMES: Record<ThemeKey, ThemeColors> = { default: THEME };
export const DEFAULT_THEME: ThemeKey = 'default';
