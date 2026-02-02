
# Plan: Fix Post-Handover Exit Scenarios Clamping Bug

## Problem Identified
When creating an exit scenario beyond the handover date (e.g., +3 years post-handover), the Exit Scenarios tab shows incorrect values - displaying the property value at handover instead of the correct post-handover value.

## Root Cause
In both `CashflowDashboard.tsx` and `OICalculator.tsx`, the `exitScenarios` useMemo hook incorrectly clamps exit months to a maximum of `totalMonths`:

```typescript
// Current (BUGGY) code in both files:
return saved
  .map((m: number) => Math.min(Math.max(1, m), calculations.totalMonths))  // <-- BUG!
  ...
```

This means an exit at `totalMonths + 36` (3 years post-handover) gets clamped to just `totalMonths`, causing the display to show handover values instead of the correct post-handover appreciated values.

## Solution
Update the clamping logic to allow exit scenarios up to 5 years (60 months) after handover, matching the configurator's limit:

```typescript
// Fixed code:
const maxExitMonth = calculations.totalMonths + 60; // Allow up to 5 years post-handover
return saved
  .map((m: number) => Math.min(Math.max(1, m), maxExitMonth))
  ...
```

## Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/pages/CashflowDashboard.tsx` | 208 | Change `calculations.totalMonths` to `calculations.totalMonths + 60` |
| `src/pages/OICalculator.tsx` | 352 | Change `calculations.totalMonths` to `calculations.totalMonths + 60` |

## Implementation Details

### 1. CashflowDashboard.tsx (lines 204-213)
```typescript
// Before:
const exitScenarios = useMemo(() => {
  const saved = inputs._exitScenarios;
  if (saved && Array.isArray(saved) && saved.length > 0) {
    return saved
      .map((m: number) => Math.min(Math.max(1, m), calculations.totalMonths))
      ...
  }
  ...
}, [inputs._exitScenarios, calculations.totalMonths]);

// After:
const exitScenarios = useMemo(() => {
  const saved = inputs._exitScenarios;
  const maxExitMonth = calculations.totalMonths + 60; // 5 years post-handover
  if (saved && Array.isArray(saved) && saved.length > 0) {
    return saved
      .map((m: number) => Math.min(Math.max(1, m), maxExitMonth))
      ...
  }
  ...
}, [inputs._exitScenarios, calculations.totalMonths]);
```

### 2. OICalculator.tsx (lines 348-357)
Same change as above.

## Testing
After the fix:
1. Create a quote with a handover date 36 months from booking
2. Add an exit scenario at +3 years post-handover (month 72)
3. Verify the Exit Scenarios tab shows the correct appreciated property value at month 72, not month 36
4. Verify the OIGrowthCurve chart extends to show the post-handover exit
5. Verify the exit card displays "Growth Phase" or "Mature Phase" label appropriately
