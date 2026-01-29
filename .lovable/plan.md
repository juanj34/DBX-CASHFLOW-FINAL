
# Plan: Fix PDF Export to Match Live Cashflow View

## Problem Summary
The PDF export uses a completely different rendering engine (`pdfGenerator.ts` with jsPDF manual drawing) instead of the same layout used in the live Snapshot/Cashflow view. This creates a fundamentally different document.

## Solution: Unify Export to Use DOM-Based Approach

### Phase 1: Fix the Export Modal Routing
**File: `src/components/roi/ExportModal.tsx`**

Currently the ExportModal uses two different approaches:
- PNG: Uses `exportSnapshot` (html2canvas on ExportSnapshotDOM) ✓
- PDF: Uses `downloadSnapshotPDF` from pdfGenerator.ts ✗

**Change:**
- Remove the PDF special case and use `exportSnapshot` for both PNG and PDF
- Both formats will render ExportSnapshotDOM and capture with html2canvas
- PDF will embed the high-resolution image into a PDF document

### Phase 2: Enhance ExportSnapshotDOM to Match SnapshotContent

The `ExportSnapshotDOM` component needs to mirror the live `SnapshotContent` exactly:

**File: `src/components/roi/export/ExportSnapshotDOM.tsx`**

1. **Add Hero Section**
   - Replace `ExportHeader` with a new `ExportPropertyHero` component that matches `PropertyHeroCard`
   - Include project hero image, building render, project/developer names
   - Display price info with dual currency

2. **Ensure 4 Overview Cards Match**
   - Verify `ExportOverviewCards` matches `SnapshotOverviewCards` visually (currently looks good)

3. **Update Payment Table**
   - Ensure `ExportPaymentTable` includes:
     - Handover quarter badges (green "Handover" label on relevant rows)
     - "Total to this point" cumulative line after handover payments
     - Value Differentiators section at bottom
     - All the same sections: Entry, Journey, Handover, Post-Handover

4. **Ensure Exit Scenarios Match**
   - `ExportExitCards` should match `CompactAllExitsCard` layout (numbered scenarios, same metrics)

5. **Verify Rent Card Matches**
   - `ExportRentCard` should match `CompactRentCard` (Long-Term + Short-Term if enabled)

6. **Verify Post-Handover Card Matches**
   - `ExportPostHandoverCard` should match `CompactPostHandoverCard`

7. **Verify Mortgage Card Matches**
   - `ExportMortgageCard` should match `CompactMortgageCard`

8. **Ensure Wealth Timeline Matches**
   - `ExportWealthTimeline` should match `WealthProjectionTimeline` (7 dots, connecting lines, phase legend)

### Phase 3: Remove Legacy pdfGenerator.ts Path

**Files to modify:**
- `src/components/roi/ExportModal.tsx`: Remove `downloadSnapshotPDF` import and usage
- Consider deprecating `src/lib/pdfGenerator.ts` entirely (or keep for reference)

### Phase 4: Ensure Consistent Data Flow

Both live view and export must receive identical:
- `inputs` (OIInputs)
- `calculations` (OICalculations)
- `clientInfo` (ClientUnitData) 
- `mortgageInputs` & `mortgageAnalysis`
- `exitScenarios` array
- `currency`, `rate`, `language`

## Technical Details

### Changes to ExportModal.tsx
```typescript
// Remove this import and usage:
// import { downloadSnapshotPDF } from '@/lib/pdfGenerator';

// Change handleExport to always use DOM-based export:
if (format === 'pdf') {
  // Use same DOM-based approach as PNG
  const result = await exportSnapshot(
    { inputs, calculations, clientInfo, ... },
    'pdf' // format passed to useExportRenderer
  );
}
```

### Changes to ExportSnapshotDOM.tsx
1. Add `ExportPropertyHero` import and replace `ExportHeader`
2. Pass hero image URLs to the hero component
3. Ensure all conditional visibility matches live (exit scenarios, post-handover, etc.)

### New Component: ExportPropertyHero.tsx
```typescript
// Static version of PropertyHeroCard for export
// Fixed height, no animations, inline styles
// Shows: project name, developer, unit info, price, hero image background
```

## Files to Modify
1. `src/components/roi/ExportModal.tsx` - Use DOM-based export for PDF
2. `src/components/roi/export/ExportSnapshotDOM.tsx` - Add hero section, verify structure
3. `src/components/roi/export/ExportPropertyHero.tsx` - Create new component (or enhance ExportHeader)
4. `src/components/roi/export/ExportPaymentTable.tsx` - Add handover badges, cumulative total
5. `src/hooks/useExportRenderer.tsx` - May need quoteImages prop for hero image

## Expected Outcome
After implementation:
- PDF and PNG exports will be **pixel-perfect matches** of the live Cashflow view
- Same layout, colors, sections, and conditional visibility
- Hero image, overview cards, payment table, exit scenarios, rent, mortgage, wealth timeline all match
- Dual currency and language localization work identically

## Testing Checklist
- [ ] Export PDF matches live view layout
- [ ] Export PNG matches live view layout
- [ ] Hero image appears in export (if configured)
- [ ] All payment sections visible with correct styling
- [ ] Exit scenarios show with correct calculations
- [ ] Post-handover card appears when enabled
- [ ] Mortgage card appears when enabled
- [ ] Wealth timeline shows all 7 years with phase colors
- [ ] Spanish translations work correctly
- [ ] Dual currency (AED + reference) displays correctly
