
# Plan: Fix Handover Highlighting Logic + Post-Handover Card Bugs

## Issues Identified

### Issue 1: "Handover" badge shows on POST-HANDOVER items (INCORRECT)
**Current behavior:** Month 18-20 (Jul-Sep 2027) show the green "Handover" badge even though they are in the POST-HANDOVER section.

**Root cause:** The logic `isPaymentInHandoverQuarter()` returns `true` for payments in the handover quarter. But if a payment is already categorized as "post-handover" (meaning it's AT or AFTER handover start), it shouldn't display the "Handover" badge - that badge should only mark pre-handover payments that happen during the delivery quarter.

**The fix:** In the POST-HANDOVER section, we should NOT apply the handover highlighting at all. Payments in that section are already past/at handover - the "Handover" badge is redundant and confusing.

### Issue 2: Post-Handover Coverage Card shows "Post-HO Payments (0%)"
**Current behavior:** Line 155 in `CompactPostHandoverCard.tsx`:
```tsx
label={`${t('postHandoverPayments')} (${inputs.postHandoverPercent || 0}%)`}
```
This uses `inputs.postHandoverPercent` which is `undefined` for derived payments.

**The fix:** Calculate the actual percentage from the derived payments:
```tsx
const postHandoverPercent = postHandoverPaymentsToUse.reduce((sum, p) => sum + p.paymentPercent, 0);
// Then use postHandoverPercent in the label
```

### Issue 3: Missing EUR (secondary currency) in Post-Handover Coverage Card
**Current behavior:** Some rows like "Monthly Equivalent" only show AED values, not the dual currency.

**The fix:** Add `secondaryValue` prop to all `DottedRow` components in the card.

---

## Technical Changes

### File 1: `src/components/roi/snapshot/CompactPaymentTable.tsx`

**Change:** Remove handover quarter highlighting from the POST-HANDOVER section (lines 355-394).

The payments in the post-handover section are BY DEFINITION at or after handover, so the "Handover" badge is redundant. Only pre-handover payments that coincide with the delivery quarter should get the badge.

```tsx
// REMOVE from post-handover section:
// - isHandoverQuarter check and styling
// - The green border/background highlighting
// - The "Handover" badge

// The post-handover section should render plain rows:
{derivedPostHandoverPayments.map((payment, index) => {
  const amount = basePrice * (payment.paymentPercent / 100);
  const dateStr = getPaymentDate(payment);
  const label = `${getPaymentLabel(payment)} (${dateStr})`;
  
  return (
    <div key={index} className="flex items-center justify-between gap-2">
      <span className="text-xs text-theme-text-muted truncate">{label}</span>
      <span className="text-xs font-mono text-theme-text whitespace-nowrap flex-shrink-0">
        {getDualValue(amount).primary}
        {currency !== 'AED' && (
          <span className="text-theme-text-muted ml-1">({getDualValue(amount).secondary})</span>
        )}
      </span>
    </div>
  );
})}
```

---

### File 2: `src/components/roi/snapshot/CompactPostHandoverCard.tsx`

**Change 1:** Calculate percentage from derived payments (around line 67-70)

```tsx
// Calculate post-handover percentage from actual payments
const postHandoverPercent = postHandoverPaymentsToUse.reduce(
  (sum, p) => sum + p.paymentPercent, 0
);
```

**Change 2:** Use calculated percentage in label (line 155)

```tsx
<DottedRow 
  label={`${t('postHandoverPayments')} (${Math.round(postHandoverPercent)}%)`}
  value={getDualValue(postHandoverTotal).primary}
  secondaryValue={getDualValue(postHandoverTotal).secondary}
/>
```

**Change 3:** Add secondary currency to Monthly Equivalent row (line 163)

```tsx
<DottedRow 
  label={t('monthlyEquivalent')}
  value={`${getDualValue(monthlyEquivalent).primary}/mo`}
  secondaryValue={currency !== 'AED' ? `${getDualValue(monthlyEquivalent).secondary}/mo` : null}
  bold
  valueClassName="text-purple-400"
/>
```

**Change 4:** Add secondary currency to Rental Income row (line 171)

```tsx
<DottedRow 
  label={t('rentalIncome')}
  value={`+${getDualValue(monthlyRent).primary}/mo`}
  secondaryValue={currency !== 'AED' ? `+${getDualValue(monthlyRent).secondary}/mo` : null}
  valueClassName="text-cyan-400"
/>
```

**Change 5:** Add secondary currency to Monthly Gap row (line 179)

```tsx
<DottedRow 
  label={isFullyCovered ? t('monthlySurplus') : t('monthlyGap')}
  value={`${isFullyCovered ? '+' : '-'}${getDualValue(Math.abs(monthlyCashflow)).primary}/mo`}
  secondaryValue={currency !== 'AED' ? `${isFullyCovered ? '+' : '-'}${getDualValue(Math.abs(monthlyCashflow)).secondary}/mo` : null}
  bold
  valueClassName={isFullyCovered ? 'text-green-400' : 'text-red-400'}
/>
```

---

## Visual Result After Fix

### Snapshot Payment Table - POST-HANDOVER Section:
```
POST-HANDOVER (34%)
Month 18 (Jul 2027)              AED 12,284 (2.806 €)   ← NO handover badge
Month 19 (Aug 2027)              AED 12,284 (2.806 €)   ← NO handover badge  
Month 20 (Sep 2027)              AED 12,284 (2.806 €)   ← NO handover badge
Month 21 (Oct 2027)              AED 12,284 (2.806 €)
...
```

### Post-Handover Coverage Card:
```
POST-HANDOVER COVERAGE                     39mo @ Q4 2030
─────────────────────────────────────────────────────────
Post-HO Payments (34%)........AED 417,654 (95.399 €)
Monthly Equivalent............AED 10,709/mo (2.447 €/mo)
Rental Income.................+AED 7,511/mo (+1.716 €/mo)
─────────────────────────────────────────────────────────
Monthly Gap...................-AED 3,198/mo (-731 €/mo)

◉ Partial   ↘ AED 124,720 gap over 39mo
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Remove handover highlighting from POST-HANDOVER section |
| `src/components/roi/snapshot/CompactPostHandoverCard.tsx` | Calculate % from derived payments; add dual currency to all rows |

---

## Summary

1. **Handover badge removal from Post-HO section** - The badge should only appear on pre-handover payments that happen to fall in the delivery quarter. Post-handover payments are by definition at/after handover, so the badge is redundant.

2. **Fix 0% label** - Calculate percentage from the actual derived payments instead of using `inputs.postHandoverPercent` which may be undefined.

3. **Add EUR display** - Show secondary currency on all monetary values in the card.
