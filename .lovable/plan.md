
# Adaptive 2-Column Payment Layout for Long Quotes

## Problem Analysis

Looking at the screenshot, I can see a 28-month payment plan creating a payment breakdown that's **extremely long vertically** (30+ rows), pushing the important insight cards (Rental Income, Exit Scenarios, Post-Handover Coverage) far down the page. This creates a poor reading experience where:

1. Clients have to scroll excessively to see key metrics
2. The right column is underutilized (it only has 3-4 small cards)
3. Visual balance is lost - left column is 3x taller than right

## Proposed Solution: Adaptive Payment Layout

When payment count exceeds a threshold (e.g., 15 installments), automatically switch to a **2-column payment layout** with insight cards flowing underneath in a consistent grid.

```text
CURRENT LAYOUT (Long quotes)
─────────────────────────────────────────────────────────
┌─────────────────────────────┐ ┌──────────────────────┐
│                             │ │  Rental Income       │
│                             │ └──────────────────────┘
│                             │ ┌──────────────────────┐
│     PAYMENT BREAKDOWN       │ │  Exit Scenarios      │
│     (30+ rows)              │ └──────────────────────┘
│     Scrolls forever...      │ ┌──────────────────────┐
│                             │ │  Post-HO Coverage    │
│                             │ └──────────────────────┘
│                             │ ┌──────────────────────┐
│                             │ │  Mortgage            │
│                             │ └──────────────────────┘
│                             │
│                             │       ← Empty space
│                             │
└─────────────────────────────┘

NEW ADAPTIVE LAYOUT (Long quotes)
─────────────────────────────────────────────────────────
┌───────────────────────────────────────────────────────┐
│                 PAYMENT BREAKDOWN                     │
│ ┌─────────────────────────┐ ┌───────────────────────┐ │
│ │ ENTRY                   │ │ JOURNEY (Months 13-28)│ │
│ │ EOI, Downpayment, DLD   │ │ 1% Month 13           │ │
│ │                         │ │ 1% Month 14           │ │
│ │ JOURNEY (Months 1-12)   │ │ ...                   │ │
│ │ 5% Month 2              │ │ 8% Month 24           │ │
│ │ 10% Month 3             │ │                       │ │
│ │ 1% Month 4              │ │ POST-HANDOVER         │ │
│ │ ...                     │ │ 1% Month +1           │ │
│ │ 1% Month 12             │ │ 1% Month +2...        │ │
│ └─────────────────────────┘ └───────────────────────┘ │
│                    [ TOTAL INVESTMENT ]               │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│   RENTAL INCOME   │   EXIT SCENARIOS   │  POST-HO    │
│   ┌───────────┐   │   ┌───────────┐    │ ┌─────────┐ │
│   │  Gross    │   │   │ #1 18m    │    │ │Coverage │ │
│   │  Net/Year │   │   │ #2 24m    │    │ │ Matrix  │ │
│   └───────────┘   │   └───────────┘    │ └─────────┘ │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│                   MORTGAGE ANALYSIS                   │
└───────────────────────────────────────────────────────┘
```

## Technical Approach

### 1. Update `CompactPaymentTable.tsx`

Add a **compact 2-column mode** prop that:
- Splits payment rows into 2 columns when `journeyPayments.length > 12`
- Places Entry section in left column header
- Distributes Journey payments evenly between columns
- Places On-Handover / Post-Handover at bottom spanning both columns

```typescript
interface CompactPaymentTableProps {
  // ...existing props
  twoColumnMode?: 'auto' | 'always' | 'never';  // Default: 'auto'
}

// Inside component:
const useTwoColumns = useMemo(() => {
  if (twoColumnMode === 'never') return false;
  if (twoColumnMode === 'always') return true;
  // Auto: trigger when pre-handover + post-handover payments > 12
  const totalPayments = preHandoverPayments.length + derivedPostHandoverPayments.length;
  return totalPayments > 12;
}, [twoColumnMode, preHandoverPayments, derivedPostHandoverPayments]);
```

### 2. Column Split Logic

Split payments into left/right columns:

```typescript
const splitPayments = useMemo(() => {
  if (!useTwoColumns) return { left: preHandoverPayments, right: [] };
  
  const midpoint = Math.ceil(preHandoverPayments.length / 2);
  return {
    left: preHandoverPayments.slice(0, midpoint),
    right: preHandoverPayments.slice(midpoint),
  };
}, [useTwoColumns, preHandoverPayments]);
```

### 3. Update `SnapshotContent.tsx` Layout

Change from fixed 2-column grid to **adaptive stacked layout**:

```typescript
// Determine if we have a long payment schedule
const isLongPaymentPlan = useMemo(() => {
  const payments = inputs.additionalPayments || [];
  return payments.length > 12;
}, [inputs.additionalPayments]);

// Render layout:
{isLongPaymentPlan ? (
  // STACKED LAYOUT: Payment full width, then 3-column cards below
  <div className="flex flex-col gap-4">
    {/* Payment Table - Full Width with 2 internal columns */}
    <CompactPaymentTable
      {...props}
      twoColumnMode="auto"
    />
    
    {/* Insight Cards - 3 columns on desktop, 1 on mobile */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {showRent && <CompactRentCard {...} />}
      {showExits && <CompactAllExitsCard {...} />}
      {showPostHandover && <CompactPostHandoverCard {...} />}
      {showMortgage && <CompactMortgageCard {...} />}
    </div>
  </div>
) : (
  // ORIGINAL LAYOUT: 2 columns side by side
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <CompactPaymentTable {...props} />
    <div className="flex flex-col gap-3">
      {/* Cards stacked */}
    </div>
  </div>
)}
```

### 4. Internal Payment Table Styling

For 2-column mode within the payment card:

```typescript
// Section: The Journey - 2-column layout
{useTwoColumns && preHandoverPayments.length > 0 && (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-cyan-400 font-semibold mb-2">
      {t('theJourneyLabel')} ({totalMonths}{t('moShort')})
    </div>
    <div className="grid grid-cols-2 gap-4">
      {/* Left Column */}
      <div className="space-y-1">
        {splitPayments.left.map((payment, index) => (
          <PaymentRow key={index} payment={payment} />
        ))}
      </div>
      {/* Right Column */}
      <div className="space-y-1">
        {splitPayments.right.map((payment, index) => (
          <PaymentRow key={index} payment={payment} />
        ))}
      </div>
    </div>
  </div>
)}
```

## Files to Modify

| File | Changes |
|------|---------|
| `CompactPaymentTable.tsx` | Add `twoColumnMode` prop, split logic, 2-column grid for Journey section |
| `SnapshotContent.tsx` | Adaptive layout based on payment count |
| `CashflowView.tsx` | Same adaptive logic for consistency |
| `ExportSnapshotLayout.tsx` | Ensure export respects 2-column mode |

## Visual Benefits

1. **Reduced scroll depth** - Payment fits in ~50% of current height
2. **Better balance** - Content is horizontally distributed
3. **Cards at eye level** - Key metrics (exits, rent) are immediately visible
4. **Consistent reading flow** - Natural left-to-right, top-to-bottom

## Threshold Configuration

The auto-switch threshold (12 payments) can be tuned:
- **12 payments**: Typical monthly plans for 1-year construction
- **15 payments**: More conservative, only for very long plans
- **8 payments**: Aggressive, switches sooner

## Edge Cases

- **Short plans (< 12 payments)**: Original side-by-side layout
- **Post-handover plans**: Post-HO payments flow into right column
- **Export mode**: Always use 2-column for consistency
- **Mobile**: Single column stacked regardless of payment count

