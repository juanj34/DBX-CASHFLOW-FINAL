
# Plan: Fix Snapshot Overview Cards - Missing Translation & Metric Clarity

## Issues Identified

### 1. Missing Translation Key "yieldShort"
**Problem**: In `SnapshotOverviewCards.tsx`, the text `{netYieldPercent.toFixed(1)}% {t('yieldShort')}` displays "8.6% yieldShort" literally because the translation key doesn't exist.

**Solution**: Add the missing translation key and clarify that this is the "Net Yield" (already calculated from net rent / base price).

### 2. Breakeven Already Uses Rent Growth ✅
After reviewing the code, the breakeven calculation in `useOICalculations.ts` already uses the `calculateYearsWithGrowth` function which applies the geometric series formula to account for compounding annual rent growth. No changes needed here.

---

## Technical Changes

### File 1: `src/contexts/LanguageContext.tsx`
Add the missing translation key after line 41:

| Line | Change |
|------|--------|
| ~41 | Add `yieldShort: { en: 'yield', es: 'rend.' }` after `yearShort` |

```typescript
moShort: { en: 'mo', es: 'mes' },
yearShort: { en: 'yr', es: 'año' },
yieldShort: { en: 'yield', es: 'rend.' },  // NEW
```

### File 2: `src/components/roi/snapshot/SnapshotOverviewCards.tsx` (Optional Enhancement)
Consider improving clarity by making the yield label more descriptive:

**Current (line 113):**
```typescript
<span className="text-[10px] text-theme-text-muted">
  {monthlyRentDual.primary}/{t('moShort')} • {netYieldPercent.toFixed(1)}% {t('yieldShort')}
</span>
```

**Improved option:**
```typescript
<span className="text-[10px] text-theme-text-muted">
  {monthlyRentDual.primary}/{t('moShort')} • {netYieldPercent.toFixed(1)}% {t('netLabel')} {t('yieldShort')}
</span>
```

This would show "8.6% Net yield" instead of just "8.6% yield" - making it clear this is the net yield (after service charges), not gross.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/LanguageContext.tsx` | Add `yieldShort` translation key |
| `src/components/roi/snapshot/SnapshotOverviewCards.tsx` | Optionally clarify with "Net yield" label |
| `src/components/roi/export/ExportOverviewCards.tsx` | Mirror the same label fix for exports |

---

## Visual Result

**Before:**
```
AED 158,000/yr
AED 13,166/mo • 8.6% yieldShort   ← confusing literal text
```

**After:**
```
AED 158,000/yr
AED 13,166/mo • 8.6% net yield   ← clear and descriptive
```

---

## Breakeven Note (No Changes Required)

The breakeven card already uses the correct formula with rent growth:
- Uses `calculateYearsWithGrowth(basePrice, netAnnualRent, inputs.rentGrowthRate)`
- Formula: `Years = ln(1 + (Principal × g) / Rent) / ln(1 + g)`
- This correctly reduces the payback period when rent growth is configured

The badge showing the net yield % next to the breakeven time is informative - it helps users understand the relationship between yield and payback period.
