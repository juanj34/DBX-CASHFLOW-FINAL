

# Unified Comparison Table: Enhanced Design

## User Requirements

1. **Rent Coverage Row Enhancement**:
   - Show positive/negative cashflow amount (e.g., "+AED 2,500" or "-AED 1,200")
   - Display coverage percentage in smaller text next to it

2. **Draggable Header Enhancement**:
   - Add Developer name (small text)
   - Add Zone name (small text)
   - Project name remains the primary heading

## Final Metrics List (User Specified)

| Metric | Source | Notes |
|--------|--------|-------|
| Property Value | `inputs.basePrice` | Primary property price |
| Price/sqft | `basePrice / unitSizeSqf` | Calculated |
| Area | `unitSizeSqf` | sqft |
| Rental Income | Annual rent | Show yield % next to it (e.g., "AED 72K (7%)") |
| Handover | `Q# YYYY` | With countdown in parentheses |
| Pre-Handover | `preHandoverPercent * basePrice` | Money spent before handover |
| Post-Handover | `postHandoverPercent * basePrice` | Money spent after handover (or "—") |
| Rent vs Post-HO Coverage | Cashflow ± amount | With % in small text |

## Design Mockup

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│               │ 🟡 Sera Gardens    │ 🔵 Zenith Tower     │ 🟣 Samana Manhattan  │
│               │ ⋮⋮ Emaar           │ ⋮⋮ Damac            │ ⋮⋮ Samana              │
│   Metric      │    JVC             │    Business Bay     │    JVC                │
├───────────────┼────────────────────┼─────────────────────┼───────────────────────┤
│ Property Value│ AED 890,000        │ AED 998,195         │ AED 850,500           │
│ Price/sqft    │ AED 1,413          │ AED 1,103           │ AED 1,418             │
│ Area          │ 630 sqft           │ 905 sqft            │ 600 sqft              │
│ Rental Income │ AED 53,400 (6%)    │ AED 69,874 (7%)     │ AED 51,030 (6%)       │
│ Handover      │ Q1 2028 (2y)       │ Q2 2028 (2y 3m)     │ Q1 2029 (3y)          │
│ Pre-Handover  │ AED 178,000        │ AED 299,459         │ AED 255,150           │
│ Post-Handover │ —                  │ AED 349,368         │ AED 272,160           │
│ Rent Coverage │ —                  │ +AED 2,500 (58%)    │ -AED 1,200 (42%)      │
│               │                    │ ↑ green             │ ↑ red                 │
└───────────────┴────────────────────┴─────────────────────┴───────────────────────┘
```

**Header Row Design:**
- Project name: Large, colored (theme-aware)
- Developer: Small, muted text
- Zone: Small, muted text below developer
- Drag handle: `⋮⋮` icon, visible on hover

**Rent Coverage Row Logic:**
1. If no post-handover plan → show "—"
2. If positive cashflow → show "+AED X,XXX" in **green** with "(XX%)" small
3. If negative cashflow → show "-AED X,XXX" in **red** with "(XX%)" small

## Technical Implementation

### 1. Create `ComparisonTable.tsx`

The new unified component replaces both `CompareHeader` and `MetricsTable`:

```typescript
interface ComparisonTableProps {
  quotesWithCalcs: QuoteWithCalculations[];
  onReorder?: (newOrder: string[]) => void;
  currency?: Currency;
  exchangeRate?: number;
}
```

**Features:**
- `@dnd-kit/sortable` on header cells for drag-and-drop columns
- Synchronized metric rows following header order
- Theme-aware colors using `getQuoteColors()`
- Full translation support with `useLanguage()`

### 2. Rent Coverage Calculation

Reuse logic from `CompactPostHandoverCard.tsx`:
```typescript
const getRentCoverage = (item: QuoteWithCalculations) => {
  const inputs = item.quote.inputs;
  if (!inputs.hasPostHandoverPlan) return null;
  
  // Calculate post-HO payments
  const postPayments = inputs.postHandoverPayments?.length > 0 
    ? inputs.postHandoverPayments 
    : inputs.additionalPayments?.filter(p => isAfterHandover(p));
  
  if (postPayments.length === 0) return null;
  
  const postTotal = inputs.basePrice * (inputs.postHandoverPercent / 100);
  const durationMonths = calculateDuration(postPayments);
  const monthlyPayment = postTotal / durationMonths;
  
  // Monthly rent (from calculations)
  const monthlyRent = item.calculations.holdAnalysis.netAnnualRent / 12;
  
  const cashflow = monthlyRent - monthlyPayment;
  const coveragePercent = Math.min(100, (monthlyRent * durationMonths / postTotal) * 100);
  
  return { cashflow, coveragePercent, isPositive: cashflow >= 0 };
};
```

### 3. Zone Name Access

Zone is stored in `inputs._clientInfo.zoneName` or can be fetched via `inputs.zoneId`:
```typescript
const getZoneName = (quote: ComparisonQuote) => {
  const clientInfo = quote.inputs._clientInfo as any;
  return clientInfo?.zoneName || null;
};
```

### 4. Translation Keys to Add

| Key | EN | ES |
|-----|----|----|
| `propertyValue` | Property Value | Valor de Propiedad |
| `area` | Area | Área |
| `preHandoverSpend` | Pre-Handover | Pre-Entrega |
| `postHandoverSpend` | Post-Handover | Post-Entrega |
| `rentCoverage` | Rent Coverage | Cobertura Alquiler |

## Files to Modify

| File | Action |
|------|--------|
| `src/components/roi/compare/ComparisonTable.tsx` | **CREATE** - New unified table component |
| `src/components/roi/compare/index.ts` | **UPDATE** - Export `ComparisonTable` |
| `src/pages/QuotesCompare.tsx` | **UPDATE** - Replace `CompareHeader` + `MetricsTable` with `ComparisonTable` |
| `src/pages/CompareView.tsx` | **UPDATE** - Replace with `ComparisonTable` |
| `src/components/presentation/PresentationPreview.tsx` | **UPDATE** - Replace with `ComparisonTable` |
| `src/contexts/LanguageContext.tsx` | **UPDATE** - Add missing translation keys |

## Benefits

1. **Single Component** - One unified table for all comparison views
2. **Drag-to-Reorder** - Header drag moves entire column
3. **Full i18n** - All labels translated (EN/ES)
4. **Focused Metrics** - Only essential data for quick comparison
5. **Clear Visual Feedback** - Green/red for positive/negative cashflow
6. **Developer + Zone Info** - Quick context in header row

