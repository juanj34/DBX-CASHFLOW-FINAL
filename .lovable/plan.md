
# Dual Currency Display & Year 5 Metrics for Comparison Tables

## Overview

This plan addresses two enhancements to the comparison view:

1. **Dual Currency Display**: When currency is changed from AED, show both AED (primary) and converted value (secondary) side-by-side instead of overwriting
2. **New Year 5 Metrics**: Add "Rent at Year 5" and "Property Value at Year 5" to the key metrics table

---

## Current Behavior

### Currency Display
Currently, the `ComparisonTable` uses a simple `fmt()` function that formats in the selected currency only:
```
const fmt = (v: number) => formatCurrency(v, currency, exchangeRate);
```

This overwrites values entirely when switching currency, losing the AED reference.

### Missing Metrics
The comparison table does not show Year 5 projections - it only shows current values and Year 1 rental income.

---

## Solution

### 1. Dual Currency Display Pattern

Use the existing `formatDualCurrency` utility (already used throughout the codebase) to show both currencies inline:

**Before:** `AED 890,000` → `$242,370` (when switching to USD)

**After:** `AED 890,000 ($242K)` (always shows AED as reference)

This follows the established pattern from the memory notes:
> "Dual Currency Display: AED 10,000 ($2,700)" format for international clarity

### 2. Year 5 Metrics Calculation

Derive from the existing `yearlyProjections` array in `OICalculations`:

**Property Value (Year 5):**
- Find the projection at Year 5 (index 5 in the yearlyProjections array, accounting for booking year as Year 0)
- This already includes phased appreciation (Construction → Growth → Mature)

**Rent at Year 5:**
- Find the projection at Year 5
- Use `annualRent` from that projection (already includes rent growth compounding)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/compare/ComparisonTable.tsx` | Add dual currency formatting + Year 5 metrics rows |
| `src/components/roi/compare/MetricsTable.tsx` | Add dual currency formatting + Year 5 metrics rows |
| `src/components/portal/CompareSection.tsx` | Add dual currency formatting + Year 5 metrics rows |

---

## Implementation Details

### ComparisonTable.tsx Changes

**1. Update formatting helper:**
```typescript
// Replace simple fmt() with dual currency formatter
const getDualValue = (value: number): { primary: string; secondary: string | null } => {
  const dual = formatDualCurrency(value, currency, exchangeRate);
  return dual;
};

// For inline display
const formatWithDual = (value: number): React.ReactNode => {
  const { primary, secondary } = getDualValue(value);
  if (!secondary) return primary;
  return (
    <span>
      {primary}
      <span className="text-theme-text-muted text-xs ml-1">({secondary})</span>
    </span>
  );
};
```

**2. Update all monetary value cells:**
- Property Value row
- Price/sqft row
- Rental Income row
- Pre-Handover row
- Post-Handover row
- Rent Coverage row

**3. Add new Year 5 metrics rows:**
```typescript
// After Rental Income row

{/* Rent at Year 5 */}
<DataRow
  label="Rent (Year 5)"
  values={orderedQuotes.map(q => {
    // Find Year 5 projection (booking year + 5)
    const year5Proj = q.calculations.yearlyProjections.find(
      p => p.year === 5 && !p.isConstruction
    );
    const rentY5 = year5Proj?.annualRent || null;
    return { value: rentY5 ? formatWithDual(rentY5) : '—' };
  })}
/>

{/* Value at Year 5 */}
<DataRow
  label="Value (Year 5)"
  values={orderedQuotes.map(q => {
    const year5Proj = q.calculations.yearlyProjections[5];
    const valueY5 = year5Proj?.propertyValue || null;
    return { value: valueY5 ? formatWithDual(valueY5) : '—' };
  })}
/>
```

### MetricsTable.tsx Changes

Same pattern - update all monetary cells to use dual currency format and add Year 5 rows.

### CompareSection.tsx (Portal) Changes

Update the portal comparison table to match - this component has its own simple formatting function that needs updating to use `formatDualCurrency`.

---

## Visual Result

### Metrics Table (After)

| Metric | Property A | Property B |
|--------|------------|------------|
| Property Value | AED 890,000 ($242K) | AED 998,195 ($272K) |
| Price/sqft | AED 1,413 ($385) | AED 1,103 ($300) |
| Rental Income | AED 71,200 (8%) | AED 89,838 (9%) |
| **Rent (Year 5)** | **AED 83,200 ($22.6K)** | **AED 104,900 ($28.5K)** |
| **Value (Year 5)** | **AED 1.2M ($327K)** | **AED 1.35M ($368K)** |
| Handover | Q1 2028 (2y) | Q2 2028 (2y 3m) |
| Pre-Handover | AED 218,600 ($59K) | AED 344,386 ($94K) |

---

## Technical Notes

### Year 5 Projection Logic

The `yearlyProjections` array is indexed from Year 1:
- `yearlyProjections[0]` = Year 1 (booking year)
- `yearlyProjections[4]` = Year 5

However, for properties still in construction, Year 5 from booking might still be in construction phase. The display will correctly show "—" if no rent data exists for that year.

For accuracy, Year 5 is calculated as:
- **5 years from booking date** (consistent with the growth curve chart)
- If handover is in Year 2, then Year 5 = 3rd full year of rental income

### Currency Reference Pattern

Following the established memory pattern for inline display:
> "AED 10,000 ($2,700)" format optimizes vertical space in lists and cards

The secondary currency appears in parentheses with smaller, muted text.

---

## Testing Checklist

After implementation:
- [ ] Switch currency to USD/EUR and verify both values appear
- [ ] Verify AED shows alone when currency is set to AED
- [ ] Rent (Year 5) shows correct grown rent value
- [ ] Value (Year 5) matches the projection chart
- [ ] Portal comparison section also shows dual currency
- [ ] All three comparison contexts work (QuotesCompare, CompareView, PresentationPreview)
