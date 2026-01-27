
# Client-Side Export System

## Overview
Replace the current Edge Function-based export (which uses Browserless and is failing) with a direct client-side DOM capture system. This will capture exactly what the user sees on their screen, without sidebars or navigation, in high quality.

## Key Benefits
- **WYSIWYG**: Exports exactly what you see, with the current theme, data, and styling
- **Works everywhere**: No dependency on production URLs or external services
- **High quality**: 2x scale factor for crisp exports
- **No browser print dialogs**: Direct download of PNG or PDF files
- **Instant**: No network round-trip to external screenshot service

---

## Technical Implementation

### Step 1: Add Dependencies

Install two libraries:
- `html2canvas` - Captures DOM elements as high-resolution images
- `jspdf` - Converts images to PDF documents

### Step 2: Create Export Hook

**New File**: `src/hooks/useClientExport.ts`

A hook that handles the entire export flow:
1. Adds a temporary CSS class to hide sidebar/navbar
2. Captures the main content area using `html2canvas` with `scale: 2` for 2x resolution
3. Converts to PDF if needed using `jsPDF`
4. Triggers download
5. Removes the CSS class to restore UI

```
┌──────────────────────────────────────────┐
│           Export Flow                    │
├──────────────────────────────────────────┤
│ 1. Add body.export-mode class            │
│    → Hides sidebar + mobile menu         │
│                                          │
│ 2. html2canvas captures contentRef       │
│    → scale: 2 for high resolution        │
│    → useCORS: true for external images   │
│                                          │
│ 3. Convert canvas → PNG blob or PDF      │
│                                          │
│ 4. Trigger browser download              │
│                                          │
│ 5. Remove body.export-mode class         │
│    → UI restored                         │
└──────────────────────────────────────────┘
```

### Step 3: Add Export-Mode CSS

**File**: `src/index.css`

Add CSS rules that hide UI elements when the body has `export-mode` class:

```css
/* Client-side export mode - hide UI elements during capture */
body.export-mode .dashboard-sidebar,
body.export-mode [data-export-hide="true"] {
  display: none !important;
}

body.export-mode .dashboard-main-content {
  margin-left: 0 !important;
  width: 100vw !important;
  max-width: 100vw !important;
}
```

### Step 4: Update DashboardLayout

**File**: `src/components/roi/dashboard/DashboardLayout.tsx`

Changes:
1. Add `dashboard-sidebar` class to the sidebar container
2. Add `data-export-hide="true"` to the mobile menu trigger
3. Add `dashboard-main-content` class to the main element
4. Accept and forward a `mainContentRef` prop for capturing

### Step 5: Update ExportModal

**File**: `src/components/roi/ExportModal.tsx`

Replace the Edge Function call with client-side capture:
- Accept `mainContentRef` and `onViewChange` props
- Use the new `useClientExport` hook
- For "Both" views: programmatically switch views, wait for render, capture each

### Step 6: Update OICalculator

**File**: `src/pages/OICalculator.tsx`

Changes:
1. Create a ref for the main content area: `const mainContentRef = useRef<HTMLDivElement>(null)`
2. Pass the ref to DashboardLayout
3. Pass the ref and `setViewMode` to ExportModal for "Both" view exports

---

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `html2canvas` and `jspdf` dependencies |
| `src/hooks/useClientExport.ts` | Create | Client-side DOM capture and download logic |
| `src/index.css` | Modify | Add `.export-mode` CSS rules to hide UI |
| `src/components/roi/dashboard/DashboardLayout.tsx` | Modify | Add CSS classes and accept `mainContentRef` |
| `src/components/roi/ExportModal.tsx` | Modify | Replace Edge Function with client-side capture |
| `src/pages/OICalculator.tsx` | Modify | Create content ref and pass to modal/layout |

---

## Export Quality Settings

The export will use these settings for maximum quality:

```typescript
html2canvas(element, {
  scale: 2,              // 2x resolution (e.g., 1920px → 3840px)
  useCORS: true,         // Allow cross-origin images (maps, uploads)
  backgroundColor: null, // Preserve transparent backgrounds
  logging: false,        // Disable console logs
  allowTaint: false,     // Prevent tainted canvas issues
});
```

For PDF export, the page dimensions will match the captured content exactly, maintaining aspect ratio.

---

## "Both Views" Export Flow

When user selects "Both":

```
1. Save current view (cashflow or snapshot)
2. Capture current view → download file 1
3. Switch to other view (call onViewChange)
4. Wait 500ms for React to render
5. Capture other view → download file 2
6. Switch back to original view
7. Show success toast
```

---

## What Gets Hidden During Export

- ✅ Left sidebar (desktop)
- ✅ Mobile floating menu button
- ✅ Any element with `data-export-hide="true"` attribute

## What Gets Captured

- Full main content area (Cashflow or Snapshot view)
- Current theme styling
- All charts, tables, and images
- Full scroll height (not just viewport)
