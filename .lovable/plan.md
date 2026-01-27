
# Implementation Plan: Fix Presentation Logo + Server-Side Screenshot System

## Part 1: Quick Fix - Presentation Logo Navigation

### Problem
The `AppLogo` in `PresentationView.tsx` (line ~247) defaults to `/home`, which is a protected route. When unauthenticated clients click the logo, they get redirected to login.

### Solution
Pass `linkTo={undefined}` to the `AppLogo` component in the public presentation view to disable navigation.

**File**: `src/pages/PresentationView.tsx`

```typescript
// Change from:
<AppLogo size="md" />

// To:
<AppLogo size="md" linkTo={undefined} />
```

---

## Part 2: Server-Side Screenshot System

### Architecture Overview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                            EXPORT FLOW                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. User clicks "Export Image" or "Export PDF" in DashboardSidebar      │
│                              ↓                                           │
│  2. Frontend calls Edge Function: generate-snapshot-screenshot           │
│                              ↓                                           │
│  3. Edge Function calls Browserless.io API with print URL               │
│     URL: /snapshot/{shareToken}/print                                    │
│                              ↓                                           │
│  4. Browserless renders page with Playwright (1920px, 2x scale)         │
│     - fullPage: true (captures entire scrollable height)                 │
│     - deviceScaleFactor: 2 (3840px actual = Full HD+)                   │
│                              ↓                                           │
│  5. Returns base64-encoded PNG/PDF to frontend                          │
│                              ↓                                           │
│  6. Frontend downloads file to user's device                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/PresentationView.tsx` | Modify | Disable logo link |
| `src/pages/SnapshotPrint.tsx` | **Create** | Print-optimized snapshot route |
| `src/components/roi/snapshot/SnapshotPrintContent.tsx` | **Create** | Print layout component (no sidebars, vertical scroll) |
| `src/App.tsx` | Modify | Add `/snapshot/:shareToken/print` route |
| `supabase/functions/generate-snapshot-screenshot/index.ts` | **Create** | Edge function for Browserless API |
| `supabase/config.toml` | Modify | Register new edge function |
| `src/components/roi/dashboard/DashboardSidebar.tsx` | Modify | Add export buttons |

---

## Technical Details

### 1. Print-Optimized Snapshot Route (`/snapshot/:shareToken/print`)

This is a minimal, vertical layout specifically for headless browser capture:

- **No sidebars or navigation** - just the content
- **Single column layout** - all cards stacked vertically
- **Fixed width: 1920px** - for consistent high-quality output
- **No overflow/scroll containers** - content flows naturally
- **All sections expanded** - no modals or hidden content
- **White/dark background** - optimized for both print and digital

The route accepts query parameters:
- `?format=png` or `?format=pdf` - to slightly adjust styling for each format

### 2. SnapshotPrintContent Component

A vertical version of the snapshot that renders:

1. **Property Hero Card** (with image, price info)
2. **Snapshot Overview Cards** (4 key metrics in a row)
3. **Payment Table** (full payment breakdown)
4. **Rent Card** (rental income summary)
5. **Exit Scenarios Card** (if enabled)
6. **Mortgage Card** (if enabled)
7. **Wealth Projection Timeline** (7-year projection)

Key differences from `SnapshotContent`:
- No `h-screen` constraint - natural height flow
- All interactive buttons removed (no modals)
- Fixed 1920px container width
- Larger font sizes for print clarity
- No hover states or transitions

### 3. Edge Function: `generate-snapshot-screenshot`

```typescript
// High-quality screenshot configuration
const browserlessConfig = {
  url: `${PREVIEW_URL}/snapshot/${shareToken}/print?format=${format}`,
  options: {
    fullPage: true,
    type: format === 'pdf' ? 'pdf' : 'png',
  },
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2  // 2x for crisp output (3840px actual)
  },
  gotoOptions: {
    waitUntil: 'networkidle0',  // Wait for all content to load
    timeout: 30000
  },
  waitForSelector: '.snapshot-print-content',  // Ensure content is rendered
  waitForTimeout: 2000  // Additional buffer for images
};
```

**For PDF format**, additional options:
```typescript
{
  format: 'A3',  // Larger format for detailed content
  printBackground: true,  // Include dark theme background
  preferCSSPageSize: false
}
```

### 4. Required Secret: `BROWSERLESS_TOKEN`

**Service**: [browserless.io](https://browserless.io)

- Free tier: 2,000 sessions/month (sufficient for most use cases)
- Paid plans available for higher volume

The secret needs to be added before deployment.

### 5. DashboardSidebar Export Buttons

Add two new buttons in the "View" section:

```typescript
<ActionButton 
  icon={ImageIcon} 
  label="Export Image" 
  onClick={() => handleExport('png')} 
  collapsed={collapsed}
/>
<ActionButton 
  icon={FileDown} 
  label="Export PDF" 
  onClick={() => handleExport('pdf')} 
  collapsed={collapsed}
/>
```

The export function:
```typescript
const handleExport = async (format: 'png' | 'pdf') => {
  if (!shareToken) {
    toast.error('Save quote first to export');
    return;
  }
  
  setExporting(format);
  
  const { data, error } = await supabase.functions.invoke('generate-snapshot-screenshot', {
    body: { shareToken, format }
  });
  
  if (data?.screenshot) {
    const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png';
    const blob = base64ToBlob(data.screenshot, mimeType);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${clientInfo.projectName || 'snapshot'}-${new Date().toISOString().slice(0,10)}.${format}`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success(`${format.toUpperCase()} exported successfully`);
  } else {
    toast.error('Export failed: ' + (error?.message || 'Unknown error'));
  }
  
  setExporting(null);
};
```

---

## Quality Specifications

| Setting | Value | Result |
|---------|-------|--------|
| Viewport Width | 1920px | Full HD base |
| Device Scale Factor | 2x | 3840px actual width |
| Full Page | true | Captures ALL content, not just viewport |
| Wait Strategy | networkidle0 + selector + timeout | Ensures all images/fonts loaded |
| PNG Quality | lossless | Crisp text and graphics |
| PDF Format | A3 + printBackground | Professional document with dark theme |

---

## Implementation Order

1. **Add Browserless secret** (required first)
2. **Fix PresentationView logo** (quick fix)
3. **Create SnapshotPrintContent component** (print layout)
4. **Create SnapshotPrint page** (route handler)
5. **Add route to App.tsx**
6. **Create edge function** (screenshot generation)
7. **Update config.toml**
8. **Add export buttons to DashboardSidebar**
9. **Test with real quote**
