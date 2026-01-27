
# Plan: Client Database & Portal System

## Overview

This is a major architectural change to how clients and quotes are managed. We will:

1. **Create a `clients` table** - A dedicated database for storing client information
2. **Link quotes to clients** - Associate `cashflow_quotes` with client records
3. **Link presentations to clients** - Associate `presentations` with client records
4. **Create a Client Portal** - A page where clients can view all their quotes and presentations
5. **Remove Showcase View** - Eliminate the showcase/story view from the project presentation workflow

---

## Database Changes

### New Table: `clients`

```sql
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Client Information
  name text NOT NULL,
  email text,
  phone text,
  country text,
  
  -- Access Token for Client Portal
  portal_token text UNIQUE,
  portal_enabled boolean DEFAULT false,
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Brokers can manage their own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = broker_id);

CREATE POLICY "Public access via portal token"
  ON public.clients FOR SELECT
  USING (portal_token IS NOT NULL AND portal_enabled = true);

-- Index for faster lookups
CREATE INDEX idx_clients_broker_id ON public.clients(broker_id);
CREATE INDEX idx_clients_portal_token ON public.clients(portal_token);
```

### Modify `cashflow_quotes` Table

Add a foreign key to link quotes to clients:

```sql
ALTER TABLE public.cashflow_quotes 
  ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX idx_cashflow_quotes_client_id ON public.cashflow_quotes(client_id);
```

### Modify `presentations` Table

Add a foreign key to link presentations to clients:

```sql
ALTER TABLE public.presentations 
  ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX idx_presentations_client_id ON public.presentations(client_id);
```

---

## Application Changes

### New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useClients.ts` | Hook for CRUD operations on clients table |
| `src/pages/ClientsManager.tsx` | Admin page for managing clients |
| `src/pages/ClientPortal.tsx` | Public page for clients to view their quotes/presentations |
| `src/components/clients/ClientForm.tsx` | Form for creating/editing clients |
| `src/components/clients/ClientCard.tsx` | Card component to display client info |
| `src/components/clients/ClientSelector.tsx` | Dropdown to select/assign client to quote |
| `src/components/clients/ClientPortalContent.tsx` | Main content for client portal view |

### Files to Modify

#### 1. `src/App.tsx`
- Add route for `/clients` (protected - broker dashboard)
- Add route for `/portal/:portalToken` (public - client access)
- Remove `/showcase` routes if they exist

#### 2. `src/pages/OICalculator.tsx`
- Remove `viewMode === 'showcase'` conditional rendering
- Remove `handleShowcaseView` function
- Update `ViewMode` type to `'cashflow' | 'snapshot'` only
- Add `ClientSelector` component to the configurator

#### 3. `src/components/roi/dashboard/DashboardSidebar.tsx`
- Remove "Showcase" button from the sidebar
- Remove `onShowcase` prop
- Update `activeView` type to exclude 'showcase'

#### 4. `src/components/roi/dashboard/DashboardLayout.tsx`
- Remove `onShowcase` prop from interface
- Remove from sidebarProps

#### 5. `src/components/roi/configurator/ClientSection.tsx`
- Add `ClientSelector` dropdown to select existing client
- Keep ability to add new clients inline (which creates entry in `clients` table)
- When a client is selected, auto-populate name, email, country fields

#### 6. `src/hooks/useCashflowQuote.ts`
- Update `saveQuote` to include `client_id`
- Update quote interface to include `client_id`

#### 7. `src/pages/PresentationsHub.tsx`
- Add ability to assign presentations to clients
- Show client name in presentation cards

#### 8. `src/pages/PresentationBuilder.tsx`
- Add client selector when creating/editing presentation

#### 9. `src/components/presentation/ConfigurePresentationModal.tsx`
- Remove "Showcase" vs "Cashflow" view toggle
- Default all quotes to show as Snapshot or Cashflow

#### 10. `src/components/presentation/CreatePresentationWizard.tsx`
- Remove "Showcase" view mode toggle buttons
- Update viewMode default to 'vertical' (Cashflow)

#### 11. `src/pages/PresentationView.tsx`
- Remove showcase-related filtering
- Update item grouping to not include showcase items
- Only show Snapshot and Cashflow views

---

## Client Portal Design

The client portal (`/portal/:portalToken`) will:

1. **Fetch client by portal_token** from the `clients` table
2. **Display all associated quotes** - Cards showing each quote with:
   - Project name and developer
   - Property details (unit, size)
   - Status (draft, presented, negotiating, sold)
   - Link to Snapshot view (`/snapshot/:shareToken`)
   - Link to Cashflow view (`/view/:shareToken`)
3. **Display all associated presentations** - Cards with:
   - Presentation title
   - Number of items
   - Link to view presentation (`/present/:shareToken`)
4. **Clean, client-friendly UI** without broker tools

### Portal Layout

```
┌──────────────────────────────────────────────────────────────┐
│  DubaiInvestPro                              [Language] [EN] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   👋 Welcome, [Client Name]                                  │
│   Your Investment Opportunities                              │
│                                                              │
│   ┌─────────────────────────────────────────────────────────┐│
│   │ QUOTES (3)                                              ││
│   ├─────────────────────────────────────────────────────────┤│
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐             ││
│   │  │Project A │  │Project B │  │Project C │             ││
│   │  │1BR Unit  │  │2BR Unit  │  │Studio    │             ││
│   │  │AED 1.2M  │  │AED 2.1M  │  │AED 890K  │             ││
│   │  │[Snapshot]│  │[Snapshot]│  │[Snapshot]│             ││
│   │  │[Cashflow]│  │[Cashflow]│  │[Cashflow]│             ││
│   │  └──────────┘  └──────────┘  └──────────┘             ││
│   └─────────────────────────────────────────────────────────┘│
│                                                              │
│   ┌─────────────────────────────────────────────────────────┐│
│   │ PRESENTATIONS (1)                                       ││
│   ├─────────────────────────────────────────────────────────┤│
│   │  ┌──────────────────────┐                               ││
│   │  │ Investment Summary   │                               ││
│   │  │ 3 properties         │                               ││
│   │  │ [View Presentation]  │                               ││
│   │  └──────────────────────┘                               ││
│   └─────────────────────────────────────────────────────────┘│
│                                                              │
│   ┌─────────────────────────────────────────────────────────┐│
│   │ CONTACT YOUR ADVISOR                                    ││
│   │ [Advisor Card with WhatsApp/Email buttons]              ││
│   └─────────────────────────────────────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

### Phase 1: Database Setup
1. Create `clients` table migration
2. Add `client_id` to `cashflow_quotes`
3. Add `client_id` to `presentations`

### Phase 2: Core Hooks & Components
4. Create `useClients.ts` hook
5. Create `ClientSelector.tsx` component
6. Create `ClientForm.tsx` component

### Phase 3: Integration
7. Update `ClientSection.tsx` to use client selector
8. Update `useCashflowQuote.ts` to save `client_id`
9. Update `usePresentations.ts` to save `client_id`

### Phase 4: Remove Showcase View
10. Update `OICalculator.tsx` - remove showcase viewMode
11. Update `DashboardSidebar.tsx` - remove Showcase button
12. Update `DashboardLayout.tsx` - remove onShowcase prop
13. Update `PresentationView.tsx` - remove showcase filtering
14. Update `CreatePresentationWizard.tsx` - remove showcase toggle
15. Update `ConfigurePresentationModal.tsx` - remove showcase toggle

### Phase 5: Client Portal
16. Create `ClientPortal.tsx` page
17. Create `ClientPortalContent.tsx` component
18. Add route in `App.tsx`

### Phase 6: Client Management
19. Create `ClientsManager.tsx` page
20. Create `ClientCard.tsx` component
21. Add route and navigation

---

## Summary of Changes

| Category | Action |
|----------|--------|
| **Database** | Create `clients` table, add `client_id` FK to quotes and presentations |
| **New Pages** | `ClientsManager.tsx`, `ClientPortal.tsx` |
| **New Components** | `ClientSelector.tsx`, `ClientForm.tsx`, `ClientCard.tsx`, `ClientPortalContent.tsx` |
| **New Hook** | `useClients.ts` |
| **Remove** | Showcase view from OICalculator, DashboardSidebar, presentation modals |
| **Update** | ClientSection to use client database, quote/presentation saving to include client_id |

---

## Technical Notes

### RLS Policies for Client Portal
- Clients table: Allow SELECT when `portal_token` matches and `portal_enabled = true`
- Quotes: Allow SELECT when quote's `client_id` matches the client fetched by `portal_token`
- Presentations: Allow SELECT when presentation's `client_id` matches

### Migration of Existing Data
- Existing quotes with `client_name` will NOT be auto-migrated to the new `clients` table
- Brokers can manually create client records and assign existing quotes
- The old `client_name`, `client_email`, `client_country` fields remain for backwards compatibility

### Share Token vs Portal Token
- **Share Token** (existing): One-time link to a specific quote or presentation
- **Portal Token** (new): Persistent link for a client to access ALL their assigned items

