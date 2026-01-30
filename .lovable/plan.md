
# Plan: Fix Off-Plan vs Secondary 404 Error and Add Quote Selector

## Problem

The route `/offplan-vs-secondary/:quoteId` requires a `quoteId` parameter, but all navigation links point to `/offplan-vs-secondary` (without the parameter), causing a 404 error.

## Solution

### 1. Add Optional Route in App.tsx

Add a second route that handles the case when no quoteId is provided:

```typescript
// Add BEFORE the route with quoteId
<Route path="/offplan-vs-secondary" element={<ProtectedRoute><OffPlanVsSecondary /></ProtectedRoute>} />
<Route path="/offplan-vs-secondary/:quoteId" element={<ProtectedRoute><OffPlanVsSecondary /></ProtectedRoute>} />
```

### 2. Update OffPlanVsSecondary.tsx Page

When no `quoteId` is provided, show a quote selector interface instead of the error message:

**Changes needed:**
- Add a state for showing the quote selector modal
- When `quoteId` is undefined, show a full-page quote selection UI
- When user selects a quote, navigate to `/offplan-vs-secondary/{selectedQuoteId}`
- Reuse the existing `useQuotesList` hook to fetch available quotes

**New Quote Selection UI (when no quoteId):**
```text
┌─────────────────────────────────────────────────────────────────┐
│  Off-Plan vs Secondary Comparison                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Select an Off-Plan Quote to Compare                            │
│  ─────────────────────────────────────────────                  │
│                                                                  │
│  [Search quotes...]                                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏢 Marina Shores Tower - Unit 1204                      │   │
│  │    Emaar • AED 1,450,000 • Created: Jan 25              │   │
│  │    Client: John Smith                                    │   │
│  │                                          [Compare →]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏢 Downtown Views - Unit 3405                           │   │
│  │    Binghatti • AED 980,000 • Created: Jan 22            │   │
│  │    Client: Sarah Johnson                                 │   │
│  │                                          [Compare →]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

### 1. `src/App.tsx`
- Add a new route for `/offplan-vs-secondary` (without quoteId)
- Keep existing route for `/offplan-vs-secondary/:quoteId`

### 2. `src/pages/OffPlanVsSecondary.tsx`
- Check if `quoteId` is undefined
- If undefined, show quote selection UI instead of error
- Use `useQuotesList` hook to fetch quotes
- Add search/filter functionality
- When quote is selected, navigate to the full URL with quoteId

---

## Technical Implementation

### App.tsx Change (lines 99-100)
```typescript
// Before:
<Route path="/offplan-vs-secondary/:quoteId" element={...} />

// After:
<Route path="/offplan-vs-secondary" element={<ProtectedRoute><OffPlanVsSecondary /></ProtectedRoute>} />
<Route path="/offplan-vs-secondary/:quoteId" element={<ProtectedRoute><OffPlanVsSecondary /></ProtectedRoute>} />
```

### OffPlanVsSecondary.tsx Changes

Add new imports:
```typescript
import { useQuotesList } from '@/hooks/useCashflowQuote';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
```

Add quote selection UI when no quoteId:
```typescript
// If no quoteId, show quote selector
if (!quoteId) {
  return (
    <div className="min-h-screen bg-theme-bg">
      <PageHeader
        title="Off-Plan vs Secondary"
        subtitle="Select an off-plan quote to compare against a secondary property"
        icon={<Building2 className="w-5 h-5" />}
        backLink="/home"
      />
      <div className="container mx-auto px-4 py-6">
        {/* Search input */}
        {/* List of quotes with click-to-select */}
        {/* Navigate to /offplan-vs-secondary/{quoteId} on selection */}
      </div>
    </div>
  );
}
```

---

## Quote Card Design

Each quote card in the selector will show:
- Project name + Unit (if available)
- Developer name
- Purchase price (formatted)
- Client name (if available)
- Creation date
- "Compare" button that navigates to full comparison

---

## Testing Checklist

- [ ] Clicking "Off-Plan vs Resale" in Home.tsx navigates correctly (no 404)
- [ ] Quote selection page shows list of available quotes
- [ ] Search filters quotes correctly
- [ ] Clicking a quote navigates to `/offplan-vs-secondary/{quoteId}`
- [ ] Full comparison page loads with selected quote
- [ ] Back button returns to quote selection
- [ ] Links from sidebar and PageHeader work correctly
