
# Implementation Plan: Server-Side Screenshot System

## Step 1: Add Browserless API Token (First Action)

When implementation begins, I'll prompt you to securely add your `BROWSERLESS_TOKEN` to the backend. A modal will appear where you can paste your API key from browserless.io.

---

## Step 2: Fix Presentation Logo Navigation

**File**: `src/pages/PresentationView.tsx`

Disable navigation for unauthenticated viewers by passing `linkTo={undefined}`:

```typescript
<AppLogo size="md" linkTo={undefined} />
```

---

## Step 3: Create Print-Optimized Snapshot Component

**File**: `src/components/roi/snapshot/SnapshotPrintContent.tsx` (New)

A vertical, single-column layout optimized for screenshot capture:

- Fixed 1920px width container
- No sidebars, navigation, or modal triggers
- Natural height flow (no `h-screen` constraint)
- All content sections stacked vertically:
  1. Property Hero Card
  2. Overview Cards (4 key metrics)
  3. Payment Breakdown Table
  4. Rent Summary Card
  5. Exit Scenarios Card (if enabled)
  6. Mortgage Card (if enabled)
  7. Wealth Projection Timeline

---

## Step 4: Create Print Route Page

**File**: `src/pages/SnapshotPrint.tsx` (New)

Minimal page component that:
- Fetches quote data using `shareToken`
- Renders `SnapshotPrintContent` with full data
- Includes a `.snapshot-print-content` CSS class for Browserless detection
- Applies print-optimized styling

---

## Step 5: Add Route to App.tsx

**File**: `src/App.tsx`

Add the public print route:

```typescript
<Route path="/snapshot/:shareToken/print" element={<SnapshotPrint />} />
```

---

## Step 6: Create Screenshot Edge Function

**File**: `supabase/functions/generate-snapshot-screenshot/index.ts` (New)

Edge function that calls Browserless.io API:

```typescript
// Configuration for high-quality capture
const browserlessPayload = {
  url: `https://dbxprime.lovable.app/snapshot/${shareToken}/print`,
  options: {
    fullPage: true,
    type: format === 'pdf' ? 'pdf' : 'png',
  },
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2  // 3840px effective width
  },
  gotoOptions: {
    waitUntil: 'networkidle0',
    timeout: 30000
  },
  waitForSelector: '.snapshot-print-content',
  waitForTimeout: 2000
};
```

For PDF, additional options:
- A3 format
- `printBackground: true` for dark theme

---

## Step 7: Register Edge Function

**File**: `supabase/config.toml`

```toml
[functions.generate-snapshot-screenshot]
verify_jwt = true
```

---

## Step 8: Add Export Buttons to Dashboard

**File**: `src/components/roi/dashboard/DashboardSidebar.tsx`

Add two export buttons with loading states:

| Button | Icon | Action |
|--------|------|--------|
| Export Image | Image icon | Captures PNG (3840px width) |
| Export PDF | FileDown icon | Generates A3 PDF with background |

Export flow:
1. Check if quote is saved (has shareToken)
2. Show loading spinner
3. Call edge function
4. Convert base64 to blob
5. Trigger browser download
6. Show success/error toast

---

## Quality Specifications

| Setting | Value | Result |
|---------|-------|--------|
| Viewport Width | 1920px | Full HD base |
| Device Scale Factor | 2x | 3840px actual width |
| Full Page | true | Captures entire scrollable content |
| Wait Strategy | networkidle0 + selector | All images/fonts loaded |
| PNG | Lossless | Crisp text and graphics |
| PDF | A3 + printBackground | Professional document |

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/PresentationView.tsx` | Modify - disable logo link |
| `src/components/roi/snapshot/SnapshotPrintContent.tsx` | Create - print layout |
| `src/pages/SnapshotPrint.tsx` | Create - print route page |
| `src/App.tsx` | Modify - add print route |
| `supabase/functions/generate-snapshot-screenshot/index.ts` | Create - edge function |
| `supabase/config.toml` | Modify - register function |
| `src/components/roi/dashboard/DashboardSidebar.tsx` | Modify - add export buttons |

