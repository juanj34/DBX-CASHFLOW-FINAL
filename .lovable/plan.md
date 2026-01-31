
# Export Functionality for Off-Plan vs Secondary Comparison Tool

## Overview

This plan implements a complete PDF/PNG export system for the Off-Plan vs Secondary comparison tool, following the established **Export DOM Architecture** pattern used throughout the application.

The export will capture:
1. Key Insights (4 comparison cards)
2. Year-by-Year Asset Progression Table
3. Wealth Trajectory Chart
4. Exit Scenarios Comparison Table
5. Out of Pocket Analysis Card
6. Mortgage Coverage Card (if applicable)
7. Rental Comparison at Handover
8. Final Verdict

---

## Architecture

Following the existing pattern from the main cashflow export system:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     Export Flow                                      │
├─────────────────────────────────────────────────────────────────────┤
│  User clicks "Export" button in header                               │
│           ↓                                                          │
│  ExportComparisonModal opens (format selection: PDF/PNG)             │
│           ↓                                                          │
│  useExportRenderer hook creates offscreen container                  │
│           ↓                                                          │
│  ExportComparisonDOM rendered (static, A3 landscape, 1587px width)   │
│           ↓                                                          │
│  html2canvas captures at 2x resolution                               │
│           ↓                                                          │
│  jsPDF embeds image / PNG downloaded directly                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Files to Create

### 1. `src/components/roi/secondary/export/ExportComparisonDOM.tsx`
Main static export container component (similar to `ExportSnapshotDOM.tsx`).

**Props:**
```typescript
interface ExportComparisonDOMProps {
  // Off-Plan data
  offPlanInputs: OIInputs;
  offPlanCalcs: OICalculations;
  offPlanProjectName: string;
  
  // Secondary data
  secondaryInputs: SecondaryInputs;
  secondaryCalcs: SecondaryCalculations;
  
  // Shared metrics
  metrics: ComparisonMetrics;
  handoverYearIndex: number;
  exitMonths: number[];
  rentalMode: 'long-term' | 'airbnb';
  
  // Calculated values (passed from parent to ensure consistency)
  offPlanTotalAssets10Y: number;
  secondaryTotalAssets10Y: number;
  offPlanMonthlyRent5Y: number;
  secondaryMonthlyRent5Y: number;
  appreciationDuringConstruction: number;
  secondaryRentDuringConstruction: number;
  
  // Display settings
  currency: Currency;
  rate: number;
  language: 'en' | 'es';
}
```

**Structure:**
- Fixed 1587px width (A3 landscape @ 96dpi)
- All inline styles (no hover effects, no animations, no framer-motion)
- Uses CSS variables for theme consistency

### 2. `src/components/roi/secondary/export/ExportKeyInsights.tsx`
Static version of `ComparisonKeyInsights.tsx` for export.

**Features:**
- 4-column grid layout
- Same metric calculations
- No tooltips, no interactivity
- Fixed fonts and colors

### 3. `src/components/roi/secondary/export/ExportWealthTable.tsx`
Static version of `YearByYearWealthTable.tsx` for export.

**Features:**
- Full 10-year data table
- Simplified headers (no tooltip triggers)
- Fixed column widths for consistency
- Color-coded delta values

### 4. `src/components/roi/secondary/export/ExportWealthChart.tsx`
Static version of `WealthTrajectoryDualChart.tsx` for export.

**Considerations:**
- Recharts renders as SVG, which html2canvas handles well
- Need to ensure fixed dimensions (no ResponsiveContainer in export)
- Remove Legend interactivity

### 5. `src/components/roi/secondary/export/ExportExitScenarios.tsx`
Static version of `ExitScenariosComparison.tsx` for export.

**Features:**
- Simplified table without tooltips
- Winner badges inline
- Fixed column widths

### 6. `src/components/roi/secondary/export/ExportOutOfPocket.tsx`
Static version of `OutOfPocketCard.tsx` for export.

### 7. `src/components/roi/secondary/export/ExportMortgageCoverage.tsx`
Static version of `MortgageCoverageCard.tsx` for export (conditional).

### 8. `src/components/roi/secondary/export/ExportRentalComparison.tsx`
Static version of `RentalComparisonAtHandover.tsx` for export.

### 9. `src/components/roi/secondary/export/ExportVerdict.tsx`
Static version of `ComparisonVerdict.tsx` for export.

### 10. `src/components/roi/secondary/export/ExportComparisonHeader.tsx`
Header section with:
- Title: "Off-Plan vs Secondary Property Comparison"
- Off-Plan project name + base price
- Secondary property name + purchase price
- Export date
- Broker info (if available)

### 11. `src/components/roi/secondary/export/ExportComparisonFooter.tsx`
Footer with:
- "Powered by DBX Prime" branding
- Disclaimer text
- Generation timestamp

### 12. `src/components/roi/secondary/export/index.ts`
Barrel export file for all export components.

### 13. `src/components/roi/secondary/ExportComparisonModal.tsx`
Modal for selecting export format (PDF/PNG).

**Features:**
- Format selection (PDF default, PNG option)
- Progress indicator during export
- Uses `useExportRenderer` hook pattern

---

## Files to Modify

### 1. `src/pages/OffPlanVsSecondary.tsx`

**Add:**
- Import `ExportComparisonModal`
- State for `exportModalOpen`
- Export button in the header (next to Load/Reconfigure buttons)
- Pass all required props to modal

**Header addition (~line 748):**
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setExportModalOpen(true)}
  className="border-theme-border text-theme-text"
>
  <Download className="w-4 h-4 mr-2" />
  Export
</Button>
```

### 2. `src/hooks/useExportRenderer.tsx`

**Add:**
- New export function for comparison: `exportComparison`
- Import and use `ExportComparisonDOM` component

---

## Export Component Design Principles

Following the existing pattern from `ExportSnapshotDOM`:

1. **Fixed Dimensions**
   - Width: 1587px (A3 landscape)
   - No responsive breakpoints
   - All elements use fixed px values

2. **Inline Styles Only**
   - No Tailwind classes that might not render in offscreen DOM
   - Use `style={{}}` for all styling
   - Reference CSS variables via `hsl(var(--theme-xxx))`

3. **No Interactivity**
   - No hover states
   - No click handlers
   - No tooltips with triggers
   - No animations or transitions

4. **Static Data Display**
   - All calculations done in parent
   - Components receive final values as props
   - No hooks inside export components (except useMemo for formatting)

5. **Theme Consistency**
   - Use theme CSS variables for colors
   - Export captures current theme (light/dark)
   - Background color from `getBackgroundColor()` in renderer

---

## Technical Implementation Details

### Chart Rendering for Export

For the `ExportWealthChart`, we need special handling since Recharts uses ResponsiveContainer:

```tsx
// Export version uses fixed dimensions
<ComposedChart width={700} height={300} data={chartData}>
  {/* No ResponsiveContainer wrapper */}
</ComposedChart>
```

### Calculation Consistency

All calculated values are passed as props from the parent component to ensure the export shows exactly what the user sees:

```tsx
<ExportComparisonDOM
  // Pre-calculated values from parent (same as live view)
  offPlanTotalAssets10Y={offPlanTotalAssets10Y}
  secondaryTotalAssets10Y={secondaryTotalAssets10Y}
  // ... etc
/>
```

### Export Renderer Integration

Add a new method to `useExportRenderer`:

```typescript
const exportComparison = useCallback(async (
  props: ExportComparisonDOMProps,
  format: FormatType
): Promise<ExportResult> => {
  // Similar to exportSnapshot but renders ExportComparisonDOM
  return await renderAndCaptureComparison(props, format, 'comparison');
}, [renderAndCaptureComparison]);
```

---

## Visual Layout (A3 Landscape - 1587 x auto px)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Off-Plan vs Secondary Comparison                                        │
│ [Off-Plan: Project Name - AED X.XXM]  [Secondary: Property - AED X.XXM]  [Date] │
├─────────────────────────────────────────────────────────────────────────────────┤
│ KEY INSIGHTS (4 cards row)                                                      │
│ ┌────────────┬────────────┬────────────┬────────────┐                          │
│ │Total Wealth│ Multiplier │Monthly Rent│Construction│                          │
│ │  (10Y)     │   (10Y)    │  (Year 5)  │  Trade-off │                          │
│ └────────────┴────────────┴────────────┴────────────┘                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ YEAR-BY-YEAR TABLE                   │ WEALTH TRAJECTORY CHART                  │
│ Year | Off-Plan | Secondary | Delta  │  [Line chart with Off-Plan vs Secondary] │
│ 0-10 data rows                       │                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ EXIT SCENARIOS TABLE                                                            │
│ [Year 3/5/10 exit comparison with Value, Profit, ROE for both properties]       │
├──────────────────────────────────────┬──────────────────────────────────────────┤
│ OUT OF POCKET ANALYSIS               │ RENTAL COMPARISON AT HANDOVER            │
│ [Capital during construction]        │ [Monthly rent comparison]                │
├──────────────────────────────────────┴──────────────────────────────────────────┤
│ MORTGAGE COVERAGE (if applicable)                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ VERDICT                                                                         │
│ [Winner summary with key differentiators]                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER: Powered by DBX Prime | Disclaimer | Generated: Jan 31, 2026             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## File Summary

| New Files | Description |
|-----------|-------------|
| `src/components/roi/secondary/export/ExportComparisonDOM.tsx` | Main export container |
| `src/components/roi/secondary/export/ExportComparisonHeader.tsx` | Header with property info |
| `src/components/roi/secondary/export/ExportKeyInsights.tsx` | 4 insight cards |
| `src/components/roi/secondary/export/ExportWealthTable.tsx` | Year-by-year table |
| `src/components/roi/secondary/export/ExportWealthChart.tsx` | Trajectory chart |
| `src/components/roi/secondary/export/ExportExitScenarios.tsx` | Exit comparison table |
| `src/components/roi/secondary/export/ExportOutOfPocket.tsx` | Capital analysis card |
| `src/components/roi/secondary/export/ExportMortgageCoverage.tsx` | Mortgage card (optional) |
| `src/components/roi/secondary/export/ExportRentalComparison.tsx` | Rental at handover |
| `src/components/roi/secondary/export/ExportVerdict.tsx` | Final recommendation |
| `src/components/roi/secondary/export/ExportComparisonFooter.tsx` | Footer with branding |
| `src/components/roi/secondary/export/index.ts` | Barrel exports |
| `src/components/roi/secondary/ExportComparisonModal.tsx` | Format selection modal |

| Modified Files | Changes |
|----------------|---------|
| `src/pages/OffPlanVsSecondary.tsx` | Add export button + modal state |
| `src/hooks/useExportRenderer.tsx` | Add `exportComparison` function |
| `src/components/roi/secondary/index.ts` | Export new modal component |

---

## Implementation Order

1. Create export subfolder and index
2. Build `ExportComparisonHeader` and `ExportComparisonFooter`
3. Build `ExportKeyInsights` (static 4-card grid)
4. Build `ExportWealthTable` (static table)
5. Build `ExportWealthChart` (fixed-dimension chart)
6. Build `ExportExitScenarios` (static table)
7. Build remaining cards (OutOfPocket, MortgageCoverage, RentalComparison, Verdict)
8. Assemble `ExportComparisonDOM` with all components
9. Create `ExportComparisonModal` with format selection
10. Update `useExportRenderer` hook
11. Add export button to `OffPlanVsSecondary.tsx`
12. Test both PDF and PNG exports with light and dark themes
