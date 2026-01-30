
# Plan: Fix PNG Export Dual Currency & Add Drag-to-Select for Payment Rows

## Problem 1: PNG Export Missing Dual Currency Values

### Analysis
The export components (`ExportPaymentTable.tsx`, `ExportOverviewCards.tsx`, etc.) are NOT showing the secondary currency (e.g., EUR/USD) alongside AED in many places. The `formatDualCurrency()` function returns both `.primary` (AED) and `.secondary` (converted value), but only `.primary` is displayed in most payment rows.

### Solution
Update all export components to display dual currency values inline (AED + converted in parentheses) when a non-AED currency is selected:

**Files to modify:**
1. `src/components/roi/export/ExportPaymentTable.tsx`
   - Add secondary value display after primary for: EOI, Downpayment, DLD, Oqood, all journey payments, handover, post-handover payments, subtotals, and grand total
   - Format: `{primary} ({secondary})` when secondary exists

2. `src/components/roi/export/ExportOverviewCards.tsx` (already mostly correct, verify)

3. `src/components/roi/export/ExportExitCards.tsx`
   - Ensure all monetary values show dual currency

4. `src/components/roi/export/ExportRentCard.tsx`
   - Ensure monthly/annual rent shows dual currency

5. `src/components/roi/export/ExportMortgageCard.tsx`
   - Ensure mortgage values show dual currency

6. `src/components/roi/export/ExportPostHandoverCard.tsx`
   - Ensure all amounts show dual currency

---

## Problem 2: Payment Row Drag-to-Select

### Analysis
Currently, users must click each payment row individually to select it. The user wants Excel-like behavior where they can click and drag across multiple rows to select them in a single gesture.

### Solution
Implement mouse-based drag selection using `onMouseDown`, `onMouseMove`, and `onMouseUp` events with a tracking state for the drag operation.

**File to modify:** `src/components/roi/snapshot/CompactPaymentTable.tsx`

**Implementation approach:**
1. Add a `isDragging` ref to track when user is actively dragging
2. Add a `dragStartId` ref to remember where the drag started
3. On `mousedown` on a payment row:
   - Set `isDragging = true`
   - Start tracking which rows are part of the drag gesture
   - Store the starting row ID
4. On `mousemove` (document-level while dragging):
   - Track which rows the mouse passes over
   - Add them to the selection set
5. On `mouseup`:
   - Set `isDragging = false`
   - Finalize the selection
6. Keep existing click-to-toggle for individual row selection
7. Add `user-select: none` during drag to prevent text selection

**Key code changes:**
```typescript
// New refs for drag tracking
const isDragging = useRef(false);
const dragStartY = useRef<number | null>(null);
const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

// On mousedown on a row
const handleRowMouseDown = (e: React.MouseEvent, id: string, amount: number) => {
  isDragging.current = true;
  dragStartY.current = e.clientY;
  // Clear previous selection and start fresh with this row
  setSelectedPayments(new Map([[id, amount]]));
};

// On mousemove (attached to document while dragging)
// Check if mouse Y intersects with any row bounds
// If so, add that row to selection

// On mouseup
// Finalize selection, reset isDragging
```

**Visual feedback:**
- During drag, show a subtle "dragging" state (e.g., cursor change)
- Rows being added to selection highlight immediately
- Keep the animated selection bar at bottom

---

## Technical Details

### ExportPaymentTable.tsx Changes
```typescript
// Before (line 271):
<span style={valueStyle}>{getDualValue(amount).primary}</span>

// After:
<span style={valueStyle}>
  {getDualValue(amount).primary}
  {getDualValue(amount).secondary && (
    <span style={{ color: 'hsl(var(--theme-text-muted))', marginLeft: '4px' }}>
      ({getDualValue(amount).secondary})
    </span>
  )}
</span>
```

### CompactPaymentTable.tsx Drag Selection
```typescript
// Add to component
const isDragging = useRef(false);
const rowElements = useRef<Map<string, { id: string; amount: number; element: HTMLDivElement }>>(new Map());

// Wrapper for each selectable row
const handleMouseDown = (e: React.MouseEvent, id: string, amount: number) => {
  e.preventDefault(); // Prevent text selection
  isDragging.current = true;
  setSelectedPayments(new Map([[id, amount]]));
};

const handleMouseEnter = (id: string, amount: number) => {
  if (isDragging.current) {
    setSelectedPayments(prev => {
      const next = new Map(prev);
      next.set(id, amount);
      return next;
    });
  }
};

// Add document-level mouseup listener
useEffect(() => {
  const handleMouseUp = () => {
    isDragging.current = false;
  };
  document.addEventListener('mouseup', handleMouseUp);
  return () => document.removeEventListener('mouseup', handleMouseUp);
}, []);
```

---

## Files to Modify

1. **`src/components/roi/export/ExportPaymentTable.tsx`**
   - Add dual currency display to all monetary value rows

2. **`src/components/roi/export/ExportExitCards.tsx`**
   - Add dual currency display to exit scenario values

3. **`src/components/roi/export/ExportRentCard.tsx`**
   - Add dual currency display to rent values

4. **`src/components/roi/export/ExportMortgageCard.tsx`**
   - Add dual currency display to mortgage values

5. **`src/components/roi/export/ExportPostHandoverCard.tsx`**
   - Add dual currency display to post-handover values

6. **`src/components/roi/snapshot/CompactPaymentTable.tsx`**
   - Add drag-to-select functionality with mousedown/mousemove/mouseup

---

## Testing Checklist
- [ ] PNG export shows dual currency (e.g., "AED 100,000 (€25,000)") for all values
- [ ] PDF export shows dual currency for all values
- [ ] Drag-to-select works by clicking and dragging across multiple payment rows
- [ ] Single click still toggles individual row selection
- [ ] Selection clears when clicking outside the table
- [ ] PaymentSelectionBar shows correct sum/average for dragged selection
