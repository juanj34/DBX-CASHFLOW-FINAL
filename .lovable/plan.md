
# Plan: Fixes for Snapshot Card Overflow, Quote Loading Lag, and AI Extractor Missing 10% Completion

## Summary of Issues

Based on your screenshot and the PDF document:

1. **Card Number Overflow** - Values in the POST-HANDOVER COVERAGE card are being cut off (e.g., "AED 8..." instead of full amounts)
2. **Quote Loading Lag** - "Load Quotes" modal sometimes experiences long delays with quotes not loading
3. **AI Extractor Missing 10% Completion** - The PDF shows a clear "At the Handover - 40%" payment but the AI is not extracting it correctly

---

## Issue 1: Card Number Overflow Fix

### Root Cause
The `CompactPostHandoverCard.tsx` and `DottedRow.tsx` components don't handle long currency values properly when dual currency is enabled. The card has `min-w-0` but the parent containers aren't constraining overflow.

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/DottedRow.tsx` | Add `overflow-hidden` and proper `text-right` alignment to value container |
| `src/components/roi/snapshot/CompactPostHandoverCard.tsx` | Add `min-w-0` to parent containers, constrain card width |
| `src/components/roi/snapshot/CompactRentCard.tsx` | Same overflow fixes |
| `src/components/roi/snapshot/CompactAllExitsCard.tsx` | Add `text-right` and `whitespace-nowrap` to prevent wrapping |

### Specific Changes

**DottedRow.tsx:**
```typescript
// Current: value container can overflow
<span 
  className={cn(
    'font-mono tabular-nums text-theme-text text-sm min-w-0',
    ...
  )}
>
  <span className="truncate">{value}</span>
  ...
</span>

// Fixed: proper overflow handling
<span 
  className={cn(
    'font-mono tabular-nums text-theme-text text-sm shrink-0 text-right whitespace-nowrap',
    ...
  )}
>
  {value}
  ...
</span>
```

**CompactPostHandoverCard.tsx:**
```typescript
// Add min-w-0 to inner content container to allow text truncation
<div className="p-3 space-y-1.5 min-w-0 overflow-hidden">
```

---

## Issue 2: Quote Loading Lag Fix

### Root Cause
The `useQuotesList` hook in `useCashflowQuote.ts` (line 521-533) doesn't have:
1. A `.limit()` clause to prevent loading too many quotes
2. Error handling / timeout protection
3. A try-catch block

This causes issues when users have many quotes or network is slow.

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCashflowQuote.ts` | Add `.limit(150)`, try-catch, timeout handling |
| `src/components/roi/compare/QuoteSelector.tsx` | Add loading states with timeout fallback |

### Specific Changes

**useCashflowQuote.ts - useQuotesList (line 513-540):**
```typescript
const fetchQuotes = useCallback(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setLoading(false);
    return;
  }

  setLoading(true);
  
  try {
    const { data, error } = await supabase
      .from('cashflow_quotes')
      .select(`
        id, broker_id, share_token, client_name, client_country, client_email,
        project_name, developer, unit, unit_type, unit_size_sqf, unit_size_m2,
        inputs, title, created_at, updated_at, status, status_changed_at,
        presented_at, negotiation_started_at, sold_at, view_count, first_viewed_at,
        is_archived, archived_at, last_viewed_at
      `)
      .eq('broker_id', user.id)
      .neq('status', 'working_draft')
      .or('is_archived.is.null,is_archived.eq.false')
      .order('updated_at', { ascending: false })
      .limit(150); // ADD LIMIT

    if (!error && data) {
      setQuotes(data.map(q => ({ ...q, inputs: q.inputs as unknown as OIInputs })));
      setLastFetched(new Date());
    } else if (error) {
      console.error('Failed to fetch quotes:', error);
    }
  } catch (err) {
    console.error('Failed to fetch quotes:', err);
  } finally {
    setLoading(false);
  }
}, []);
```

---

## Issue 3: AI Extractor Missing 10% Completion Payment

### Analysis of the PDF

The PDF shows this payment schedule:
```text
| Payment Type                 | Amount    | Date        |
| Booking Amount (Today) - 10% | 78,497.00 | 29-Jan-2026 |
| First Installment - 10%      | 78,497.00 | 01-Mar-2026 |
| 2nd Installment - 10%        | 78,497.00 | 01-May-2026 |
| 3rd Installment - 10%        | 78,497.00 | 01-Jul-2026 |
| 4th Installment - 10%        | 78,497.00 | 01-Sep-2026 |
| 5th Installment - 10%        | 78,497.00 | 01-Nov-2026 |
| At the Handover - 40%        | 313,986.00| 30-Dec-2026 |
```

**Total: 60% before handover + 40% on handover = 100%**

This is a **60/40 standard plan** (no post-handover). The issue is that the AI extractor may be:
1. Missing the "At the Handover - 40%" payment from page 2
2. Not correctly calculating that handover happens at Dec-2026 (11 months from booking)

### Root Cause
The system prompt in the edge function mentions "completion" keywords but the PDF says "At the Handover" which should also trigger handover detection.

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/extract-payment-plan/index.ts` | Enhance handover detection keywords to include "At the Handover", "On Handover", "Upon Handover" |

### Specific Changes

**extract-payment-plan/index.ts - System Prompt Enhancement (around line 66-71):**

Current prompt mentions "Completion" detection. Need to add explicit "At the Handover" pattern:

```typescript
// Add to HANDOVER MONTH DETECTION section
=== HANDOVER PAYMENT DETECTION ===
- Look for these patterns to identify the handover/completion payment:
  - "At the Handover" / "On Handover" / "Upon Handover"
  - "Completion" / "On Completion" / "At Completion"
  - "Final Payment" / "Balance Payment"
  - "Handover Payment"
- This payment should have type: "handover"
- Calculate handoverMonthFromBooking from the date if provided (e.g., "30-Dec-2026" with booking Jan 2026 = 12 months)
```

**Add explicit date parsing guidance:**
```typescript
=== DATE PARSING FROM PAYMENT SCHEDULE ===
- When you see explicit dates like "01-Mar-2026", "30-Dec-2026":
  - Calculate months from the booking date (e.g., Jan 2026)
  - "01-Mar-2026" from "29-Jan-2026" = 2 months
  - "30-Dec-2026" from "29-Jan-2026" = 11 months
- The "At the Handover" or "Completion" payment defines handoverMonthFromBooking
```

**Also update the extractionTool description** to include "At the Handover" as a recognized label pattern.

---

## Files Summary

| File | Issue | Change Type |
|------|-------|-------------|
| `src/components/roi/snapshot/DottedRow.tsx` | Overflow | Fix value alignment and prevent overflow |
| `src/components/roi/snapshot/CompactPostHandoverCard.tsx` | Overflow | Add min-w-0 to containers |
| `src/components/roi/snapshot/CompactRentCard.tsx` | Overflow | Add min-w-0 to containers |
| `src/hooks/useCashflowQuote.ts` | Loading Lag | Add .limit(150), try-catch, error handling |
| `supabase/functions/extract-payment-plan/index.ts` | AI Extraction | Enhance handover keyword detection, add date parsing guidance |

---

## Expected Results

1. **Card Overflow**: Numbers like "AED 8,500" will display fully without being cut off
2. **Loading Lag**: Quotes will load faster with the 150 limit and won't hang on network issues
3. **AI Extraction**: The "At the Handover - 40%" payment will be correctly extracted and the handoverMonthFromBooking will be set to 11 (or 12 depending on exact calculation)

---

## Testing Notes

After implementation:
1. Test the POST-HANDOVER COVERAGE card with dual currency enabled to verify numbers don't overflow
2. Test Load Quotes with many quotes to verify it loads quickly
3. Re-upload the XENIA PDF and verify all 7 payments are extracted correctly (6 installments + handover = 100%)
