
# Fix: Align Top Card "Total Wealth" with Table Year 10 Values

## Problem Identified

The **"Total Wealth (10Y)"** card and the **Year-by-Year Table** show different values because they use different calculation methods:

### Table (Correct - Gross Wealth):
```
Year 10 Assets = Property Value + Cumulative Rent
```
**No capital subtraction.** Simple and intuitive.

### Cards (Currently Broken):
```
offPlanTotalWealth10 = metrics.offPlanWealthYear10 + metrics.offPlanCapitalDay1
                     = (propertyValue + rent - capitalDay1) + capitalDay1
```

This *should* cancel out to gross wealth, but:

1. **`secondaryWealthYear10`** in `useSecondaryCalculations.ts` (line 147) is calculated as:
   ```
   totalWealthLT = equityBuildup + cumulativeRentLT - totalCapitalDay1
   ```
   Where `equityBuildup = propertyValue - mortgageBalance` (NOT just property value!)

2. When mortgage is enabled, the secondary wealth already accounts for mortgage balance reduction, creating a different formula than the table.

3. The cards add `secondaryCashCapital` (equity invested) but the original subtracted `totalCapitalDay1` - these may differ slightly.

---

## Solution: Pass Year 10 Values Directly from Table Data Source

Instead of reverse-engineering gross wealth, pass the actual Year 10 values (property + cumulative rent) directly to the cards component. This ensures they match exactly.

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/OffPlanVsSecondary.tsx` | Calculate Year 10 gross wealth values and pass as new props |
| `src/components/roi/secondary/ComparisonKeyInsights.tsx` | Use new props directly instead of reverse-calculating |

---

## Technical Implementation

### 1. Calculate Year 10 Gross Wealth in `OffPlanVsSecondary.tsx`

Add calculations for the exact values the table shows:

```typescript
// Year 10 property values (already exist)
const offPlanPropertyValue10Y = offPlanCalcs.yearlyProjections[9]?.propertyValue || 0;
const secondaryPropertyValue10Y = secondaryCalcs.yearlyProjections[9]?.propertyValue || 0;

// NEW: Year 10 cumulative rent
const offPlanCumulativeRent10Y = useMemo(() => {
  let cumulative = 0;
  for (let i = 0; i < 10; i++) {
    if (i >= handoverYearIndex - 1) {
      cumulative += offPlanCalcs.yearlyProjections[i]?.netIncome || 0;
    }
  }
  return cumulative;
}, [offPlanCalcs.yearlyProjections, handoverYearIndex]);

const secondaryCumulativeRent10Y = rentalMode === 'airbnb'
  ? secondaryCalcs.yearlyProjections[9]?.cumulativeRentST || 0
  : secondaryCalcs.yearlyProjections[9]?.cumulativeRentLT || 0;

// NEW: Year 10 Total Assets (matching table exactly)
const offPlanTotalAssets10Y = offPlanPropertyValue10Y + offPlanCumulativeRent10Y;
const secondaryTotalAssets10Y = secondaryPropertyValue10Y + secondaryCumulativeRent10Y;
```

### 2. Pass New Props to `ComparisonKeyInsights`

```tsx
<ComparisonKeyInsights
  metrics={comparisonMetrics}
  // ... existing props ...
  
  // NEW: Pass exact Year 10 Total Assets
  offPlanTotalAssets10Y={offPlanTotalAssets10Y}
  secondaryTotalAssets10Y={secondaryTotalAssets10Y}
/>
```

### 3. Update `ComparisonKeyInsights.tsx` to Use Direct Props

Replace the reverse-calculation logic:

```typescript
// BEFORE (broken):
const offPlanTotalWealth10 = metrics.offPlanWealthYear10 + metrics.offPlanCapitalDay1;
const secondaryTotalWealth10 = secondaryWealth10 + metrics.secondaryCashCapital;

// AFTER (simple, matches table):
const offPlanTotalWealth10 = offPlanTotalAssets10Y;
const secondaryTotalWealth10 = secondaryTotalAssets10Y;
```

### 4. Update Interface

Add new props to `ComparisonKeyInsightsProps`:

```typescript
interface ComparisonKeyInsightsProps {
  // ... existing props ...
  
  // NEW: Year 10 Total Assets (Value + Rent)
  offPlanTotalAssets10Y: number;
  secondaryTotalAssets10Y: number;
}
```

---

## Expected Result

After this fix:

| Component | Off-Plan Year 10 | Secondary Year 10 |
|-----------|------------------|-------------------|
| **Table (Row 10, "Assets" column)** | 20.00M | 26.10M |
| **Top Card ("Total Wealth")** | 20.00M | 26.10M |

**Both will now show identical values** because they use the same source calculation:
```
Total Assets = Property Value at Year 10 + Cumulative Net Rent (Years 1-10)
```

---

## Summary

The fix is straightforward:
1. Calculate Year 10 gross wealth (value + rent) in the parent component
2. Pass these values directly as props
3. Remove the reverse-calculation logic from the cards component

This eliminates all the complexity around capital adjustments and ensures the card always shows exactly what the table's Year 10 row displays.
