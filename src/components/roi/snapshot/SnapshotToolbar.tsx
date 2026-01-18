import { Currency, CURRENCY_CONFIG, formatDualCurrency } from '@/components/roi/currencyUtils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface SnapshotToolbarProps {
  basePrice: number;
  pricePerSqft: number;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  language: 'en' | 'es';
  setLanguage: (language: 'en' | 'es') => void;
  rate: number;
}

const currencies: Currency[] = ['AED', 'USD', 'EUR', 'GBP', 'COP'];

export const SnapshotToolbar = ({
  basePrice,
  pricePerSqft,
  currency,
  setCurrency,
  language,
  setLanguage,
  rate,
}: SnapshotToolbarProps) => {
  const priceDisplay = formatDualCurrency(basePrice, currency, rate);
  const sqftDisplay = formatDualCurrency(pricePerSqft, currency, rate);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-muted/50 rounded-lg border border-border/50 mb-4">
      {/* Price Info */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Property Price</span>
          <span className="font-semibold text-foreground">
            {priceDisplay.primary}
            {priceDisplay.secondary && (
              <span className="text-muted-foreground text-sm ml-1.5">
                ({priceDisplay.secondary})
              </span>
            )}
          </span>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Price/sqft</span>
          <span className="font-semibold text-foreground">
            {sqftDisplay.primary}
            {sqftDisplay.secondary && (
              <span className="text-muted-foreground text-sm ml-1.5">
                ({sqftDisplay.secondary})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Currency & Language Toggles */}
      <div className="flex items-center gap-4">
        {/* Currency Toggle */}
        <ToggleGroup 
          type="single" 
          value={currency} 
          onValueChange={(v) => v && setCurrency(v as Currency)}
          className="bg-background rounded-md p-0.5"
        >
          {currencies.map((c) => (
            <ToggleGroupItem
              key={c}
              value={c}
              aria-label={c}
              className={cn(
                'px-2 py-1 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                'hover:bg-muted'
              )}
            >
              <span className="mr-1">{CURRENCY_CONFIG[c].flag}</span>
              <span className="hidden sm:inline">{c}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="w-px h-6 bg-border" />

        {/* Language Toggle */}
        <ToggleGroup 
          type="single" 
          value={language} 
          onValueChange={(v) => v && setLanguage(v as 'en' | 'es')}
          className="bg-background rounded-md p-0.5"
        >
          <ToggleGroupItem
            value="en"
            aria-label="English"
            className="px-3 py-1 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            EN
          </ToggleGroupItem>
          <ToggleGroupItem
            value="es"
            aria-label="Spanish"
            className="px-3 py-1 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            ES
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
