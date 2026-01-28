
# Plan: Fix Booking Date Default + Post-Handover Coverage Calculation

## Issue 1: Booking Date Default

### Current State
The `NEW_QUOTE_OI_INPUTS` in `types.ts` already correctly sets:
```tsx
bookingMonth: new Date().getMonth() + 1,
bookingYear: new Date().getFullYear(),
```

However, for **existing quotes** loaded from the database, the booking date comes from the saved data which may have old static values (like January 2026).

### Solution
This is working as designed - new quotes get current month/year by default. If the user is seeing January 2026, it's because that quote was **loaded from saved data**. No code change needed for this part.

---

## Issue 2: Post-Handover Coverage Calculation Mismatch

### Problem
The Coverage Card calculates "Monthly Equivalent" by dividing total post-handover amount by **calendar months** between handover and end date:
```tsx
postHandoverMonths = (endDate - handoverDate) in months // e.g., 24 months
monthlyEquivalent = postHandoverTotal / postHandoverMonths
```

But the **actual payment schedule** may not be monthly. In the user's case:
- 45 installments of AED 11,967 each = AED 538,521 total
- If paid over 24 calendar months, "monthly equivalent" = 22,438/mo
- But each actual payment is only 11,967

The user wants the card to show the **actual payment amount per installment**, not a theoretical average.

### Solution
Calculate the "Monthly Equivalent" based on the **actual payment schedule**:
1. Count the number of post-handover installments
2. Calculate the period over which they're spread
3. Show **actual payment amount** (AED 11,967) instead of calendar average

**Alternative approach** (simpler, more accurate):
Show actual payment per installment + payment frequency instead of "monthly equivalent":
- "Per Installment: AED 11,967"
- "45 payments over 24 months"

---

## Technical Changes

### File: `src/components/roi/snapshot/CompactPostHandoverCard.tsx`

**Change 1:** Calculate based on actual payments, not calendar division

Replace lines 81-87:
```tsx
// OLD: Calendar-based monthly equivalent
const postHandoverMonths = (endDate - handoverDate) in months;
const monthlyEquivalent = postHandoverTotal / postHandoverMonths;
```

With:
```tsx
// NEW: Calculate from actual payment schedule
const numberOfPayments = postHandoverPaymentsToUse.length;

// Calculate period using triggerValues (months from booking)
// Find the last payment's month offset from handover
const handoverMonthFromBooking = (inputs.handoverQuarter * 3) - 2 + 
  ((inputs.handoverYear - inputs.bookingYear) * 12) - inputs.bookingMonth;

// Get actual post-handover duration from payment schedule
const paymentMonths = postHandoverPaymentsToUse.map(p => p.triggerValue);
const lastPaymentMonth = Math.max(...paymentMonths);
const firstPaymentMonth = Math.min(...paymentMonths);
const actualDurationMonths = lastPaymentMonth - firstPaymentMonth + 1;

// Average payment per installment (what user actually pays each time)
const perInstallmentAmount = postHandoverTotal / numberOfPayments;

// Monthly cashflow burn rate (spread over actual payment period)
const monthlyEquivalent = postHandoverTotal / Math.max(1, actualDurationMonths);
```

**Change 2:** Update display to show clearer breakdown

Update the DottedRow for monthly equivalent to include payment context:
```tsx
<DottedRow 
  label={`${t('monthlyEquivalent')} (${numberOfPayments} payments)`}
  value={`${getDualValue(monthlyEquivalent).primary}/mo`}
  ...
/>
```

**Change 3:** Add "Per Installment" row for clarity

Add a new row showing the actual per-payment amount:
```tsx
{/* Per Installment Amount */}
<DottedRow 
  label={`Per Installment (${numberOfPayments}x)`}
  value={getDualValue(perInstallmentAmount).primary}
  secondaryValue={getDualValue(perInstallmentAmount).secondary}
  valueClassName="text-purple-400"
/>
```

---

## Summary

| Issue | Fix |
|-------|-----|
| Booking date default | Already correct for NEW quotes. Old quotes keep their saved values. |
| Monthly equivalent mismatch | Calculate from actual payment duration, not calendar months |
| Clarity | Add "Per Installment" row showing actual payment amount |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/CompactPostHandoverCard.tsx` | Fix monthly equivalent calculation, add per-installment display |
