

# Fix AI Extractor: Set Handover Date from Completion Payment

## Problem Analysis

When importing from Excel:
1. The AI correctly identifies "Completion" (row 33, 7.0%, 8/1/2028) as `type: "handover"`
2. But the configurator converts it to `type: "time"` losing the semantic meaning
3. The handover date should be **set FROM** the completion payment, not calculated separately from `handoverMonthFromBooking`

**Current Flow:**
```
Excel: "Completion 7% 8/1/2028" 
→ AI outputs: { type: "handover", triggerValue: 33, paymentPercent: 7 }
→ Configurator: converts to { type: "time", triggerValue: 33, paymentPercent: 7 }
→ Handover date: calculated from handoverMonthFromBooking (may be wrong or missing)
```

**Expected Flow:**
```
Excel: "Completion 7% 8/1/2028"
→ AI outputs: { type: "handover", triggerValue: 33, paymentPercent: 7 }
→ Configurator: 
   1. SETS handoverMonth = 8, handoverYear = 2028 (from trigger value)
   2. Marks payment with isHandover = true
   3. Stores as { type: "time", triggerValue: 33, isHandover: true }
```

---

## Solution

### Part 1: Add `isHandover` flag to PaymentMilestone interface

**File: `src/components/roi/useOICalculations.ts`**

Update the interface:
```typescript
export interface PaymentMilestone {
  id: string;
  type: 'time' | 'construction' | 'post-handover';
  triggerValue: number;
  paymentPercent: number;
  label?: string;
  isHandover?: boolean; // NEW: Explicitly marks this as the completion payment
}
```

### Part 2: Update AI extraction handler to derive handover date from completion payment

**File: `src/components/roi/configurator/PaymentSection.tsx`**

In `handleAIExtraction`:

```typescript
const handleAIExtraction = (data: ExtractedPaymentPlan) => {
  // === STEP 1: Find handover payment first to derive handover timing ===
  const handoverPayment = data.installments.find(i => i.type === 'handover');
  
  let handoverMonth: number | undefined;
  let handoverYear: number | undefined;
  let handoverQuarter: 1 | 2 | 3 | 4 | undefined;
  
  // PRIORITY 1: Derive from handover payment's triggerValue (most accurate)
  if (handoverPayment && handoverPayment.triggerValue > 0) {
    const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handoverDate = new Date(bookingDate);
    handoverDate.setMonth(handoverDate.getMonth() + handoverPayment.triggerValue);
    
    handoverMonth = handoverDate.getMonth() + 1;
    handoverYear = handoverDate.getFullYear();
    handoverQuarter = (Math.ceil(handoverMonth / 3)) as 1 | 2 | 3 | 4;
  }
  // PRIORITY 2: Fall back to handoverMonthFromBooking if no explicit handover payment
  else if (data.paymentStructure.handoverMonthFromBooking) {
    const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handoverDate = new Date(bookingDate);
    handoverDate.setMonth(handoverDate.getMonth() + data.paymentStructure.handoverMonthFromBooking);
    
    handoverMonth = handoverDate.getMonth() + 1;
    handoverYear = handoverDate.getFullYear();
    handoverQuarter = (Math.ceil(handoverMonth / 3)) as 1 | 2 | 3 | 4;
  }
  // PRIORITY 3: Use explicit quarter/year if provided
  else {
    handoverQuarter = data.paymentStructure.handoverQuarter || inputs.handoverQuarter;
    handoverYear = data.paymentStructure.handoverYear || inputs.handoverYear;
    handoverMonth = handoverQuarter ? (handoverQuarter - 1) * 3 + 1 : undefined;
  }
  
  // ... rest of function ...
  
  // === STEP 5: Convert installments, preserving isHandover flag ===
  const additionalPayments = data.installments
    .filter(i => {
      if (i.type === 'time' && i.triggerValue === 0) return false; // Skip downpayment
      // ... other filters ...
      return true;
    })
    .map((inst, idx) => ({
      id: inst.id || `ai-${Date.now()}-${idx}`,
      type: inst.type === 'construction' ? 'construction' as const : 'time' as const,
      triggerValue: inst.triggerValue,
      paymentPercent: inst.paymentPercent,
      isHandover: inst.type === 'handover', // NEW: Preserve handover flag
    }))
    .sort((a, b) => a.triggerValue - b.triggerValue);
```

### Part 3: Update configurator UI to show handover badge for flagged payments

**File: `src/components/roi/configurator/PaymentSection.tsx`**

In the installment rendering, add check for explicit `isHandover` flag:

```typescript
{inputs.additionalPayments.map((payment, index) => {
  const isPostHO = payment.type === 'time' && isPaymentPostHandover(...);
  const isHandoverQuarter = payment.type === 'time' && isPaymentInHandoverQuarter(...);
  
  // NEW: Explicit handover payment has priority
  const isExplicitHandover = payment.isHandover === true;
  const showHandoverBadge = isExplicitHandover || isHandoverQuarter;
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 p-1.5 rounded-lg",
      isExplicitHandover ? "bg-green-500/15 border border-green-500/40" : // Stronger for explicit
      isHandoverQuarter ? "bg-green-500/10 border border-green-500/30" :
      isPostHO ? "bg-purple-500/10 border border-purple-500/30" : 
      "bg-theme-bg"
    )}>
      {/* ... */}
      {showHandoverBadge && (
        <span className="text-[9px] px-1 py-0.5 bg-green-500/20 text-green-400 rounded flex items-center gap-0.5">
          <Key className="w-2.5 h-2.5" />
          {isExplicitHandover && "HO"}
        </span>
      )}
    </div>
  );
})}
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/roi/useOICalculations.ts` | Add `isHandover?: boolean` to `PaymentMilestone` interface |
| `src/components/roi/configurator/PaymentSection.tsx` | Derive handover date from completion payment's triggerValue; preserve `isHandover` flag when mapping |

---

## Technical Flow After Fix

```text
1. AI extracts "Completion 7% 8/1/2028" as:
   { type: "handover", triggerValue: 33, paymentPercent: 7 }

2. handleAIExtraction processes:
   - Finds handoverPayment (type === 'handover')
   - Calculates: triggerValue 33 → August 2028 (Q3 2028)
   - Sets: handoverMonth = 8, handoverYear = 2028, handoverQuarter = 3

3. Converts to additionalPayments:
   { type: "time", triggerValue: 33, paymentPercent: 7, isHandover: true }

4. UI displays:
   - Green background + border for this payment
   - "HO" badge with key icon
   - Handover date picker auto-set to August 2028
```

