import React, { createContext, useContext, useEffect } from 'react';
import { ThemeKey, THEME, ThemeColors } from '@/config/themes';

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Apply single theme class on mount
  useEffect(() => {
    document.documentElement.classList.remove('theme-tech-dark', 'theme-consultant', 'theme-consultant-dark');
    document.documentElement.classList.add('theme-default');
  }, []);

  const value: ThemeContextType = {
    theme: 'default',
    setTheme: () => {}, // no-op — single theme
    colors: THEME,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for getting theme from URL parameter (for shared views) — now returns single theme
export const useThemeFromUrl = (_urlTheme?: string | null): ThemeKey => {
  return 'default';
};
