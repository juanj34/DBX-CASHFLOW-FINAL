
# Plan: Fix Handover Quarter Highlighting for ALL Payment Plans

## The Problem

Currently:
1. For post-handover plans, payments are filtered into "pre-handover" and "post-handover" based on whether they're before/after the handover quarter start
2. This means NO pre-handover payment falls IN the handover quarter - they're all BEFORE it
3. The "Total to this point" is hidden when `hasPostHandoverPlan=true` and `onHandoverPercent=0`

## The Simple Fix

**User's requirement:** If project hands over Q3 2027, highlight the 3 months of Q3 (Jul, Aug, Sep 2027). Period. After those highlighted payments, show "Total to this point".

## Technical Changes

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

**Change 1:** Fix the post-handover filtering logic (lines 111-123)

Currently, payments in the handover quarter are being classified as "post-handover". Change to include handover quarter payments in pre-handover:

```tsx
// Current: filters OUT handover quarter payments from pre-handover
const preHandoverPayments = hasPostHandoverPlan
  ? sortedPayments.filter(p => {
      if (p.type !== 'time') return true;
      return !isPaymentPostHandover(...); // This excludes handover quarter!
    })
  : sortedPayments;
```

Update `isPaymentPostHandover` check to be STRICTLY after handover quarter end (not start):

```tsx
// New: include handover quarter in pre-handover section
const isPaymentAfterHandoverQuarter = (monthsFromBooking, bookingMonth, bookingYear, handoverQuarter, handoverYear) => {
  // Calculate payment date
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  // Handover quarter END = last month of quarter
  const handoverQuarterEndMonth = handoverQuarter * 3; // Q3 = month 9 (Sep)
  const handoverQuarterEnd = new Date(handoverYear, handoverQuarterEndMonth - 1); // Last day of quarter
  
  return paymentDate > handoverQuarterEnd;
};
```

**Change 2:** Always show handover cumulative total (lines 327-358)

Remove the condition that hides handover section when `hasPostHandoverPlan && handoverPercent === 0`:

```tsx
// Current condition hides when hasPostHandover && handoverPercent=0
{(!hasPostHandoverPlan || handoverPercent > 0) && (...)}

// New: Show handover section header and cumulative total even when handoverPercent=0
// For post-handover plans with 0% on-handover, just show the cumulative total
```

**Change 3:** Show cumulative total AFTER the last handover-quarter payment

Insert the "Total to this point" inline directly after the last payment that has `isHandoverQuarter = true`:

```tsx
{preHandoverPayments.map((payment, index) => {
  const isHandoverQuarter = isPaymentInHandoverQuarter(...);
  const isLastHandoverQuarterPayment = isHandoverQuarter && 
    !preHandoverPayments.slice(index + 1).some(p => 
      p.type === 'time' && isPaymentInHandoverQuarter(p.triggerValue, ...)
    );
  
  return (
    <>
      <div className={cn(..., isHandoverQuarter && "bg-green-500/10 ...")}>
        {/* payment row */}
      </div>
      
      {/* Insert cumulative total after last handover-quarter payment */}
      {isLastHandoverQuarterPayment && (
        <div className="mt-1 pt-1 border-t border-dashed">
          <span>Total to this point: {totalUntilHandover}</span>
        </div>
      )}
    </>
  );
})}
```

## Summary of Changes

| Line Range | Change |
|------------|--------|
| 58-69 | Update `isPaymentPostHandover` to check AFTER handover quarter end (not start) |
| 111-123 | Use updated filter so handover quarter payments stay in pre-handover section |
| 283-322 | Detect last handover-quarter payment and insert cumulative total inline |
| 327-358 | Simplify or remove duplicate handover section (cumulative is now inline) |

## Expected Behavior

1. Project handover = Q3 2027
2. Any payment in Jul/Aug/Sep 2027 gets green highlight with key badge
3. After the LAST highlighted payment → show "Total to this point: AED X,XXX,XXX"
4. Works for BOTH standard plans AND post-handover plans
