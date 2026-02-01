

# Fix AI Payment Plan Extraction & Auto-Save Logic

## Issues Identified

### Issue 1: Inconsistent Handover Payment Handling
**PaymentSection.tsx** correctly excludes the handover payment from `additionalPayments` (lines 339-344), but **ClientSection.tsx** includes it (lines 241-248). This causes:
- Double-counting when extraction happens from ClientSection
- Totals exceeding 100% in some flows

### Issue 2: Construction Milestone Sorting Bug
Both files sort installments by `triggerValue` directly:
```typescript
.sort((a, b) => a.triggerValue - b.triggerValue)
```

But `triggerValue` means different things:
- **`type: 'time'`** → months from booking (e.g., 6, 12, 18)
- **`type: 'construction'`** → completion percentage (e.g., 30, 50, 70)
- **`type: 'handover'`** → month number (e.g., 27)

This causes "30% Construction" to appear AFTER "Month 27" because 30 > 27.

### Issue 3: Save Logic Race Conditions
The `scheduleAutoSave` function has potential issues:
1. No check for `quote?.id` matching `existingQuoteId` before saving in the lazy creation path
2. The 500ms debounce for new quotes can still race with state updates

## Solution

### Part 1: Unify Handover Handling in ClientSection.tsx

Make ClientSection.tsx match PaymentSection.tsx by excluding handover payments:

```typescript
// In ClientSection.tsx handleAIExtraction (around line 243-248)
.filter(i => {
  // Skip downpayment (Month 0) - handled by downpaymentPercent
  if (i.type === 'time' && i.triggerValue === 0) return false;
  
  // CRITICAL: Skip handover payment - it's handled by onHandoverPercent
  if (i.type === 'handover') {
    console.log('Excluding handover payment from installments:', i.paymentPercent, '%');
    return false;
  }
  
  return true;
})
```

### Part 2: Fix Construction Milestone Sorting

Create a type-aware sorting function that converts construction percentages to estimated months:

```typescript
// Helper function - add before the sort
const getEstimatedMonth = (payment: ExtractedInstallment, totalMonths: number): number => {
  switch (payment.type) {
    case 'time':
      return payment.triggerValue; // Already in months
    case 'construction':
      // Convert construction % to estimated month
      // e.g., 30% complete ≈ 30% of totalMonths
      return Math.round((payment.triggerValue / 100) * totalMonths);
    case 'handover':
      return totalMonths; // Handover is at the end
    case 'post-handover':
      return totalMonths + payment.triggerValue; // After handover
    default:
      return payment.triggerValue;
  }
};

// Use handover months from extraction for sorting
const sortingTotalMonths = data.paymentStructure.handoverMonthFromBooking || 36;

.sort((a, b) => {
  const aMonth = getEstimatedMonth(a, sortingTotalMonths);
  const bMonth = getEstimatedMonth(b, sortingTotalMonths);
  return aMonth - bMonth;
})
```

### Part 3: Improve Save Logic Safety

Add additional guards in `scheduleAutoSave` to prevent race conditions:

```typescript
// In useCashflowQuote.ts scheduleAutoSave
if (!existingQuoteId && isQuoteConfigured) {
  autoSaveTimeout.current = setTimeout(async () => {
    // Double-check we still don't have a quote ID (could have been created by another path)
    if (existingQuoteId) {
      console.log('Quote already exists, skipping lazy creation');
      return;
    }
    
    console.log('Creating new quote on first meaningful change...');
    // ... rest of creation logic
  }, 500);
  return;
}
```

Also add validation in `saveQuote` to prevent saving with mismatched IDs:

```typescript
// Add at start of saveQuote, before the update/insert logic
if (existingId && quote?.id && existingId !== quote.id) {
  console.warn('Quote ID mismatch - aborting save to prevent data corruption');
  console.warn('existingId:', existingId, 'quote.id:', quote.id);
  setSaving(false);
  return null;
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/configurator/PaymentSection.tsx` | Add type-aware sorting with `getEstimatedMonth` helper |
| `src/components/roi/configurator/ClientSection.tsx` | 1. Exclude handover from installments, 2. Add type-aware sorting |
| `src/hooks/useCashflowQuote.ts` | Add save guards for ID mismatch and race condition prevention |

## Detailed Code Changes

### PaymentSection.tsx (lines ~355-365)

```typescript
// Add helper before the filter/map chain
const sortingTotalMonths = data.paymentStructure.handoverMonthFromBooking || 36;

const getEstimatedMonth = (inst: typeof data.installments[0], totalMonths: number): number => {
  if (inst.type === 'time') return inst.triggerValue;
  if (inst.type === 'construction') return Math.round((inst.triggerValue / 100) * totalMonths);
  if (inst.type === 'handover') return totalMonths;
  if (inst.type === 'post-handover') return totalMonths + inst.triggerValue;
  return inst.triggerValue;
};

// Update the sort to use type-aware comparison
.sort((a, b) => {
  const aMonth = getEstimatedMonth(a, sortingTotalMonths);
  const bMonth = getEstimatedMonth(b, sortingTotalMonths);
  return aMonth - bMonth;
})
```

### ClientSection.tsx (lines ~243-260)

```typescript
// Add helper
const sortingTotalMonths = extractedData.paymentStructure.handoverMonthFromBooking || 36;

const getEstimatedMonth = (inst: typeof extractedData.installments[0], totalMonths: number): number => {
  if (inst.type === 'time') return inst.triggerValue;
  if (inst.type === 'construction') return Math.round((inst.triggerValue / 100) * totalMonths);
  if (inst.type === 'handover') return totalMonths;
  if (inst.type === 'post-handover') return totalMonths + inst.triggerValue;
  return inst.triggerValue;
};

// Fix the filter to exclude handover (match PaymentSection.tsx)
const additionalPayments = extractedData.installments
  .filter(i => {
    if (i.type === 'time' && i.triggerValue === 0) return false;
    // CRITICAL: Exclude handover - handled by onHandoverPercent
    if (i.type === 'handover') {
      console.log('Excluding handover payment from installments:', i.paymentPercent, '%');
      return false;
    }
    return true;
  })
  .map((inst, idx) => ({
    id: inst.id || `ai-${Date.now()}-${idx}`,
    type: inst.type === 'construction' ? 'construction' as const : 'time' as const,
    triggerValue: inst.triggerValue,
    paymentPercent: inst.paymentPercent,
  }))
  .sort((a, b) => {
    const aMonth = getEstimatedMonth(a, sortingTotalMonths);
    const bMonth = getEstimatedMonth(b, sortingTotalMonths);
    return aMonth - bMonth;
  });
```

### useCashflowQuote.ts (saveQuote function ~lines 244-260)

```typescript
const saveQuote = useCallback(
  async (
    inputs: OIInputs,
    clientInfo: ClientUnitData,
    existingId?: string,
    // ... other params
  ) => {
    setSaving(true);

    // Safety check: Prevent saving with mismatched quote IDs
    if (existingId && quote?.id && existingId !== quote.id) {
      console.warn('Quote ID mismatch detected - aborting save');
      console.warn('Attempted to save to:', existingId, 'but current quote is:', quote.id);
      setSaving(false);
      return null;
    }

    // ... rest of existing code
  },
  [toast, quote?.id] // Add quote?.id to dependencies
);
```

## Expected Behavior After Fix

```text
Before (broken):
1. On Booking - 10%
2. 30% Construction - 10%  ← Wrong position (30 > 27)
3. 50% Construction - 10%  ← Wrong position (50 > 27)
4. Month 6 - 5%
5. Month 27 Handover - 50% ← Duplicated as installment

After (fixed):
1. On Booking - 10%
2. Month 6 - 5%
3. 30% Construction (~Month 9) - 10%  ← Correct position
4. 50% Construction (~Month 14) - 10% ← Correct position
5. [Handover is NOT in list - handled by onHandoverPercent = 50%]
```

## Save Logic Flow After Fix

```text
1. User makes change → scheduleAutoSave called
2. Check: existingQuoteId present? 
   - Yes → Wait 1.5s, verify quote.id matches, then save
   - No + isQuoteConfigured → Wait 500ms, create new quote
3. Before actual save: Verify no ID mismatch
4. Save executes safely
```

