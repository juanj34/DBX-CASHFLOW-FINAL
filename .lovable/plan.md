

# Complete Payment Plan System Overhaul

## Problems Identified from Your Screenshots and PDF

### Problem 1: The 5% "Completion" Payment is MISSING
**PDF shows**: "Completion: 5%" as the first post-handover payment
**Configurator shows**: This payment is filtered out and stored in `onHandoverPercent` but NOT added to the installments list

The current mapping logic (line 287 in PaymentSection.tsx):
```typescript
if (i.type === 'handover') return false; // Skip explicit handover marker
```

This removes the 5% from `additionalPayments` and stores it only in `onHandoverPercent`. The snapshot DOES show it when `handoverPercent > 0` (lines 526-549), BUT the configurator installment list doesn't show it at all!

### Problem 2: Quarter-Based Handover vs. Month-Based Reality
**PDF shows**:
- Last pre-handover: "In 26 months" = 4%
- Completion: Month 27 (one month after Month 26)
- Post-handover starts: "4th Month after Completion" = Month 31

**Configurator does**:
- Uses `handoverQuarter` (Q1, Q2, Q3, Q4) which maps to months 1, 4, 7, 10
- This creates a GAP in the schedule when handover doesn't align with quarter boundaries

**From your screenshot (image-347/348)**:
- Row 26 shows "Mar 2028" (M26) with 4%
- Row 27 shows "Jul 2028" (M30) - that's a 4-month jump!
- But PDF says post-handover starts at "4th Month after Completion" = Month 27 + 4 = Month 31

### Problem 3: Post-Handover Payments Use Wrong Reference Point
The AI is correctly extracting:
- "4th Month after Completion" → `triggerValue: 30` (Month 26 + 4)
- "5th Month after Completion" → `triggerValue: 31`

But the configurator's `isPaymentAfterHandoverQuarter()` function uses the QUARTER boundary, not the actual handover month:
```typescript
const handoverQuarterEndMonth = handoverQuarter * 3;
const handoverQuarterEnd = new Date(handoverYear, handoverQuarterEndMonth - 1, 28);
```

This causes payments to be mis-categorized as pre/post handover.

### Problem 4: Missing Handover Month in Data Model
The current `OIInputs` stores:
- `handoverQuarter: number` (1-4)
- `handoverYear: number`

But it should store:
- `handoverMonth: number` (1-12) - for accurate payment scheduling
- Optionally derive quarter from month for display

---

## Solution Architecture

### Core Change: Add `handoverMonth` to Data Model

Instead of quarter-based handover, we need month-based handover for accurate payment scheduling:

```typescript
// In OIInputs
handoverMonth: number; // 1-12 (the actual month)
handoverYear: number;
// Keep handoverQuarter for backward compatibility, but derive from month
```

### Data Flow After Fix

```text
PDF Input                    AI Extraction                    Configurator
─────────────────────────────────────────────────────────────────────────────
"In 26 months: 4%"    →    handoverMonthFromBooking: 27  →   handoverMonth: 3 (Mar)
                           (Completion is NEXT month)        handoverYear: 2028
                                                             handoverQuarter: 1 (derived)

"Completion: 5%"      →    type: 'handover', trigger: 27 →   INCLUDED in additionalPayments
                                                             with special 'handover' flag

"4th Month after HO"  →    triggerValue: 31 (27+4)       →   Categorized as post-HO by
                                                             comparing to handoverMonth
```

---

## Technical Changes

### 1. Update OIInputs Data Model

**File**: `src/components/roi/useOICalculations.ts`

Add new field and backward compatibility:

```typescript
export interface OIInputs {
  // ... existing fields
  
  // NEW: Month-based handover for accurate scheduling
  handoverMonth?: number; // 1-12 (actual month of handover)
  
  // Existing quarter-based (kept for backward compatibility)
  handoverQuarter: number; // 1-4 (now derived from handoverMonth if available)
  handoverYear: number;
}
```

### 2. Update AI Extraction to Calculate Handover Month

**File**: `supabase/functions/extract-payment-plan/index.ts`

The AI should:
1. Detect `handoverMonthFromBooking` from the last pre-handover payment
2. The "Completion" payment marks the ACTUAL handover month
3. Post-handover payments are absolute months from booking

Update the prompt to clarify:
```text
HANDOVER TIMING - CRITICAL:
- The "Completion" or "On Handover" payment occurs ONE MONTH AFTER the last
  pre-handover payment
- Example: Last payment "In 26 months", then "Completion" = Month 27
- Set handoverMonthFromBooking = 27 (the COMPLETION month, not the last pre-handover)

POST-HANDOVER ABSOLUTE MONTHS:
- "4th Month after Completion" with completion at month 27 = triggerValue 31
- "5th Month after Completion" = triggerValue 32
```

### 3. Include "Completion" Payment in Installments

**File**: `src/components/roi/configurator/PaymentSection.tsx`

Change the mapping logic to INCLUDE the handover payment in `additionalPayments`:

```typescript
const additionalPayments = data.installments
  .filter(i => {
    if (i.type === 'time' && i.triggerValue === 0) return false; // Skip downpayment only
    // DON'T filter out handover - include it as a regular installment
    return true;
  })
  .map((inst, idx) => ({
    id: inst.id || `ai-${Date.now()}-${idx}`,
    // Keep handover type for display, but all are time-based in storage
    type: inst.type === 'construction' 
      ? 'construction' as const 
      : 'time' as const,
    triggerValue: inst.triggerValue,
    paymentPercent: inst.paymentPercent,
    isHandover: inst.type === 'handover', // NEW: Flag for special display
  }));
```

### 4. Calculate Handover Month from Booking Date

**File**: `src/components/roi/configurator/PaymentSection.tsx`

```typescript
// Calculate handover date from handoverMonthFromBooking
if (data.paymentStructure.handoverMonthFromBooking) {
  const handoverMonths = data.paymentStructure.handoverMonthFromBooking;
  const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
  const handoverDate = new Date(bookingDate);
  handoverDate.setMonth(handoverDate.getMonth() + handoverMonths);
  
  // Store the actual month (1-12) for accurate scheduling
  const handoverMonth = handoverDate.getMonth() + 1;
  handoverYear = handoverDate.getFullYear();
  
  // Derive quarter from month for display
  handoverQuarter = Math.ceil(handoverMonth / 3) as 1 | 2 | 3 | 4;
  
  // Store both in inputs
  setInputs(prev => ({
    ...prev,
    handoverMonth,
    handoverYear,
    handoverQuarter,
    // ... other fields
  }));
}
```

### 5. Update Post-Handover Detection Logic

**File**: `src/components/roi/snapshot/CompactPaymentTable.tsx`

Change from quarter-based to month-based detection:

```typescript
// Check if payment is AFTER the handover month (not quarter)
const isPaymentAfterHandover = (
  monthsFromBooking: number, 
  bookingMonth: number, 
  bookingYear: number, 
  handoverMonth: number, // 1-12
  handoverYear: number
): boolean => {
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  const handoverDate = new Date(handoverYear, handoverMonth - 1);
  
  return paymentDate > handoverDate;
};
```

### 6. Add Edge Function Fallback Logic

**File**: `supabase/functions/extract-payment-plan/index.ts`

After AI extraction, if `handoverMonthFromBooking` is missing, calculate it:

```typescript
// Fallback: Calculate handoverMonthFromBooking from installments
if (!extractedData.paymentStructure.handoverMonthFromBooking) {
  // Find the handover-type installment
  const handoverInst = extractedData.installments.find(i => i.type === 'handover');
  
  if (handoverInst && handoverInst.triggerValue > 0) {
    extractedData.paymentStructure.handoverMonthFromBooking = handoverInst.triggerValue;
  } else {
    // Find the last time-based installment before any post-handover
    const postHandoverInsts = extractedData.installments.filter(i => i.type === 'post-handover');
    const timeInsts = extractedData.installments.filter(i => i.type === 'time');
    
    if (postHandoverInsts.length > 0) {
      const firstPostHO = Math.min(...postHandoverInsts.map(i => i.triggerValue));
      const lastPreHO = Math.max(
        ...timeInsts.filter(i => i.triggerValue < firstPostHO).map(i => i.triggerValue)
      );
      // Handover is one month after last pre-handover
      extractedData.paymentStructure.handoverMonthFromBooking = lastPreHO + 1;
    }
  }
}

// Ensure hasPostHandover is set
if (extractedData.paymentStructure.hasPostHandover === undefined) {
  extractedData.paymentStructure.hasPostHandover = 
    extractedData.installments.some(i => i.type === 'post-handover');
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/useOICalculations.ts` | Add `handoverMonth?: number` to OIInputs interface |
| `src/components/roi/configurator/types.ts` | Add `handoverMonth` to defaults |
| `src/lib/paymentPlanTypes.ts` | Ensure `handoverMonthFromBooking` is in types |
| `supabase/functions/extract-payment-plan/index.ts` | Update prompt, add fallback logic, add required fields |
| `src/components/roi/configurator/PaymentSection.tsx` | Include handover payment, calculate handoverMonth |
| `src/components/roi/configurator/ClientSection.tsx` | Same mapping changes as PaymentSection |
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Use month-based detection instead of quarter |
| `src/components/roi/configurator/ExtractedDataPreview.tsx` | Add handover month field |

---

## Expected Result After Fix

### PDF Payment Plan:
```
In 26 months: 4%        → Month 26 (Mar 2028)
Completion: 5%          → Month 27 (Apr 2028) ← HANDOVER
4th Month after: 1%     → Month 31 (Aug 2028)
5th Month after: 1%     → Month 32 (Sep 2028)
```

### Configurator Installments:
```
Row 26: Mar 2028 - M26 - 4%
Row 27: Apr 2028 - M27 - 5% (🔑 Handover)  ← NOW INCLUDED!
Row 28: Aug 2028 - M31 - 1%  ← Correct date based on actual handover month
Row 29: Sep 2028 - M32 - 1%
```

### Snapshot Display:
- The Journey: Months 1-26 (pre-handover)
- Handover: Month 27 - 5% (green highlight)
- Post-Handover: Months 31+ (purple section)

---

## Implementation Order

1. Update data types (`useOICalculations.ts`, `types.ts`) - Add `handoverMonth`
2. Update edge function (`extract-payment-plan/index.ts`) - Prompt + fallback logic
3. Update mapping logic (`PaymentSection.tsx`, `ClientSection.tsx`) - Include handover payment
4. Update display logic (`CompactPaymentTable.tsx`) - Month-based detection
5. Update preview (`ExtractedDataPreview.tsx`) - Show handover month
6. Deploy and test with your PDF

---

## Testing Checklist

With the Zenith PDF:
- [ ] All 60% pre-handover installments appear (including the 5% Completion)
- [ ] Handover payment (5%) shows at Month 27, not skipped
- [ ] Post-handover payments (4th month after = Month 31) align correctly
- [ ] No gap between Month 26 and Month 31 (the 5% fills Month 27)
- [ ] Total adds up to 100%

