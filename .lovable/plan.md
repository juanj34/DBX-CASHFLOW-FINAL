
# Fix: Wealth Table Logic Inconsistency

## Issues Identified

After analyzing the code, I found **three interconnected problems**:

### 1. Year 0 Secondary Shows Negative Wealth

**Current Calculation (YearByYearWealthTable.tsx line 80):**
```
secondaryWealth = secondaryPurchasePrice - secondaryCapitalInvested
               = 7,500,000 - 7,950,000 = -450,000
```

**Why it's negative:** The capital invested includes 6% closing costs, so you're "underwater" by exactly that closing cost amount on Day 1.

**This is technically correct for "Net Wealth"** (cash position change), but very confusing to users.

---

### 2. Top Cards Use Different Capital Than Table

| Component | Capital Used | Formula |
|-----------|--------------|---------|
| **Top Cards** (ComparisonKeyInsights) | `offPlanCapitalDay1` (~14%) | Property + Rent - Downpayment |
| **Table** (YearByYearWealthTable) | `offPlanTotalCapitalAtHandover` (~52%) | Property + Rent - TotalPreHandover |

This causes the cards to show much higher wealth than the table for Year 10.

---

### 3. User's Math Check Question

For Secondary Year 10:
- Property Value: 20.64M
- Cumulative Rent: 5.46M
- Shown Wealth: ~19M

The math IS correct: `20.64M + 5.46M - 7.95M (capital) = 18.15M`

The confusion is that users expect "Total Wealth" to mean Value + Rent, not the net position after subtracting investment.

---

## Recommended Solution

### Option A: Use "Gross Wealth" Everywhere (Simpler for Users)

Define Wealth as `Property Value + Cumulative Rent` **without subtracting capital**.

This matches intuitive expectations:
- "My property is worth 20M and I've earned 5M in rent = I have 25M in wealth"
- The "profit" or "gain" is a separate metric

### Option B: Keep "Net Wealth" But Align Both Components

If we want to show "Net Position" (what you gained vs. cash-in-bank alternative):
1. Use the **same capital definition** in both cards and table
2. Either use `offPlanCapitalDay1` everywhere, OR `offPlanTotalCapitalAtHandover` everywhere
3. Rename column to **"Net Position"** or **"Gain vs Cash"** to clarify

### Option C: Show BOTH (Most Informative)

- **Column 1:** "Total Assets" = Property Value + Cumulative Rent
- **Column 2:** "Net Gain" = Total Assets - Capital Invested

This eliminates confusion by being explicit.

---

## Technical Implementation (Option A - Gross Wealth)

### Files to Modify

1. **`src/components/roi/secondary/YearByYearWealthTable.tsx`**
   - Remove capital subtraction from wealth calculation
   - Change column header from "Wealth" to "Total Assets" or "Value + Rent"
   - Update tooltip to reflect new formula

2. **`src/components/roi/secondary/ComparisonKeyInsights.tsx`**
   - Change "Total Wealth" calculation to match: `propertyValue + cumulativeRent`
   - Keep capital subtraction for "Net Gain" if desired as separate metric

### Code Changes

**YearByYearWealthTable.tsx - Line 76 (Year 0):**
```typescript
// Current:
offPlanWealth: offPlanBasePrice - offPlanCapitalInvested,
secondaryWealth: secondaryPurchasePrice - secondaryCapitalInvested,

// New (Gross Wealth):
offPlanWealth: offPlanBasePrice,  // Just property value at purchase
secondaryWealth: secondaryPurchasePrice,
```

**YearByYearWealthTable.tsx - Lines 111-112 (Year 1-10):**
```typescript
// Current:
const opWealth = offPlanValue + opCumulativeRent - offPlanCapitalInvested;
const secWealth = secondaryValue + secCumulativeRent - secondaryCapitalInvested;

// New (Gross Wealth):
const opWealth = offPlanValue + opCumulativeRent;
const secWealth = secondaryValue + secCumulativeRent;
```

**Update column header in translations (line 165):**
```typescript
// Current:
wealth: 'Wealth',

// New:
wealth: 'Total Assets',
```

**Update tooltip (line 161):**
```typescript
// Current:
tooltip: 'Wealth = Property Value + Cumulative Net Rent - Initial Investment...'

// New:
tooltip: 'Total Assets = Property Value + Cumulative Net Rent earned to date.'
```

### Also Update ComparisonKeyInsights.tsx

Lines 51-54:
```typescript
// Current (confusing because it uses different capital):
const offPlanTotalWealth10 = metrics.offPlanWealthYear10;

// New (calculate fresh with gross formula):
const offPlanTotalWealth10 = offPlanPropertyValue10Y + offPlanCumulativeRent10Y;
const secondaryTotalWealth10 = secondaryPropertyValue10Y + (isAirbnb ? secondaryCumulativeRentST : secondaryCumulativeRentLT);
```

This requires passing additional props for cumulative rent values.

---

## Expected Results After Fix

| Year | Off-Plan Value | Off-Plan Rent | Off-Plan Total | Secondary Value | Secondary Rent | Secondary Total |
|------|----------------|---------------|----------------|-----------------|----------------|-----------------|
| 0 | 9.60M | 0 | 9.60M | 7.50M | 0 | 7.50M |
| 1 | 11.04M | 0 | 11.04M | 7.88M | 525K | 8.40M |
| 10 | 16.8M | 3.2M | 20.0M | 12.2M | 5.8M | 18.0M |

**No more negative values. Card and table values will match.**

---

## Summary

The core issue is **inconsistent capital definitions** and **confusing terminology**:

1. Cards use "Day 1 Capital" (~14%)
2. Table uses "Total Capital at Handover" (~52%)
3. Users see "Wealth" but expect "Property Value + Rent"

**Recommended fix:** Switch to "Gross Wealth" (Value + Rent) without capital subtraction. This:
- Eliminates negative Year 0 values
- Makes card and table values consistent
- Matches user intuition about "total wealth"

The profit/gain metrics can be shown separately in the Exit Scenarios section where capital context is clearer.
