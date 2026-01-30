
# Plan: Fix Secondary Multiplier Calculation

## The Problem

The secondary multiplier shows **1.1x** for 10-year growth, which is clearly wrong. A property appreciating at 3%/year for 10 years should show much higher growth.

### Root Cause

There's a mismatch between how wealth is calculated and what capital is used for the multiplier:

| Step | Formula | Value Used |
|------|---------|------------|
| Wealth calculation | `equityBuildup + cumulativeRent - totalCapitalDay1` | **920K** (mortgage-adjusted) |
| Multiplier division | `wealthYear10 / secondaryCapitalDay1` | **2.12M** (full price) |

The wealth formula already subtracts the 920K capital, creating a "net profit" figure. Then we divide by 2.12M which is larger, artificially shrinking the multiplier.

### Example Math (2M property, 60% mortgage):
- Property Value Year 10: ~2.68M
- Cumulative Rent 10Y: ~1.4M
- Mortgage Balance Year 10: ~1.0M
- Wealth10 = (2.68M - 1.0M) + 1.4M - 920K = **~2.18M** (net wealth)
- Multiplier = 2.18M / 2.12M = **1.03x** (wrong!)

---

## Solution: Calculate Gross Wealth for Multiplier

The multiplier should answer: **"Your total portfolio grew to X times your initial investment."**

**Correct Formula:**
```
Multiplier = (Wealth10 + Capital) / Capital
           = (Net Profit + Capital) / Capital
           = Total Value / Capital
```

Or equivalently:
```
grossWealth = wealthYear10 + secondaryCalcs.totalCapitalDay1
Multiplier = grossWealth / metrics.secondaryCapitalDay1
```

Wait, this still mixes the two capital values. Let me think more carefully...

---

## Deeper Analysis

The issue is that `secondaryCalcs.wealthYear10LT` subtracts `totalCapitalDay1` (920K), but we changed `metrics.secondaryCapitalDay1` to be 2.12M.

**Two consistent options:**

### Option A: Keep capital consistent at 2.12M everywhere
- Recalculate wealth: `equityBuildup + cumulativeRent - fullPurchasePrice - closingCosts`
- This would show negative wealth for leveraged properties (since you'd subtract the full 2M price when you only put in 920K)
- **Not ideal**

### Option B: Compute multiplier correctly using gross values
- Multiplier = (Equity at Year 10 + Cumulative Rent) / Initial Capital
- This shows the true return on investment

**Recommended: Option B**

In `ComparisonKeyInsights.tsx`, instead of using `wealthYear10` (which is already net of capital), calculate the multiplier from the underlying components:

```typescript
// For secondary: 
// Year 10 Property Value = propertyValue from projections
// Year 10 Mortgage Balance = mortgageBalance from projections
// Cumulative Rent = cumulativeRentLT from projections
// Equity = propertyValue - mortgageBalance

const secYear10 = secondaryProjections[9];
const secGrossWealth = secYear10.equityBuildup + secYear10.cumulativeRentLT;
const secondaryMultiplier = secGrossWealth / totalCapitalDay1; // Use 920K
```

But wait - we want to compare apples-to-apples. The off-plan multiplier uses `offPlanWealthYear10 / offPlanCapitalDay1`. Let me check that calculation...

---

## The Real Fix

Looking at it more carefully, the issue is:

1. **Off-Plan Multiplier**: `offPlanWealthYear10 / offPlanCapitalDay1` where wealth = propertyValue + rent - capital ✓
2. **Secondary Multiplier**: `secondaryWealthYear10 / secondaryCapitalDay1` where wealth = equity + rent - capital ✓

But we changed `secondaryCapitalDay1` to 2.12M while the wealth still subtracts 920K!

### Correct Fix

In `ComparisonKeyInsights.tsx`, we need to add back the **difference** between the two capitals to get apples-to-apples:

```typescript
// The wealth was calculated subtracting 920K (mortgage capital)
// But secondaryCapitalDay1 is now 2.12M (full price)
// So we need to adjust:
const capitalDifference = metrics.secondaryCapitalDay1 - secondaryCalcs.totalCapitalDay1;
const adjustedSecondaryWealth = secondaryWealth10 + capitalDifference;
const secondaryMultiplier = adjustedSecondaryWealth / metrics.secondaryCapitalDay1;
```

**But this requires passing `secondaryCalcs` to ComparisonKeyInsights...**

### Simpler Solution: Pass the correct wealth value from the parent

In `OffPlanVsSecondary.tsx`, calculate the wealth using consistent capital:

```typescript
// For secondary, use consistent capital (full price + closing)
const secondaryFullCapital = secondaryInputs.purchasePrice + secondaryCalcs.closingCosts;
const secondaryGrossWealth10LT = secondaryCalcs.yearlyProjections[9]?.equityBuildup 
  + secondaryCalcs.yearlyProjections[9]?.cumulativeRentLT 
  - secondaryFullCapital;
```

Wait, that would give the same result (subtracting 2.12M gives lower wealth).

---

## Final Correct Approach

For a **Money Multiplier**, we should show:

**"Your AED X investment became AED Y"** → Multiplier = Y / X

Where:
- X = Initial capital invested
- Y = Total value at Year 10 (property equity + cumulative income)

For leveraged secondary with mortgage:
- X = 920K (what you actually put in)
- Y = Equity(2.68M - 1.0M) + Rent(1.4M) = 3.08M
- **Multiplier = 3.08M / 920K = 3.3x** ✓

For non-leveraged comparison using full price:
- X = 2.12M (full commitment)
- Y = Property(2.68M) + Rent(1.4M) = 4.08M
- **Multiplier = 4.08M / 2.12M = 1.9x** ✓

### The Problem We Created

We changed `secondaryCapitalDay1` to 2.12M for the "Entry Ticket" card, but the multiplier should use the **mortgage-adjusted capital (920K)** because that's what the investor actually puts in.

### The Fix

Pass **both** capital values to `ComparisonKeyInsights`:
- `secondaryCapitalDay1` (2.12M) for "Entry Ticket"
- `secondaryCashCapital` (920K) for "Multiplier"

---

## Implementation Plan

### File: `src/components/roi/secondary/types.ts`

Add new field to `ComparisonMetrics`:
```typescript
export interface ComparisonMetrics {
  // ... existing fields
  secondaryCashCapital: number; // 920K - what you actually put in (for multiplier)
}
```

### File: `src/pages/OffPlanVsSecondary.tsx` (~line 318)

Pass both capital values:
```typescript
return {
  // ... existing fields
  secondaryCapitalDay1: secondaryInputs.purchasePrice + secondaryCalcs.closingCosts, // 2.12M for "Entry Ticket"
  secondaryCashCapital: secondaryCalcs.totalCapitalDay1, // 920K for "Multiplier"
};
```

### File: `src/components/roi/secondary/ComparisonKeyInsights.tsx` (~line 41)

Use cash capital for multiplier, add back capital to get gross wealth:
```typescript
// For multiplier: use actual cash invested (920K) and gross wealth (not net)
// Gross wealth = net wealth + cash capital (add back what was subtracted)
const secondaryGrossWealth = secondaryWealth10 + metrics.secondaryCashCapital;
const secondaryMultiplier = metrics.secondaryCashCapital > 0
  ? secondaryGrossWealth / metrics.secondaryCashCapital
  : 0;
```

This gives:
- Gross Wealth = 2.18M + 920K = 3.08M
- Multiplier = 3.08M / 920K = **3.3x** ✓

---

## Updated Entry Ticket Card

The "Entry Ticket" card should clarify what we're comparing:

| Entry Ticket | Off-Plan | Secondary |
|--------------|----------|-----------|
| Total Commitment | AED 520K | AED 2.12M |
| Cash Required | - | AED 920K |

Or better yet, compare cash-to-cash:
- Off-Plan: Total you pay = AED 520K (or full contract over time)
- Secondary: Cash required = AED 920K + mortgage obligation

For simplicity, keep Entry Ticket as "Total Commitment" (2.12M) but add a tooltip explaining the mortgage.

---

## Summary

| Change | File | Description |
|--------|------|-------------|
| Add `secondaryCashCapital` | `types.ts` | New field for mortgage-adjusted capital |
| Pass both capitals | `OffPlanVsSecondary.tsx` | 2.12M for Entry Ticket, 920K for Multiplier |
| Fix multiplier formula | `ComparisonKeyInsights.tsx` | Use gross wealth / cash capital |

### Expected Result After Fix:

| Card | Off-Plan | Secondary |
|------|----------|-----------|
| Entry Ticket | AED 520K | AED 2.12M |
| Multiplier | 10.5x | **3.3x** (was 1.1x) |
