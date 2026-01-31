
# Fix AI Payment Plan Extractor: Correct Split Handling and Prevent Double-Counting

## Problem Analysis

Based on the edge function logs and screenshot, here's what's happening:

### What the AI Correctly Extracted:
```
installmentsCount: 2
handoverMonthFromBooking: 23
onHandoverPercent: 80
totalPercent: 100
hasPostHandover: false
```

This means: **20% downpayment on Month 0** + **80% completion on Month 23** = 100% (a simple 20/80 plan)

### What's Broken in the UI:
1. **Split selector shows "30/70"** instead of "20/80" despite AI extracting the correct split
2. **Footer shows "PRE-HO 20%, HANDOVER 70%, TOTAL 90%"** - mathematically impossible
3. **An 80% payment appears in the installments list** - it shouldn't be there

### Root Causes:

**Issue 1: Handover payment added to installments incorrectly**
- In `handleAIExtraction()` (line 312-339), the filter excludes Month 0 (downpayment) but **includes the handover payment**
- The 80% completion payment is being added to `additionalPayments` as a regular installment
- It then gets classified as a "post-handover" payment because its month (23) equals the handover date

**Issue 2: `preHandoverPercent` not being set correctly**
- The AI doesn't return `paymentSplit` in many cases
- The fallback logic (lines 304-308) only extracts it IF the AI provides it
- Without `paymentSplit`, `preHandoverPercent` stays at its previous value (30%) instead of 20%

**Issue 3: Footer calculation uses wrong values**
- `handoverPercent = 100 - preHandoverPercent` uses the stale 30% value
- Result: 100 - 30 = 70% handover (wrong)
- Total becomes 20 + 70 = 90% (missing the 80% that went to installments)

---

## Solution

### Fix 1: Calculate `paymentSplit` from Installments (Edge Function)

Add a fallback in the edge function to compute the split from the extracted installments:

```typescript
// Fallback 5: Calculate paymentSplit from installments
if (!extractedData.paymentStructure.paymentSplit) {
  const preHOTotal = extractedData.installments
    .filter(i => i.type === 'time' || i.type === 'construction')
    .reduce((sum, i) => sum + i.paymentPercent, 0);
  
  const postHOTotal = 100 - preHOTotal;
  extractedData.paymentStructure.paymentSplit = `${Math.round(preHOTotal)}/${Math.round(postHOTotal)}`;
}
```

### Fix 2: Exclude Handover Payment from Installments (Client-Side)

In `PaymentSection.tsx` → `handleAIExtraction()`, modify the filter to exclude handover-type installments:

```typescript
const additionalPayments = data.installments
  .filter(i => {
    // Skip downpayment (Month 0)
    if (i.type === 'time' && i.triggerValue === 0) return false;
    
    // Skip handover payment - it's handled by preHandoverPercent/handoverPercent
    if (i.type === 'handover') return false;
    
    // Skip duplicates
    if (i.type === 'time' && i.triggerValue === 1 && 
        downpayment && i.paymentPercent === downpayment.paymentPercent) {
      return false;
    }
    
    return true;
  })
  // ... rest of mapping
```

### Fix 3: Derive `preHandoverPercent` from Downpayment + Installments

If the AI doesn't provide `paymentSplit`, calculate it from the extracted data:

```typescript
let preHandoverPercent = inputs.preHandoverPercent;
if (data.paymentStructure.paymentSplit) {
  const [pre] = data.paymentStructure.paymentSplit.split('/').map(Number);
  if (!isNaN(pre)) preHandoverPercent = pre;
} else {
  // Calculate from extracted installments: downpayment + all pre-HO installments
  const preHOTotal = (downpaymentPercent || 0) + 
    data.installments
      .filter(i => (i.type === 'time' || i.type === 'construction') && i.triggerValue > 0 && i.type !== 'handover')
      .reduce((sum, i) => sum + i.paymentPercent, 0);
  
  if (preHOTotal > 0 && preHOTotal <= 100) {
    preHandoverPercent = preHOTotal;
  }
}
```

---

## UI/UX Improvements (Optional - Address Clutter)

Based on your feedback about redundant UI elements, here are targeted improvements:

### Reduce Visual Clutter:
1. **Remove duplicate section headers** - The "Payment Plan" title appears twice in some states
2. **Consolidate padding** - Some nested boxes have excessive padding (p-3 inside p-3)
3. **Simplify step badges** - Currently 3 visual levels (badge + text + icon), reduce to 2

### Specific Changes:
- Remove outer title from step blocks (keep only the numbered badge)
- Reduce nested card padding from `p-3` to `p-2`
- Consolidate the "Generate" row and "Installments" section header

---

## Files to Modify

### `supabase/functions/extract-payment-plan/index.ts`
- Add Fallback 5 to calculate `paymentSplit` from installments

### `src/components/roi/configurator/PaymentSection.tsx`
- Fix `handleAIExtraction()` to:
  1. Exclude handover-type payments from `additionalPayments`
  2. Calculate `preHandoverPercent` when `paymentSplit` is missing
- Reduce UI clutter in step blocks

---

## Expected Outcome

After these fixes, importing a **20/80 payment plan** will:
1. ✅ Show "20/80" selected in the Split buttons
2. ✅ Set downpayment to 20%
3. ✅ Show **empty** installments list (no intermediate payments)
4. ✅ Footer shows "PRE-HO 20%, HANDOVER 80%, TOTAL 100%"

---

## Technical Details

### Why the 80% Installment Appeared at Month 23

The AI correctly identified:
```json
{
  "type": "handover",
  "triggerValue": 23,
  "paymentPercent": 80
}
```

But the client code mapped it as:
```typescript
type: 'time',           // Converted from 'handover'
triggerValue: 23,       // Month 23
paymentPercent: 80
```

Because Month 23 equals the handover month, it was classified as a post-handover payment, bypassing the pre-handover total calculation entirely.

### The Math That Was Happening
```
preHandoverTotal = 20% (downpayment) + 0% (no pre-HO installments) = 20%
handoverPercent = 100% - 30% (stale preHandoverPercent) = 70%
totalPayment = 20% + 70% = 90%
```

The 80% completion payment was in `additionalPayments` but filtered into `postHandoverPayments` array, which has no effect on the standard (non-post-handover) calculation.
