
# Plan: Add Currency Selection to CompareView & Hide Sections

## Changes Required

### 1. Add Currency Selection to CompareView Header

Add currency and language state with dropdown selectors in the header area (next to AI Insights toggle):

```tsx
// Add imports
import { Currency, CURRENCY_CONFIG } from '@/components/roi/currencyUtils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Coins, Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Add state (after line 64)
const [currency, setCurrency] = useState<Currency>('AED');
const [language, setLanguage] = useState<'en' | 'es'>('en');
const { rate, isLive } = useExchangeRate(currency);
```

Add dropdown selectors in header (after AI Insights toggle):

```tsx
{/* Currency Selector */}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm" className="...">
      <Coins className="w-4 h-4 mr-1.5" />
      {CURRENCY_CONFIG[currency].flag} {currency}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="bg-[#1a1f2e] border-[#2a3142] z-50">
    {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
      <DropdownMenuItem key={key} onClick={() => setCurrency(key as Currency)}>
        {currency === key && <Check className="w-3 h-3 mr-2" />}
        {config.flag} {key}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>

{/* Language Selector */}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <Globe className="w-4 h-4 mr-1.5" />
      {language === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="bg-[#1a1f2e] border-[#2a3142] z-50">
    <DropdownMenuItem onClick={() => setLanguage('en')}>🇬🇧 English</DropdownMenuItem>
    <DropdownMenuItem onClick={() => setLanguage('es')}>🇪🇸 Español</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 2. Hide Sections (Remove from CompareView)

Remove these CollapsibleSection blocks entirely:

| Section | Lines to Remove |
|---------|-----------------|
| Payment & Growth | Lines 352-362 |
| Value Differentiators | Lines 364-371 |
| Exit Scenarios | Lines 398-407 |

**Keep these sections:**
- Key Metrics Comparison (lines 341-350)
- Mortgage Comparison (lines 373-382)
- Rental Yield (lines 384-396)

### 3. Pass Currency/Rate to Components

Pass currency and rate props to remaining components:

```tsx
<MetricsTable 
  quotesWithCalcs={quotesWithCalcs} 
  metrics={metrics} 
  currency={currency}
  rate={rate}
/>
<MortgageComparison quotesWithCalcs={quotesWithCalcs} currency={currency} rate={rate} />
<RentalYieldComparison quotesWithCalcs={quotesWithCalcs} currency={currency} rate={rate} />
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CompareView.tsx` | Add currency/language state, dropdowns, hide 3 sections, pass props |

---

## Summary

| Before | After |
|--------|-------|
| No currency selection | Currency dropdown (AED, USD, EUR, GBP, COP) |
| No language selection | Language dropdown (EN, ES) |
| Shows Payment & Growth | Hidden |
| Shows Exit Scenarios | Hidden |
| Shows Value Differentiators | Hidden |
| Shows Key Metrics, Mortgage, Rental Yield | Kept |
