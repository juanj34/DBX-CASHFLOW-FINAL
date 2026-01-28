
# Plan: Fix Handover Quarter Highlighting in Cashflow View + Debug Snapshot Card

## Issues Identified

### Issue 1: Cashflow View - No Strong Handover Quarter Highlighting
The `PaymentBreakdown.tsx` component (used in Cashflow View) has handover badges but not the **strong green border highlighting** that was added to `CompactPaymentTable.tsx` (Snapshot View).

**Current behavior in PaymentBreakdown.tsx:**
- Small cyan badge "🔑 Handover" and purple "Post-HO" badge
- No green background or left border

**Expected (matching Snapshot):**
- Green left border + green background for payments in handover quarter
- Key icon + "Handover" badge

### Issue 2: Snapshot View - Post-Handover Card May Not Show
The `CompactPostHandoverCard` has two conditions that must be true:
1. `inputs.hasPostHandoverPlan === true`
2. `inputs.postHandoverPayments.length > 0`

If either is false, the card won't render.

---

## Technical Changes

### File 1: `src/components/roi/PaymentBreakdown.tsx`

#### Change 1: Add `isPaymentInHandoverQuarter` function (after line 43)

Add the same helper function used in CompactPaymentTable:

```tsx
// Check if a payment falls within the handover quarter specifically
const isPaymentInHandoverQuarter = (
  monthsFromBooking: number,
  bookingMonth: number,
  bookingYear: number,
  handoverQuarter: number,
  handoverYear: number
): boolean => {
  // Calculate payment's calendar date
  const bookingDate = new Date(bookingYear, bookingMonth - 1);
  const paymentDate = new Date(bookingDate);
  paymentDate.setMonth(paymentDate.getMonth() + monthsFromBooking);
  
  const paymentYear = paymentDate.getFullYear();
  const paymentMonth = paymentDate.getMonth() + 1;
  const paymentQuarter = Math.ceil(paymentMonth / 3);
  
  return paymentYear === handoverYear && paymentQuarter === handoverQuarter;
};
```

#### Change 2: Add Key icon import (line 3)

```tsx
import { Calendar, CreditCard, Home, Clock, Building2, Key } from "lucide-react";
```

#### Change 3: Update payment row styling (lines 251-278)

Replace the current row div with enhanced highlighting:

```tsx
// Check if in handover quarter (for strong visual)
const inHandoverQuarter = isPaymentInHandoverQuarter(
  monthsFromBooking, bookingMonth, bookingYear, handoverQuarter, handoverYear
);

return (
  <div 
    key={payment.id} 
    className={cn(
      "flex justify-between items-center gap-2",
      inHandoverQuarter && "bg-green-500/10 rounded px-2 py-1 -mx-2 border-l-2 border-green-400"
    )}
  >
    <div className="flex items-center gap-2 min-w-0 flex-1">
      {isTimeBased ? (
        <Clock className="w-3 h-3 text-theme-text-muted flex-shrink-0" />
      ) : (
        <Building2 className="w-3 h-3 text-theme-text-muted flex-shrink-0" />
      )}
      <span className="text-sm text-theme-text-muted truncate">
        {payment.paymentPercent}% @ {triggerLabel}
      </span>
      {dateStr && (
        <span className="text-xs text-theme-text-muted flex-shrink-0">({dateStr})</span>
      )}
      {inHandoverQuarter && (
        <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30 whitespace-nowrap flex items-center gap-0.5">
          <Key className="w-2.5 h-2.5" />
          Handover
        </span>
      )}
      {isPostHandover && !inHandoverQuarter && (
        <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 whitespace-nowrap">
          Post-HO
        </span>
      )}
    </div>
    <span className="text-sm text-theme-text font-mono flex-shrink-0 text-right tabular-nums">
      {formatCurrency(amount, currency, rate)}
    </span>
  </div>
);
```

#### Change 4: Add cn import (line 1)

```tsx
import { cn } from "@/lib/utils";
```

---

## Visual Result

### Before (Cashflow View):
```
THE JOURNEY (51 months)
2% @ Milestone M6 (Jul 2026)                 AED 50,800
2% @ Milestone M12 (Jan 2027)                AED 50,800
2% @ Milestone M17 (Jun 2027)  🔑 Handover   AED 50,800  ← Small badge only
```

### After (Cashflow View):
```
THE JOURNEY (51 months)
2% @ Milestone M6 (Jul 2026)                 AED 50,800
2% @ Milestone M12 (Jan 2027)                AED 50,800
▌2% @ Milestone M17 (Jun 2027) 🔑 Handover   AED 50,800  ← Green bg + border + badge
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/PaymentBreakdown.tsx` | 1. Add `isPaymentInHandoverQuarter` helper<br>2. Add Key icon import<br>3. Add cn import<br>4. Enhance row styling with green border/background for handover quarter |

---

## Benefits

1. **Consistent highlighting** - Cashflow View now matches Snapshot View with strong green indicators
2. **Clear handover timing** - Users can easily see which payments fall in the handover quarter
3. **Post-handover distinction** - Purple "Post-HO" badges still show for payments after handover quarter

---

## Regarding Snapshot Post-Handover Card

The `CompactPostHandoverCard` in `SnapshotContent.tsx` is correctly implemented. If it's not showing, it means:
- `inputs.hasPostHandoverPlan` is `false`, OR
- `inputs.postHandoverPayments` array is empty

Please verify that the quote you're viewing has the Post-Handover Plan enabled and has post-handover payments configured.
