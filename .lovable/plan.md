
# Plan: Extend Booking Date Range & Add Drag-Drop AI Extractor Zone

## Overview

Two enhancements requested:
1. **Extend booking year range** to include past years (for loading old client portfolio quotes)
2. **Add a drag-and-drop zone** in the Payment section that opens the AI Payment Plan Extractor with files pre-loaded

---

## Problem Analysis

### Issue 1: Year Range Too Limited

Currently in `src/components/roi/configurator/types.ts`:
```typescript
export const years = Array.from({ length: 12 }, (_, i) => 2024 + i);
// Results in: [2024, 2025, 2026, ... 2035]
```

And in `PaymentPlanExtractor.tsx`:
```typescript
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear + i);
// Results in: [2026, 2027, 2028, 2029, 2030]
```

**Solution**: Extend years to go back to 2018 (covering ~8 years of historical data) while still projecting forward.

### Issue 2: No Quick Drag-Drop to AI Extractor

Currently, users must:
1. Click "AI Import" button
2. Wait for sheet to open
3. Drag/upload files
4. Click extract

**Solution**: Add a subtle drop zone in the Payment section header that:
- Shows a visual indicator when dragging files over
- Automatically opens the AI Extractor with files pre-loaded
- Provides a faster workflow for power users

---

## Implementation Details

### Phase 1: Extend Year Ranges

**File: `src/components/roi/configurator/types.ts`**

Change the `years` constant to include past years:

```typescript
// Current:
export const years = Array.from({ length: 12 }, (_, i) => 2024 + i);

// New: 8 years back + 8 years forward from current year
const currentYear = new Date().getFullYear();
export const years = Array.from({ length: 16 }, (_, i) => currentYear - 8 + i);
// For 2026: [2018, 2019, 2020, ..., 2033]
```

**File: `src/components/roi/configurator/PaymentPlanExtractor.tsx`**

Extend the YEARS constant for the custom date picker:

```typescript
// Current:
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear + i);

// New: Include 8 years back
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 13 }, (_, i) => currentYear - 8 + i);
// For 2026: [2018, 2019, ..., 2030]
```

---

### Phase 2: Add Drag-Drop Zone to Payment Section

**File: `src/components/roi/configurator/PaymentSection.tsx`**

Add a new drag-drop zone component that:
1. Accepts file drops
2. Processes files (same as FileUploadZone)
3. Opens AI Extractor with files pre-populated

```text
┌─────────────────────────────────────────────────┐
│ Payment Plan                          [AI Import]│
│ Configure your payment schedule                  │
├─────────────────────────────────────────────────┤
│  ╔═══════════════════════════════════════════╗  │
│  ║   🔮 Drop payment plan here               ║  │
│  ║      PDF, image, or screenshot            ║  │
│  ╚═══════════════════════════════════════════╝  │
│                                                  │
│  [Post-Handover Toggle]                         │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

**Component structure:**

```tsx
// New component: AIExtractorDropZone
interface AIExtractorDropZoneProps {
  onFilesDropped: (files: FileWithPreview[]) => void;
  disabled?: boolean;
}

const AIExtractorDropZone = ({ onFilesDropped, disabled }: AIExtractorDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // File processing logic (reused from FileUploadZone)
  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    // Convert files to FileWithPreview format
    // Call onFilesDropped with processed files
  }, [onFilesDropped]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "border-2 border-dashed rounded-lg p-3 transition-all cursor-pointer",
        isDragging 
          ? "border-purple-400 bg-purple-500/10" 
          : "border-theme-border/40 hover:border-purple-400/50",
        disabled && "opacity-50 pointer-events-none"
      )}
      onClick={() => !disabled && onFilesDropped([])} // Click opens extractor empty
    >
      <div className="flex items-center justify-center gap-2 text-sm">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-theme-text-muted">
          Drop payment plan here or <span className="text-purple-400">click to import</span>
        </span>
      </div>
    </div>
  );
};
```

**Integration in PaymentSection:**

```tsx
// In PaymentSection component:

// State for pre-loaded files
const [preloadedFiles, setPreloadedFiles] = useState<FileWithPreview[]>([]);

// Handler for drop zone
const handleDropZoneFiles = (files: FileWithPreview[]) => {
  setPreloadedFiles(files);
  setShowAIExtractor(true);
};

// Modify PaymentPlanExtractor to accept initial files
<PaymentPlanExtractor
  open={showAIExtractor}
  onOpenChange={(open) => {
    setShowAIExtractor(open);
    if (!open) setPreloadedFiles([]); // Clear on close
  }}
  existingBookingMonth={inputs.bookingMonth}
  existingBookingYear={inputs.bookingYear}
  onApply={handleAIExtraction}
  initialFiles={preloadedFiles}  // NEW PROP
/>
```

**Update PaymentPlanExtractor to support initial files:**

```tsx
interface PaymentPlanExtractorProps {
  // ... existing props
  initialFiles?: FileWithPreview[];
}

// In component:
useEffect(() => {
  if (initialFiles && initialFiles.length > 0 && open) {
    setFiles(initialFiles);
  }
}, [initialFiles, open]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/configurator/types.ts` | Extend `years` array to include past 8 years |
| `src/components/roi/configurator/PaymentPlanExtractor.tsx` | Extend `YEARS` array, add `initialFiles` prop |
| `src/components/roi/configurator/PaymentSection.tsx` | Add drag-drop zone component and integration |

---

## User Experience

### Before:
- Booking year limited to 2024-2035
- Must click AI Import → wait for sheet → drag file → click extract

### After:
- Booking year supports 2018-2033 (adjusts dynamically with current year)
- Can drag file directly onto Payment section → extractor opens with file ready
- Click on drop zone also opens extractor (empty)
- Existing AI Import button still works as before

---

## Technical Notes

- The drop zone will reuse the same file processing logic from `FileUploadZone`
- Files dragged in will be converted to `FileWithPreview[]` format
- The extractor will automatically focus on the "Upload" tab when files are pre-loaded
- The subtle styling ensures it doesn't distract from the payment configuration
