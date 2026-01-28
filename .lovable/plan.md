
# Plan: Fix Handover Quarter Highlighting + Show Total at Handover Inline

## Issues Identified

### Issue 1: Handover Quarter Months Not Highlighting in Cashflow
Looking at `CompactPaymentTable.tsx`, the `isPaymentInHandoverQuarter()` function (lines 44-58) checks if a payment falls in the handover quarter by comparing the payment's calculated month/year to the handover quarter range. 

**Potential cause:** The logic checks if `paymentYear === handoverYear` AND `paymentMonth` is within the quarter bounds. However, if payments are scheduled by month number relative to booking (e.g., Month 12, Month 15), the calculation may not correctly identify them as being in the handover quarter.

The highlighting logic at lines 291-297 wraps the row with a green background when `isHandoverQuarter` is true - but the function may be returning false due to:
- The payment month calculation not matching the expected handover quarter range
- The handover quarter/year not being set correctly in inputs

### Issue 2: Show Total Cash Until Handover Inline After Handover
Currently, "Total Cash Until Handover" is shown at the **bottom** of the payment table as a summary card (lines 406-422). User wants this shown **inline right after the handover quarter** row, and smaller.

---

## Solution

### Fix 1: Improve Handover Quarter Detection
Update the `isPaymentInHandoverQuarter` function to be more robust by:
1. Using the same date comparison logic as `PaymentBreakdown.tsx` (which works correctly)
2. Adding a fallback check for payments that are very close to `totalMonths`

### Fix 2: Show Total After Handover Row Inline
After the "On Handover" section (or the last handover-quarter payment), insert a small inline cumulative total indicator that shows:
- "Total to this point: AED X,XXX,XXX"
- Styled subtly (smaller text, muted accent)

---

## Technical Changes

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

**Change 1:** Fix `isPaymentInHandoverQuarter` function (lines 44-58)

The current logic calculates the payment date correctly but may have edge cases. Add a secondary check for payments where `monthsFromBooking >= totalMonths - 3` (within ~3 months of handover):

```tsx
const isPaymentInHandoverQuarter = (monthsFromBooking: number, bookingMonth: number, bookingYear: number, handoverQuarter: number, handoverYear: number): boolean => {
  // Calculate actual payment date
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  const paymentYear = paymentDate.getFullYear();
  const paymentMonth = paymentDate.getMonth() + 1;
  const paymentQuarter = Math.ceil(paymentMonth / 3);
  
  return paymentYear === handoverYear && paymentQuarter === handoverQuarter;
};
```

**Change 2:** Add inline cumulative total after "On Handover" section (after line 345)

Insert a small, compact indicator showing the running total after the handover payment:

```tsx
{/* Inline Cumulative: Total to Handover */}
{(!hasPostHandoverPlan || handoverPercent > 0) && (
  <div className="mt-1 pt-1 border-t border-dashed border-theme-border/50">
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-theme-text-muted flex items-center gap-1">
        <Wallet className="w-2.5 h-2.5" />
        Total to this point
      </span>
      <span className="font-mono text-theme-accent font-medium">
        {getDualValue(totalUntilHandover).primary}
      </span>
    </div>
  </div>
)}
```

**Change 3:** Remove or simplify the bottom "Total Cash Until Handover" card

Since we're showing it inline, we can either:
- **Option A:** Remove the bottom card entirely
- **Option B:** Keep it but make it very minimal (just the value, no description)

I recommend **Option A** - remove lines 406-422 to avoid duplication.

---

## Summary of Changes

| Location | Change |
|----------|--------|
| `CompactPaymentTable.tsx` lines 44-58 | Update `isPaymentInHandoverQuarter` to use Date object comparison |
| `CompactPaymentTable.tsx` after line 345 | Add inline "Total to this point" after handover section |
| `CompactPaymentTable.tsx` lines 406-422 | Remove bottom summary card (now shown inline) |

---

## Expected Behavior After Fix

1. **Handover Quarter Highlighting:** Payments that fall within the handover quarter (Q1/Q2/Q3/Q4 of the handover year) will be highlighted with green background and a 🔑 badge
2. **Inline Total:** Right after the handover row, a small line shows "Total to this point: AED X,XXX,XXX" - compact and not intrusive
3. **Cleaner UI:** No duplicate "Total Cash Until Handover" card at the bottom

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Fix handover detection, add inline total, remove bottom card |
