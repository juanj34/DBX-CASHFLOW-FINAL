
# Plan: Comparison View Metrics & Layout Improvements

## Overview

Three improvements to the comparison view:
1. Add years/months to completion in key metrics
2. Show post-handover amount for all quotes (not just conditionally)
3. Change Payment & Growth from side-by-side to stacked rows

---

## 1. Add Time to Completion in Metrics

**File: `src/components/roi/compare/MetricsTable.tsx`**

Update the "Handover" row to show both the quarter/year AND the time remaining (e.g., "Q3 2027 (2y 6m)").

```tsx
// Add helper function to calculate time to completion
const getTimeToCompletion = (quote: QuoteWithCalculations['quote']) => {
  const now = new Date();
  const handoverDate = new Date(quote.inputs.handoverYear, (quote.inputs.handoverQuarter - 1) * 3, 1);
  const diffMonths = Math.max(0, (handoverDate.getFullYear() - now.getFullYear()) * 12 + 
    (handoverDate.getMonth() - now.getMonth()));
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  if (years > 0 && months > 0) return `${years}y ${months}m`;
  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}m`;
  return 'Now';
};

// Update Handover row formatter
<MetricRow
  label="Handover"
  values={quotesWithCalcs.map(q => ({ 
    value: { 
      date: formatHandoverDate(q.quote), 
      time: getTimeToCompletion(q.quote) 
    }
  }))}
  formatter={(v) => `${v.date} (${v.time})`}
/>
```

---

## 2. Always Show Post-Handover Amount

**File: `src/components/roi/compare/MetricsTable.tsx`**

Currently post-handover is conditionally shown (lines 128-138). Change to always show the row, displaying "—" or "0" for quotes without post-handover plans.

```tsx
// Remove the conditional wrapper, always show the row
<MetricRow
  label="Post-Handover"
  values={quotesWithCalcs.map(q => {
    if (!q.quote.inputs.hasPostHandoverPlan) return { value: 0 };
    const postPercent = 100 - q.quote.inputs.preHandoverPercent - (q.quote.inputs.onHandoverPercent || 0);
    return { value: q.quote.inputs.basePrice * postPercent / 100 };
  })}
  formatter={(v) => v > 0 ? formatCurrency(v, 'AED', 1) : '—'}
/>
```

---

## 3. Change Payment & Growth to Stacked Layout

**File: `src/pages/QuotesCompare.tsx`**

Change from side-by-side `grid lg:grid-cols-2` to stacked vertical layout (lines 405-408).

```tsx
// Before (side-by-side)
<div className="grid lg:grid-cols-2 gap-6">
  <PaymentComparison ... />
  <GrowthComparisonChart ... />
</div>

// After (stacked rows)
<div className="space-y-6">
  <PaymentComparison ... />
  <GrowthComparisonChart ... />
</div>
```

**File: `src/components/presentation/PresentationPreview.tsx`**

Apply same change to the comparison preview (if exists).

---

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/components/roi/compare/MetricsTable.tsx` | Add time-to-completion helper, update Handover row format, remove conditional on Post-Handover row |
| `src/pages/QuotesCompare.tsx` | Change Payment & Growth grid to stacked `space-y-6` |
| `src/components/presentation/PresentationPreview.tsx` | Same layout change for comparison preview |

---

## Visual Result

| Metric | Before | After |
|--------|--------|-------|
| Handover | Q3 2027 | Q3 2027 (2y 6m) |
| Post-Handover | Only shown if any quote has it | Always shown, "—" if none |
| Payment & Growth | Side-by-side (cramped) | Stacked vertically (full width) |
