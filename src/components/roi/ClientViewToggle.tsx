import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type ClientViewMode = 'story' | 'dashboard';

interface ClientViewToggleProps {
  value: ClientViewMode;
  onChange: (mode: ClientViewMode) => void;
}

const STORAGE_KEY = 'client_view_preference';

export const useClientViewPreference = (): [ClientViewMode, (mode: ClientViewMode) => void] => {
  const [mode, setMode] = useState<ClientViewMode>(() => {
    if (typeof window === 'undefined') return 'story';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'story' || saved === 'dashboard') return saved;
    // Default: story on mobile, dashboard on desktop
    return window.innerWidth < 768 ? 'story' : 'story';
  });

  const setModeAndSave = (newMode: ClientViewMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  return [mode, setModeAndSave];
};

export const ClientViewToggle = ({ value, onChange }: ClientViewToggleProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="inline-flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-theme-card-alt rounded-lg border border-theme-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('story')}
        className={`h-7 sm:h-8 px-2 sm:px-3 gap-1 sm:gap-2 transition-all ${
          value === 'story'
            ? 'bg-theme-accent text-theme-bg hover:bg-theme-accent/90 hover:text-theme-bg'
            : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-card'
        }`}
      >
        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">{t('storyView') || 'Story'}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('dashboard')}
        className={`h-7 sm:h-8 px-2 sm:px-3 gap-1 sm:gap-2 transition-all ${
          value === 'dashboard'
            ? 'bg-theme-accent text-theme-bg hover:bg-theme-accent/90 hover:text-theme-bg'
            : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-card'
        }`}
      >
        <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">{t('dashboardView') || 'Dashboard'}</span>
      </Button>
    </div>
  );
};
