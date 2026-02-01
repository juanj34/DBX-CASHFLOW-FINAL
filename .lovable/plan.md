
# Fix AI Extraction Handlers for Standard Payment Plans

## Problem

The AI extraction handlers (`handleAIExtraction`) in both `PaymentSection.tsx` and `ClientSection.tsx` currently set `onHandoverPercent` from the extracted handover payment regardless of whether it's a standard or post-handover plan.

This causes:
1. Redundant data storage (handover % stored when it should be derived)
2. Potential calculation conflicts with the fix we just made
3. Inconsistent behavior between manual entry and AI extraction

## Current Code (Both Files)

```typescript
// Line 309 in PaymentSection.tsx
// Line 225 in ClientSection.tsx
const onHandoverPercent = handoverPayment?.paymentPercent || 0;
```

This sets `onHandoverPercent` **unconditionally** for all plans.

## Solution

Apply the same conditional logic from the manual payment fix:

**For standard plans**: `onHandoverPercent = 0` (handover is derived as `100 - preHandoverPercent`)

**For post-handover plans**: `onHandoverPercent = handoverPayment?.paymentPercent` (explicit payment)

## Files to Modify

| File | Location | Change |
|------|----------|--------|
| `src/components/roi/configurator/PaymentSection.tsx` | ~lines 309-315 | Conditionally set `onHandoverPercent` based on `hasPostHandover` |
| `src/components/roi/configurator/ClientSection.tsx` | ~lines 224-232 | Same fix |

## Code Changes

### PaymentSection.tsx (lines 301-315)

```typescript
// === STEP 2: Find special installments ===
const downpayment = data.installments.find(
  i => i.type === 'time' && i.triggerValue === 0
);
const downpaymentPercent = downpayment?.paymentPercent || inputs.downpaymentPercent;

// === STEP 3: Calculate totals for validation ===
const postHandoverInstallments = data.installments.filter(i => 
  i.type === 'post-handover'
);
const postHandoverTotal = postHandoverInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);

// Determine if this is a post-handover plan BEFORE setting onHandoverPercent
const hasPostHandover = data.paymentStructure.hasPostHandover || postHandoverTotal > 0;

// CRITICAL FIX: Only set onHandoverPercent for post-handover plans
// For standard plans, handover = 100 - preHandoverPercent (derived)
const onHandoverPercent = hasPostHandover 
  ? (handoverPayment?.paymentPercent || data.paymentStructure.onHandoverPercent || 0)
  : 0;
```

### ClientSection.tsx (lines 216-232)

```typescript
// === STEP 2: Find special installments ===
const downpayment = extractedData.installments.find(
  i => i.type === 'time' && i.triggerValue === 0
);
const downpaymentPercent = downpayment?.paymentPercent || inputs.downpaymentPercent;

// Explicit handover payment - used for timing and post-handover plans only
const handoverPayment = extractedData.installments.find(i => i.type === 'handover');

// === STEP 3: Calculate totals for validation ===
const postHandoverInstallments = extractedData.installments.filter(i => 
  i.type === 'post-handover'
);
const postHandoverTotal = postHandoverInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);

// Determine if this is a post-handover plan
const hasPostHandover = extractedData.paymentStructure.hasPostHandover || postHandoverTotal > 0;

// CRITICAL FIX: Only set onHandoverPercent for post-handover plans
const onHandoverPercent = hasPostHandover 
  ? (handoverPayment?.paymentPercent || 0)
  : 0;
```

## Expected Behavior After Fix

**AI Extraction - Standard Plan (30/70):**
```
AI extracts: 20% booking, 10% @ Month 3, 70% on completion
hasPostHandover = false

Result:
  - downpaymentPercent = 20
  - preHandoverPercent = 30 (from split)
  - onHandoverPercent = 0 (NOT stored for standard plans)
  - additionalPayments = [10% @ Month 3]
  - hasPostHandoverPlan = false

Display: Handover = 100 - 30 = 70% ✓
```

**AI Extraction - Post-Handover Plan (30/70 split with 5yr payment):**
```
AI extracts: 20% booking, 10% installments, 10% on completion, 60% over 5 years
hasPostHandover = true

Result:
  - downpaymentPercent = 20
  - preHandoverPercent = 30
  - onHandoverPercent = 10 (explicit handover payment stored)
  - additionalPayments = [10% pre-HO, 60% post-HO installments]
  - hasPostHandoverPlan = true
  - postHandoverPercent = 60

Display: Pre-HO = 30%, On-HO = 10%, Post-HO = 60% ✓
```

## Summary

This fix ensures AI extraction follows the **same logic** as manual entry:
- Standard plans: All installments are pre-handover, handover amount is derived
- Post-handover plans: Explicit on-handover and post-handover tracking applies
