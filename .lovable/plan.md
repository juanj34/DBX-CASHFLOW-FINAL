

# Plan: Fix Year-by-Year Wealth Table Calculations + Add Hover Tooltips

## Problems Identified

### Problem 1: Off-Plan Wealth Mismatch (Year 1: Value 9.60M → Wealth 10.48M)
**Current code in `YearByYearWealthTable.tsx` lines 84-90:**
```typescript
// Wealth uses appreciated propertyValue (10.48M)
const opWealth = (opProj?.propertyValue || 0) + opCumulativeRent;

// But display shows BASE price (9.60M)
const displayOffPlanValue = year === 1 ? offPlanBasePrice : (opProj?.propertyValue || 0);
```
**Result:** Table shows Value=9.60M but Wealth=10.48M, which is impossible since rent=0

### Problem 2: Secondary Wealth Mismatch (Year 1: Value 7.50M + Rent 481K → Wealth 8.21M)
**In `useSecondaryCalculations.ts` line 108:**
```typescript
const propertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, year);
// Year 1: 7.5M * 1.08^1 = 8.1M (NOT 7.5M)
```
The secondary projections apply appreciation starting from Year 1, but table displays purchase price for Year 1 value.

### Problem 3: Secondary Property Value Resets
The auto-initialization effect in `OffPlanVsSecondary.tsx` (lines 92-108) can trigger on quote reference changes even after user has configured secondary inputs.

---

## Solution

### Principle: Use CONSISTENT values for display AND calculation
For Year 1, we must decide: either show appreciated values OR use base prices for both display and wealth. 

**Decision:** For Year 0 (entry point), show base prices. For Year 1+, show appreciated values. Wealth = Value shown + Cumulative Rent.

---

## Technical Changes

### File 1: `src/components/roi/secondary/YearByYearWealthTable.tsx`

#### 1.1 Fix wealth calculation to use displayed values

**Lines 83-98 - Before:**
```typescript
// Wealth uses appreciated value
const opWealth = (opProj?.propertyValue || 0) + opCumulativeRent;
const secWealth = (secProj?.propertyValue || 0) + secCumulativeRent;

// Display uses base price for Year 1
const displayOffPlanValue = year === 1 ? offPlanBasePrice : (opProj?.propertyValue || 0);
const displaySecondaryValue = year === 1 ? secondaryPurchasePrice : (secProj?.propertyValue || 0);
```

**After:**
```typescript
// USE THE SAME VALUE for display AND wealth calculation
// For Year 1, we use the appreciated value from projections (consistent with other years)
// This makes Value + Cumulative Rent = Wealth always true
const offPlanValue = opProj?.propertyValue || offPlanBasePrice;
const secondaryValue = secProj?.propertyValue || secondaryPurchasePrice;

// Wealth = Property Value + Cumulative Rent (now consistent)
const opWealth = offPlanValue + opCumulativeRent;
const secWealth = secondaryValue + secCumulativeRent;
```

#### 1.2 Add hover tooltips showing calculation breakdown

For each Wealth cell, wrap in a `Tooltip` showing:
```
Property Value: AED 10.48M
+ Cumulative Rent: AED 0
= Wealth: AED 10.48M
```

**Implementation:**
```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <span className={`text-sm font-medium cursor-help ${...}`}>
      {formatSmallValue(row.offPlanWealth)}
    </span>
  </TooltipTrigger>
  <TooltipContent side="top" className="p-2">
    <div className="text-xs space-y-1">
      <div className="flex justify-between gap-4">
        <span className="text-theme-text-muted">{t.value}:</span>
        <span className="font-mono">{formatSmallValue(row.offPlanValue)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-theme-text-muted">+ {t.cumulativeRent}:</span>
        <span className="font-mono">{formatSmallValue(row.offPlanCumulativeRent)}</span>
      </div>
      <div className="border-t border-theme-border pt-1 flex justify-between gap-4 font-semibold">
        <span>= {t.wealth}:</span>
        <span className="font-mono">{formatSmallValue(row.offPlanWealth)}</span>
      </div>
    </div>
  </TooltipContent>
</Tooltip>
```

---

### File 2: `src/pages/OffPlanVsSecondary.tsx`

#### 2.1 Remove problematic auto-initialization effect

**Delete lines 92-108** (the entire useEffect that auto-initializes secondary inputs):
```typescript
// REMOVE THIS ENTIRE BLOCK:
useEffect(() => {
  if (quote?.inputs && !hasInitializedSecondaryFromQuote && !hasConfigured) {
    const inputs = quote.inputs as OIInputs;
    setSecondaryInputs(prev => ({
      ...prev,
      purchasePrice: inputs.basePrice || prev.purchasePrice,
      ...
    }));
    setHasInitializedSecondaryFromQuote(true);
    setHasConfigured(true);
  }
}, [quote?.inputs, hasInitializedSecondaryFromQuote, hasConfigured]);
```

**Reasoning:** Initialization should ONLY happen through explicit user actions:
1. `handleCompare()` - when user configures via modal
2. `handleLoadComparison()` - when loading saved comparison

This eliminates the state reset issue entirely.

#### 2.2 Also remove the `hasInitializedSecondaryFromQuote` state (no longer needed)

---

## Translation Updates

Add new translation keys in `YearByYearWealthTable.tsx`:
```typescript
cumulativeRent: language === 'es' ? 'Renta Acumulada' : 'Cumulative Rent',
breakdown: language === 'es' ? 'Desglose' : 'Breakdown',
```

---

## Expected Results

### Wealth Table After Fix

| Year | Value | Rent | Wealth | Hover shows... |
|------|-------|------|--------|----------------|
| 1 | AED 10.48M | — | AED 10.48M | 10.48M + 0 = 10.48M |
| 2 | AED 11.45M | — | AED 11.45M | 11.45M + 0 = 11.45M |
| 3 | AED 12.50M | — | AED 12.50M | 12.50M + 0 = 12.50M |
| 4 🔑 | AED 13.65M | AED 480K | AED 14.13M | 13.65M + 0.48M = 14.13M |
| 5 | AED 14.70M | AED 500K | AED 15.68M | 14.70M + 0.98M = 15.68M |

**Now Value + Cumulative Rent = Wealth** ✓

### Secondary Property Stability

| Action | Before | After |
|--------|--------|-------|
| Enter custom price | Value resets on re-render | Value persists |
| Tab away and back | Value might reset | Value stable |
| Quote updates | Overwrites user input | No effect |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/secondary/YearByYearWealthTable.tsx` | Fix wealth calculation consistency, add hover tooltips with breakdown |
| `src/pages/OffPlanVsSecondary.tsx` | Remove auto-initialization effect, remove unused state |

