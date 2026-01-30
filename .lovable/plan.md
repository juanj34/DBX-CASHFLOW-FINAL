
# Plan: Fix Secondary Property Configurator & Formatting Issues

## Issues Summary

From the screenshots and code analysis, I identified these problems:

1. **Exit Scenarios Capital Bug**: Shows 920K instead of 2M because it uses mortgage-based capital (down payment + closing) instead of full purchase price
2. **Wealth/Delta columns missing "AED" prefix**: Inconsistent currency formatting
3. **Purchase price input not formatted**: Shows raw number `2000000` instead of `AED 2,000,000`
4. **Cannot proceed past step 2 in configurator**: Button stays disabled when navigating via URL with quoteId
5. **No name field for secondary property**: Can't easily save/identify configurations

---

## File Changes

### 1. `src/components/roi/secondary/YearByYearWealthTable.tsx`

**Fix Wealth and Delta column formatting** - all monetary values should display "AED X.XM" consistently.

**Current Formatting (lines 262-294):**
- Wealth columns use `formatValue()` which returns "2.2M" (missing AED)
- Delta uses `formatCompact()` which returns "+174K" (missing AED)

**Updated Formatting:**
```typescript
// Line 266: Off-Plan Wealth
{formatSmallValue(row.offPlanWealth)}

// Line 282: Secondary Wealth  
{formatSmallValue(row.secondaryWealth)}

// Line 292: Delta
{row.delta >= 0 ? '+' : ''}AED {formatCompact(Math.abs(row.delta))}
```

This ensures all columns show: `AED 2.2M`, `AED 3.3M`, `+AED 174K`

---

### 2. `src/components/roi/secondary/ExitScenariosComparison.tsx`

**Fix secondary capital to use full purchase price** instead of mortgage-based capital.

**Current Logic (line 116-121):**
```typescript
// Uses mortgage-based capital (down payment + closing = 920K)
const secROE = secondaryCapitalInvested > 0 
  ? (secAppreciation / secondaryCapitalInvested) * 100 : 0;
```

**New Logic:**
```typescript
// For exits: Capital = Total Purchase Price
// Mortgages are just financing - when you sell, what matters is what you paid vs what you sell for
const secCapital = secondaryPurchasePrice;
const secProfit = secExitPrice - secondaryPurchasePrice;
const secTotalROE = secCapital > 0 ? (secProfit / secCapital) * 100 : 0;
const secAnnualizedROE = years > 0 ? secTotalROE / years : 0;
```

**Result:** Capital shows 2M (not 920K), ROE shows ~3%/year (matching appreciation rate)

**Prop Changes:**
- Remove `secondaryCapitalInvested` prop (no longer needed)
- Keep `secondaryPurchasePrice` (already exists)

---

### 3. `src/pages/OffPlanVsSecondary.tsx`

**Remove `secondaryCapitalInvested` prop** from ExitScenariosComparison call.

**Current (line 574):**
```typescript
<ExitScenariosComparison
  ...
  secondaryCapitalInvested={secondaryCalcs.totalCapitalDay1}
  ...
/>
```

**Updated:**
```typescript
<ExitScenariosComparison
  ...
  // secondaryCapitalInvested removed - using secondaryPurchasePrice instead
  ...
/>
```

---

### 4. `src/components/roi/secondary/ComparisonConfiguratorModal.tsx`

**Fix navigation bug** - when arriving at step 2 via URL, load the initial quote data.

**Problem:**
- Modal opens at step 2 when `initialQuoteId` is provided
- But `selectedQuote` state remains null
- "Next" button is disabled because it checks `disabled={!selectedQuote}`

**Solution - Add quote loading:**
```typescript
import { useCashflowQuote } from '@/hooks/useCashflowQuote';

// Inside component:
const { quote: initialQuote } = useCashflowQuote(initialQuoteId);

useEffect(() => {
  if (initialQuote && !selectedQuote && initialQuoteId) {
    setSelectedQuote(initialQuote);
  }
}, [initialQuote, selectedQuote, initialQuoteId]);
```

---

### 5. `src/components/roi/secondary/SecondaryPropertyStep.tsx`

**A) Format purchase price input** with thousand separators:

**Current:**
```typescript
<Input
  type="number"
  value={inputs.purchasePrice}
  onChange={(e) => updateInput('purchasePrice', Number(e.target.value))}
/>
```

**Updated:**
```typescript
<div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted text-sm">
    AED
  </span>
  <Input
    type="text"
    value={inputs.purchasePrice.toLocaleString()}
    onChange={(e) => {
      const cleaned = e.target.value.replace(/[^0-9]/g, '');
      updateInput('purchasePrice', Number(cleaned) || 0);
    }}
    className="pl-12 font-mono"
  />
</div>
```

**B) Add property name field** for saving/identifying configurations:

```typescript
// Add state for property name
const [propertyName, setPropertyName] = useState('Secondary Property');

// Add name input at top of form
<div className="space-y-1.5">
  <Label>Property Name</Label>
  <Input
    value={propertyName}
    onChange={(e) => setPropertyName(e.target.value)}
    placeholder="e.g., Marina View 2BR"
    className="bg-theme-bg"
  />
</div>
```

**C) Pass name to save function** when saving secondary property.

---

## Summary Table

| Issue | File | Fix |
|-------|------|-----|
| Wealth missing "AED" | `YearByYearWealthTable.tsx` | Use `formatSmallValue()` for Wealth columns |
| Delta missing "AED" | `YearByYearWealthTable.tsx` | Add "AED" prefix to delta display |
| Capital = 920K | `ExitScenariosComparison.tsx` | Use `secondaryPurchasePrice` as capital |
| Can't proceed step 2 | `ComparisonConfiguratorModal.tsx` | Load quote from `initialQuoteId` |
| Purchase price format | `SecondaryPropertyStep.tsx` | Use formatted text input with "AED" prefix |
| No property name | `SecondaryPropertyStep.tsx` | Add name input field |

---

## Expected Results After Fix

### Year-by-Year Wealth Table:
| Year | Value | Rent | Wealth | Delta |
|------|-------|------|--------|-------|
| 3 | AED 2.79M | AED 136K | **AED 2.8M** | **+AED 206K** |
| 5 | AED 3.32M | AED 160K | **AED 3.6M** | **+AED 630K** |

All monetary values now consistently show "AED" prefix.

### Exit Scenarios:
| Exit | Value | Capital | Profit | ROE |
|------|-------|---------|--------|-----|
| Year 3 | AED 2.19M | **AED 2.0M** | +AED 185K | **9.3%** |
| Year 5 | AED 2.32M | **AED 2.0M** | +AED 319K | **16%** |

Capital now shows full purchase price (2M, not 920K), and ROE reflects true appreciation return.

### Configurator:
- Purchase price input shows: `AED 2,000,000`
- Property name field visible at top
- Step 2 → Step 3 navigation works when arriving via URL
