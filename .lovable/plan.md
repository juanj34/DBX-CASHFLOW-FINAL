
# Plan: Fix Post-Handover Amount Display in Metrics Table

## Problem

The current calculation for post-handover amount uses:
```typescript
const postPercent = 100 - preHandoverPercent - (onHandoverPercent || 0);
```

But the `OIInputs` interface actually stores `postHandoverPercent` directly (line 33). For projects like "skyline" and "weybridge" where `onHandoverPercent` is 0, the stored `postHandoverPercent` should be used to correctly show the amount being paid in the post-handover phase.

---

## Solution

**File: `src/components/roi/compare/MetricsTable.tsx`**

Update the Post-Handover row calculation (lines 175-179) to use the stored `postHandoverPercent` value when available:

```tsx
{/* Post-Handover Amount - always show */}
<MetricRow
  label="Post-Handover"
  values={quotesWithCalcs.map(q => {
    if (!q.quote.inputs.hasPostHandoverPlan) return { value: 0 };
    // Use stored postHandoverPercent if available, otherwise calculate
    const postPercent = q.quote.inputs.postHandoverPercent ?? 
      (100 - q.quote.inputs.preHandoverPercent - (q.quote.inputs.onHandoverPercent || 0));
    return { value: q.quote.inputs.basePrice * postPercent / 100 };
  })}
  formatter={(v) => v > 0 ? formatCurrency(v, 'AED', 1) : '—'}
/>
```

Also update the `getPaymentPlanLabel` helper (lines 57-76) to use the same logic for consistency:

```tsx
const getPaymentPlanLabel = (quote: QuoteWithCalculations['quote']) => {
  const hasPostHandover = quote.inputs.hasPostHandoverPlan;
  const preHandoverTotal = quote.inputs.preHandoverPercent;
  
  if (hasPostHandover) {
    const onHandover = quote.inputs.onHandoverPercent || 0;
    // Use stored postHandoverPercent if available
    const postHandover = quote.inputs.postHandoverPercent ?? 
      (100 - preHandoverTotal - onHandover);
    return {
      type: 'post-handover',
      label: `${Math.round(preHandoverTotal)}/${Math.round(onHandover)}/${Math.round(postHandover)}`
    };
  }
  // ... rest unchanged
};
```

---

## Summary

| File | Changes |
|------|---------|
| `src/components/roi/compare/MetricsTable.tsx` | Use stored `postHandoverPercent` value instead of calculating from remaining percentage |

---

## Expected Result

| Quote | On Handover | Post-Handover |
|-------|-------------|---------------|
| Skyline | — (or small amount) | AED X,XXX,XXX (the actual post-HO amount) |
| Weybridge | — (or small amount) | AED X,XXX,XXX (the actual post-HO amount) |
| Standard Plan | AED X,XXX,XXX | — |
