
# Plan: Comparison View Enhancements & Presentation Improvements

## Overview

This plan addresses multiple improvements across the comparison view and presentation modes:
1. Support up to 6 quotes in comparison
2. Remove "best" indicators and trophy icons
3. Streamline metrics with new data points
4. Fix presentation mode to only show snapshot views
5. Fix scrolling issues in snapshot view
6. Layout improvements for payment/growth sections

---

## 1. Increase Quote Limit to 6

### Files to Modify

**`src/pages/QuotesCompare.tsx`**
- Line 340: Update help text from "2-4 quotes" to "2-6 quotes"
- Line 391: Expand colors array from 4 to 6 colors
- Line 573: Change `maxQuotes={4}` to `maxQuotes={6}`

**`src/components/roi/compare/QuoteSelector.tsx`**
- Line 30: Change `maxQuotes = 4` to `maxQuotes = 6`

**`src/hooks/useQuotesComparison.ts`**
- Add 2 additional colors to support 6 quotes

**Color Palette** (add 2 new colors):
```
['#CCFF00', '#00EAFF', '#FF00FF', '#FFA500', '#FF6B6B', '#4ECDC4']
```

Apply consistently across:
- MetricsTable.tsx
- PaymentComparison.tsx
- GrowthComparisonChart.tsx
- ExitComparison.tsx

---

## 2. Remove "Best" Indicators

### Files to Modify

**`src/components/roi/compare/MetricsTable.tsx`**
- Remove Trophy icon import
- Remove all `best` highlighting logic
- All values display with uniform white text (no green highlighting)

```tsx
// Before
<span className={`font-medium ${item.best ? 'text-emerald-400' : 'text-white'}`}>
{item.best && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}

// After  
<span className="font-medium text-white">
// No trophy icon
```

**`src/components/roi/compare/ExitComparison.tsx`**
- Remove Trophy icon import and "isBest" logic
- Display all values uniformly

**`src/hooks/useQuotesComparison.ts`**
- Remove `best: boolean` calculation from `computeComparisonMetrics`
- Simplify to just return `{ value: number }[]` arrays

---

## 3. Enhance MetricsTable with New Data Points

### Add New Metrics

**`src/components/roi/compare/MetricsTable.tsx`**

Add these new rows:
1. **Developer** - Show developer name
2. **Handover Date** - Format as "Q3 2027" instead of "2y 11mo"
3. **Monthly Burn Rate** - (Entry costs + Pre-handover) / construction months
4. **Y1 Rent Income** - Show in AED, not just yield %
5. **Pre-Handover Amount** - Total AED paid before handover
6. **At Handover Amount** - AED paid at handover
7. **Post-Handover Amount** - AED (if applicable)

**Remove** or collapse:
- Construction Appreciation row
- Growth Appreciation row
- (Move to tooltip or secondary section)

**`src/hooks/useQuotesComparison.ts`**

Update `ComparisonMetrics` interface:
```typescript
export interface ComparisonMetrics {
  developer: { value: string | null }[];
  basePrice: { value: number }[];
  pricePerSqft: { value: number | null }[];
  handoverDate: { value: { quarter: number; year: number } }[];
  monthlyBurnRate: { value: number }[];
  rentIncomeY1: { value: number | null }[];
  preHandoverAmount: { value: number }[];
  atHandoverAmount: { value: number }[];
  postHandoverAmount: { value: number }[];
  rentalYieldY1: { value: number | null }[];
}
```

---

## 4. Remove Standalone Rental Yield Section

### Files to Modify

**`src/pages/QuotesCompare.tsx`**
- Remove lines 519-531: `RentalYieldComparison` section entirely
- The rental yield data is now integrated into MetricsTable

**`src/components/presentation/PresentationPreview.tsx`**
- Remove `RentalYieldComparison` from comparison sections (lines 513-522)

---

## 5. Payment Comparison: 4-Part Breakdown for Post-Handover Plans

### File: `src/components/roi/compare/PaymentComparison.tsx`

Update visual bar to show 4 segments when `hasPostHandoverPlan`:
1. **Downpayment** - solid accent color
2. **Pre-Handover Installments** - 80% opacity accent
3. **On Handover** - 60% opacity accent  
4. **Post-Handover Installments** - striped pattern or distinct color

```tsx
// Detect post-handover plan
const hasPostHandover = quote.inputs.hasPostHandoverPlan;

// Calculate segments
const downpayment = quote.inputs.downpaymentPercent;
const preHandoverInstallments = quote.inputs.preHandoverPercent - downpayment;
const onHandover = hasPostHandover 
  ? (quote.inputs.onHandoverPercent || 0) 
  : (100 - quote.inputs.preHandoverPercent);
const postHandover = hasPostHandover 
  ? (100 - quote.inputs.preHandoverPercent - (quote.inputs.onHandoverPercent || 0)) 
  : 0;
```

Update legend to show 4 rows when post-handover plan exists.

---

## 6. Payment & Growth in 2 Rows (Side by Side)

### Files to Modify

**`src/pages/QuotesCompare.tsx`**

Currently payment and growth are in separate collapsible sections. Update to place them in a 2-column grid (already done in PresentationPreview):

```tsx
<CollapsibleSection title="Payment & Growth" ...>
  <div className="grid lg:grid-cols-2 gap-6">
    <PaymentComparison quotesWithCalcs={quotesWithCalcs} />
    <GrowthComparisonChart quotesWithCalcs={quotesWithCalcs} />
  </div>
</CollapsibleSection>
```

Remove separate PaymentComparison and GrowthComparisonChart collapsible sections (lines 488-503).

---

## 7. Presentation Mode: Only Load Snapshot View

### File: `src/pages/PresentationView.tsx`

Currently supports both 'snapshot' and 'vertical' (cashflow) view modes. Change to:
- Force all quotes to render in snapshot mode
- Remove vertical/cashflow option from presentation view

```tsx
// Line 186-187: Filter for snapshots only
const snapshotItems = presentation?.items.filter(item => item.type === 'quote') || [];
// Remove cashflowItems entirely or force viewMode to 'snapshot'
```

Update sidebar to only show "Properties" section (no separate Cashflows section).

### File: `src/components/presentation/PresentationPreview.tsx`

In `QuotePreview` component, force `viewMode` to always be `'snapshot'`:

```tsx
// Line 710-714
{currentItem?.type === 'quote' && quoteData && (
  <QuotePreview 
    quoteData={quoteData} 
    viewMode="snapshot"  // Always snapshot, ignore currentItem.viewMode
  />
)}
```

---

## 8. Client Portal: Same Behavior

### File: `src/pages/ClientPortal.tsx`

Ensure client portal uses snapshot view for all quotes:
- When client clicks on a quote, open in snapshot mode
- Remove any cashflow/vertical view options

---

## 9. Fix Scrolling in Snapshot View (Presentation)

### File: `src/components/presentation/PresentationPreview.tsx`

The issue is `overflow-hidden` on the preview container prevents scrolling.

```tsx
// Line 709: Change overflow-hidden to overflow-auto
<div className="flex-1 overflow-auto bg-theme-bg">
```

### File: `src/components/roi/snapshot/SnapshotContent.tsx`

Ensure the snapshot content allows scrolling:
```tsx
// Line 73: Already has min-h-full, ensure parent allows scroll
<div className="min-h-full flex flex-col bg-theme-bg overflow-auto">
```

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/pages/QuotesCompare.tsx` | Update maxQuotes to 6, combine Payment & Growth sections, remove RentalYield section, expand colors |
| `src/components/roi/compare/QuoteSelector.tsx` | Update default maxQuotes to 6 |
| `src/components/roi/compare/MetricsTable.tsx` | Remove Trophy/best indicators, add Developer/Handover Date/Monthly Burn/Y1 Rent Income rows, expand colors |
| `src/components/roi/compare/PaymentComparison.tsx` | Support 4-segment visualization for post-handover plans, expand colors |
| `src/components/roi/compare/GrowthComparisonChart.tsx` | Expand colors to 6 |
| `src/components/roi/compare/ExitComparison.tsx` | Remove best indicators, expand colors |
| `src/hooks/useQuotesComparison.ts` | Remove `best` field, add new metric calculations, expand colors |
| `src/pages/PresentationView.tsx` | Simplify to only show snapshot views, remove cashflow section |
| `src/components/presentation/PresentationPreview.tsx` | Force snapshot mode for quotes, fix overflow for scrolling, expand colors |
| `src/pages/ClientPortal.tsx` | Ensure snapshot-only view for quotes |

---

## Visual Changes Summary

| Before | After |
|--------|-------|
| Max 4 quotes | Max 6 quotes |
| Trophy icons on "best" values | No indicators - all values equal |
| Separate Rental Yield section | Integrated into Metrics table |
| Handover shown as "2y 11mo" | Shown as "Q3 2027" |
| No monthly burn rate | Monthly burn rate shown |
| No developer name | Developer shown in metrics |
| 3-segment payment bar | 4-segment for post-handover plans |
| Payment & Growth separate sections | Combined in 2-column layout |
| Presentation shows Cashflow option | Snapshot only |
| Snapshot can't scroll in presentation | Fixed scrolling |
