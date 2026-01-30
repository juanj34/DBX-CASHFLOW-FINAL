

# Comprehensive Plan: Fix Bugs + Revamp Comparison Metrics

## Overview

This plan addresses all identified issues and revamps the comparison view to be more persuasive for off-plan investments.

---

## Part 1: Fix Secondary Capital Bug (920K → 2.12M)

### Problem
The comparison shows "Secondary Day 1 Capital" as AED 920K instead of AED 2.12M because it uses the mortgage-adjusted figure (down payment + closing costs) instead of the total property commitment.

### Solution
Update the metrics calculation to use **Total Capital = Purchase Price + Closing Costs** for a fair apples-to-apples comparison.

### File: `src/pages/OffPlanVsSecondary.tsx` (line 316)

```typescript
// BEFORE:
secondaryCapitalDay1: secondaryCalcs.totalCapitalDay1,

// AFTER:
// For fair comparison, use total property cost (not mortgage-adjusted)
// Secondary buyer commits to full price + fees, just like off-plan buyer
secondaryCapitalDay1: secondaryInputs.purchasePrice + secondaryCalcs.closingCosts,
```

**Result:** Secondary capital shows AED 2.12M (2M + 120K), not 920K.

---

## Part 2: Revamp Key Insights Cards (The Persuasion Engine)

### Current State (Ineffective)
The current `ComparisonKeyInsights` shows:
- Initial Capital (raw numbers)
- Wealth Year 10 (raw numbers)
- Annualized ROE (percentage)

**Problem:** These are abstract metrics that don't tell a compelling "story."

### New Design: 4 High-Impact Cards

Replace the current 3 generic cards with 4 emotionally impactful cards:

| Card | Metric | Purpose |
|------|--------|---------|
| **Entry Ticket** | Capital + "Save X%" | Shows how much LESS cash is needed |
| **Money Multiplier** | X.Xx | "Your money grows X times" |
| **Crossover Point** | Year N | When off-plan permanently wins |
| **Construction Bonus** | +AED XXK | "Free" appreciation during build |

### File: `src/components/roi/secondary/ComparisonKeyInsights.tsx` (Complete Revamp)

```typescript
// New props needed
interface ComparisonKeyInsightsProps {
  metrics: ComparisonMetrics;
  rentalMode: 'long-term' | 'airbnb';
  offPlanLabel: string;
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
  appreciationDuringConstruction: number; // NEW
}

// New computed metrics:
const entrySavings = ((metrics.secondaryCapitalDay1 - metrics.offPlanCapitalDay1) / metrics.secondaryCapitalDay1) * 100;

const offPlanMultiplier = metrics.offPlanWealthYear10 / metrics.offPlanCapitalDay1;
const secondaryMultiplier = secondaryWealth10 / metrics.secondaryCapitalDay1;

const crossoverYear = metrics.crossoverYearLT || metrics.crossoverYearST;

// New 4-card layout:
const insights = [
  {
    title: 'Entry Ticket',
    icon: Wallet,
    offPlanValue: formatValue(metrics.offPlanCapitalDay1),
    secondaryValue: formatValue(metrics.secondaryCapitalDay1),
    badge: `Save ${entrySavings.toFixed(0)}%`, // Highlight the savings
    badgeColor: entrySavings > 0 ? 'emerald' : 'cyan',
    winner: metrics.offPlanCapitalDay1 < metrics.secondaryCapitalDay1 ? 'offplan' : 'secondary',
  },
  {
    title: 'Money Multiplier',
    subtitle: '10-Year Growth',
    icon: TrendingUp,
    offPlanValue: `${offPlanMultiplier.toFixed(1)}x`,
    secondaryValue: `${secondaryMultiplier.toFixed(1)}x`,
    winner: offPlanMultiplier > secondaryMultiplier ? 'offplan' : 'secondary',
  },
  {
    title: 'Crossover Point',
    icon: Target,
    value: crossoverYear ? `Year ${crossoverYear}` : 'N/A',
    description: 'When Off-Plan wealth exceeds Secondary',
    isPositive: crossoverYear && crossoverYear <= 5,
  },
  {
    title: 'Construction Bonus',
    icon: Building2,
    value: formatValue(appreciationDuringConstruction),
    description: '"Free" appreciation during build',
    isPositive: appreciationDuringConstruction > 0,
  },
];
```

### Visual Design:
```text
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  ENTRY TICKET   │ │ MONEY MULTIPLIER│ │ CROSSOVER POINT │ │CONSTRUCTION     │
│  ────────────── │ │ ──────────────  │ │ ──────────────  │ │    BONUS        │
│  OP: AED 520K   │ │  OP:  3.5x  🏆  │ │                 │ │                 │
│  SEC: AED 2.1M  │ │  SEC: 1.8x      │ │   YEAR 3        │ │  +AED 180K      │
│  ────────────── │ │                 │ │   🎯            │ │  ────────────   │
│  [Save 75%] 🏆  │ │                 │ │  Off-Plan leads │ │  Free equity!   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Part 3: Update HeadToHeadTable

### Changes:
1. **Rename "Day 1 Capital" to "Total Capital"** for clarity
2. **Add tooltip** explaining this is full property commitment
3. **Ensure consistent dual currency formatting**

### File: `src/components/roi/secondary/HeadToHeadTable.tsx`

```typescript
// Update translations (line 59)
day1Capital: 'Total Capital', // Was: 'Day 1 Capital'
totalCapitalTooltip: 'Full property commitment including purchase price and closing costs',

// Update formatMoney to always include AED prefix
const formatMoney = (value: number): string => {
  const aed = Math.abs(value) >= 1000000 
    ? `AED ${(value / 1000000).toFixed(2)}M`
    : `AED ${(value / 1000).toFixed(0)}K`;
  
  if (currency === 'AED') return aed;
  
  const converted = value * rate;
  const secondary = Math.abs(converted) >= 1000000 
    ? `${(converted / 1000000).toFixed(2)}M`
    : `${(converted / 1000).toFixed(0)}K`;
  
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
  return `${aed} (${symbol}${secondary})`;
};
```

---

## Part 4: Fix ComparisonVerdict Secondary Capital Reference

The verdict currently uses the incorrect `secondaryCapitalDay1` value. After Part 1, this will automatically show the correct value.

### File: `src/components/roi/secondary/ComparisonVerdict.tsx` (line 118)

```typescript
// This will now show correct value after Part 1 fix
{ icon: DollarSign, text: `AED ${(metrics.secondaryCapitalDay1 / 1000000).toFixed(2)}M ${t.capitalRequired}` },
```

---

## Part 5: Fix Configurator Navigation Bug

### Problem
When navigating to `/offplan-vs-secondary/:quoteId`, the modal opens at Step 2 but `selectedQuote` is null, disabling the "Next" button.

### File: `src/components/roi/secondary/ComparisonConfiguratorModal.tsx`

```typescript
// Add import
import { useCashflowQuote } from '@/hooks/useCashflowQuote';

// Inside component, after state declarations:
const { quote: initialQuote, loading: initialQuoteLoading } = useCashflowQuote(initialQuoteId);

// Add effect to load quote when initialQuoteId is provided
useEffect(() => {
  if (initialQuote && !selectedQuote && initialQuoteId) {
    setSelectedQuote(initialQuote);
  }
}, [initialQuote, selectedQuote, initialQuoteId]);

// Update button disabled state
<Button
  onClick={handleNext}
  disabled={step === 2 ? (!selectedQuote && !initialQuoteLoading && !initialQuoteId) : false}
>
```

---

## Part 6: Add Property Name to Secondary Configurator

### File: `src/components/roi/secondary/SecondaryPropertyStep.tsx`

```typescript
// Add state for property name
const [propertyName, setPropertyName] = useState(initialInputs?.propertyName || 'Secondary Property');

// Add to form (at top of form fields):
<div className="space-y-1.5">
  <Label>{t.propertyName || 'Property Name'}</Label>
  <Input
    value={propertyName}
    onChange={(e) => setPropertyName(e.target.value)}
    placeholder="e.g., Marina View 2BR"
    className="bg-theme-bg"
  />
</div>
```

---

## Part 7: Format Purchase Price Input

### File: `src/components/roi/secondary/SecondaryPropertyStep.tsx`

```typescript
// Replace purchase price input:
<div className="space-y-1.5">
  <Label>{t.purchasePrice}</Label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted text-sm font-medium">
      AED
    </span>
    <Input
      type="text"
      inputMode="numeric"
      value={inputs.purchasePrice.toLocaleString()}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/[^0-9]/g, '');
        updateInput('purchasePrice', Number(cleaned) || 0);
      }}
      className="pl-14 font-mono"
    />
  </div>
</div>
```

---

## Part 8: Update OffPlanVsSecondary to Pass New Props

### File: `src/pages/OffPlanVsSecondary.tsx`

```typescript
// Pass appreciationDuringConstruction to ComparisonKeyInsights (line 523):
<ComparisonKeyInsights
  metrics={comparisonMetrics}
  rentalMode={rentalMode}
  offPlanLabel={projectName}
  currency={currency}
  rate={rate}
  language={language}
  appreciationDuringConstruction={appreciationDuringConstruction} // NEW
/>
```

---

## Summary of All Changes

| File | Changes |
|------|---------|
| `OffPlanVsSecondary.tsx` | Fix secondaryCapitalDay1 calculation, pass new props |
| `ComparisonKeyInsights.tsx` | Complete revamp with 4 persuasive cards |
| `HeadToHeadTable.tsx` | Rename label, improve formatting |
| `ComparisonVerdict.tsx` | Update format for larger capital values |
| `ComparisonConfiguratorModal.tsx` | Fix navigation, load initial quote |
| `SecondaryPropertyStep.tsx` | Add property name, format purchase price |

---

## Expected Results After All Fixes

### Top Cards (New Design):
| Entry Ticket | Money Multiplier | Crossover | Construction Bonus |
|--------------|------------------|-----------|-------------------|
| OP: AED 520K | OP: **3.5x** 🏆 | **Year 3** | **+AED 180K** |
| SEC: AED 2.1M | SEC: 1.8x | Off-Plan leads | Free equity during build |
| **Save 75%** 🏆 | | | |

### HeadToHead Table:
| Metric | Off-Plan | Secondary |
|--------|----------|-----------|
| **Total Capital** | AED 520K | **AED 2.12M** |
| Wealth Year 10 | AED 3.5M | AED 2.8M |
| ROE | 22.4% | 8.1% |

### Configurator:
- Property name field visible at top
- Purchase price formatted: `AED 2,000,000`
- Navigation works when arriving via URL

