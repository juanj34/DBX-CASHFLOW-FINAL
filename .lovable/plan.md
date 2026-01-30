

# Plan: Complete Off-Plan vs Secondary Comparison Tool Overhaul

## Problems Identified

### 1. Year 1 Shows Appreciated Value Instead of Purchase Price
**Screenshot shows**: Off-Plan Year 1 = AED 10.87M, but base price is AED 9.6M

**Root cause**: The `useOICalculations` and `useSecondaryCalculations` hooks calculate Year 1 with 1 year of appreciation already applied:
```typescript
// Secondary (line 108)
const propertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, year);

// Off-Plan (similar)
propertyValue = basePrice * (1 + yearAppreciation)
```

**Solution**: Add a "Year 0" row back, but correctly - representing the **purchase date**, not Year 1 data.

Actually, simpler fix: We should show base price in Year 1 for the "Value" column, since Year 1 is "End of Year 1" - the value at purchase (start of Year 1) is the base price.

---

### 2. Construction Phase Card - Wrong Rent Calculation
**Current** (line 34 in `OutOfPocketCard.tsx`):
```typescript
const avgMonthlyRent = secondaryCapitalDay1 * 0.07 / 12;
```

`secondaryCapitalDay1` is equity + closing costs (e.g., 4.4M), NOT the property price (9.89M).

**Fix**: Pass `secondaryPurchasePrice` as a prop and use it:
```typescript
const avgMonthlyRent = secondaryPurchasePrice * 0.07 / 12;
```

---

### 3. "Crossover Point" is Confusing
The "Crossover Point" metric compares wealth of two different assets with different values. It's misleading when:
- Off-Plan is 9.6M
- Secondary is 9.89M

**Replace with**: "Monthly Cashflow Comparison" showing:
- **Off-Plan**: AED 0/mo (during construction)
- **Secondary**: Net cashflow (Rent - Mortgage if financed)

---

### 4. Missing: Mortgage Coverage for Secondary
The user wants to see when mortgage is enabled:
- How much rent covers the mortgage
- Is the property "self-paying"?
- Monthly cashflow after mortgage

---

## Technical Changes

### File 1: `src/components/roi/secondary/YearByYearWealthTable.tsx`

#### Fix Year 1 to show purchase prices (not appreciated values)

The issue is that projections already contain `propertyValue` with Year 1 appreciation. For a fair "entry point" display:

**Option A** (cleaner): Add pass-through props for base prices and show them in Year 1
**Option B**: Modify the loop to show base prices for Year 1 row

I'll use **Option A** - add `offPlanBasePrice` and `secondaryPurchasePrice` props:

```typescript
interface YearByYearWealthTableProps {
  // ... existing
  offPlanBasePrice: number;      // NEW
  secondaryPurchasePrice: number; // NEW
}
```

Then in the table, for Year 1's "Value" column:
```typescript
// Year 1 shows purchase price (entry point)
// Years 2+ show appreciated values
const displayOffPlanValue = row.year === 1 ? offPlanBasePrice : row.offPlanValue;
const displaySecondaryValue = row.year === 1 ? secondaryPurchasePrice : row.secondaryValue;
```

---

### File 2: `src/components/roi/secondary/OutOfPocketCard.tsx`

#### Add `secondaryPurchasePrice` prop and fix rent calculation

```typescript
interface OutOfPocketCardProps {
  // ... existing
  secondaryPurchasePrice: number;  // NEW
}

// Fix the calculation (line 34)
const avgMonthlyRent = secondaryPurchasePrice * 0.07 / 12;
```

---

### File 3: `src/components/roi/secondary/ComparisonKeyInsights.tsx`

#### Replace "Crossover Point" with "Monthly Cashflow"

Change the 4 insight cards from:
1. Entry Ticket
2. Multiplier
3. **Crossover Point** ← Remove
4. Construction Bonus

To:
1. Entry Ticket
2. Multiplier
3. **Monthly Cashflow** ← New (show Off-Plan $0 vs Secondary net cashflow)
4. Construction Bonus

New props needed:
```typescript
interface ComparisonKeyInsightsProps {
  // ... existing
  secondaryMonthlyCashflow: number;  // Net (rent - mortgage)
  secondaryMonthlyRent: number;      // Gross rent
  secondaryMonthlyMortgage: number;  // Mortgage payment (0 if no mortgage)
  mortgageEnabled: boolean;
}
```

New card design:
```typescript
{
  key: 'cashflow',
  title: 'Monthly Cashflow',
  icon: Coins,
  showComparison: true,
  offPlanValue: 'AED 0',
  secondaryValue: formatValue(secondaryMonthlyCashflow),
  badge: mortgageEnabled 
    ? (secondaryMonthlyCashflow >= 0 ? '100% Covered' : 'Partial Coverage')
    : null,
  winner: 'secondary', // Secondary always wins during construction
}
```

---

### File 4: `src/components/roi/secondary/MortgageCoverageCard.tsx` (NEW FILE)

Create a new card that shows mortgage coverage when mortgage is enabled:

```typescript
interface MortgageCoverageCardProps {
  monthlyRent: number;
  monthlyMortgage: number;
  netCashflow: number;
  coveragePercent: number; // rent / mortgage * 100
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}
```

Visual design:
- Progress bar showing coverage %
- If >= 100%: "Tenant pays your mortgage!" in green
- If < 100%: "You pay AED X/mo gap" in amber

---

### File 5: `src/pages/OffPlanVsSecondary.tsx`

#### Pass new props to components

```typescript
// To YearByYearWealthTable:
<YearByYearWealthTable
  // ... existing
  offPlanBasePrice={safeOffPlanInputs.basePrice}
  secondaryPurchasePrice={secondaryInputs.purchasePrice}
/>

// To OutOfPocketCard:
<OutOfPocketCard
  // ... existing
  secondaryPurchasePrice={secondaryInputs.purchasePrice}
/>

// To ComparisonKeyInsights:
<ComparisonKeyInsights
  // ... existing
  secondaryMonthlyCashflow={
    rentalMode === 'long-term' 
      ? secondaryCalcs.monthlyCashflowLT 
      : secondaryCalcs.monthlyCashflowST
  }
  secondaryMonthlyRent={
    rentalMode === 'long-term'
      ? secondaryCalcs.monthlyRentLT
      : secondaryCalcs.monthlyRentST
  }
  secondaryMonthlyMortgage={secondaryCalcs.monthlyMortgagePayment}
  mortgageEnabled={secondaryInputs.useMortgage}
/>

// Add MortgageCoverageCard when mortgage enabled:
{secondaryInputs.useMortgage && (
  <MortgageCoverageCard
    monthlyRent={
      rentalMode === 'long-term' 
        ? secondaryCalcs.monthlyRentLT 
        : secondaryCalcs.monthlyRentST
    }
    monthlyMortgage={secondaryCalcs.monthlyMortgagePayment}
    netCashflow={
      rentalMode === 'long-term'
        ? secondaryCalcs.monthlyCashflowLT
        : secondaryCalcs.monthlyCashflowST
    }
    coveragePercent={
      secondaryCalcs.monthlyMortgagePayment > 0
        ? (secondaryCalcs.monthlyRentLT / secondaryCalcs.monthlyMortgagePayment) * 100
        : 100
    }
    currency={currency}
    rate={rate}
    language={language}
  />
)}
```

---

### File 6: `src/components/roi/secondary/index.ts`

Export the new component:
```typescript
export { MortgageCoverageCard } from './MortgageCoverageCard';
```

---

## Expected Results

### Year-by-Year Table (After Fix)

| Year | Off-Plan Value | Rent | Wealth | Secondary Value | Rent | Wealth |
|------|----------------|------|--------|-----------------|------|--------|
| 1    | AED 9.60M ✓    | —    | 9.60M  | AED 9.89M ✓     | 628K | 10.52M |
| 2    | AED 10.87M     | —    | 10.87M | AED 10.18M      | 647K | 11.46M |

### Construction Phase Card (After Fix)

| Metric | Before | After |
|--------|--------|-------|
| Secondary Rent | +AED 1.2M | +AED 2.8M |
| Calculation | 4.4M × 7% × 48mo | 9.89M × 7% × 48mo |

### Key Insights Cards (After Fix)

| Before | After |
|--------|-------|
| 1. Entry Ticket | 1. Entry Ticket |
| 2. Multiplier | 2. Multiplier |
| 3. Crossover Point ❌ | 3. **Monthly Cashflow** ✓ |
| 4. Construction Bonus | 4. Construction Bonus |

### New Mortgage Coverage Card

When Secondary has mortgage enabled:
```text
┌────────────────────────────────────────┐
│ 🏠 Tenant Pays Your Mortgage           │
│                                        │
│ Monthly Rent:     AED 57,722          │
│ Mortgage Payment: AED 45,000          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [████████████████████▓▓▓▓] 128%       │
│                                        │
│ 🎉 Net Cashflow: +AED 12,722/mo       │
│    Property pays itself + profit!      │
└────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/roi/secondary/YearByYearWealthTable.tsx` | Modify | Add base price props, show purchase prices in Year 1 |
| `src/components/roi/secondary/OutOfPocketCard.tsx` | Modify | Add purchasePrice prop, fix rent calculation |
| `src/components/roi/secondary/ComparisonKeyInsights.tsx` | Modify | Replace Crossover with Cashflow card, add new props |
| `src/components/roi/secondary/MortgageCoverageCard.tsx` | **Create** | New card showing mortgage coverage |
| `src/pages/OffPlanVsSecondary.tsx` | Modify | Pass new props to all components |
| `src/components/roi/secondary/index.ts` | Modify | Export new component |

