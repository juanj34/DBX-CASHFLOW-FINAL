
# Plan: Add Payment Plan Type to Key Metrics

## Overview

Add a prominent "Payment Plan" row to the MetricsTable that clearly indicates whether each quote uses a standard or post-handover payment plan, along with the percentage breakdown.

---

## Changes Required

**File: `src/components/roi/compare/MetricsTable.tsx`**

Add a new "Payment Plan" row after "Developer" that shows:
- **Standard plans**: "Standard 40/60" format
- **Post-handover plans**: "Post-HO 40/30/30" format (highlighted differently)

```tsx
// Add helper function to generate payment plan label
const getPaymentPlanLabel = (quote: QuoteWithCalculations['quote']) => {
  const hasPostHandover = quote.inputs.hasPostHandoverPlan;
  const preHandoverTotal = quote.inputs.preHandoverPercent;
  
  if (hasPostHandover) {
    const onHandover = quote.inputs.onHandoverPercent || 0;
    const postHandover = 100 - preHandoverTotal - onHandover;
    return {
      type: 'post-handover',
      label: `${Math.round(preHandoverTotal)}/${Math.round(onHandover)}/${Math.round(postHandover)}`
    };
  } else {
    const onHandover = 100 - preHandoverTotal;
    return {
      type: 'standard',
      label: `${Math.round(preHandoverTotal)}/${Math.round(onHandover)}`
    };
  }
};

// Add new MetricRow after Developer row
<MetricRow
  label="Payment Plan"
  values={quotesWithCalcs.map(q => ({ value: getPaymentPlanLabel(q.quote) }))}
  formatter={(v) => v.type === 'post-handover' 
    ? `Post-HO ${v.label}` 
    : `Standard ${v.label}`}
/>
```

The formatter will display:
- `Standard 40/60` for regular plans
- `Post-HO 40/30/30` for post-handover plans

---

## Summary

| File | Changes |
|------|---------|
| `src/components/roi/compare/MetricsTable.tsx` | Add `getPaymentPlanLabel` helper and new "Payment Plan" row after Developer |

---

## Visual Result

| Metric | Standard Quote | Post-Handover Quote |
|--------|---------------|---------------------|
| Developer | Emaar | Damac |
| **Payment Plan** | **Standard 40/60** | **Post-HO 40/30/30** |
| Base Price | AED 2,500,000 | AED 3,000,000 |
| ... | ... | ... |
