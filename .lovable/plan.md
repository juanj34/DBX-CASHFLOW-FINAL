
# Analysis: Year 0 Wealth Table Logic

## Understanding the Current Calculation

The table uses **Net Wealth** formula:
```
Wealth = Property Value + Cumulative Rent - Capital Invested
```

### Why Secondary Shows Negative Wealth at Purchase (Year 0)

The "Capital Invested" values are fundamentally different:

| Investment Type | Capital Day 1 | What It Represents |
|-----------------|---------------|-------------------|
| **Off-Plan** | ~AED 1.35M | Downpayment (20%) + Entry Costs (4%) = ~24% of property |
| **Secondary** | ~AED 7.95M | Full Price (7.5M) + Closing Costs (6%) = ~106% of property |

**Year 0 Calculation:**
- **Off-Plan:** 9.60M (value) - 1.35M (paid) = **+8.25M** 
  - You paid 14% but own a 9.6M asset → huge positive wealth
- **Secondary:** 7.50M (value) - 7.95M (paid) = **-450K**
  - You paid 7.95M but asset is worth 7.5M → negative due to closing costs

This is **mathematically correct** for "Net Wealth" (change from holding cash), but it's **extremely confusing** because:
1. Users see negative wealth and think it's an error
2. The comparison seems unfair - off-plan looks artificially good because you haven't paid the full price yet
3. It doesn't account for the fact that off-plan still owes 76% of the property price

## The Core Problem

The current approach compares apples to oranges:
- **Off-Plan:** Only counts partial payment made (not committed debt)
- **Secondary:** Counts full purchase (but also has full ownership)

For a fair comparison, we need to either:
1. **Option A:** Use "Equity" instead of "Wealth" (what you actually own free and clear)
2. **Option B:** Count Off-Plan's total committed payments as capital (not just what's paid to date)
3. **Option C:** Remove Year 0 entirely and only show years after both properties are fully paid/delivered

---

## Recommended Solution: Option B - Use Total Committed Capital

Adjust the Off-Plan "Capital Invested" to represent what the buyer is **committed to paying**, not just what they've paid so far. This makes Year 0 values more comparable.

### For Off-Plan:
Instead of:
```typescript
offPlanCapitalDay1 = downpayment + entryCosts  // ~1.35M
```

Use "Total Capital at Handover" (pre-handover payments + entry costs):
```typescript
offPlanCapitalCommitted = (basePrice × downpaymentPercent / 100) 
                        + (basePrice × preHandoverPercent / 100) 
                        + entryCosts
// For 20% down + 30% pre-handover + 4% entry = ~5.4M
```

Or even use the full purchase price + entry costs to match secondary's approach.

### Expected Result After Fix:

| Year | Off-Plan Value | Off-Plan Wealth | Secondary Value | Secondary Wealth |
|------|----------------|-----------------|-----------------|------------------|
| 0 (Purchase) | 9.60M | 4.14M | 7.50M | -450K |
| 1 | 11.04M | 5.58M | 7.88M | 220K |

Now off-plan still shows higher wealth but the numbers are more balanced and secondary won't show as severely negative.

---

## Alternative Solution: Different Column Label

If we want to keep the current "capital spent to date" logic, we should:

1. **Rename "Wealth" to "Equity Gained"** or **"Position"**
2. **Add a tooltip explaining:** "Shows current asset value minus capital deployed so far. Off-plan shows higher initial values because full payment hasn't occurred yet."
3. **Add a visual indicator** on Year 0 secondary row explaining the closing costs impact

---

## Technical Changes Required

### Option B Implementation (Recommended)

**File: `src/pages/OffPlanVsSecondary.tsx`**

Change how `offPlanCapitalInvested` is calculated for the table:

```typescript
// Current (line 729):
offPlanCapitalInvested={comparisonMetrics.offPlanCapitalDay1}

// Changed to:
offPlanCapitalInvested={offPlanTotalCapitalAtHandover}  // Uses full pre-handover commitment
```

This would use:
```typescript
const offPlanTotalCapitalAtHandover = downpayment + preHandover + entryCosts  // ~5.4M
```

**Expected Result:**
- Off-Plan Year 0: 9.60M - 5.4M = **+4.2M** (still positive, but more balanced)
- Secondary Year 0: 7.50M - 7.95M = **-450K** (still negative due to closing costs)

The gap narrows but off-plan still shows advantage during construction.

---

## Summary

The negative wealth for secondary at Year 0 is **technically correct** but **confusing**. It happens because:
1. Secondary pays 100% + closing costs upfront
2. Off-Plan only pays ~24% upfront but gets credit for full property value

**Recommendation:** Use off-plan's "Total Capital at Handover" instead of "Day 1 Capital" for the table comparison. This makes the wealth comparison more intuitive while still showing off-plan's payment flexibility advantage through the actual cash flow timeline.
