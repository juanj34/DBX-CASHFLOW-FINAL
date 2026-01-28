

# Plan: Scrollable Payment List + "Cash Until Handover" Summary

## Understanding the Requirements

1. **Scrollable payments list** - When there are many payments (like 51 in your case), make The Journey and Post-Handover sections scrollable in the snapshot view
2. **Remove subtotals** - Remove the "Subtotal" rows from The Journey and Post-Handover sections
3. **Add "Total Until Handover" summary** - Show the total cash needed until handover (Entry + Journey + On Handover) so clients know how much money they need before rental income starts
4. **Show all payments** - Continue showing all individual payments including post-handover
5. **Fix post-handover bug** - Derive post-handover payments from `additionalPayments` (where they're stored) instead of the empty `postHandoverPayments` array

---

## Technical Changes

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

#### 1. Import ScrollArea Component

```typescript
import { ScrollArea } from '@/components/ui/scroll-area';
```

#### 2. Derive Post-Handover Payments from additionalPayments (Lines 107-125)

Currently the component reads from `inputs.postHandoverPayments` which is always empty. Fix by filtering `additionalPayments`:

```typescript
// Derive post-handover payments from additionalPayments by date
const derivedPostHandoverPayments = hasPostHandoverPlan
  ? sortedPayments.filter(p => {
      if (p.type !== 'time') return false;
      return isPaymentPostHandover(p.triggerValue, bookingMonth, bookingYear, handoverQuarter, handoverYear);
    })
  : [];

// Update preHandoverPayments to exclude post-handover ones
const preHandoverPayments = hasPostHandoverPlan
  ? sortedPayments.filter(p => {
      if (p.type !== 'time') return true;
      return !isPaymentPostHandover(p.triggerValue, bookingMonth, bookingYear, handoverQuarter, handoverYear);
    })
  : sortedPayments;

// Calculate totals from derived arrays
postHandoverTotal = derivedPostHandoverPayments.reduce(
  (sum, p) => sum + (basePrice * p.paymentPercent / 100), 0
);
```

#### 3. Calculate "Total Until Handover" (New)

Add a new calculation for the total cash needed before rental income:

```typescript
// Total Cash Until Handover = Entry + Journey + On Handover
const totalUntilHandover = entryTotal + journeyTotal + handoverAmount;
```

#### 4. Wrap Payment Lists in ScrollArea (The Journey Section)

Make the payments scrollable with a max height:

```tsx
<div className="space-y-1">
  <ScrollArea className="max-h-[200px]">
    <div className="space-y-1 pr-2">
      {preHandoverPayments.map((payment, index) => (
        // ... payment rows
      ))}
    </div>
  </ScrollArea>
  {/* NO subtotal row here anymore */}
</div>
```

#### 5. Wrap Post-Handover Section in ScrollArea

Same treatment for post-handover payments:

```tsx
<ScrollArea className="max-h-[150px]">
  <div className="space-y-1 pr-2">
    {derivedPostHandoverPayments.map((payment, index) => (
      // ... payment rows
    ))}
  </div>
</ScrollArea>
{/* NO subtotal row here anymore */}
```

#### 6. Remove Subtotal Rows

Delete these blocks:
- Lines 319-327: Journey subtotal
- Lines 375-383: Post-handover subtotal

#### 7. Add "Total Until Handover" Summary (After Handover Section)

Add a prominent summary card showing the cash needed before rental starts:

```tsx
{/* Cash Until Handover Summary - Key metric for clients */}
<div className="bg-theme-accent/10 border border-theme-accent/30 rounded-lg p-2">
  <div className="text-[10px] uppercase tracking-wide text-theme-accent font-semibold mb-1">
    Total Cash Until Handover
  </div>
  <DottedRow 
    label="Entry + Journey + Handover"
    value={getDualValue(totalUntilHandover).primary}
    secondaryValue={getDualValue(totalUntilHandover).secondary}
    bold
    valueClassName="text-theme-accent"
  />
  <p className="text-[10px] text-theme-text-muted mt-1">
    Cash required before rental income starts (1 month after handover)
  </p>
</div>
```

---

## Visual Comparison

### Before:
```
┌─────────────────────────────────────────────────┐
│ PAYMENT BREAKDOWN                               │
├─────────────────────────────────────────────────┤
│ THE ENTRY                                       │
│ • Downpayment...              AED 508,000       │
│ • DLD Fee...                  AED 101,600       │
│ └ Total Entry                 AED 649,600       │
├─────────────────────────────────────────────────┤
│ THE JOURNEY (23mo)                              │
│ • Month 1 (Feb'25)            AED 25,400        │
│ • Month 2...                  AED 25,400        │  ← No scroll
│ • ... (only pre-handover shown)                 │  ← Post-HO missing!
│ └ Subtotal                    AED 558,800       │  ← Confusing subtotal
├─────────────────────────────────────────────────┤
│ POST-HANDOVER                                   │
│ (nothing shown - empty array!)                  │  ← BUG
└─────────────────────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────────────────────┐
│ PAYMENT BREAKDOWN                               │
├─────────────────────────────────────────────────┤
│ THE ENTRY                                       │
│ • Downpayment...              AED 508,000       │
│ • DLD Fee...                  AED 101,600       │
│ └ Total Entry                 AED 649,600       │
├─────────────────────────────────────────────────┤
│ THE JOURNEY (23mo)                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ • Month 1 (Feb'25)          AED 25,400      │ │
│ │ • Month 2 (Mar'25)          AED 25,400      │▒│  ← Scrollable!
│ │ • Month 3 (Apr'25)          AED 25,400      │▒│
│ │ • ...more payments          ...             │▒│
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ON HANDOVER (0%)                                │
│ • Handover Payment            AED 0             │
├─────────────────────────────────────────────────┤
│ ┌─ 💰 TOTAL CASH UNTIL HANDOVER ────────────┐   │  ← NEW!
│ │ Entry + Journey + Handover  AED 1,208,400 │   │
│ │ Cash required before rental income starts │   │
│ └────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│ POST-HANDOVER (29%)                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ • Month 24 (Jan'27)         AED 25,400      │ │
│ │ • Month 25 (Feb'27)         AED 25,400      │▒│  ← Shows now!
│ │ • ...29 payments            ...             │▒│  ← Scrollable!
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Base Property Price           AED 2,540,000     │
│ Transaction Fees              AED 141,600       │
│ TOTAL INVESTMENT              AED 2,681,600     │
└─────────────────────────────────────────────────┘
```

---

## PDF Export Consideration

The ScrollArea will **not affect PDF export** because:
1. The export uses `ExportSnapshotDOM.tsx` which has its own static layout
2. The snapshot CSS already uses `data-export-layout` attributes for export mode
3. We can add a CSS rule to override scroll in export mode if needed

---

## Files to Modify

| File | Changes |
|------|--------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | 1. Import ScrollArea<br>2. Fix post-handover payments derivation<br>3. Wrap payment lists in ScrollArea<br>4. Remove subtotals<br>5. Add "Total Until Handover" summary |

---

## Benefits

1. **Scrollable list** - Long payment plans don't overflow the card
2. **Clear cash requirement** - Clients see exactly how much they need until handover
3. **All payments visible** - Both pre and post-handover payments are shown
4. **Cleaner layout** - No confusing subtotals
5. **PDF unaffected** - Export uses separate static component

