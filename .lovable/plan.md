
# Sync Export Components with Live View Adaptive Layouts

## Problem Summary

The live UI (`SnapshotContent.tsx`) has been updated with:
1. **Adaptive stacked layout** for long payment plans (>12 payments)
2. **Dynamic card grid** that adjusts columns based on visible cards (1-4)
3. **Multi-column payment table** (2 or 3 columns) for long plans

However, the export components haven't been updated to match:
- `ExportSnapshotDOM.tsx` uses a fixed 2-column layout for all cases
- `SnapshotPrintContent.tsx` is missing `CompactPostHandoverCard` in the stacked layout

## Files to Update

| File | Current Issue | Fix Needed |
|------|--------------|------------|
| `src/components/roi/export/ExportSnapshotDOM.tsx` | Fixed 2-column layout | Add adaptive layout logic matching SnapshotContent |
| `src/components/roi/snapshot/SnapshotPrintContent.tsx` | Missing PostHandover card in stacked layout | Add the card and use dynamic grid |

---

## Technical Changes

### 1. Update `ExportSnapshotDOM.tsx`

Add the same adaptive layout logic as `SnapshotContent.tsx`:

```typescript
// Check if long payment plan
const isLongPaymentPlan = (inputs.additionalPayments || []).length > 12;

// Check visibility conditions
const showRent = inputs.rentalYieldPercent > 0;
const showExits = inputs.enabledSections?.exitStrategy !== false && exitScenarios.length > 0 && calculations.basePrice > 0;
const showPostHandover = inputs.hasPostHandoverPlan;
const showMortgage = mortgageInputs.enabled;

// Count visible cards for dynamic grid
const visibleCardCount = [showRent, showExits, showPostHandover, showMortgage].filter(Boolean).length;
```

Replace the fixed 2-column grid with conditional layout:

```typescript
{isLongPaymentPlan ? (
  /* STACKED LAYOUT for long payment plans */
  <div style={{ marginBottom: '16px' }}>
    {/* Payment Table - Full Width */}
    <div style={{ marginBottom: '16px' }}>
      <ExportPaymentTable ... twoColumnMode={true} />
    </div>
    
    {/* Insight Cards - dynamic grid */}
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleCardCount}, 1fr)`, gap: '12px' }}>
      {showRent && <ExportRentCard ... />}
      {showExits && <ExportExitCards ... />}
      {showPostHandover && <ExportPostHandoverCard ... />}
      {showMortgage && <ExportMortgageCard ... />}
    </div>
  </div>
) : (
  /* ORIGINAL 2-COLUMN LAYOUT for short payment plans */
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
    ...
  </div>
)}
```

### 2. Update `SnapshotPrintContent.tsx`

Add the missing `CompactPostHandoverCard` to the stacked layout's dynamic grid:

```typescript
{/* Dynamic grid for print */}
<div style={getCardGridStyle()}>
  {showRent && <CompactRentCard ... />}
  {showExits && <CompactAllExitsCard ... />}
  {showPostHandover && <CompactPostHandoverCard ... />}  {/* ADD THIS */}
  {showMortgage && <CompactMortgageCard ... />}
</div>
```

---

## Expected Result

After these changes:
- **PNG/PDF exports** will match the live view layout exactly
- Long payment plans (>12 payments) will use stacked layout with full-width payment table
- Bottom insight cards will expand to fill the row (3 cards → 3 columns, not 4 columns with 1 empty)
- Post-handover coverage card will appear in exports when enabled

---

## Visual Comparison

**Before (Export with 25+ payments):**
```text
┌─────────────────────────────────────────────────────────────┐
│   Payment Table (narrow)  │   Rent │ Exits │ Post │ Mort  │
│   (cramped 1-column)      │   Card │ Card  │ Card │ Card  │
└─────────────────────────────────────────────────────────────┘
^ Fixed 2-column, payment table squeezed
```

**After (Export with 25+ payments):**
```text
┌─────────────────────────────────────────────────────────────┐
│           Payment Table (Full Width, 3-column)              │
├─────────────────────────────────────────────────────────────┤
│   Rent Card   │   Exit Card   │   Post-Handover Card        │
│   (expands)   │   (expands)   │   (expands - no empty)      │
└─────────────────────────────────────────────────────────────┘
^ Stacked layout, cards expand to fill row
```
