
# Plan: Fix Selection Bug and Increase Limit to 6 in CreateComparisonModal

## Problem Analysis

Two issues identified in `CreateComparisonModal.tsx`:

1. **Selection Bug**: The `useEffect` on line 46-52 has `initialQuoteIds` as a dependency. Since the default value `initialQuoteIds = []` creates a new array reference on each render, the effect fires repeatedly and resets `selectedQuoteIds` to empty, preventing any selections.

2. **Limit Issue**: `maxQuotes` is still set to 4 (line 54), should be 6.

---

## Solution

**File: `src/components/presentation/CreateComparisonModal.tsx`**

### Change 1: Increase maxQuotes (line 54)
```tsx
// Before
const maxQuotes = 4;

// After
const maxQuotes = 6;
```

### Change 2: Fix useEffect to only reset on modal open transition (lines 45-52)

Add a ref to track the previous open state and only reset when modal opens (transitions from closed to open):

```tsx
import { useState, useMemo, useEffect, useRef } from "react";

// Inside component:
const prevOpenRef = useRef(false);

useEffect(() => {
  // Only reset when modal opens (transitions from closed to open)
  if (open && !prevOpenRef.current) {
    setSelectedQuoteIds(initialQuoteIds);
    setTitle(initialTitle);
    setSearch("");
  }
  prevOpenRef.current = open;
}, [open, initialQuoteIds, initialTitle]);
```

This ensures selections are only reset when the modal first opens, not on every parent re-render.

---

## Summary

| Location | Change |
|----------|--------|
| Line 1 | Add `useRef` to imports |
| Line 45-52 | Add `prevOpenRef` and update useEffect logic to only reset on open transition |
| Line 54 | Change `maxQuotes = 4` → `maxQuotes = 6` |

---

## Expected Result

- Users can select up to 6 quotes for comparison
- Selections persist while the modal is open (no more reset on every click)
- Modal text updates to "Select 2-6 quotes to compare"
