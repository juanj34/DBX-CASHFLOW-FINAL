
# Fix "Untitled Quote" Display in Comparison View

## Problem Identified

When a quote has its `title` set to the default placeholder `"Untitled Quote"` (instead of `null`), the comparison view shows "Untitled Quote" rather than the more useful `projectName` like "Zenith Residences".

**Root cause:** The pattern `quote.title || quote.projectName` treats `"Untitled Quote"` as a valid title because it's a truthy string, so it never falls back to showing the project name.

**Database evidence:**
- The Zenith quote has `title = 'Untitled Quote'` and `project_name = 'Zenith Residences'`
- The current logic shows "Untitled Quote" instead of "Zenith Residences"

## Solution

Create a helper function that treats `"Untitled Quote"` as equivalent to having no title, allowing the fallback chain to work properly:

```typescript
// Helper to get display name for a quote
const getQuoteDisplayName = (
  title: string | null, 
  projectName: string | null, 
  clientName?: string | null,
  fallback = 'Quote'
): string => {
  // Treat "Untitled Quote" as if there's no title
  const effectiveTitle = title && title !== 'Untitled Quote' ? title : null;
  return effectiveTitle || projectName || clientName || fallback;
};
```

## Files to Update

| File | Current Pattern | Change |
|------|-----------------|--------|
| `MetricsTable.tsx` | `q.quote.title \|\| q.quote.projectName \|\| 'Quote'` | Use helper function |
| `CompareHeader.tsx` | `quote.title \|\| 'Untitled Quote'` | Use helper function |
| `PaymentComparison.tsx` | `quote.title \|\| quote.projectName \|\| 'Quote'` | Use helper function |
| `DifferentiatorsComparison.tsx` | `quote.title \|\| quote.projectName \|\| 'Quote'` | Use helper function |
| `ExitComparison.tsx` | `item.quote.title \|\| item.quote.projectName` | Use helper function |
| `MortgageComparison.tsx` | `q.quote.title \|\| q.quote.projectName \|\| 'Quote'` | Use helper function |
| `GrowthComparisonChart.tsx` | `item.quote.title \|\| item.quote.projectName` | Use helper function |
| `CashflowKPIComparison.tsx` | `quote.title \|\| quote.projectName \|\| 'Quote'` | Use helper function |
| `RentalYieldComparison.tsx` | `quote.title \|\| quote.projectName \|\| 'Quote'` | Use helper function |

## Implementation Approach

**Option 1 (Inline):** Add the helper function to each file that needs it
- Pros: Self-contained, no cross-file dependencies
- Cons: Repeated code

**Option 2 (Shared utility):** Create a shared utility function in a common file
- Pros: DRY, single source of truth
- Cons: One more import

**Recommended: Option 2** - Create the helper in a shared location (e.g., `src/components/roi/compare/utils.ts`) and import it in all affected files.

## Expected Result

After fix:
- Quotes with `title = 'Untitled Quote'` will display their `projectName` instead
- Quotes with custom titles (e.g., "Sera Gardens - Hugo") continue to show those titles
- The fallback chain becomes: **Real Title → Project Name → Client Name → "Quote"**
