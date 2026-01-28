
# Plan: Fix Quote Duplication When Creating New Quote

## Problem Summary

When you're editing an existing quote and click "New Quote", the app navigates to `/cashflow-generator` but **does NOT reset the component state**. The React state (`inputs`, `clientInfo`, `mortgageInputs`) still contains data from the previous quote.

Since `isQuoteConfigured` evaluates to `true` (because the state still has `clientInfo.developer`, `inputs.basePrice`, etc.), the auto-save logic thinks this is meaningful user input and **immediately creates a new quote with the old data** - causing the duplication.

## Root Cause

- `useState(NEW_QUOTE_OI_INPUTS)` only sets the initial value on **first mount**
- When navigating from `/cashflow/:id` to `/cashflow-generator`, the `OICalculatorContent` component **does not remount** - it just re-renders with the URL change
- The stale state triggers auto-save, duplicating the quote

## Solution

**Reset ALL state explicitly when navigating to `/cashflow-generator` (no quoteId).**

We need to detect when the route changes from having a `quoteId` to not having one, and **forcefully reset** all the component state to fresh defaults.

## Technical Changes

### File: `src/pages/OICalculator.tsx`

**Change 1:** Add a `useEffect` that resets state when `quoteId` becomes undefined (new quote mode)

```tsx
// Around line 194, where setDataLoaded(false) is triggered on quoteId change

// Reset ALL state when starting a new quote (no quoteId)
useEffect(() => {
  if (!quoteId) {
    // Clear all state to fresh defaults for a brand new quote
    setInputs(NEW_QUOTE_OI_INPUTS);
    setClientInfo(DEFAULT_CLIENT_INFO);
    setMortgageInputs(DEFAULT_MORTGAGE_INPUTS);
    setQuoteImages({
      floorPlanUrl: null,
      buildingRenderUrl: null,
      heroImageUrl: null,
      showLogoOverlay: true,
    });
    setViewMode('cashflow');
    setShareUrl(null);
    setDataLoaded(false);
  }
}, [quoteId]);
```

**Change 2:** Update the existing `useEffect` that resets `dataLoaded` to be more comprehensive

Current code (line 194):
```tsx
useEffect(() => { setDataLoaded(false); }, [quoteId]);
```

This will be replaced/merged with the new comprehensive reset effect above.

**Change 3:** Add a guard to the auto-save effect to skip when state is being reset

The auto-save effect (lines 227-244) currently triggers immediately when state appears "configured". We should add an additional condition:

```tsx
// Only allow auto-create after component has stabilized
// (prevents duplicates during navigation/reset)
const isStableForAutoCreate = !quoteId && isQuoteConfigured && dataLoaded === false;
```

Wait - actually the better solution is: **don't set `dataLoaded` to `true` for new quotes until user actually makes a change**. Let me reconsider:

**Refined Solution:**

The `dataLoaded` flag tracks whether we've loaded data from the database. For new quotes (no `quoteId`), this should immediately be `true` because there's nothing to load - but we need to ensure state is fresh first.

The key fix: When `quoteId` becomes undefined, reset state AND **temporarily prevent auto-save** by not marking as configured until user actually interacts.

## Final Approach

**File: `src/pages/OICalculator.tsx`**

1. Track previous quoteId to detect navigation from existing quote to new quote:

```tsx
const prevQuoteIdRef = useRef<string | undefined>(quoteId);

useEffect(() => {
  const wasExistingQuote = !!prevQuoteIdRef.current;
  const isNowNewQuote = !quoteId;
  
  if (wasExistingQuote && isNowNewQuote) {
    // User navigated from an existing quote to new quote mode
    // Reset ALL state to fresh defaults
    console.log('Resetting state for new quote');
    setInputs(NEW_QUOTE_OI_INPUTS);
    setClientInfo(DEFAULT_CLIENT_INFO);
    setMortgageInputs(DEFAULT_MORTGAGE_INPUTS);
    setQuoteImages({
      floorPlanUrl: null,
      buildingRenderUrl: null,
      heroImageUrl: null,
      showLogoOverlay: true,
    });
    setViewMode('cashflow');
    setShareUrl(null);
    setDataLoaded(false);
  }
  
  prevQuoteIdRef.current = quoteId;
}, [quoteId]);
```

2. Update `dataLoaded` reset to work correctly with new quotes:

For new quotes (no `quoteId`), set `dataLoaded` to `true` **after** the reset occurs, so that:
- State is definitely fresh defaults
- Auto-save only triggers when user actually configures something

```tsx
// After resetting state for new quote, mark as "loaded" so UI shows
useEffect(() => {
  if (!quoteId && !quoteLoading) {
    // For new quotes with no data to load, immediately mark as ready
    // BUT only if we've already reset the state (checked via inputs.basePrice being default)
    if (inputs.basePrice === NEW_QUOTE_OI_INPUTS.basePrice && !clientInfo.developer) {
      setDataLoaded(true);
    }
  }
}, [quoteId, quoteLoading, inputs.basePrice, clientInfo.developer]);
```

Actually, this is getting complex. Let me simplify:

## Simplified Fix

Just reset state when quoteId disappears, and ensure `dataLoaded` is managed correctly:

```tsx
// Track if we just reset state (to prevent immediate auto-save)
const justResetRef = useRef(false);

// Reset state when navigating to new quote
useEffect(() => {
  if (!quoteId) {
    // Reset all state for fresh start
    setInputs(NEW_QUOTE_OI_INPUTS);
    setClientInfo(DEFAULT_CLIENT_INFO);
    setMortgageInputs(DEFAULT_MORTGAGE_INPUTS);
    setQuoteImages({
      floorPlanUrl: null,
      buildingRenderUrl: null,
      heroImageUrl: null,
      showLogoOverlay: true,
    });
    setShareUrl(null);
    setDataLoaded(true); // Ready immediately for new quotes
    justResetRef.current = true;
    // Clear the flag after a tick to allow normal operation
    setTimeout(() => { justResetRef.current = false; }, 100);
  } else {
    setDataLoaded(false); // Will load from DB
  }
}, [quoteId]);

// In auto-save effect, add guard:
useEffect(() => {
  if (!dataLoaded) return;
  if (quoteLoading) return;
  if (justResetRef.current) return; // Skip auto-save immediately after reset
  // ... rest of auto-save logic
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/OICalculator.tsx` | Add state reset when `quoteId` becomes undefined; add guard to prevent auto-save immediately after reset |

## Expected Behavior After Fix

1. User is on `/cashflow/abc123` editing a quote
2. User clicks "New Quote"
3. App navigates to `/cashflow-generator`
4. **New behavior:** State resets to `NEW_QUOTE_OI_INPUTS`, `DEFAULT_CLIENT_INFO`, etc.
5. `isQuoteConfigured` evaluates to `false` (no developer, no projectName, basePrice is default but no quoteId)
6. Auto-save does NOT trigger
7. User sees a fresh, empty configurator
8. When user enters data, auto-save creates a genuinely new quote

## Verification

- Navigate from existing quote to "New Quote" - should show fresh form
- The old quote should NOT be duplicated
- Auto-save should only create a new quote when user actually configures something
