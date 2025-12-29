import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeKey, THEMES, DEFAULT_THEME, ThemeColors } from '@/config/themes';
import { supabase } from '@/integrations/supabase/client';

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  colors: ThemeColors;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    // Load from localStorage first for immediate display
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored && stored in THEMES) ? stored as ThemeKey : DEFAULT_THEME;
  });

  // Apply theme class to document
  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove('theme-tech-dark', 'theme-consultant', 'theme-consultant-dark');
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  // Load theme from database on auth change
  useEffect(() => {
    const loadThemeFromDB = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const themePreference = (data as any)?.theme_preference;
        if (themePreference && themePreference in THEMES) {
          setThemeState(themePreference as ThemeKey);
          localStorage.setItem(THEME_STORAGE_KEY, themePreference);
        }
      } catch (error) {
        // Silently fail - use localStorage value
      }
    };

    loadThemeFromDB();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadThemeFromDB();
    });

    return () => subscription.unsubscribe();
  }, []);

  const setTheme = useCallback(async (newTheme: ThemeKey) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    // Save to database if logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ theme_preference: newTheme } as any)
          .eq('id', user.id);
      }
    } catch (error) {
      // Silently fail - localStorage is the backup
    }
  }, []);

  const value: ThemeContextType = {
    theme,
    setTheme,
    colors: THEMES[theme],
    themes: THEMES,
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

// Hook for getting theme from URL parameter (for shared views)
export const useThemeFromUrl = (urlTheme?: string | null): ThemeKey => {
  if (urlTheme && urlTheme in THEMES) {
    return urlTheme as ThemeKey;
  }
  return DEFAULT_THEME;
};
