
# Plan: Auto-Shift Subsequent Installments When Changing Month

## Problem
When editing the delivery month (triggerValue) of a payment installment in the configurator, only that specific payment updates. The user wants subsequent installments to automatically shift by the same amount.

**Example:**
- Installment 40 is at month 15, installment 41 is at month 18 (3-month gap)
- User changes installment 40 from month 15 → month 17 (shift of +2)
- Expected: Installment 41 should auto-shift from month 18 → month 20, and all following installments should shift too

---

## Solution

Add a "cascade shift" behavior when editing a payment's month:
1. Calculate the delta (new month - old month)
2. Apply that delta to all subsequent payments in the list
3. This preserves the relative spacing between payments

---

## Technical Changes

### File: `src/components/roi/configurator/PaymentSection.tsx`

**Change 1:** Update `updateAdditionalPayment` function (lines 144-155)

Add logic to detect when `triggerValue` changes and cascade the shift to subsequent payments:

```tsx
const updateAdditionalPayment = (id: string, field: keyof PaymentMilestone, value: any) => {
  setInputs(prev => {
    // Find the index of the payment being updated
    const paymentIndex = prev.additionalPayments.findIndex(m => m.id === id);
    if (paymentIndex === -1) return prev;
    
    const oldPayment = prev.additionalPayments[paymentIndex];
    
    // If changing triggerValue (month), cascade shift to all subsequent payments
    if (field === 'triggerValue' && oldPayment.type === 'time') {
      const oldValue = oldPayment.triggerValue;
      const newValue = value as number;
      const delta = newValue - oldValue;
      
      // Only cascade if there's an actual change
      if (delta !== 0) {
        const updated = prev.additionalPayments.map((m, idx) => {
          if (idx === paymentIndex) {
            // Update the current payment
            return { ...m, triggerValue: newValue };
          } else if (idx > paymentIndex && m.type === 'time') {
            // Shift all subsequent time-based payments
            return { ...m, triggerValue: Math.max(1, m.triggerValue + delta) };
          }
          return m;
        });
        return { ...prev, additionalPayments: updated };
      }
    }
    
    // Standard single-field update for non-cascade cases
    const updated = prev.additionalPayments.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    );
    
    // Sort by triggerValue when month changes
    if (field === 'triggerValue') {
      return { ...prev, additionalPayments: updated.sort((a, b) => a.triggerValue - b.triggerValue) };
    }
    return { ...prev, additionalPayments: updated };
  });
};
```

---

## How It Works

| Action | Before | After |
|--------|--------|-------|
| User changes installment 40 from month 15 to month 17 | Only installment 40 updates | Installment 40 moves to 17, installment 41+ all shift by +2 |
| User adds a gap between 40 and 41 | Manual edit of each | Automatic cascade maintains relative spacing |
| Construction-type payments | N/A | Not affected (only time-based cascade) |

---

## Edge Cases Handled

1. **Negative months:** Capped at minimum of 1 with `Math.max(1, ...)`
2. **Construction milestones:** Only time-based payments cascade (construction milestones are percentage-based)
3. **Single payment edit:** If only changing percentage, no cascade occurs

---

## Expected Behavior

1. Edit installment 40's month from 15 → 17
2. Installments 41, 42, 43... all automatically shift by +2 months
3. The relative spacing between payments is preserved
4. List remains sorted by month after the change
