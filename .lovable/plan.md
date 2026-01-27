
## Goal (what will be fixed)
Fix the export so the PNG/PDF matches the on-screen layout with no “text-only” vertical shift (badge text moving down while the bubble stays put, divider lines clipping, etc.). This is a must-have reliability fix.

## What’s happening (plain-language)
Right now the export uses a screenshot-style library (html2canvas). It sometimes mis-renders text when there are:
- live animations (especially subtle scale animations),
- transforms (scale/translate) on parents or wrappers,
- blur/backdrop effects,
- fonts still settling,
- nested scroll containers.

That’s why the container/bubble looks correct but the text baseline inside is shifted down (the screenshot engine computes the text baseline differently than the browser does when transforms/animations are involved).

The session replay strongly suggests there’s a continuous `transform: scale(1.00...)` happening on at least one element during capture; that’s a classic trigger for “text baseline drift” in html2canvas.

## Strategy (high confidence approach)
Instead of trying to “guess” coordinates, we will make the DOM **stable** for the export render:

1) **Wait for fonts to be fully ready** before capture  
   - `await document.fonts.ready` (supported in modern browsers)  
   This removes baseline shifts caused by font swapping/late loading.

2) **Freeze animations & transitions during export** (export-mode only)  
   - Add export-only CSS rules that stop animations/transitions in export mode.
   - This eliminates the micro-scale updates that break text positioning.

3) **Neutralize transforms that affect text metrics during capture**  
   Best practice here is to do it in the html2canvas **clone** of the document so we don’t visually disturb the user:
   - Use html2canvas `onclone` callback to inject a `<style>` into the cloned DOM:
     - `animation: none !important; transition: none !important;`
     - `transform: none !important;` for elements that have transforms applied (or selectively for framer-motion elements / wrappers).
   This prevents “text moves but container doesn’t” in the exported render while keeping the live UI untouched.

4) **Make background deterministic**  
   - Replace `backgroundColor: null` with a computed theme background for the exported area to avoid “gray bar” artifacts caused by transparency.

5) (Optional fallback if needed) **Enable a more text-faithful rendering mode**
   - Try `foreignObjectRendering: true` only if the above still doesn’t fully solve it.
   - This can improve text accuracy but can introduce other quirks, so we’ll treat it as a fallback path behind a small conditional flag.

## Exact code changes (implementation details)

### A) `src/hooks/useClientExport.ts` (primary fix)
Update `captureElement()` to:
1. Add:
   - `await document.fonts?.ready` after enabling export-mode and before html2canvas.
2. Add `onclone` option in html2canvas call:
   - Inject a `<style>` tag into the cloned document’s `<head>` that:
     - Disables animations/transitions globally
     - Disables transforms (at least for known animation wrappers)
     - Disables caret/blinking effects (minor, but helps)
3. Replace `backgroundColor: null` with:
   - `backgroundColor: getComputedStyle(contentRef.current).backgroundColor`  
   - If that’s transparent, fallback to `getComputedStyle(document.body).backgroundColor` or `hsl(var(--theme-bg))` equivalent.

Proposed `onclone` CSS (in the clone only):
- `* { animation: none !important; transition: none !important; }`
- `*, *::before, *::after { caret-color: transparent !important; }`
- If we go broad: `[style*="transform"] { transform: none !important; }`  
  (We may keep this narrower if it risks layout changes—see “Risk control” below.)
- Specifically target framer-motion elements if possible:
  - Common patterns: `.framer-motion`, `[data-framer-name]` (depending on actual markup)
  - If not present, we’ll do the computed-style approach by JS in onclone: iterate elements and remove transforms when `transform !== 'none'`.

### B) `src/index.css` (export-mode stability)
Add export-mode rules (safe ones that won’t change layout, just freeze motion):
- `body.export-mode *, body.export-mode *::before, body.export-mode *::after { animation: none !important; transition: none !important; }`

(We will not globally remove transforms in the real DOM via CSS because that can reposition layout; we will do transform-neutralization in the cloned DOM via `onclone`.)

## Risk control / avoiding regressions
- We will not mutate the live UI beyond adding/removing `export-mode` (as currently).
- Transform removal will happen in the **cloned DOM** only (via `onclone`), so even if we have to be aggressive, it won’t break the user’s screen.
- If disabling transforms broadly in the clone changes layout too much (rare, but possible), we will narrow it to:
  - only elements with `computedStyle.transform` matching `matrix(...)` AND containing text nodes,
  - or only elements within known problematic sections (badges, payment info, chips).

## How we’ll verify (quick acceptance tests)
1) Export **Cashflow** view PNG:
   - Confirm badge “bubble” and text align properly (no text drifting down).
   - Confirm payment info divider lines are not clipped and text baseline matches.
2) Export **Snapshot** view PNG:
   - Confirm exit cards and any pill/badge components render correctly.
3) Export PDF:
   - Verify the same alignment (since PDF is built from the canvas image).
4) Run exports in both:
   - Tech Dark theme (most sensitive to gray/contrast artifacts)
   - Consultant theme (ensures background is handled correctly)

## If it still persists (backup plan)
If after freezing animations + clone-transform neutralization it still shifts:
- Switch capture method to “capture document and crop using bounding rect” (more complex but very robust for coordinate issues).
- Or enable `foreignObjectRendering: true` selectively for the problematic view.

## Files involved
- `src/hooks/useClientExport.ts` (main logic improvements: fonts ready, onclone freeze, background color)
- `src/index.css` (export-mode: stop transitions/animations)

## Outcome
Exports (PNG/PDF) where:
- Text no longer shifts within badges/cards
- Dividers and borders are not clipped
- The exported image matches the on-screen layout pixel-perfectly, regardless of theme
