
# Integrate Server-Side Screenshot Export

## Summary

Replace the client-side `html2canvas` export with server-side Browserless screenshots. The edge function `generate-snapshot-screenshot` already exists and is configured - we just need to integrate it into the export flow.

## Current Flow vs. New Flow

```text
CURRENT (causes offsets):
User clicks Export → ExportModal → useClientExport (html2canvas) → Broken layout

NEW (pixel-perfect):
User clicks Export → ExportModal → useServerExport → Edge Function → Browserless → Perfect render
```

---

## Files to Create/Modify

### 1. NEW: `src/hooks/useServerExport.ts`

Create a hook that:
- Takes `shareToken`, `format` (png/pdf), `view` (snapshot/cashflow)
- Calls `supabase.functions.invoke('generate-snapshot-screenshot', { body: {...} })`
- Converts base64 response to downloadable blob
- Handles loading state and error feedback

```typescript
// Key functions:
// - exportServerSide(options) - calls edge function
// - downloadBlob(base64, format, filename) - creates download
// - exporting: boolean - loading state
```

### 2. MODIFY: `src/components/roi/ExportModal.tsx`

Update to use server-side export:
- Import new `useServerExport` hook
- Ensure quote has `share_token` before export (generate if missing)
- Call server export instead of client export
- Update progress messaging ("Rendering..." instead of "Generating...")

Key changes:
- Add `shareToken` prop to the component
- Add `generateShareToken` prop for generating tokens when needed
- Switch from `useClientExport` to `useServerExport`

### 3. MODIFY: `src/pages/OICalculator.tsx`

Pass required props to ExportModal:
- Add `shareToken={quote?.share_token}` 
- Add `generateShareToken={generateShareToken}` from useCashflowQuote

---

## Technical Flow

```text
1. User clicks Export button
2. ExportModal opens with view/format options
3. User clicks "Export Snapshot" (for example)
4. Modal checks if quote has share_token:
   - If no → calls generateShareToken(quoteId) first
   - If yes → proceeds
5. Calls useServerExport.export({
     shareToken: quote.share_token,
     format: 'png' or 'pdf',
     view: 'snapshot' or 'cashflow'
   })
6. Hook invokes edge function: generate-snapshot-screenshot
7. Edge function:
   - Opens https://dbxprime.lovable.app/snapshot/{token}/print
   - Waits for .snapshot-print-content selector
   - Captures at 1920x1080 @ 2x scale
   - Returns base64
8. Hook converts base64 → blob → triggers download
9. Toast shows success
```

---

## Edge Function Already Ready

The `generate-snapshot-screenshot` function is fully implemented:

| Feature | Status |
|---------|--------|
| BROWSERLESS_TOKEN secret | Configured |
| config.toml entry | `verify_jwt = false` |
| CORS headers | Included |
| Auth validation | Uses getClaims() |
| PNG support | 1920x1080 @ 2x |
| PDF support | A3 landscape |
| Wait for selector | `.snapshot-print-content` / `.cashflow-print-content` |

---

## Changes to ExportModal Props

```typescript
interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId?: string;
  shareToken?: string | null;           // ADD
  projectName?: string;
  activeView?: 'cashflow' | 'snapshot';
  generateShareToken?: (quoteId: string) => Promise<string | null>;  // ADD
  mainContentRef?: React.RefObject<HTMLDivElement>;  // KEEP as fallback
  onViewChange?: (view: 'cashflow' | 'snapshot') => void;
}
```

---

## Export Both Views Flow

For "Both" option:
1. Export first view (snapshot or cashflow) via server
2. Export second view via server
3. Two files downloaded

---

## Error Handling

- If edge function fails → show toast with error
- If BROWSERLESS_TOKEN not configured → function returns 500, show "Export service unavailable"
- If user not authenticated → use client-side fallback (keep useClientExport as backup)

---

## Expected Results

| Issue | Before (html2canvas) | After (Browserless) |
|-------|---------------------|---------------------|
| Payment row offsets | Misaligned | Perfect |
| Dotted line separators | Missing | Visible |
| Value Add badges | Cut off | Complete |
| Mortgage info | Offset | Aligned |
| Exit cards | Layout issues | Correct |
| Font rendering | Inconsistent | Perfect |

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useServerExport.ts` | CREATE | Hook to call edge function |
| `src/components/roi/ExportModal.tsx` | MODIFY | Use server export |
| `src/pages/OICalculator.tsx` | MODIFY | Pass shareToken + generateShareToken props |

---

## Implementation Notes

1. Keep `useClientExport` as fallback for offline or error cases
2. Server export takes 3-8 seconds vs 1-2 for client - update UX messaging
3. The print routes `/snapshot/{token}/print` already exist and render correctly
4. BROWSERLESS_TOKEN is already in secrets (verified in project config)
