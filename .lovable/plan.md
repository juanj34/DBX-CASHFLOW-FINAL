
# Fix: Years to Payoff Should Account for Rent Growth

## Problem Identified

When you increase the **Yearly Rent Growth %**, the **Breakeven** time should decrease, but it stays at 12.6 years regardless of the growth rate.

### Root Cause
The calculation at line 615 in `useOICalculations.ts` uses:
```
yearsToPayOff = basePrice / netAnnualRent
```

This divides the property price by **Year 1 rent only** and ignores the `rentGrowthRate` setting entirely. Changing rent growth from 0% to 10% has **zero effect** on this number.

---

## Current vs Expected Behavior

| Rent Growth | Current Output | Expected Output |
|-------------|----------------|-----------------|
| 0% | 12.6 years | 12.6 years |
| 4% | 12.6 years | ~10.8 years |
| 7% | 12.6 years | ~9.5 years |
| 10% | 12.6 years | ~8.5 years |

---

## The Fix

Replace the simple division with a formula that accounts for compounding rent growth.

### Mathematical Approach

If rent grows at rate `g` annually, cumulative rent after `n` years is a geometric series:

**With growth (g > 0):**
```
Years = ln(1 + (Principal × g) / AnnualRent) / ln(1 + g)
```

**Without growth (g = 0):**
```
Years = Principal / AnnualRent
```

This correctly reduces the payback period as rent growth increases.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/useOICalculations.ts` | Update `yearsToPayOff` and `yearsToBreakEven` calculations to use geometric series formula |

---

## Implementation

### Before (lines 614-615):
```typescript
const yearsToBreakEven = netAnnualRent > 0 ? totalCapitalInvested / netAnnualRent : 999;
const yearsToPayOff = netAnnualRent > 0 ? basePrice / netAnnualRent : 999;
```

### After:
```typescript
// Helper function to calculate years with rent growth
const calculateYearsWithGrowth = (principal: number, annualRent: number, growthRate: number): number => {
  if (annualRent <= 0) return 999;
  if (growthRate <= 0) return principal / annualRent; // Simple division when no growth
  
  const g = growthRate / 100;
  // Using geometric series: Years = ln(1 + (P × g) / R) / ln(1 + g)
  const yearsNeeded = Math.log(1 + (principal * g) / annualRent) / Math.log(1 + g);
  return yearsNeeded;
};

const yearsToBreakEven = calculateYearsWithGrowth(totalCapitalInvested, netAnnualRent, rentGrowthRate);
const yearsToPayOff = calculateYearsWithGrowth(basePrice, netAnnualRent, rentGrowthRate);
```

### Airbnb calculations (lines 626-627):
Apply the same fix for Airbnb rent using `adrGrowthRate`.

---

## Validation

After the fix:
- Setting **Rent Growth = 0%** should give the same result as before
- Setting **Rent Growth = 4%** should reduce breakeven by ~15%
- Setting **Rent Growth = 10%** should reduce breakeven by ~30%

---

## Secondary Calculations

The same issue exists in `useSecondaryCalculations.ts` - the `yearsToPayOff` calculation there should also be updated to use the same formula for consistency.
