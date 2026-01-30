

# Plan: Fix Year-by-Year Wealth Table Column Clarity

## Root Cause Analysis

### Issue 1: "Rent" Column Shows Wrong Metric
The table has a semantic mismatch:
- **Column header says**: "Rent"
- **Column displays**: Annual rent for that specific year (`secAnnualRent`)
- **Wealth formula uses**: Cumulative rent (`secCumulativeRent`)

**Example from screenshot:**
- Value: AED 9.60M
- Rent: AED 628K (this is Year 2's annual rent)
- Wealth: AED 10.52M

**Expected math**: 9.60M + 628K = 10.23M ≠ 10.52M

**Actual formula**: 10.52M = 9.60M + **cumulative rent** (which includes Year 1 + Year 2)

### Issue 2: Secondary Property Value Appreciation Starts at Year 1

In `useSecondaryCalculations.ts` line 108:
```typescript
const propertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, year);
```

For Year 1 with 8% appreciation: `7.5M * 1.08 = 8.1M`

So the table's "Value" column for secondary already shows appreciated values, not the purchase price, which is actually correct behavior but needs the rent column fix to make math visible.

---

## Solution: Change "Rent" Column to Show Cumulative Rent

Since **Wealth = Value + Cumulative Rent**, the table should display:
- **Value**: Current property value (appreciated)
- **Rent**: **Cumulative rent** up to that year (not annual)
- **Wealth**: Value + Cumulative Rent (now the math is visible!)

This way users can mentally verify: Value + Rent = Wealth ✓

---

## Technical Changes

### File: `src/components/roi/secondary/YearByYearWealthTable.tsx`

#### Change 1: Update column to show cumulative rent instead of annual rent

**Current code (lines 241-248):**
```typescript
{/* Off-Plan Rent */}
<TableCell className="text-right text-xs">
  {row.isBeforeHandover ? (
    <span className="text-theme-text-muted">{t.noRent}</span>
  ) : (
    <span className="text-theme-text">{formatSmallValue(row.offPlanRent)}</span>
  )}
</TableCell>
```

**Change to:**
```typescript
{/* Off-Plan Cumulative Rent */}
<TableCell className="text-right text-xs">
  {row.isBeforeHandover ? (
    <span className="text-theme-text-muted">{t.noRent}</span>
  ) : (
    <span className="text-theme-text">{formatSmallValue(row.offPlanCumulativeRent)}</span>
  )}
</TableCell>
```

**Similarly for secondary rent (lines 283-285):**
```typescript
{/* Secondary Cumulative Rent */}
<TableCell className="text-right text-xs text-theme-text">
  {formatSmallValue(row.secondaryCumulativeRent)}
</TableCell>
```

#### Change 2: Update column header for clarity

Update the translations to indicate cumulative nature:

```typescript
const t = language === 'es' ? {
  ...
  rent: 'Renta Acum.',  // Shortened for "Renta Acumulada"
  ...
} : {
  ...
  rent: 'Cumul. Rent',  // Shortened for "Cumulative Rent"
  ...
};
```

---

## Expected Result After Fix

| Year | Value | Cumul. Rent | Wealth |
|------|-------|-------------|--------|
| 1 | AED 8.10M | AED 481K | AED 8.58M |
| 2 | AED 8.75M | AED 990K | AED 9.74M |

**Now the math is visible**: 8.10M + 0.48M ≈ 8.58M ✓

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/secondary/YearByYearWealthTable.tsx` | Display cumulative rent instead of annual rent in the "Rent" column; update column header text |

