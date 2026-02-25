import React, { createContext, useContext } from 'react';
import { ThemeKey, THEME, ThemeColors } from '@/config/themes';

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: ThemeContextType = {
    theme: 'default',
    setTheme: () => {},
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

export const useThemeFromUrl = (_urlTheme?: string | null): ThemeKey => {
  return 'default';
};
