
# Comprehensive Fix: Off-Plan vs Secondary Calculation Consistency

## Overview

This plan addresses all identified issues to ensure complete consistency between the summary cards, year-by-year table, and underlying calculations. We'll add a Year 0 (Purchase Day) reference row and align all wealth calculations.

## Issues to Fix

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Secondary Year 1 shows appreciated value | `useSecondaryCalculations.ts` | Change exponent from `year` to `year - 1` |
| 2 | Off-Plan Year 1 shows appreciated value | Table rendering | Use base price for Year 1 in table display |
| 3 | Wealth Cards ≠ Table values | `YearByYearWealthTable.tsx` | Align both to use same definition (Net Wealth) |
| 4 | No purchase reference point | `YearByYearWealthTable.tsx` | Add Year 0 row showing purchase day values |

## Implementation Details

### 1. Fix Secondary Year 1 Property Value

**File:** `src/components/roi/secondary/useSecondaryCalculations.ts`

Change line 108 from:
```typescript
const propertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, year);
```

To:
```typescript
// Year 1 = purchase price, Year 2 = 1 year appreciation, etc.
const propertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, year - 1);
```

This ensures:
- Year 1: `purchasePrice * (1.05)^0 = purchasePrice` ✓
- Year 2: `purchasePrice * (1.05)^1 = +5%`
- Year 10: `purchasePrice * (1.05)^9`

### 2. Add Year 0 Row to Table

**File:** `src/components/roi/secondary/YearByYearWealthTable.tsx`

Add a new row at the beginning of `tableData` representing the purchase day:

```typescript
const tableData = useMemo(() => {
  const data = [];
  
  // Year 0 - Purchase Day (baseline reference)
  const currentYear = new Date().getFullYear();
  data.push({
    year: 0,
    calendarYear: offPlanProjections[0]?.calendarYear 
      ? offPlanProjections[0].calendarYear - 1 
      : currentYear,
    offPlanValue: offPlanBasePrice,
    offPlanRent: 0,
    offPlanCumulativeRent: 0,
    offPlanWealth: offPlanBasePrice,  // Initial investment value
    secondaryValue: secondaryPurchasePrice,
    secondaryRent: 0,
    secondaryCumulativeRent: 0,
    secondaryWealth: secondaryPurchasePrice, // Initial investment value
    delta: offPlanBasePrice - secondaryPurchasePrice,
    isHandover: false,
    isBeforeHandover: true,
    isPurchase: true,  // New flag for styling
  });
  
  // Years 1-10 continue as before...
```

### 3. Style Year 0 Row Distinctively

Add visual distinction for the purchase row:
- Light accent background
- Left border accent
- "(Purchase)" label next to Year 0

```tsx
<TableRow 
  className={`border-theme-border ${
    row.isPurchase 
      ? 'bg-theme-accent/5 border-l-2 border-l-theme-accent' 
      : row.isHandover 
        ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' 
        : ''
  }`}
>
  <TableCell>
    {row.isPurchase ? (
      <span className="italic text-theme-text-muted">0 (Purchase)</span>
    ) : row.year}
  </TableCell>
```

### 4. Align Wealth Definition: Choose Net Wealth

To match the summary cards, the table will also use **Net Wealth**:

**Current (Gross):**
```typescript
const opWealth = offPlanValue + opCumulativeRent;
```

**New (Net):**
```typescript
const opWealth = offPlanValue + opCumulativeRent - offPlanCapitalInvested;
const secWealth = secondaryValue + secCumulativeRent - secondaryCapitalInvested;
```

This requires:
1. Adding `secondaryCapitalInvested` as a new prop to `YearByYearWealthTable`
2. Updating the wealth calculation for both columns
3. Updating the tooltip formula to show: `Value + Rent - Initial Investment = Wealth`

### 5. Pass Secondary Capital to Table

**File:** `src/pages/OffPlanVsSecondary.tsx`

Add new prop when rendering the table:
```tsx
<YearByYearWealthTable
  // ...existing props
  secondaryCapitalInvested={secondaryCalcs.totalCapitalDay1}
/>
```

### 6. Update Props Interface

**File:** `src/components/roi/secondary/YearByYearWealthTable.tsx`

```typescript
interface YearByYearWealthTableProps {
  // ...existing
  secondaryCapitalInvested: number; // NEW
}
```

### 7. Update Tooltip Text

Update the tooltip to reflect the complete formula:
```typescript
tooltip: 'Wealth = Property Value + Cumulative Net Rent - Initial Investment. Shows net gain over time.',
```

And in the hover tooltip breakdown:
```tsx
<div>- Initial Investment: {formatSmallValue(capitalInvested)}</div>
<div className="border-t">= Net Wealth: {formatSmallValue(wealth)}</div>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/secondary/useSecondaryCalculations.ts` | Fix Year 1 appreciation exponent |
| `src/components/roi/secondary/YearByYearWealthTable.tsx` | Add Year 0 row, align wealth to Net, add styling, update tooltips |
| `src/pages/OffPlanVsSecondary.tsx` | Pass `secondaryCapitalInvested` prop |

## Validation After Implementation

The following must be true after the fix:

| Validation | Expected |
|------------|----------|
| Table Year 0 Off-Plan Value | = `basePrice` (purchase price) |
| Table Year 0 Secondary Value | = `purchasePrice` |
| Table Year 1 Secondary Value | = `purchasePrice` (no appreciation yet) |
| Table Year 2 Secondary Value | = `purchasePrice * (1 + rate)` |
| Table Year 10 Wealth | = Cards "Total Wealth (10Y)" value |
| Tooltip breakdown | Value + Rent - Capital = Wealth ✓ |

## Summary

This comprehensive fix ensures:
1. **Clear baseline**: Year 0 shows purchase day values for reference
2. **Correct appreciation**: Year 1 = purchase price, Year 2 = +1 year appreciation
3. **Consistent wealth definition**: Both cards and table use Net Wealth (Value + Rent - Capital)
4. **Verifiable math**: Tooltip breakdowns match displayed values exactly
