

# Fix Double Scroll & Export Issues

## Problem Summary

### Issue 1: Double Scroll in Snapshot View
The Snapshot view has **nested scroll containers** that create a confusing UX:

```
DashboardLayout
├── <main overflow-auto>              ← SCROLL #1 (outer)
│     └── SnapshotContent
│           └── <div h-screen>        ← Forces viewport height
│                 └── <div overflow-auto>  ← SCROLL #2 (inner)
```

You have to scroll the outer container first, then scroll the inner container to see the Mortgage card at the bottom.

### Issue 2: Content Cropping During Export
When `html2canvas` captures the DOM, the nested scroll containers and `h-screen` constraint cause the bottom content to be clipped. The capture only sees the viewport height, not the full scrollable content.

### Issue 3: 25MB PDF File Size
Current export uses PNG format at full quality (`toDataURL('image/png', 1.0)`), which is lossless and extremely large.

---

## Solution Overview

| Problem | Fix |
|---------|-----|
| Double scroll | Remove inner scroll, use `min-h-full` instead of `h-screen` |
| Content cropping | Add CSS rules to force `height: auto` during export mode |
| Large PDF size | Use JPEG format with 85% quality for PDF exports |

---

## Technical Changes

### File 1: `src/components/roi/snapshot/SnapshotContent.tsx`

**Change the layout to use a single scroll context:**

- Replace `h-screen` with `min-h-full` - allows content to grow beyond viewport
- Remove `overflow-auto` from the inner content div - no more nested scroll
- Remove `h-full` from the grid container - let content flow naturally

```tsx
// BEFORE (line 72)
<div className="h-screen flex flex-col bg-theme-bg">

// AFTER
<div className="min-h-full flex flex-col bg-theme-bg">
```

```tsx
// BEFORE (line 104-105)
<div className="flex-1 px-4 pb-4 overflow-auto">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">

// AFTER
<div className="flex-1 px-4 pb-4">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
```

### File 2: `src/index.css`

**Add comprehensive export-mode CSS rules to force full height capture:**

```css
/* Export mode - Force auto height for full content capture */
body.export-mode,
body.export-mode .dashboard-main-content,
body.export-mode .min-h-full,
body.export-mode .h-screen {
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
}

body.export-mode .overflow-auto,
body.export-mode .overflow-hidden,
body.export-mode .overflow-y-auto {
  overflow: visible !important;
}

body.export-mode .flex-1 {
  flex: none !important;
  height: auto !important;
}
```

### File 3: `src/hooks/useClientExport.ts`

**Reduce PDF size by using JPEG compression:**

```typescript
// BEFORE (line 89)
const imgData = canvas.toDataURL('image/png', 1.0);

// AFTER - Use JPEG for PDF (much smaller file size)
const imgData = canvas.toDataURL('image/jpeg', 0.85);
```

Also add:
- Increase delay from 100ms to 200ms for layout reflow
- Force reflow with `offsetHeight` before capture

---

## Visual Comparison

**Before (Double Scroll):**
```
┌─────────────────────────────────────┐
│ Sidebar │ Hero Card                 │
│         ├───────────────────────────┤
│         │ Overview Cards            │ ↕ Scroll #1
│         ├───────────────────────────┤
│         │ ┌─────────────────────┐   │
│         │ │ Payment │ Rent      │   │
│         │ │         │ Exits     │   │ ↕ Scroll #2
│         │ │         │ Mortgage  │   │   (hidden)
│         │ └─────────────────────┘   │
└─────────────────────────────────────┘
```

**After (Single Scroll):**
```
┌─────────────────────────────────────┐
│ Sidebar │ Hero Card                 │
│         ├───────────────────────────┤
│         │ Overview Cards            │
│         ├───────────────────────────┤  ↕ Single scroll
│         │ Payment   │ Rent          │    for entire
│         │           │ Exits         │    content area
│         │           │ Mortgage      │
└─────────────────────────────────────┘
```

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Scroll behavior | Two nested scrollbars | Single intuitive scrollbar |
| Mortgage visibility | Hidden until 2nd scroll | Visible with normal scroll |
| Export cropping | Bottom content cut off | Full content captured |
| PDF file size | ~25MB | ~2-5MB (80-90% smaller) |
| PNG quality | High | High (unchanged) |

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/SnapshotContent.tsx` | Replace `h-screen` → `min-h-full`, remove inner `overflow-auto` |
| `src/index.css` | Add export-mode CSS for auto height and visible overflow |
| `src/hooks/useClientExport.ts` | Use JPEG 85% quality for PDFs, add layout reflow delay |

