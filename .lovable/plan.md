
# Plan: Fix Handover Quarter Highlighting for Payments

## Current State

The code already has logic to highlight payments in the handover quarter (lines 283-307 in `CompactPaymentTable.tsx`), but it may not be working correctly because:

1. **The `isPaymentInHandoverQuarter` function** checks if a payment's calendar month falls within the handover quarter (e.g., Q4 2027 = Oct-Dec 2027)
2. **The highlighting** applies a green background (`bg-green-500/10`) and shows a "🔑 Handover" badge

The issue is that the current logic only highlights payments that fall **exactly within** the 3 months of the handover quarter. If handover is Q4 2027, it highlights payments in Oct, Nov, Dec 2027.

## Solution

The existing highlighting logic is correct, but we should verify it's working and make the visual indicator more prominent so users can clearly see which payments coincide with the handover period.

---

## Technical Changes

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

#### 1. Enhance Visual Highlighting (Lines 292-315)

Make the handover quarter highlighting more visible:

**Current styling:**
```tsx
className={cn(
  "flex items-center justify-between gap-2",
  isHandoverQuarter && "bg-green-500/10 rounded px-1 py-0.5 -mx-1"
)}
```

**Enhanced styling with left border indicator:**
```tsx
className={cn(
  "flex items-center justify-between gap-2",
  isHandoverQuarter && "bg-green-500/10 rounded px-1 py-0.5 -mx-1 border-l-2 border-green-400"
)}
```

#### 2. Show Handover Quarter Range in Header (Lines 208-213)

Add a clearer indicator of which quarter is the handover period:

**Current:**
```tsx
<span>Q{handoverQuarter} {handoverYear}</span>
```

**Enhanced with month range:**
```tsx
// Calculate quarter month names (e.g., Q4 = "Oct-Dec")
const getQuarterMonths = (quarter: number): string => {
  const quarterMonths = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
  return quarterMonths[quarter - 1];
};

<span>Q{handoverQuarter} ({getQuarterMonths(handoverQuarter)}) {handoverYear}</span>
```

This shows: `Q4 (Oct-Dec) 2027` instead of just `Q4 2027`

---

## Visual Result

### Before:
```
THE JOURNEY (51mo)
Month 1 (Feb 2026)         AED 12,284 (2,886 €)
Month 2 (Mar 2026)         AED 12,284 (2,886 €)
...
Month 17 (Jun 2027)        AED 12,284 (2,886 €)   ← No indication this is handover quarter
```

### After:
```
PAYMENT BREAKDOWN                    Feb 2025 → Q4 (Oct-Dec) 2027

THE JOURNEY (51mo)
Month 1 (Feb 2026)         AED 12,284 (2,886 €)
Month 2 (Mar 2026)         AED 12,284 (2,886 €)
...
▌Month 16 (May 2027)       AED 12,284 (2,886 €)  🔑 Handover  ← Green highlight + border
▌Month 17 (Jun 2027)       AED 12,284 (2,886 €)  🔑 Handover  ← Green highlight + border
```

---

## Files to Modify

| File | Changes |
|------|--------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | 1. Add left border to handover quarter rows for stronger visual<br>2. Add helper function to show quarter month names<br>3. Update header to show month range (e.g., "Oct-Dec") |

---

## Benefits

1. **Clear handover indication** - Green left border + background + badge makes it unmistakable
2. **Quarter context** - Header shows "Q4 (Oct-Dec) 2027" so users know which months to expect
3. **No confusion** - Users can immediately see when the handover is happening in the payment timeline
