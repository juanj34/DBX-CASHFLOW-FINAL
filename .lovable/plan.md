
# Implementation Plan: Unified Export Modal

## Problem
Currently there are two separate export buttons in the sidebar:
- "Export Snapshot" / "Export Cashflow" (PNG)
- "Export PDF"

These only export the current view and don't allow exporting both views at once.

## Solution
Replace both buttons with a single **"Export"** button that opens a modal with clear options.

---

## Export Modal Design

```
┌─────────────────────────────────────────────────────┐
│  📥 Export Quote                              [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  What to export:                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ ○ Cashflow  │ │ ○ Snapshot  │ │ ○ Both      │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                     │
│  Format:                                            │
│  ┌─────────────┐ ┌─────────────┐                   │
│  │ ○ PDF       │ │ ○ PNG       │                   │
│  └─────────────┘ └─────────────┘                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           Export                    🔽      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  (Generating cashflow... 1/2)  ← progress state    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Step 1: Create ExportModal Component

**File**: `src/components/roi/ExportModal.tsx` (New)

A modal with:
- **View Selection**: Radio group with "Cashflow", "Snapshot", "Both" options
- **Format Selection**: Radio group with "PDF", "PNG" options
- **Export Button**: Triggers export(s) based on selections
- **Loading State**: Shows progress when exporting (especially for "Both")
- **Auto-token Generation**: Uses existing logic from useCashflowExport

Props:
```typescript
interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken?: string | null;
  quoteId?: string;
  projectName?: string;
  generateShareToken?: (quoteId: string) => Promise<string | null>;
  onTokenGenerated?: (token: string) => void;
}
```

---

### Step 2: Update Export Hook for Multi-View Support

**File**: `src/hooks/useCashflowExport.ts`

Extend to support:
- Exporting a specific view (not just activeView)
- Exporting both views sequentially
- Progress callback for "Both" exports

New functions:
```typescript
const exportSingleView = async (view: 'cashflow' | 'snapshot', format: 'png' | 'pdf') => {...}

const exportBothViews = async (format: 'png' | 'pdf', onProgress?: (step: number, total: number) => void) => {
  onProgress?.(1, 2);
  await exportSingleView('cashflow', format);
  onProgress?.(2, 2);
  await exportSingleView('snapshot', format);
}
```

---

### Step 3: Update Sidebar - Replace Two Buttons with One

**File**: `src/components/roi/dashboard/DashboardSidebar.tsx`

Replace:
```typescript
// BEFORE: Two buttons
{onExportImage && <ActionButton label="Export Snapshot" ... />}
{onExportPdf && <ActionButton label="Export PDF" ... />}
```

With:
```typescript
// AFTER: Single button
{quoteId && (
  <ActionButton 
    icon={FileDown} 
    label="Export" 
    onClick={onOpenExportModal} 
    collapsed={collapsed}
  />
)}
```

Remove props:
- `onExportImage`
- `onExportPdf`
- `exportingImage`
- `exportingPdf`

Add props:
- `onOpenExportModal?: () => void`

---

### Step 4: Update Sidebar Props Interface

**File**: `src/components/roi/dashboard/DashboardSidebar.tsx`

```typescript
interface DashboardSidebarProps {
  // ... existing props
  
  // Remove these:
  // onExportImage?: () => void;
  // onExportPdf?: () => void;
  // exportingImage?: boolean;
  // exportingPdf?: boolean;
  
  // Add this:
  onOpenExportModal?: () => void;
}
```

---

### Step 5: Update OICalculator to Use Modal

**File**: `src/pages/OICalculator.tsx`

Changes:
1. Add state for export modal: `const [exportModalOpen, setExportModalOpen] = useState(false)`
2. Remove individual export handlers from sidebar props
3. Pass `onOpenExportModal={() => setExportModalOpen(true)}` to sidebar
4. Render ExportModal component with necessary props

---

### Step 6: Update DashboardLayout Props (if needed)

**File**: `src/components/roi/dashboard/DashboardLayout.tsx`

Pass through the new `onOpenExportModal` prop instead of individual export handlers.

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/roi/ExportModal.tsx` | Create | Modal with view/format selection |
| `src/hooks/useCashflowExport.ts` | Modify | Add multi-view export support |
| `src/components/roi/dashboard/DashboardSidebar.tsx` | Modify | Replace 2 buttons with 1 "Export" button |
| `src/pages/OICalculator.tsx` | Modify | Add modal state and render ExportModal |
| `src/components/roi/dashboard/DashboardLayout.tsx` | Modify | Update props passthrough |

---

## Export Flow

1. User clicks "Export" button in sidebar
2. Modal opens with options:
   - **View**: Cashflow (default to current view) / Snapshot / Both
   - **Format**: PDF / PNG
3. User clicks "Export" in modal
4. If no shareToken, auto-generate one
5. For "Both": 
   - Export first view, show progress "Exporting 1/2..."
   - Export second view, show progress "Exporting 2/2..."
   - Both files download
6. For single view: Export and download
7. Close modal, show success toast

---

## UI/UX Details

- Default view selection = current active view
- Dark theme styling consistent with existing modals
- Loading spinner with progress text for "Both"
- Disabled button while exporting
- Clear visual distinction between selected/unselected options
