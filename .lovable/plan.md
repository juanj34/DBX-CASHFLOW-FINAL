
# Fix PDF/PNG Export Y-Axis Offset

## Problem

The exported PDF/PNG has a visible offset at the top - a gray bar appears above the content, and all elements are shifted down on the Y-axis. This makes the export look incorrect.

## Root Cause Analysis

Looking at the code and screenshot:

1. **`html2canvas` element positioning**: The `useClientExport.ts` uses `scrollX: 0` and `scrollY: 0` in the html2canvas options. However, when the captured element has any offset from the document root (which happens because it's nested inside the `DashboardLayout`), html2canvas may miscalculate the starting position.

2. **CSS export-mode side effects**: The export-mode CSS rules modify `padding` and `overflow` properties. Specifically, line 554-556 in `index.css`:
   ```css
   body.export-mode .dashboard-main-content > div {
     padding: 24px !important;
   }
   ```
   This adds padding to the content wrapper, but the capture starts from the `main` element's top edge, potentially including unintended space.

3. **Element bounds calculation**: The `html2canvas` options set `windowHeight: contentRef.current.scrollHeight` but don't account for the element's `getBoundingClientRect().y` offset from the viewport.

## Solution

Fix the html2canvas configuration to properly capture the element without Y-offset:

### Changes

#### File: `src/hooks/useClientExport.ts`

Add explicit position options to html2canvas to ensure the capture starts at the element's actual top edge:

```typescript
const canvas = await html2canvas(contentRef.current, {
  scale: 2,
  useCORS: true,
  backgroundColor: null,
  logging: false,
  allowTaint: false,
  scrollX: 0,
  scrollY: 0,
  x: 0,  // ADD: Start capture at element's left edge
  y: 0,  // ADD: Start capture at element's top edge
  width: contentRef.current.scrollWidth,
  height: contentRef.current.scrollHeight,
  windowWidth: contentRef.current.scrollWidth,
  windowHeight: contentRef.current.scrollHeight,
});
```

The key additions are:
- `x: 0` - Explicitly start capture at the element's left edge (relative to the element itself)
- `y: 0` - Explicitly start capture at the element's top edge (relative to the element itself)
- `width` and `height` - Explicitly define the capture dimensions based on the element's actual content size

These options tell html2canvas to capture the element from its own coordinate origin (0,0) rather than calculating from the document root.

#### File: `src/index.css`

Remove the padding override that may be adding unexpected space. Change line 554-556:

**From:**
```css
body.export-mode .dashboard-main-content > div {
  padding: 24px !important;
}
```

**To:**
```css
body.export-mode .dashboard-main-content > div {
  padding: 0 !important;
}
```

This removes the 24px padding injection during export mode. The content already has its own internal padding via the component structure.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useClientExport.ts` | Add `x: 0`, `y: 0`, `width`, `height` options to html2canvas |
| `src/index.css` | Change export-mode padding from `24px` to `0` |

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Gray bar at top | Visible gray space above content | No offset - content starts at top |
| Content position | Shifted down on Y-axis | Properly aligned from top edge |
| Overall export | Cropped/offset appearance | Clean full-page capture |

---

## Technical Details

The `html2canvas` library captures DOM elements by rendering them to a canvas. When capturing a nested element (like `main.dashboard-main-content`), it needs explicit positioning hints to avoid including parent element offsets.

The options we're adding:
- `x: 0, y: 0` - Forces the capture to start at the top-left corner of the target element
- `width, height` - Uses the element's scroll dimensions for complete content capture
- `windowWidth, windowHeight` - Sets the virtual viewport size to match the content

Combined with removing the padding injection, this ensures a pixel-perfect export with no Y-offset.
