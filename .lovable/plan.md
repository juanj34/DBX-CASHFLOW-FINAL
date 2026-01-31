
# Add Draggable Property Cards to All Comparison Views

## Problem Identified

The drag-and-drop functionality exists in `QuotesCompare.tsx` (using `CompareHeader` component), but two other comparison views are missing this feature:

1. **`CompareView.tsx`** (public share link for comparisons) - Has property cards but:
   - Uses hardcoded dark theme colors (`#1a1f2e`, `#2a3142`)
   - Uses `'Untitled Quote'` fallback instead of project name
   - No drag-and-drop support

2. **`PresentationPreview.tsx` → `ComparisonPreview`** (embedded comparisons in presentations) - **Has no property header cards at all** - jumps directly to the MetricsTable

The user is viewing a presentation at `/presentations/{shareToken}` which uses the `PresentationPreview` component.

## Solution

### 1. Update `CompareView.tsx`
Add the `CompareHeader` component to the public comparison view:
- Import and use `CompareHeader` component  
- Add `onReorder` state management to enable drag-and-drop
- This replaces the hardcoded property cards with the reusable, theme-aware component

### 2. Update `PresentationPreview.tsx` → `ComparisonPreview`
Add the `CompareHeader` component to embedded comparisons:
- Import `CompareHeader` from the compare components
- Add reorder state management
- Place the header cards between the title and the MetricsTable section

### 3. Minor Fixes
- Update `getQuoteDisplayName` usage in `CompareView.tsx` to show project name instead of "Untitled Quote"
- Ensure the header cards respect the existing currency and language settings

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/CompareView.tsx` | Replace hardcoded property cards with `CompareHeader` component, add reorder functionality |
| `src/components/presentation/PresentationPreview.tsx` | Add `CompareHeader` component to `ComparisonPreview`, add reorder state |

## Technical Details

### CompareView.tsx Changes
```typescript
// Add imports
import { CompareHeader } from '@/components/roi/compare/CompareHeader';
import { getQuoteDisplayName } from '@/components/roi/compare/utils';

// Add reorder state
const [orderedQuoteIds, setOrderedQuoteIds] = useState<string[]>([]);

// Effect to sync quote order
useEffect(() => {
  if (comparison?.quote_ids) {
    setOrderedQuoteIds(comparison.quote_ids);
  }
}, [comparison]);

// Replace hardcoded cards grid with:
<CompareHeader 
  quotes={orderedQuotes} 
  onRemove={() => {}} // Read-only, no remove in public view
  onReorder={setOrderedQuoteIds}
/>
```

### PresentationPreview.tsx Changes
```typescript
// In ComparisonPreview component
const [orderedQuoteIds, setOrderedQuoteIds] = useState<string[]>([]);

// Sync with incoming quotes
useEffect(() => {
  setOrderedQuoteIds(comparisonData.quoteIds);
}, [comparisonData.quoteIds]);

// Convert quotes to ComparisonQuote format for CompareHeader
const orderedQuotesForHeader = orderedQuoteIds
  .map(id => comparisonData.quotes.find(q => q.id === id))
  .filter(Boolean)
  .map(q => ({
    id: q.id,
    title: q.title,
    projectName: q.project_name,
    developer: q.developer,
    // ... other fields
  }));

// Add between header and MetricsTable:
<CompareHeader 
  quotes={orderedQuotesForHeader}
  onRemove={() => {}}
  onReorder={setOrderedQuoteIds}
/>
```

## Expected Result
- Both the public comparison view and embedded presentation comparisons will show the draggable property cards
- Users can reorder properties in all three comparison contexts
- Theme-aware colors will work correctly in both light and dark modes
- Project name fallback will work correctly (no more "Untitled Quote")
