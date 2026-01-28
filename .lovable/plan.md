
# Plan: Comparison View Cleanup & Edit Functionality

## Status: ✅ COMPLETED

## Overview

This plan addressed three improvements to the comparison view:
1. ✅ Remove construction/appreciation metrics from the comparison
2. ✅ Enable editing comparisons in the presentation builder (add/remove quotes)
3. ✅ Remove the large property cards at the top of comparisons

---

## Changes Made

### 1. Remove Construction/Appreciation Metrics

**File: `src/hooks/useQuotesComparison.ts`**
- Removed `constructionAppreciation` and `growthAppreciation` from the `ComparisonMetrics` interface
- Removed the calculation of these metrics from `computeComparisonMetrics` function

### 2. Add Edit Comparison Functionality in Presentation Builder

**File: `src/components/presentation/CreateComparisonModal.tsx`**
- Added new props: `isEditing`, `initialQuoteIds`, `initialTitle`, `onUpdateComparison`
- Pre-populates selected quotes when editing
- Changes button text from "Create" to "Update" when editing
- Calls appropriate callback for create vs update

**File: `src/pages/PresentationBuilder.tsx`**
- Added state for edit modal: `editingComparisonItem`
- Added edit button to comparison items in sidebar
- Added `handleUpdateComparison` handler
- Added second CreateComparisonModal instance for editing

### 3. Remove Large Property Cards

**File: `src/pages/QuotesCompare.tsx`**
- Removed the property cards grid (lines 388-474)

**File: `src/components/presentation/PresentationPreview.tsx`**
- Removed the property cards grid in `ComparisonPreview` (lines 430-463)

---

## Visual Changes Summary

| Before | After |
|--------|-------|
| Large property cards with project/developer info | Cards removed - info in metrics table header |
| Construction/Growth appreciation in metrics | Metrics removed from comparison |
| No edit option for comparisons | Edit button on comparison items in sidebar |
