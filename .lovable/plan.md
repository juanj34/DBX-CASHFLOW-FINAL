
# Plan: Fix Presentation Issues - Exit Scenarios, Export Buttons, and Comparison Improvements

## Issues Identified

### 1. Exit Scenarios Showing AED 0
**Root Cause**: In `CompactAllExitsCard.tsx`, the component looks up scenarios from `calculations.scenarios` by matching `exitMonths`. However, `useOICalculations` generates scenarios at fixed 6-month intervals (6, 12, 18, 24...), while the saved exit scenarios might be at different months (e.g., 10, 13, 16). When there's no match, it falls back to zeros.

**Solution**: Instead of doing a simple lookup, calculate the scenario data dynamically using the same functions from `constructionProgress.ts`, or generate scenarios for the specific requested months in `useOICalculations`.

### 2. Toggle View Button Still Showing
**Analysis**: The code in `PresentationPreview.tsx` (line 684) already forces `viewMode="snapshot"`. If you're still seeing a toggle, it could be:
- Browser cache showing old version
- A different component (PropertyHeroCard has currency/language selectors)

**Solution**: Verify hard refresh clears it; if not, audit PropertyHeroCard for any view toggles.

### 3. Export Buttons Missing from Sidebar
**Analysis**: The code at lines 337-349 of `PresentationView.tsx` shows download buttons ARE implemented. The issue might be:
- Buttons render but are visually hidden
- The NavItem component isn't being used correctly

**Solution**: Ensure download buttons have proper visibility and styling.

### 4. Drag/Reorder Cards in Comparison
**Implementation**: Add @dnd-kit sortable capability to comparison cards.

### 5. Post-Handover Payment Plan Visualization
**Issue**: The comparison needs to better visualize 4-part payment structure (Downpayment / Pre-Handover / On-Handover / Post-Handover).

---

## File Changes

### 1. Fix Exit Scenarios Calculation - `CompactAllExitsCard.tsx`

Generate exit scenarios dynamically using `calculateExitScenario` instead of lookup:

```tsx
import { calculateExitScenario, calculateExitPrice } from '../constructionProgress';

// Instead of:
const preCalcScenario = calculations.scenarios.find(s => s.exitMonths === exitMonths);

// Calculate dynamically:
const exitData = calculateExitScenario(
  exitMonths,
  calculations.totalMonths,
  inputs.basePrice,
  inputs,
  calculations.totalEntryCosts
);
```

### 2. Ensure Export Buttons Visible - `PresentationView.tsx`

The download button exists but might need styling fixes. Verify the NavItem button is visible:

```tsx
{/* Download button for quotes - ensure visible */}
{item.type === 'quote' && (
  <Button
    variant="ghost"
    size="icon"
    className="h-7 w-7 text-theme-text-muted hover:text-theme-accent shrink-0 opacity-100"
    onClick={(e) => {
      e.stopPropagation();
      handleDownloadQuote(item.id);
    }}
  >
    <Download className="w-3.5 h-3.5" />
  </Button>
)}
```

### 3. Add Drag/Reorder to Comparison - `PaymentComparison.tsx`

Integrate @dnd-kit for sortable quote cards:

```tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';

// Wrap cards in DndContext with SortableContext
// Add useSortable hook to each card
// Emit order changes via callback
```

### 4. Improve Post-Handover Visualization - `PaymentComparison.tsx`

Ensure 4-part breakdown shows correctly:
- Fix postHandoverPercent calculation (already done)
- Add visual distinction for each segment
- Show "Total to Handover" vs "Total Post-Handover" amounts

### 5. Add Currency/Rate to Comparison Components

Pass currency and rate through to `PaymentComparison`, `GrowthComparisonChart`, and `ExitComparison` from PresentationPreview.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/roi/snapshot/CompactAllExitsCard.tsx` | Calculate exit scenarios dynamically instead of lookup |
| `src/pages/PresentationView.tsx` | Ensure export buttons visible, add "Export All" batch functionality |
| `src/components/roi/compare/PaymentComparison.tsx` | Add @dnd-kit drag support, improve post-handover visualization |
| `src/components/presentation/PresentationPreview.tsx` | Pass currency/rate to comparison components |
| `src/components/roi/compare/ExitComparison.tsx` | Calculate scenarios dynamically to avoid AED 0 |

---

## Technical Notes

**Exit Scenario Calculation Fix**:
The key fix is using `calculateExitScenario()` from `constructionProgress.ts` which properly calculates:
- Exit price based on appreciation phases
- Total capital deployed at that point
- True profit after costs
- Annualized ROE

This ensures the snapshot displays correct values regardless of what exit months are specified.

**Drag/Reorder Implementation**:
- Use @dnd-kit (already installed)
- Wrap comparison cards in DndContext
- Use horizontalListSortingStrategy
- Persist order changes to parent component
- Visual feedback during drag

---

## Expected Results

| Before | After |
|--------|-------|
| Exit: AED 0, +AED 0, 0% | Exit: AED 245,679, +AED 12,340, 5% |
| No export button visible | Download button next to each quote |
| Fixed card order | Drag to reorder cards in comparison |
| Post-handover shows 0 | Shows actual post-handover breakdown |
