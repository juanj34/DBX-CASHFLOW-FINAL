
# Add Editable Snapshot Title

## Overview

Add a customizable title field to the Snapshot view that displays above the project name. The title defaults to "Monthly Cashflow Statement" but can be edited by brokers to personalize for each client (e.g., "Investment Proposal", "Property Overview", "Q4 Investment Summary").

## Current State

- The `cashflow_quotes` table already has a `title` column (currently stores auto-generated titles like "Project - ClientName")
- PropertyHeroCard is the current hero component used in SnapshotContent
- The static "Monthly Cashflow Statement" text exists in SnapshotHeader.tsx (unused component)

## Solution: Add `snapshotTitle` Field

Instead of repurposing the existing `title` column (which serves as a quote identifier), store the snapshot headline as a field within the `inputs` JSON:

```tsx
// Inside inputs object
snapshotTitle: string | null; // Default: "Monthly Cashflow Statement"
```

This approach:
- Avoids database schema changes
- Preserves backward compatibility (null = use default)
- Saves automatically with existing auto-save logic

## Implementation Details

### 1. Add Snapshot Title to PropertyHeroCard

Display the title above the project name, editable when in configurator mode (not readOnly):

```tsx
// PropertyHeroCard.tsx - Add above project name
<p className="text-xs uppercase tracking-wider mb-2 text-white/60">
  {snapshotTitle || 'Monthly Cashflow Statement'}
</p>
```

For editing, add an inline editable field when not in read-only mode:
- Click to edit
- Input field appears
- Blur/Enter to save

### 2. Update Components to Pass/Display Title

| Component | Changes |
|-----------|---------|
| `PropertyHeroCard.tsx` | Add `snapshotTitle` prop, display above project name, enable inline editing when not readOnly |
| `SnapshotContent.tsx` | Pass `snapshotTitle` from inputs to PropertyHeroCard |
| `SnapshotView.tsx` | Extract `snapshotTitle` from loaded quote inputs |
| `OICalculator.tsx` | Handle title updates in inputs state, trigger auto-save |
| `ExportSnapshotLayout.tsx` | Pass `snapshotTitle` to export hero component |
| `ExportPropertyHero.tsx` | Display snapshot title in export version |

### 3. Default Value and Localization

- Default title: "Monthly Cashflow Statement"
- Localized version for Spanish: "Estado de Flujo de Caja Mensual"
- Title is stored as-is (not a translation key) to allow custom titles

### 4. UI/UX Design

**View Mode (SnapshotView - client facing)**:
```text
┌─────────────────────────────────────────────┐
│  [Hero Image Background]                     │
│                                              │
│        MONTHLY CASHFLOW STATEMENT            │  ← snapshotTitle (read-only)
│        ━━━━━━━━━━━━━━━━━━━━━━━━━             │
│           Project Marina Heights             │  ← projectName
│           by DAMAC                           │  ← developer
└─────────────────────────────────────────────┘
```

**Edit Mode (OICalculator - broker facing)**:
```text
┌─────────────────────────────────────────────┐
│  [Hero Image Background]                     │
│                                              │
│    [ Investment Proposal for Q4 ] ✏️         │  ← Click to edit
│        ━━━━━━━━━━━━━━━━━━━━━━━━━             │
│           Project Marina Heights             │
│           by DAMAC                           │
└─────────────────────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/PropertyHeroCard.tsx` | Add `snapshotTitle` prop with inline editing capability |
| `src/components/roi/snapshot/SnapshotContent.tsx` | Extract and pass `snapshotTitle` from inputs |
| `src/pages/SnapshotView.tsx` | Load `snapshotTitle` from inputs |
| `src/pages/OICalculator.tsx` | Handle `snapshotTitle` updates |
| `src/components/roi/export/ExportPropertyHero.tsx` | Add title display for exports |
| `src/components/roi/export/ExportSnapshotLayout.tsx` | Pass title prop |
| `src/components/roi/snapshot/SnapshotPrintContent.tsx` | Pass title prop if applicable |
| `src/contexts/LanguageContext.tsx` | Add translation key for default title |

## Technical Notes

1. **Storage**: Title stored in `inputs.snapshotTitle` field (inside JSON column)
2. **Auto-save**: Changes trigger existing auto-save mechanism
3. **Default handling**: `snapshotTitle || t('defaultSnapshotTitle')` pattern for fallback
4. **Export parity**: Same title appears in PDF/PNG exports
5. **No migration needed**: New field, null = use default

## Testing Checklist

After implementation:
- [ ] Title displays above project name in Snapshot view
- [ ] Title is editable in OICalculator (configurator mode)
- [ ] Custom title persists after save/reload
- [ ] Default "Monthly Cashflow Statement" shows when no custom title
- [ ] Title appears correctly in PDF/PNG exports
- [ ] Spanish translation works for default title
- [ ] Light and dark themes display title correctly
