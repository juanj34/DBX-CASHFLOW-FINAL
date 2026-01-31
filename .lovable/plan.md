
# Adaptive Payment Layout Improvements

## Problem Summary

Looking at the screenshot, I can identify three issues:

1. **Bottom cards use fixed 4-column grid** - Even when only 3 cards are visible (Rental Income, Exit Scenarios, Post-Handover Coverage), the layout uses 4 columns leaving empty space
2. **Text overflow in Post-Handover Coverage card** - Values like "AED 349,36..." are being truncated
3. **Vertical height still excessive** - User wants to explore 3-column payment breakdown instead of 2-column to further reduce scroll depth

---

## Technical Solution

### 1. Dynamic Column Grid for Bottom Cards

**Current Code (SnapshotContent.tsx line 141):**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
```

**Problem:** Always uses 4 columns on xl screens regardless of how many cards are visible.

**Solution:** Count visible cards and apply dynamic grid classes:

```typescript
// Count visible cards
const visibleCards = [showRent, showExits, showPostHandover, showMortgage].filter(Boolean).length;

// Dynamic grid based on card count
const cardGridClass = useMemo(() => {
  switch (visibleCards) {
    case 1: return 'grid grid-cols-1';
    case 2: return 'grid grid-cols-1 md:grid-cols-2';
    case 3: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    case 4: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    default: return 'grid grid-cols-1';
  }
}, [visibleCards]);
```

This ensures:
- 3 cards → 3 columns (fills the row completely)
- 2 cards → 2 columns
- 4 cards → 4 columns

---

### 2. Fix Text Overflow in Cards

**Identified Issues:**

In `CompactPostHandoverCard.tsx`:
- Values like "AED 349,368" are truncating due to insufficient space
- The DottedRow component uses `whitespace-nowrap` which prevents wrapping

**Solution:** Add `truncate` and `min-w-0` to value containers, or use responsive text sizing:

```typescript
// In DottedRow.tsx - ensure proper truncation
<span className={cn(
  'font-mono tabular-nums text-theme-text text-sm',
  'truncate min-w-0',  // Add truncation safety
  bold && 'font-semibold',
  valueClassName
)}>
```

For the Post-Handover card specifically, reduce font size on smaller containers:
```typescript
// In CompactPostHandoverCard.tsx - use slightly smaller text in tight layouts
<DottedRow 
  label={...}
  value={...}
  className="text-xs"  // Smaller text to prevent overflow
/>
```

Also add `overflow-hidden` to the card container and ensure values have room to breathe.

---

### 3. Three-Column Payment Breakdown Option

**Current:** Journey payments split into 2 columns
**Proposed:** Add support for 3 columns to further reduce height

**Implementation:**

Modify `CompactPaymentTable.tsx` to support a `threeColumnMode` or extend `twoColumnMode` to `'auto' | 'two' | 'three' | 'never'`:

```typescript
interface CompactPaymentTableProps {
  // ... existing props
  twoColumnMode?: 'auto' | 'always' | 'never';
  columnCount?: 2 | 3;  // New prop for explicit control
}
```

**Column splitting logic:**
```typescript
const splitIntoColumns = (payments: PaymentMilestone[], numColumns: number) => {
  const itemsPerColumn = Math.ceil(payments.length / numColumns);
  return Array.from({ length: numColumns }, (_, i) => 
    payments.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
  );
};
```

**Rendering:**
```typescript
{useTwoColumns && (
  <div className={cn(
    "grid gap-4",
    columnCount === 3 ? "grid-cols-3" : "grid-cols-2"
  )}>
    {splitColumns.map((columnPayments, colIndex) => (
      <div key={colIndex} className="space-y-1">
        {columnPayments.map((payment, index) => renderPaymentRow(...))}
      </div>
    ))}
  </div>
)}
```

**Threshold Logic:**
- 12-20 payments → 2 columns
- 21+ payments → 3 columns (optional auto-upgrade)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/SnapshotContent.tsx` | Dynamic grid class based on visible card count |
| `src/components/roi/snapshot/SnapshotPrintContent.tsx` | Same dynamic grid logic |
| `src/components/roi/export/ExportSnapshotLayout.tsx` | Dynamic grid for export layout |
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Add 3-column support, fix text sizing |
| `src/components/roi/snapshot/CompactPostHandoverCard.tsx` | Fix text overflow with smaller fonts |
| `src/components/roi/snapshot/DottedRow.tsx` | Add truncation safety classes |

---

## Visual Result

**Before (Current):**
```
┌─────────────────────────────────────────────────────────────┐
│ Rental Income │ Exit Scenarios │ Post-Handover │   EMPTY   │
│     CARD      │      CARD      │     CARD      │   SPACE   │
└─────────────────────────────────────────────────────────────┘
```

**After (Fixed):**
```
┌───────────────────────────────────────────────────────────┐
│   Rental Income   │   Exit Scenarios   │   Post-Handover │
│        CARD       │        CARD        │       CARD      │
└───────────────────────────────────────────────────────────┘
```

**3-Column Payment Breakdown (Optional):**
```
┌───────────────────────────────────────────────────────────┐
│ ENTRY              │ JOURNEY (cont.)    │ JOURNEY (cont.) │
│ Booking Fee        │ Month 15           │ Month 30        │
│ Downpayment        │ Month 16           │ Month 31        │
│ DLD + Oqood        │ Month 17           │ POST-HANDOVER   │
│                    │ ...                │ Month +1        │
│ JOURNEY (start)    │                    │ Month +2...     │
│ Month 1            │                    │                 │
│ Month 14           │                    │                 │
├───────────────────────────────────────────────────────────┤
│ Total Investment                              AED 1,093K  │
└───────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

1. **Dynamic card grid** - Quick fix, high impact
2. **Text overflow fixes** - Critical for readability
3. **3-column payment layout** - Enhanced feature, optional
