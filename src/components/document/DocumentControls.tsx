import React from 'react';
import { Globe, Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-theme-card-alt border border-theme-border text-theme-text hover:border-theme-accent/30 hover:text-theme-accent transition-colors">
            <Globe className="w-3 h-3" />
            {currency}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[90px]">
          <DropdownMenuRadioGroup value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            {CURRENCIES.map((c) => (
              <DropdownMenuRadioItem key={c} value={c} className="text-xs cursor-pointer">
                {c}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

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
