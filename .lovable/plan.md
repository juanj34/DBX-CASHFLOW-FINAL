
# Implementation Plan: Complete Export System for All Views

## Problem Summary
1. **Export buttons not visible**: Currently hidden in sidebar and require both `activeView === 'snapshot'` AND `shareToken` to exist
2. **shareToken requirement**: Users must click "Share Link" first before export becomes available
3. **No Cashflow view export**: Only Snapshot view can be exported; Cashflow view with all sections expanded cannot be exported

---

## Solution Overview

Create a complete export system that:
1. Makes export buttons always visible in both views (with auto-generation of shareToken when needed)
2. Creates a dedicated print layout for Cashflow view with all sections expanded
3. Adds an "Export" section in the sidebar with clear options for both views

---

## Technical Implementation

### Step 1: Update Sidebar Export Button Visibility

**File**: `src/components/roi/dashboard/DashboardSidebar.tsx`

Current logic (line 440):
```typescript
{activeView === 'snapshot' && shareToken && onExportImage && (
```

Change to show export buttons for BOTH views:
- Remove the `activeView === 'snapshot'` restriction
- Remove the `shareToken` requirement (will be auto-generated)
- Add separate labels: "Export Snapshot" vs "Export Cashflow"

New logic:
```typescript
{/* Export Section - Available for both views */}
<SectionHeader label="Export" collapsed={collapsed} />
{(onExportImage || onExportPdf) && (
  <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
    {/* Export current view as Image */}
    <ActionButton 
      icon={Image} 
      label={activeView === 'snapshot' ? "Export Snapshot (PNG)" : "Export Cashflow (PNG)"} 
      onClick={onExportImage} 
      disabled={exportingImage}
      collapsed={collapsed}
    />
    {/* Export current view as PDF */}
    <ActionButton 
      icon={FileDown} 
      label={activeView === 'snapshot' ? "Export Snapshot (PDF)" : "Export Cashflow (PDF)"} 
      onClick={onExportPdf} 
      disabled={exportingPdf}
      collapsed={collapsed}
    />
  </div>
)}
```

---

### Step 2: Create Cashflow Print Layout

**File**: `src/components/roi/cashflow/CashflowPrintContent.tsx` (New)

A fixed-width (1920px) layout for server-side screenshot capture with ALL sections expanded:

```
- PropertyHeroCard
- InvestmentOverviewGrid
- InvestmentSnapshot
- PaymentBreakdown (expanded, no collapse)
- ValueDifferentiatorsDisplay
- Hold Strategy Analysis (expanded):
  - RentSnapshot
  - CumulativeIncomeChart
  - OIYearlyProjectionTable
  - WealthSummaryCard
- Exit Strategy Analysis (expanded, if enabled):
  - ExitScenariosCards
  - OIGrowthCurve
- Mortgage Analysis (expanded, if enabled):
  - MortgageBreakdown
- CashflowSummaryCard
```

All `CollapsibleSection` components will be replaced with static expanded versions (just the content, no collapse headers).

---

### Step 3: Create Cashflow Print Route

**File**: `src/pages/CashflowPrint.tsx` (New)

Similar to `SnapshotPrint.tsx`:
- Fetches quote data using `shareToken`
- Renders `CashflowPrintContent` with all data
- Uses `.cashflow-print-content` CSS class for Browserless detection
- Fixed 1920px width for consistent screenshot capture

---

### Step 4: Update App.tsx Routes

**File**: `src/App.tsx`

Add the new print route:
```typescript
<Route path="/cashflow/:shareToken/print" element={<CashflowPrint />} />
```

---

### Step 5: Update Edge Function to Support Both Views

**File**: `supabase/functions/generate-snapshot-screenshot/index.ts`

Add support for a `view` parameter:
```typescript
interface RequestBody {
  shareToken: string;
  format: 'png' | 'pdf';
  view: 'snapshot' | 'cashflow';  // NEW
}

// Build URL based on view type
const targetUrl = view === 'cashflow'
  ? `https://dbxprime.lovable.app/cashflow/${shareToken}/print`
  : `https://dbxprime.lovable.app/snapshot/${shareToken}/print`;

// Wait for appropriate selector
waitForSelector: view === 'cashflow' 
  ? '.cashflow-print-content'
  : '.snapshot-print-content',
```

---

### Step 6: Update Export Hook with Auto-Token Generation

**File**: `src/hooks/useSnapshotExport.ts`

Rename to `useCashflowExport.ts` and extend to:
1. Accept `activeView` parameter
2. Auto-generate shareToken if not present (call `generateShareToken` before export)
3. Pass `view` parameter to edge function

```typescript
interface UseCashflowExportProps {
  shareToken?: string | null;
  projectName?: string;
  activeView: 'cashflow' | 'snapshot';
  generateShareToken: (quoteId: string) => Promise<string | null>;
  quoteId?: string;
  onTokenGenerated?: (token: string) => void;
}

export const useCashflowExport = ({ 
  shareToken, 
  projectName, 
  activeView,
  generateShareToken,
  quoteId,
  onTokenGenerated,
}: UseCashflowExportProps) => {
  
  const exportImage = useCallback(async () => {
    let token = shareToken;
    
    // Auto-generate token if not present
    if (!token && quoteId) {
      token = await generateShareToken(quoteId);
      if (token) {
        onTokenGenerated?.(token);
      }
    }
    
    if (!token) {
      toast({ title: 'Cannot export', description: 'Please save the quote first.' });
      return;
    }
    
    // Call edge function with view type
    const { data, error } = await supabase.functions.invoke('generate-snapshot-screenshot', {
      body: { shareToken: token, format: 'png', view: activeView },
    });
    // ... rest of download logic
  }, [shareToken, projectName, activeView, quoteId, generateShareToken]);
  
  // Similar for exportPdf...
};
```

---

### Step 7: Update OICalculator to Pass New Props

**File**: `src/pages/OICalculator.tsx`

Update the hook usage and pass new props:
```typescript
const { exportImage, exportPdf, exportingImage, exportingPdf } = useCashflowExport({
  shareToken: quote?.share_token,
  projectName: clientInfo.projectName,
  activeView: viewMode,
  generateShareToken,
  quoteId: quote?.id,
  onTokenGenerated: (token) => {
    // Update local state if needed
  },
});
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/roi/dashboard/DashboardSidebar.tsx` | Modify | Show export buttons for both views, add Export section |
| `src/components/roi/cashflow/CashflowPrintContent.tsx` | Create | Print-optimized cashflow layout with all sections expanded |
| `src/pages/CashflowPrint.tsx` | Create | Route handler for cashflow print view |
| `src/App.tsx` | Modify | Add `/cashflow/:shareToken/print` route |
| `supabase/functions/generate-snapshot-screenshot/index.ts` | Modify | Support `view` parameter for both snapshot/cashflow |
| `src/hooks/useSnapshotExport.ts` | Rename/Modify | Rename to `useCashflowExport.ts`, add activeView support and auto-token generation |
| `src/pages/OICalculator.tsx` | Modify | Update hook usage with new parameters |

---

## Export Flow Summary

1. User clicks "Export Cashflow (PNG)" or "Export Snapshot (PNG)"
2. If no `shareToken` exists, system auto-generates one
3. Edge function receives request with `shareToken`, `format`, and `view` type
4. Browserless navigates to appropriate print route (`/cashflow/:token/print` or `/snapshot/:token/print`)
5. Print content renders with all sections expanded (no interactive elements)
6. Screenshot captured at 3840px width (1920 x 2 scale factor)
7. Base64 response converted to blob and downloaded

---

## Quality Specifications

| Setting | Value |
|---------|-------|
| Viewport Width | 1920px |
| Device Scale Factor | 2x |
| Effective Width | 3840px |
| Full Page | true |
| Wait Strategy | networkidle0 + selector |
| PNG | Lossless |
| PDF | A3 landscape, printBackground: true |
