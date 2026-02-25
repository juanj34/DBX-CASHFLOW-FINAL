import React from 'react';
import { Globe, Languages } from 'lucide-react';

type Currency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'COP';
const CURRENCIES: Currency[] = ['AED', 'USD', 'EUR', 'GBP', 'COP'];

interface DocumentControlsProps {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  language: string;
  setLanguage: (l: string) => void;
  exportMode?: boolean;
}

export const DocumentControls: React.FC<DocumentControlsProps> = ({
  currency,
  setCurrency,
  language,
  setLanguage,
  exportMode,
}) => {
  if (exportMode) return null;

  return (
    <div className="flex items-center gap-2" data-export-hide="true">
      {/* Currency dropdown */}
      <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-theme-card-alt border border-theme-border text-theme-text hover:border-theme-accent/30 hover:text-theme-accent transition-colors cursor-pointer">
        <Globe className="w-3 h-3" />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="bg-transparent border-none outline-none text-[10px] font-medium cursor-pointer appearance-none pr-1"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      {/* Language toggle */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-theme-card-alt border border-theme-border text-theme-text hover:border-theme-accent/30 hover:text-theme-accent transition-colors"
      >
        <Languages className="w-3 h-3" />
        {language.toUpperCase()}
      </button>
    </div>
  );
};

export type { Currency };
