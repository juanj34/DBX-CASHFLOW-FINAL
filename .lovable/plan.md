
# Enhanced Client Portal with Full Investment Visibility

## Overview

This plan expands the Client Portal to show a complete view of each client's investment journey, including:
1. **Snapshot View** for every quote (opportunity) and property
2. **Presentations** assigned to the client
3. **Quote Comparisons** (saved_comparisons) linked to the client
4. **Off-Plan vs Secondary Comparisons** (secondary_comparisons) linked to the client

This requires database schema changes to add `client_id` columns to comparison tables, plus significant UI enhancements.

---

## Current State Analysis

### What Exists
- **Client Portal** (`/portal/:portalToken`) shows:
  - Portfolio tab (acquired properties)
  - Opportunities tab (quotes linked via `client_id`)
  - Presentations tab (presentations linked via `client_id`)
  - Compare tab (in-session quote comparison)

### What's Missing
1. **Database**: `saved_comparisons` and `secondary_comparisons` tables lack `client_id` column
2. **UI**: No way to view individual quote/property "snapshots" inline
3. **UI**: No tab for "Saved Comparisons" or "Off-Plan vs Secondary" analyses
4. **Broker View**: Need internal `/clients/:clientId/portfolio` route for brokers

---

## Database Schema Changes

### Add `client_id` to Comparison Tables

```text
saved_comparisons
├── client_id (uuid, nullable, FK → clients.id) ← NEW

secondary_comparisons  
├── client_id (uuid, nullable, FK → clients.id) ← NEW
```

### RLS Policy Updates

Add policies to allow clients to view their own comparisons via portal token:

```sql
-- saved_comparisons
CREATE POLICY "Clients can view their comparisons via portal"
ON saved_comparisons FOR SELECT
USING (client_id IN (
  SELECT id FROM clients 
  WHERE portal_token IS NOT NULL AND portal_enabled = true
));

-- secondary_comparisons
CREATE POLICY "Clients can view their comparisons via portal"
ON secondary_comparisons FOR SELECT
USING (client_id IN (
  SELECT id FROM clients 
  WHERE portal_token IS NOT NULL AND portal_enabled = true
));
```

---

## New Tab Structure for Client Portal

The portal will have these tabs:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Portfolio  │  Opportunities  │  Presentations  │  Comparisons  │ Compare │
└─────────────────────────────────────────────────────────────────────────┘
     (1)            (2)               (3)              (4)           (5)

(1) Portfolio - Acquired properties with metrics
(2) Opportunities - Quotes with inline "View Snapshot" modal
(3) Presentations - Full presentation decks
(4) Comparisons - NEW: Saved quote comparisons + Off-Plan vs Secondary
(5) Compare - Dynamic side-by-side comparison tool
```

---

## Feature Details

### 1. Inline Snapshot Viewer for Opportunities

**Current**: Cards with "View Analysis" button that opens external `/view/:token` page

**Enhanced**: Add modal that shows the full Cashflow View inline without leaving the portal

```text
┌──────────────────────────────────────────┐
│  Creek Harbour Residences - Emaar        │
│  2BR Apartment | Unit 2508               │
│  AED 4.2M                                │
│                                          │
│  [View Snapshot]  [Download]  [Compare]  │
└──────────────────────────────────────────┘
              ↓ Click "View Snapshot"
┌─────────────────────────────────────────────────────────────┐
│ Modal: Full SnapshotContent Component                       │
│ - Hero card, payment timeline, exit scenarios               │
│ - Rental analysis, mortgage coverage                        │
│ - All the same content as /view/:token but inline           │
└─────────────────────────────────────────────────────────────┘
```

### 2. Portfolio Properties with Snapshot Access

For each acquired property, show:
- Current value & appreciation
- "View Original Analysis" button if `source_quote_id` exists (links to the original quote snapshot)
- Performance metrics

### 3. New Comparisons Tab

Shows two sections:

**Quote Comparisons** (from `saved_comparisons`)
- Title, description, included quotes
- "View Comparison" button → opens `/compare-view/:shareToken` or inline modal

**Off-Plan vs Secondary** (from `secondary_comparisons`)
- Title, off-plan quote vs secondary property summary
- "View Analysis" button → opens comparison view inline

### 4. Broker Portfolio View

New internal route `/clients/:clientId/portfolio` for brokers:
- Same tabs as client portal
- Additional actions: Edit, Delete, Create new quotes/presentations
- No external tab opening - stays within the app

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/ClientPortfolioView.tsx` | Broker's internal view of client portfolio |
| `src/components/portal/SnapshotModal.tsx` | Modal wrapper for inline snapshot viewing |
| `src/components/portal/ComparisonsSection.tsx` | NEW tab content for comparisons |
| `src/hooks/useClientComparisons.ts` | Fetch comparisons by client_id |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ClientPortal.tsx` | Add Comparisons tab, integrate SnapshotModal |
| `src/components/portal/OpportunitiesSection.tsx` | Add "View Snapshot" modal trigger |
| `src/components/portal/PortfolioSection.tsx` | Add "View Original Analysis" link for properties with source_quote |
| `src/components/clients/ClientCard.tsx` | Add "View Portfolio" menu item |
| `src/App.tsx` | Add `/clients/:clientId/portfolio` route |
| `src/hooks/usePresentations.ts` | Add `client_id` support for queries |
| `src/hooks/useSecondaryComparisons.ts` | Add `client_id` filtering |

---

## Implementation Steps

### Phase 1: Database Schema

1. Add `client_id` column to `saved_comparisons` table
2. Add `client_id` column to `secondary_comparisons` table
3. Create RLS policies for client portal access
4. Add foreign key constraints to `clients` table

### Phase 2: Data Hooks

1. Create `useClientComparisons.ts` hook that fetches:
   - `saved_comparisons` WHERE `client_id = ?`
   - `secondary_comparisons` WHERE `client_id = ?`
2. Update existing hooks to support `client_id` filtering

### Phase 3: Portal UI Enhancement

1. Create `SnapshotModal.tsx` - reuses `SnapshotContent` component
2. Create `ComparisonsSection.tsx` - displays both comparison types
3. Update `OpportunitiesSection.tsx` - add inline view button
4. Update `PortfolioSection.tsx` - add source quote link
5. Update `ClientPortal.tsx` - integrate new tab and modal

### Phase 4: Broker Portfolio View

1. Create `ClientPortfolioView.tsx` page
2. Add route to `App.tsx`
3. Update `ClientCard.tsx` with "View Portfolio" action

### Phase 5: Link Comparisons to Clients

1. Update comparison creation flows to optionally link to a client
2. Add client selector in comparison tools when creating for a client

---

## Technical Details

### SnapshotModal Component

Wraps the existing `SnapshotContent` component in a Dialog:

```text
Props:
- quoteId: string
- open: boolean
- onOpenChange: (open: boolean) => void
- currency: Currency
- language: 'en' | 'es'
- rate: number

Fetches:
- Quote data from cashflow_quotes
- Calculations via useOICalculations
- Mortgage via useMortgageCalculations
```

### ComparisonsSection Component

Displays two card grids:

```text
Props:
- savedComparisons: SavedComparison[]
- secondaryComparisons: SecondaryComparison[]
- currency: Currency
- language: 'en' | 'es'

Actions:
- "View" opens inline modal or external link
```

### useClientComparisons Hook

```text
Input: portalToken or clientId
Output:
- savedComparisons: array
- secondaryComparisons: array
- loading: boolean
```

---

## User Experience Flow

### Client Portal Experience

1. Client opens `/portal/:token`
2. Sees adaptive dashboard (Portfolio or Opportunities first)
3. Can click any quote → modal shows full analysis
4. "Comparisons" tab shows analyses their advisor has shared
5. "Compare" tool allows selecting quotes for side-by-side view

### Broker Experience

1. Broker opens `/clients` (Clients Manager)
2. Clicks "..." menu on client card
3. Selects "View Portfolio" → opens `/clients/:clientId/portfolio`
4. Sees same tabs as client portal, but with edit capabilities
5. Can create quotes, link comparisons, manage presentations

---

## Security Considerations

1. RLS policies ensure clients only see their own data
2. Portal token validation before showing any data
3. Comparisons filtered by `client_id` match
4. Broker view requires authentication via `ProtectedRoute`

---

## Testing Verification

After implementation, verify:

- [ ] Maria's portal shows her 5 quotes with "View Snapshot" option
- [ ] Maria's portal shows her 3 properties with metrics
- [ ] Comparisons tab appears when client has linked comparisons
- [ ] Broker can access `/clients/:clientId/portfolio` internally
- [ ] "View Portfolio" appears in ClientCard dropdown
- [ ] Snapshot modal displays correctly in portal context
- [ ] Export/download works from within the modal
