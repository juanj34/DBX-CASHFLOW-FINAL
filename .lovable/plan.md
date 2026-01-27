
# Fix Export Layout Issues for All Components

## Problem Summary

The PDF export shows misaligned and cut-off elements (payment rows, value add badges, mortgage info) because the CSS rule added for export mode is too broad:

```css
body.export-mode .flex-1 {
  flex: none !important;
  height: auto !important;
}
```

This breaks **internal component layouts** that rely on `flex-1`:

| Component | Uses `flex-1` For | Issue |
|-----------|------------------|-------|
| `DottedRow` | Dotted line separator | Line disappears or collapses |
| `CompactPaymentTable` | Payment label containers | Labels overlap/cut off |
| `CompactAllExitsCard` | Scenarios list | Content compressed |
| `CompactMortgageCard` | Various internal layouts | Badges misaligned |

---

## Solution: Targeted Data Attribute Approach

Instead of overriding ALL `.flex-1` elements (which breaks internal layouts), we'll:

1. **Remove** the broad `.flex-1` override
2. **Add** a data attribute (`data-export-layout="expand"`) to specific containers that need to expand
3. **Target only those marked containers** in CSS

This preserves internal component layouts while still allowing page-level containers to expand for capture.

---

## Files to Modify

### File 1: `src/index.css`

**Remove:**
```css
body.export-mode .flex-1 {
  flex: none !important;
  height: auto !important;
}
```

**Replace with targeted rule:**
```css
/* Only expand containers explicitly marked for export */
body.export-mode [data-export-layout="expand"] {
  flex: none !important;
  height: auto !important;
  overflow: visible !important;
}
```

### File 2: `src/components/roi/snapshot/SnapshotContent.tsx`

Add the `data-export-layout="expand"` attribute to the main content container that needs to expand:

```tsx
{/* Main content - flows naturally with single scroll */}
<div className="flex-1 px-4 pb-4" data-export-layout="expand">
```

### File 3: `src/hooks/useClientExport.ts`

Add improvements for more reliable capture:
- Scroll content to top before capture
- Increase delay to 300ms for complex layouts

```typescript
// Before capture, scroll to top for consistent starting point
if (contentRef.current) {
  contentRef.current.scrollTop = 0;
}

// Increase delay to 300ms
await new Promise(resolve => setTimeout(resolve, 300));
```

---

## Technical Details

### Why This Works

| Approach | Result |
|----------|--------|
| **Before** (broad override) | ALL `flex-1` elements break, including DottedRow separators and payment labels |
| **After** (targeted attribute) | Only page-level containers expand; internal layouts preserved |

### Components That Will Be Preserved

These components use `flex-1` internally and will now render correctly:

1. **DottedRow** (line 36): `<span className="flex-1 border-b border-dotted..." />` - The dotted separator line
2. **CompactPaymentTable** (line 291): `<div className="flex items-center gap-1 min-w-0 flex-1">` - Payment label containers
3. **CompactAllExitsCard** (line 104): `<div className="p-3 space-y-2 flex-1 overflow-auto">` - Scenarios list
4. **CompactMortgageCard**: Internal flex layouts for badges

### What Will Expand

Only the marked container in `SnapshotContent.tsx`:
```tsx
<div className="flex-1 px-4 pb-4" data-export-layout="expand">
```

This container needs to expand to show all content, but its children (the cards) will maintain their internal flex layouts.

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Payment row labels | Cut off / overlapping | Full text visible |
| Dotted line separators | Missing or collapsed | Properly spanning |
| Value Add badges | Misaligned | Correctly wrapped |
| Mortgage badges | Offset | Properly positioned |
| Exit scenarios | Compressed | Full height visible |

---

## Summary

The fix is surgical:
1. Remove the broad `.flex-1` override that breaks internal layouts
2. Mark only the page-level container that needs to expand with `data-export-layout="expand"`
3. Target only that marked container in CSS
4. Internal component layouts (DottedRow, badges, etc.) are preserved
