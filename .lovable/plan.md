
# Plan: Use Average Rent for Mortgage and Post-Handover Coverage Analysis

## Problem Statement

Currently, the Mortgage Analysis and Post-Handover Coverage Analysis cards use the **Year 1 rent** to calculate cashflow coverage. This is inaccurate because:

1. **Rent grows annually** (typically 3-5% per year via `rentGrowthRate`)
2. For a **25-year mortgage**, using Year 1 rent significantly underestimates coverage
3. For a **2-5 year post-handover plan**, the growing rent means payments become easier to cover over time

The user correctly identified that the "Monthly Cash Flow" showing +AED 28,090 based on Year 1 rent doesn't reflect the true average experience over the mortgage/payment term.

## Solution: Calculate Average Rent Over the Relevant Period

### Approach

Instead of using just Year 1 rent, calculate the **average rent** over the payment period:

```text
Average Monthly Rent = Sum of (Monthly Rent for each year) / Number of years
```

For a 4% annual rent growth starting at AED 68,632/month:
- Year 1: AED 68,632
- Year 5: AED 80,000 (approx)
- Year 10: AED 94,000 (approx)
- Year 25: AED 180,000 (approx)

Average over 25 years ≈ AED 115,000/month (significantly higher than Year 1)

### Implementation Details

#### 1. Create Utility Function for Average Rent Calculation

Add a helper function to calculate average rent over N years with growth:

```typescript
// Calculate average monthly rent over a period with annual growth
export const calculateAverageMonthlyRent = (
  initialMonthlyRent: number,
  rentGrowthRate: number, // % annual growth (e.g., 4)
  periodYears: number
): number => {
  if (periodYears <= 0) return initialMonthlyRent;
  
  let totalRent = 0;
  let currentRent = initialMonthlyRent;
  
  for (let year = 1; year <= periodYears; year++) {
    totalRent += currentRent * 12; // Add annual rent
    currentRent = currentRent * (1 + rentGrowthRate / 100); // Grow for next year
  }
  
  return totalRent / (periodYears * 12); // Average monthly
};
```

#### 2. Update Mortgage Analysis Components

**Files to modify:**
- `src/components/roi/snapshot/SnapshotContent.tsx`
- `src/components/roi/snapshot/CompactMortgageCard.tsx` (add prop for average rent)
- `src/components/roi/MortgageBreakdown.tsx` (show both Year 1 and average)

**Changes:**
- Pass `mortgageInputs.loanTermYears` and `inputs.rentGrowthRate` to calculate average
- Display "Average Monthly Rent (over 25 years)" in the mortgage breakdown
- Use average rent for cashflow calculation instead of Year 1 rent

#### 3. Update Post-Handover Coverage Components

**Files to modify:**
- `src/components/roi/snapshot/CompactPostHandoverCard.tsx`
- `src/components/roi/PostHandoverCoverageBreakdown.tsx`
- `src/pages/CashflowView.tsx` (where PostHandoverCoverageBreakdown is called)

**Changes:**
- Calculate post-handover duration in years from `postHandoverMonths`
- Calculate average rent over that period
- Use average rent for tenant coverage calculation
- Display both initial and average rent for clarity

### UI Display Changes

#### Mortgage Card (CompactMortgageCard)

```text
Current:
  Rental Income         +AED 68,632/mo
  Monthly Cash Flow     +AED 28,090/mo

Proposed:
  Rental Income (Avg)   +AED 115,000/mo   ← Average over 25 years
  Monthly Cash Flow     +AED 74,458/mo    ← Much more positive!
  
  [small text] Year 1: AED 68,632/mo → Growing 4%/yr
```

#### Post-Handover Card (CompactPostHandoverCard)

```text
Current:
  Monthly Rent          +AED 68,632/mo
  Monthly Gap/Surplus   -AED 10,000/mo

Proposed:
  Monthly Rent (Avg)    +AED 72,000/mo    ← Average over 3-year plan
  Monthly Surplus       +AED 3,000/mo     ← Better coverage!
  
  [small text] Year 1: AED 68,632/mo → Growing 4%/yr
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/currencyUtils.ts` | Add `calculateAverageMonthlyRent()` utility function |
| `src/components/roi/snapshot/SnapshotContent.tsx` | Calculate average rent for mortgage term and pass to CompactMortgageCard |
| `src/components/roi/snapshot/CompactMortgageCard.tsx` | Accept and display average rent with Year 1 comparison |
| `src/components/roi/snapshot/CompactPostHandoverCard.tsx` | Calculate average rent for post-handover duration |
| `src/components/roi/MortgageBreakdown.tsx` | Update cashflow calculation to use average rent, show comparison |
| `src/pages/CashflowView.tsx` | Calculate and pass average rent to PostHandoverCoverageBreakdown |
| `src/components/roi/PostHandoverCoverageBreakdown.tsx` | Accept average rent prop and update calculations |

### Technical Notes

1. **Backward Compatibility**: Keep Year 1 rent visible as context, but use average for calculations
2. **Rent Growth Source**: Use `inputs.rentGrowthRate` (default 4%) for growth projections
3. **Period Calculation**:
   - Mortgage: `mortgageInputs.loanTermYears` (typically 25 years)
   - Post-Handover: `postHandoverMonths / 12` (1-5 years typically)
4. **Pro-rata Handling**: For partial years, use monthly calculation with growth factor

### Testing Checklist

After implementation:
- [ ] Mortgage card shows higher average rent and improved cashflow
- [ ] Post-handover card shows average rent for payment period
- [ ] Year 1 rent is still visible for reference
- [ ] Calculations match expected growth formula
- [ ] All theme colors work in light and dark modes
