
# Plan: Fix Post-Handover Display & Add Export to Presentation/Client Views

## Issues Identified

### 1. Post-Handover Amount Not Showing Correctly
In `MetricsTable.tsx` and `PaymentComparison.tsx`, the post-handover percentage is being calculated as `100 - preHandoverTotal - onHandover` instead of using the stored `postHandoverPercent` value.

### 2. Payment Plan Label Wrong (e.g., "Post-HO 20/0/0")
Should show actual stored percentages like "Post-HO 20/0/80" where 80 is the stored `postHandoverPercent`.

### 3. Missing Post-Handover Payment Count
Need to show number of payments after handover by counting installments.

### 4. Export Functionality Missing
Need "Export Each" and "Export All" buttons in both Presentation and Client views.

### 5. ClientPortal Needs Same Features
Apply currency/language selectors and export functionality.

---

## File Changes

### 1. `src/components/roi/compare/MetricsTable.tsx`

**Fix Payment Plan Label** (line 65-66):
```tsx
// Before (wrong):
const postHandover = quote.inputs.postHandoverPercent ?? 
  (100 - preHandoverTotal - onHandover);

// After (use stored value directly):
const postHandover = quote.inputs.postHandoverPercent || 0;
```

**Add Post-Handover Payments Count Row** (after line 184):
```tsx
{/* Post-Handover Payments Count */}
<MetricRow
  label="Post-HO Payments"
  values={quotesWithCalcs.map(q => {
    if (!q.quote.inputs.hasPostHandoverPlan) return { value: 0 };
    // Count post-handover installments from additionalPayments
    const postPayments = (q.quote.inputs.additionalPayments || [])
      .filter((p: any) => p.type === 'post-handover').length;
    const fromPostHandover = (q.quote.inputs.postHandoverPayments || []).length;
    return { value: postPayments + fromPostHandover };
  })}
  formatter={(v) => v > 0 ? `${v} payments` : '—'}
/>
```

### 2. `src/components/roi/compare/PaymentComparison.tsx`

**Fix postHandoverPercent calculation** (lines 33-41):
```tsx
let postHandoverPercent: number;

if (hasPostHandover) {
  onHandover = quote.inputs.onHandoverPercent || 0;
  // Use stored value directly instead of calculating
  postHandoverPercent = quote.inputs.postHandoverPercent || 0;
} else {
  onHandover = 100 - preHandoverTotal;
  postHandoverPercent = 0;
}
```

**Add payment count display** (after line 181):
```tsx
{/* Post-handover payment count */}
{hasPostHandover && postHandoverPercent > 0 && (
  <div className="flex justify-between items-center text-xs text-theme-text-muted">
    <span>Post-HO payments</span>
    <span>
      {((quote.inputs.additionalPayments || []).filter((p: any) => p.type === 'post-handover').length) + 
       ((quote.inputs.postHandoverPayments || []).length)} installments
    </span>
  </div>
)}
```

### 3. `src/pages/PresentationView.tsx`

**Add "Export All" functionality** in sidebar (after currency/language selectors):
```tsx
{/* Export Options */}
<div className="p-4 border-b border-theme-border">
  <p className="text-xs uppercase tracking-wider text-theme-text-muted font-semibold mb-2">
    Downloads
  </p>
  <Button
    variant="outline"
    size="sm"
    className="w-full border-theme-border bg-theme-bg text-theme-text hover:bg-theme-bg/80"
    onClick={handleExportAll}
  >
    <Download className="w-3.5 h-3.5 mr-1.5" />
    Export All Quotes
  </Button>
</div>
```

**Add handleExportAll function**:
```tsx
const handleExportAll = async () => {
  for (const item of quoteItems) {
    if (item.type === 'quote') {
      handleDownloadQuote(item.id);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between exports
    }
  }
};
```

### 4. `src/pages/ClientPortal.tsx`

**Add currency/language state and selectors** (major updates):
- Add `useState` for currency and language
- Add `useExchangeRate` hook
- Add currency/language dropdown selectors in header
- Add download buttons next to each quote card
- Add "Download All" button
- Update quote view links to pass currency/language parameters

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/components/roi/compare/MetricsTable.tsx` | Fix postHandover calculation, add payment count row |
| `src/components/roi/compare/PaymentComparison.tsx` | Fix postHandoverPercent to use stored value, add payment count |
| `src/pages/PresentationView.tsx` | Add "Export All" button |
| `src/pages/ClientPortal.tsx` | Add currency/language selectors, export buttons for each quote and "Export All" |

---

## Expected Results

| Before | After |
|--------|-------|
| Post-HO 20/0/0 | Post-HO 20/0/80 |
| Post-Handover: — | Post-Handover: AED 1,200,000 |
| No payment count | Post-HO Payments: 48 payments |
| No export in presentation | Export each quote + Export All |
| ClientPortal has no currency/export | Full currency/language + export support |
