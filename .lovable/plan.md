
# Plan: Enhanced Off-Plan vs Secondary Comparison Tool

## Overview

This plan adds the following features to the comparison tool:
1. **Language toggle in navbar** - Persistent EN/ES switch for client presentations
2. **Currency selector with dual display** - Like cashflow view, showing AED (converted value)
3. **Reorder sections** - Detailed comparison → Wealth progression → Chart
4. **Custom exit scenarios** - Compare both properties at any exit point (year 3, 4, 5, etc.)

---

## User Experience Changes

### 1. Language & Currency in TopNavbar

The TopNavbar will include:
- Language toggle button (🇬🇧/🇪🇸) visible on all pages
- Currency dropdown with flag indicators

The Off-Plan vs Secondary page will consume these settings and pass them to all components.

### 2. Dual Currency Display

All monetary values will show:
```
AED 1,500,000 ($408,000)
```
Using the same `DualCurrencyValue` component pattern from the Cashflow snapshot.

### 3. Section Reordering

New order in results view:
1. Key Insights (4 cards)
2. **Detailed Comparison Table** (moved up)
3. **Wealth Progression Table** (moved down)
4. Wealth Trajectory Chart
5. Exit Scenarios Comparison (NEW)
6. DSCR Explanation + Out of Pocket
7. Verdict

### 4. Custom Exit Scenarios

New feature in configurator Step 2 (or Step 3):
- Add exit points at any month/year
- Compare both properties side-by-side at each exit point
- Show: Property Value, Capital Invested, Profit, Total ROE

---

## Technical Implementation

### A. TopNavbar Language & Currency Controls

**File: `src/components/layout/TopNavbar.tsx`**

Add props and controls:
- `language` / `setLanguage` props (optional, for pages that need control)
- `currency` / `setCurrency` props (optional)
- Display current language flag as toggle button
- Currency dropdown with all supported currencies

When props are not provided, the navbar shows read-only current settings from LanguageContext.

### B. Off-Plan vs Secondary Page State

**File: `src/pages/OffPlanVsSecondary.tsx`**

Add new state:
```typescript
const [language, setLanguage] = useState<'en' | 'es'>('en');
const [currency, setCurrency] = useState<Currency>('AED');
const { rate, isLive } = useExchangeRate(currency);
```

Pass to TopNavbar and all child components.

### C. Exit Scenarios Comparison Component

**New File: `src/components/roi/secondary/ExitScenariosComparison.tsx`**

A card showing side-by-side comparison at multiple exit points:

| Exit Point | Off-Plan Value | Off-Plan Profit | Off-Plan ROE | Secondary Value | Secondary Profit | Secondary ROE |
|------------|----------------|-----------------|--------------|-----------------|------------------|---------------|
| Year 3     | 1.65M          | +280K           | 45%          | 1.27M           | +120K            | 18%           |
| Year 4     | 1.82M          | +420K           | 52%          | 1.31M           | +180K            | 22%           |
| Year 5     | 1.95M          | +580K           | 58%          | 1.35M           | +250K            | 26%           |

### D. Configurator Exit Scenarios Step

**New File: `src/components/roi/secondary/ExitScenariosStep.tsx`**

Optional Step 3 in the configurator modal:
- Quick-add buttons: Year 3, Year 4, Year 5, Year 7, Year 10
- Custom input: Add exit at month X
- List of selected exit points with remove option

### E. Update Comparison Types

**File: `src/components/roi/secondary/types.ts`**

Add new type for exit comparison:
```typescript
export interface ExitComparisonPoint {
  months: number;
  offPlan: {
    propertyValue: number;
    capitalInvested: number;
    profit: number;
    totalROE: number;
    annualizedROE: number;
  };
  secondary: {
    propertyValue: number;
    capitalInvested: number;
    profit: number;
    totalROE: number;
    annualizedROE: number;
  };
}
```

### F. Dual Currency Formatting in Components

Update these components to accept currency/rate props and use dual display:
- `ComparisonKeyInsights.tsx`
- `YearByYearWealthTable.tsx`
- `HeadToHeadTable.tsx`
- `ExitScenariosComparison.tsx` (new)
- `OutOfPocketCard.tsx`
- `DSCRExplanationCard.tsx`

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/roi/secondary/ExitScenariosComparison.tsx` | Side-by-side exit comparison table |
| `src/components/roi/secondary/ExitScenariosStep.tsx` | Step 3 in configurator for exit points |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/TopNavbar.tsx` | Add language toggle + currency dropdown |
| `src/pages/OffPlanVsSecondary.tsx` | Add language/currency state, reorder sections, add exit scenarios |
| `src/components/roi/secondary/ComparisonConfiguratorModal.tsx` | Add optional Step 3 for exit scenarios |
| `src/components/roi/secondary/ComparisonKeyInsights.tsx` | Add currency/rate props, dual display |
| `src/components/roi/secondary/YearByYearWealthTable.tsx` | Add currency/rate props, dual display |
| `src/components/roi/secondary/HeadToHeadTable.tsx` | Add currency/rate props, dual display |
| `src/components/roi/secondary/OutOfPocketCard.tsx` | Add currency/rate props, dual display |
| `src/components/roi/secondary/DSCRExplanationCard.tsx` | Minor: language support |
| `src/components/roi/secondary/types.ts` | Add ExitComparisonPoint type |
| `src/components/roi/secondary/index.ts` | Export new components |

---

## Detailed Component Changes

### TopNavbar Language Toggle

```tsx
// New props
interface TopNavbarProps {
  showNewQuote?: boolean;
  language?: 'en' | 'es';
  setLanguage?: (lang: 'en' | 'es') => void;
  currency?: Currency;
  setCurrency?: (currency: Currency) => void;
}

// In navbar, add controls before avatar:
<Button variant="ghost" size="icon" onClick={() => setLanguage?.(language === 'en' ? 'es' : 'en')}>
  {language === 'en' ? '🇬🇧' : '🇪🇸'}
</Button>

<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="ghost" size="sm">
      {CURRENCY_CONFIG[currency].flag} {currency}
    </Button>
  </DropdownMenuTrigger>
  {/* Currency options */}
</DropdownMenu>
```

### Exit Scenarios Calculation

For each exit point, calculate:

**Off-Plan:**
- Use `calculateExitScenario()` from constructionProgress.ts
- Accounts for construction appreciation, capital deployed at that point

**Secondary:**
- Property Value = purchasePrice × (1 + appreciationRate)^years
- Profit = PropertyValue + CumulativeRent - TotalCapital - ExitCosts
- ROE = Profit / TotalCapital × 100
- Annualized ROE = ROE / years

### Dual Currency Format in Tables

Example in YearByYearWealthTable:
```tsx
// Instead of:
formatCompact(row.offPlanWealth)

// Use:
<div className="flex flex-col items-end">
  <span>{formatCurrency(row.offPlanWealth, 'AED', 1)}</span>
  {currency !== 'AED' && (
    <span className="text-xs text-theme-text-muted">
      ({formatCurrency(row.offPlanWealth, currency, rate)})
    </span>
  )}
</div>
```

---

## Implementation Order

1. **Update TopNavbar** - Add language toggle and currency dropdown props
2. **Update OffPlanVsSecondary.tsx** - Add state, pass to navbar, reorder sections
3. **Create ExitScenariosStep.tsx** - Exit point selector for configurator
4. **Update ComparisonConfiguratorModal.tsx** - Add Step 3 for exits
5. **Create ExitScenariosComparison.tsx** - Side-by-side exit table
6. **Update all cards/tables** - Add currency/rate props, dual display
7. **Update types and exports**

---

## Visual Layout After Changes

```
┌─────────────────────────────────────────────────────────────────┐
│  TopNavbar                            [🇬🇧/🇪🇸] [🇦🇪 AED ▼] [👤]  │
├─────────────────────────────────────────────────────────────────┤
│  Header: "Off-Plan vs Secundaria"                               │
│  [← Reconfigurar]  [Toggle: Renta Larga | Airbnb]               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. KEY INSIGHTS (4 Cards) - with dual currency                 │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  2. DETAILED COMPARISON TABLE (HeadToHeadTable) - dual currency │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  3. YEAR-BY-YEAR WEALTH PROGRESSION - dual currency             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  4. WEALTH TRAJECTORY CHART                                     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  5. EXIT SCENARIOS COMPARISON (NEW)                             │
│  Table comparing exits at Year 3, 4, 5, etc.                    │
│  Shows profit & ROE side-by-side for both strategies            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  6. DSCR EXPLANATION + OUT OF POCKET                            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  7. VERDICT / RECOMMENDATION                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Exit Scenarios UI Design

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Exit Scenarios Comparison                                   │
│  What if you sell both properties at the same time?             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┬──────────────────────┬──────────────────────┐      │
│  │ Exit    │     OFF-PLAN 🏗️      │    SECONDARY 🏠      │      │
│  ├─────────┼──────────────────────┼──────────────────────┤      │
│  │ Year 3  │ Value: AED 1.65M     │ Value: AED 1.27M     │      │
│  │         │ Profit: +280K        │ Profit: +120K        │      │
│  │         │ ROE: 45% (15%/yr)    │ ROE: 18% (6%/yr)     │      │
│  │         │ 🏆 WINNER            │                      │      │
│  ├─────────┼──────────────────────┼──────────────────────┤      │
│  │ Year 5  │ Value: AED 1.95M     │ Value: AED 1.35M     │      │
│  │         │ Profit: +580K        │ Profit: +250K        │      │
│  │         │ ROE: 58% (11.6%/yr)  │ ROE: 26% (5.2%/yr)   │      │
│  │         │ 🏆 WINNER            │                      │      │
│  ├─────────┼──────────────────────┼──────────────────────┤      │
│  │ Year 10 │ Value: AED 2.4M      │ Value: AED 1.55M     │      │
│  │         │ Profit: +1.2M        │ Profit: +580K        │      │
│  │         │ ROE: 95% (9.5%/yr)   │ ROE: 48% (4.8%/yr)   │      │
│  │         │ 🏆 WINNER            │                      │      │
│  └─────────┴──────────────────────┴──────────────────────┘      │
│                                                                  │
│  💡 Off-plan appreciation during construction creates a         │
│     significant wealth advantage that compounds over time.      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

This implementation enhances the Off-Plan vs Secondary tool with:

1. **Global controls** - Language and currency toggles in the navbar for easy client customization
2. **Dual currency display** - All monetary values show both AED and the selected reference currency
3. **Reordered sections** - Detailed comparison comes before the wealth progression table
4. **Custom exit scenarios** - The key feature showing what happens if both properties are sold at the same point in time, demonstrating the off-plan appreciation advantage
