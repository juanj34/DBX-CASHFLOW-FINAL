
# Plan: Comparison View Cleanup & Edit Functionality

## Overview

This plan addresses three improvements to the comparison view:
1. Remove construction/appreciation metrics from the comparison
2. Enable editing comparisons in the presentation builder (add/remove quotes)
3. Remove the large property cards at the top of comparisons

---

## 1. Remove Construction/Appreciation Metrics

### Changes Required

**File: `src/hooks/useQuotesComparison.ts`**
- Remove `constructionAppreciation` and `growthAppreciation` from the `ComparisonMetrics` interface (lines 32-33)
- Remove the calculation of these metrics from `computeComparisonMetrics` function (lines 187-189, 203-204)

Current interface:
```typescript
export interface ComparisonMetrics {
  basePrice: { value: number }[];
  pricePerSqft: { value: number | null }[];
  totalInvestment: { value: number }[];
  handoverMonths: { value: number }[];
  preHandoverPercent: { value: number }[];
  rentalYieldY1: { value: number | null }[];
  constructionAppreciation: { value: number }[];  // REMOVE
  growthAppreciation: { value: number }[];        // REMOVE
  roiAt36Months: { value: number | null }[];
}
```

---

## 2. Add Edit Comparison Functionality in Presentation Builder

### Approach

Modify the `CreateComparisonModal` to support both "Create" and "Edit" modes. When editing, it pre-populates with the existing comparison's selected quotes.

**File: `src/components/presentation/CreateComparisonModal.tsx`**
- Add new props: `isEditing`, `initialQuoteIds`, `initialTitle`, `comparisonId`
- Pre-populate selected quotes when editing
- Change button text from "Create" to "Update" when editing
- Call appropriate callback for create vs update

**File: `src/pages/PresentationBuilder.tsx`**
- Add state for edit modal: `editingComparisonItem`
- Add edit button to comparison items in sidebar (similar to quote edit button)
- When edit clicked, open the modal in edit mode with current quoteIds
- On update, replace the comparison item with updated quoteIds

### New Props for CreateComparisonModal:
```typescript
interface CreateComparisonModalProps {
  open: boolean;
  onClose: () => void;
  onCreateComparison: (title: string, quoteIds: string[]) => void;
  presentationQuoteIds?: string[];
  // New edit props
  isEditing?: boolean;
  initialTitle?: string;
  initialQuoteIds?: string[];
  onUpdateComparison?: (title: string, quoteIds: string[]) => void;
}
```

### Sidebar Edit Button
In `SidebarItemContent` component, add an edit button for comparisons (similar to quotes):
```tsx
{(item.type === 'comparison' || item.type === 'inline_comparison') && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      setEditingComparisonItem(item);
    }}
    className="p-1 text-theme-text-muted hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <Pencil className="w-3.5 h-3.5" />
  </button>
)}
```

---

## 3. Remove Large Property Cards

### Files to Modify

**File: `src/pages/QuotesCompare.tsx`**
- Remove the property cards grid (lines 388-474)
- Keep the recommendation header if enabled, but remove the large cards

**File: `src/components/presentation/PresentationPreview.tsx`**
- Remove the property cards grid in `ComparisonPreview` (lines 430-463)
- The metrics table header row already shows quote names with colors

The MetricsTable already has a header row showing quote names with their accent colors, making the large cards redundant.

---

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/hooks/useQuotesComparison.ts` | Remove `constructionAppreciation` and `growthAppreciation` from interface and computation |
| `src/components/presentation/CreateComparisonModal.tsx` | Add edit mode support with initial values and update callback |
| `src/pages/PresentationBuilder.tsx` | Add edit button for comparisons, state for editing, update handler |
| `src/pages/QuotesCompare.tsx` | Remove large property cards grid |
| `src/components/presentation/PresentationPreview.tsx` | Remove large property cards grid from ComparisonPreview |

---

## Visual Changes

| Before | After |
|--------|-------|
| Large property cards with project/developer info | Cards removed - info in metrics table header |
| Construction/Growth appreciation in metrics | Metrics removed from comparison |
| No edit option for comparisons | Edit button on comparison items in sidebar |
