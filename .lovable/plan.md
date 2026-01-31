# Comprehensive Fix: Off-Plan vs Secondary Calculation Consistency

## Status: ✅ COMPLETED

## Overview

This plan addressed all identified issues to ensure complete consistency between the summary cards, year-by-year table, and underlying calculations.

## Changes Implemented

### 1. Fixed Secondary Year 1 Property Value
**File:** `src/components/roi/secondary/useSecondaryCalculations.ts`

Changed appreciation exponent from `year` to `year - 1`:
```typescript
// Year 1 = purchase price, Year 2 = 1 year appreciation, etc.
const propertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, year - 1);
```

### 2. Added Year 0 Row to Table
**File:** `src/components/roi/secondary/YearByYearWealthTable.tsx`

Added a "Year 0 (Purchase)" row showing baseline values:
- Off-Plan: `basePrice` with no rent, Net Wealth = `basePrice - capitalInvested`
- Secondary: `purchasePrice` with no rent, Net Wealth = `purchasePrice - capitalInvested`
- Visual distinction with accent background and left border

### 3. Aligned Wealth to Net Wealth Definition
**File:** `src/components/roi/secondary/YearByYearWealthTable.tsx`

Changed wealth calculation to match cards:
```typescript
// Net Wealth = Property Value + Cumulative Net Rent - Initial Capital
const opWealth = offPlanValue + opCumulativeRent - offPlanCapitalInvested;
const secWealth = secondaryValue + secCumulativeRent - secondaryCapitalInvested;
```

### 4. Added Secondary Capital Prop
**File:** `src/pages/OffPlanVsSecondary.tsx`

Passed `secondaryCapitalInvested` to the table component:
```tsx
<YearByYearWealthTable
  // ...existing props
  secondaryCapitalInvested={secondaryCalcs.totalCapitalDay1}
/>
```

### 5. Updated Tooltips
Updated wealth hover tooltips to show full formula breakdown:
- Property Value
- \+ Cumulative Rent
- − Initial Investment
- = Net Wealth

## Validation Checklist

| Validation | Status |
|------------|--------|
| Table Year 0 Off-Plan Value = `basePrice` | ✅ |
| Table Year 0 Secondary Value = `purchasePrice` | ✅ |
| Table Year 1 Secondary Value = `purchasePrice` (no appreciation) | ✅ |
| Table Year 2 Secondary Value = `purchasePrice * (1 + rate)` | ✅ |
| Table Year 10 Wealth = Cards "Total Wealth (10Y)" value | ✅ |
| Tooltip breakdown shows Value + Rent - Capital = Wealth | ✅ |
