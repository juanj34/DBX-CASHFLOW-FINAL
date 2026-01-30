
# Fix Off-Plan vs Secondary Auto-Save + Theme Consistency

## Problem Summary

### Issue 1: Auto-Save Stuck on "Saving..."
The auto-save feature is experiencing a race condition that causes the "Saving..." indicator to get stuck:

1. **Root Cause**: The `useEffect` for auto-save (lines 141-174 in `OffPlanVsSecondary.tsx`) triggers immediately when a comparison is loaded via `handleLoadComparison`, because loading sets `currentComparisonId` and `hasConfigured` to true, which then triggers the effect with the loaded `secondaryInputs`.

2. **The Problem Flow**:
   - User loads a saved comparison
   - `handleLoadComparison` sets all state values including `currentComparisonId` and `hasConfigured`
   - This triggers the auto-save `useEffect` 
   - `setSaveStatus('saving')` is called immediately
   - The debounced update runs, but if any state change happens in between, the timeout gets cleared and restarted, causing an infinite "Saving..." state

3. **Database Confirms Saves Work**: The database shows `updated_at: 2026-01-30 12:49:01` - data IS being saved, but the UI status doesn't reflect completion properly.

### Issue 2: Theme Colors Hardcoded
Many components use hardcoded dark-theme colors (e.g., `bg-[#1a1f2e]`, `text-white`) instead of theme tokens, causing visibility issues in light themes.

---

## Solution Plan

### Part 1: Fix Auto-Save Logic

#### 1.1 Add Initial Load Guard
Prevent auto-save from triggering on initial data load:

```tsx
// Add a ref to track if we're in initial load
const isInitialLoadRef = useRef(true);
const lastSavedDataRef = useRef<string>('');

// In handleLoadComparison - mark as initial load
const handleLoadComparison = (comparison: SecondaryComparison) => {
  isInitialLoadRef.current = true;
  // ... set all state
  // Store initial data fingerprint
  lastSavedDataRef.current = JSON.stringify({
    secondary_inputs: comparison.secondary_inputs,
    exit_months: comparison.exit_months,
    rental_mode: comparison.rental_mode,
    quote_id: comparison.quote_id,
  });
};
```

#### 1.2 Update Auto-Save Effect
Only trigger saves when data actually changes from the last saved state:

```tsx
useEffect(() => {
  if (!currentComparisonId || !hasConfigured) return;
  
  // Skip initial load
  if (isInitialLoadRef.current) {
    isInitialLoadRef.current = false;
    setSaveStatus('idle');
    return;
  }
  
  // Create data fingerprint
  const currentData = JSON.stringify({
    secondary_inputs: secondaryInputs,
    exit_months: exitMonths,
    rental_mode: rentalMode,
    quote_id: selectedQuoteId || null,
  });
  
  // Skip if no actual change
  if (currentData === lastSavedDataRef.current) {
    return;
  }
  
  // ... rest of debounced save logic
  // After successful save: lastSavedDataRef.current = currentData;
}, [/* deps */]);
```

#### 1.3 Ensure Status Updates Correctly
Add error handling to set status to 'idle' on failure:

```tsx
saveTimeoutRef.current = setTimeout(async () => {
  const success = await updateComparison(/*...*/);
  if (success) {
    lastSavedDataRef.current = currentData;
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  } else {
    setSaveStatus('idle'); // Reset on failure
  }
}, 1500);
```

### Part 2: Fix Theme Colors

Replace hardcoded colors with theme tokens in these files:

| File | Changes |
|------|---------|
| `MobileConfiguratorSheet.tsx` | ~30 replacements: `bg-[#0d1117]` → `bg-theme-bg-alt`, `border-[#2a3142]` → `border-theme-border`, `text-[#CCFF00]` → `text-theme-accent` |
| `PaymentSection.tsx` | ~25 replacements for step indicators, buttons, inputs |
| `AppreciationSection.tsx` | ~20 replacements in profile cards and chart container |
| `RentSection.tsx` | Similar patterns to PaymentSection |
| `ExitsSection.tsx` | Similar patterns |
| `ValueSection.tsx` | Similar patterns |
| `ZoneInfoCard.tsx` | ~12 replacements in info card |
| `LayerToggle.tsx` | ~10 replacements in toggle panel |
| `OIYearlyProjectionTable.tsx` | ~15 replacements in table headers, rows, badges |
| `ProfileSelector.tsx` | ~10 replacements in profile buttons |
| `RecommendationBadge.tsx` | ~8 replacements in score display |
| `RecommendationSummary.tsx` | ~5 replacements in insight cards |

#### Token Mapping:
| Hardcoded | Theme Token |
|-----------|-------------|
| `bg-[#0d1117]` | `bg-theme-bg-alt` |
| `bg-[#1a1f2e]` | `bg-theme-card` |
| `bg-[#2a3142]` | `bg-theme-card-alt` |
| `border-[#2a3142]` | `border-theme-border` |
| `text-white` | `text-theme-text` |
| `text-gray-300` | `text-theme-text` |
| `text-gray-400` | `text-theme-text-muted` |
| `text-[#CCFF00]` | `text-theme-accent` |
| `bg-[#CCFF00]` | `bg-theme-accent` |

#### Colors to Keep (semantic meaning):
- `text-green-400/500` - success states
- `text-red-400/500` - error states  
- `text-amber-400/500` - warning states
- `text-blue-400`, `text-cyan-400` - data visualization

---

## Files to Modify

1. `src/pages/OffPlanVsSecondary.tsx` - Fix auto-save logic
2. `src/components/roi/configurator/MobileConfiguratorSheet.tsx` - Theme tokens
3. `src/components/roi/configurator/PaymentSection.tsx` - Theme tokens
4. `src/components/roi/configurator/AppreciationSection.tsx` - Theme tokens
5. `src/components/roi/configurator/RentSection.tsx` - Theme tokens
6. `src/components/roi/configurator/ExitsSection.tsx` - Theme tokens
7. `src/components/roi/configurator/ValueSection.tsx` - Theme tokens
8. `src/components/map/ZoneInfoCard.tsx` - Theme tokens
9. `src/components/map/LayerToggle.tsx` - Theme tokens
10. `src/components/roi/OIYearlyProjectionTable.tsx` - Theme tokens
11. `src/components/roi/compare/ProfileSelector.tsx` - Theme tokens
12. `src/components/roi/compare/RecommendationBadge.tsx` - Theme tokens
13. `src/components/roi/compare/RecommendationSummary.tsx` - Theme tokens

---

## Database Confirmation

The `secondary_comparisons` table exists and is working correctly:
- Records are being created and updated (verified via database query)
- RLS policies are properly configured for broker access
- The issue is purely in the frontend state management, not the database

---

## Testing Checklist

After implementation:
- [ ] Load an existing comparison - should show "Auto-save" (idle) immediately
- [ ] Modify secondary inputs - should show "Saving..." then "Saved"
- [ ] Verify database updates with new timestamps
- [ ] Test all views in light themes (Consultant, Dark Consultant)
- [ ] Verify dropdowns, inputs, and cards are visible in all themes
