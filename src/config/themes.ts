export type ThemeKey = 'tech-dark' | 'consultant' | 'consultant-dark';

export interface ThemeColors {
  name: string;
  icon: 'Zap' | 'Briefcase' | 'Moon';
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

export const THEMES: Record<ThemeKey, ThemeColors> = {
  'tech-dark': {
    name: 'Tech Dark',
    icon: 'Zap',
    // Backgrounds
    bg: '#0f172a',
    bgAlt: '#0d1117',
    card: '#1a1f2e',
    cardAlt: '#2a3142',
    // Borders
    border: '#2a3142',
    borderAlt: '#3a4152',
    // Accents
    accent: '#CCFF00',
    accentSecondary: '#00EAFF',
    accentMuted: 'rgba(204, 255, 0, 0.1)',
    // Text
    text: '#ffffff',
    textMuted: '#9ca3af',
    textHighlight: '#CCFF00',
    // Specific
    positive: '#22c55e',
    negative: '#ef4444',
    // Charts
    chartPrimary: '#CCFF00',
    chartSecondary: '#00EAFF',
    chartTertiary: '#FF00FF',
  },
  'consultant': {
    name: 'Consultant',
    icon: 'Briefcase',
    // Backgrounds
    bg: '#F9FAFB',
    bgAlt: '#F3F4F6',
    card: '#FFFFFF',
    cardAlt: '#F3F4F6',
    // Borders
    border: '#E5E7EB',
    borderAlt: '#D1D5DB',
    // Accents
    accent: '#B8860B',
    accentSecondary: '#1E3A5F',
    accentMuted: 'rgba(184, 134, 11, 0.1)',
    // Text
    text: '#111827',
    textMuted: '#6B7280',
    textHighlight: '#B8860B',
    // Specific
    positive: '#059669',
    negative: '#DC2626',
    // Charts
    chartPrimary: '#B8860B',
    chartSecondary: '#1E3A5F',
    chartTertiary: '#7C3AED',
  },
  'consultant-dark': {
    name: 'Dark Consultant',
    icon: 'Moon',
    // Backgrounds
    bg: '#1F2937',
    bgAlt: '#111827',
    card: '#374151',
    cardAlt: '#4B5563',
    // Borders
    border: '#4B5563',
    borderAlt: '#6B7280',
    // Accents
    accent: '#D4AF37',
    accentSecondary: '#60A5FA',
    accentMuted: 'rgba(212, 175, 55, 0.1)',
    // Text
    text: '#F9FAFB',
    textMuted: '#9CA3AF',
    textHighlight: '#D4AF37',
    // Specific
    positive: '#34D399',
    negative: '#F87171',
    // Charts
    chartPrimary: '#D4AF37',
    chartSecondary: '#60A5FA',
    chartTertiary: '#A78BFA',
  },
};

export const DEFAULT_THEME: ThemeKey = 'tech-dark';
