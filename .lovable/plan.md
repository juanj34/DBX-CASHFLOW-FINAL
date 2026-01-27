
# Plan: Unify Snapshot View in Presentation Mode

## Problem Identified

The presentation mode's snapshot view (`PresentationPreview.tsx`) shows a **different layout** than the snapshot view in the cashflow generator (`OICalculator.tsx`) and direct share link (`SnapshotView.tsx`).

### Current State

| Location | Component Used | Layout |
|----------|---------------|--------|
| OICalculator (creation side) | `SnapshotContent` | PropertyHeroCard, SnapshotOverviewCards, CompactPaymentTable, CompactRentCard, CompactAllExitsCard, CompactMortgageCard |
| SnapshotView (direct share) | `SnapshotContent` | Same as above |
| PresentationPreview (presentation mode) | `InvestmentOverviewGrid` + `InvestmentSnapshot` | Old grid layout, missing all compact cards |

### Root Cause

In `PresentationPreview.tsx` lines 110-136, the snapshot view mode renders:
```typescript
if (viewMode === 'snapshot') {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
      <InvestmentOverviewGrid ... />
      <InvestmentSnapshot ... />
    </div>
  );
}
```

This is completely different from the `SnapshotContent` component used elsewhere.

---

## Technical Solution

### Step 1: Update PresentationPreview to Use SnapshotContent

**File: `src/components/presentation/PresentationPreview.tsx`**

Replace the snapshot view mode rendering with `SnapshotContent`:

1. Import the `SnapshotContent` component:
```typescript
import { SnapshotContent } from "@/components/roi/snapshot";
```

2. Modify the `QuotePreview` component's snapshot mode to use `SnapshotContent`:

```typescript
// Snapshot view - use the same SnapshotContent as OICalculator and SnapshotView
if (viewMode === 'snapshot') {
  const exitScenarios = quoteData.exitScenarios && quoteData.exitScenarios.length > 0
    ? quoteData.exitScenarios
    : calculateAutoExitScenarios(calculations.totalMonths);

  return (
    <SnapshotContent
      inputs={quoteData.inputs}
      calculations={calculations}
      clientInfo={quoteData.clientUnitData}
      mortgageInputs={quoteData.mortgageInputs}
      mortgageAnalysis={mortgageAnalysis}
      exitScenarios={exitScenarios}
      quoteImages={{
        heroImageUrl: quoteData.heroImageUrl,
        floorPlanUrl: null, // Will need to fetch or pass through
        buildingRenderUrl: quoteData.buildingRenderUrl,
      }}
      currency="AED"
      setCurrency={() => {}} // Read-only in presentation mode
      language="en"
      setLanguage={() => {}} // Read-only in presentation mode
      rate={rate}
    />
  );
}
```

### Step 2: Add Floor Plan URL to QuoteData

**File: `src/components/presentation/PresentationPreview.tsx`**

Update the `QuoteData` interface and fetching logic to include `floorPlanUrl`:

```typescript
interface QuoteData {
  inputs: OIInputs;
  mortgageInputs: MortgageInputs;
  heroImageUrl: string | null;
  buildingRenderUrl: string | null;
  floorPlanUrl: string | null; // Add this
  // ... rest of fields
}
```

Update the image fetching logic in `PresentationPreview` to also get the floor plan:

```typescript
const heroImage = imagesData.find(img => img.image_type === 'hero_image');
const buildingRender = imagesData.find(img => img.image_type === 'building_render');
const floorPlan = imagesData.find(img => img.image_type === 'floor_plan'); // Add this

setQuoteData({
  // ... other fields
  heroImageUrl: heroImage?.image_url || null,
  buildingRenderUrl: buildingRender?.image_url || null,
  floorPlanUrl: floorPlan?.image_url || null, // Add this
});
```

### Step 3: Handle Language/Currency State (Optional Enhancement)

Since `SnapshotContent` expects `setCurrency` and `setLanguage` callbacks, we have two options:

**Option A: Pass no-op callbacks (simplest)**
```typescript
setCurrency={() => {}} // Already in code above
setLanguage={() => {}}
```

**Option B: Make SnapshotContent support read-only mode (better UX)**
Add a `readOnly` prop to `SnapshotContent` that hides the currency/language toggles.

For this implementation, we'll use **Option A** since `PropertyHeroCard` already accepts these props and the toggles will simply not persist changes.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/presentation/PresentationPreview.tsx` | Import SnapshotContent, update QuoteData interface to include floorPlanUrl, replace snapshot mode rendering with SnapshotContent |

---

## Visual Result

After this change, when viewing a presentation with snapshot mode:

**Before:**
- InvestmentOverviewGrid (old grid layout)
- InvestmentSnapshot (basic summary card)
- Missing: Hero card, payment breakdown, rent card, exit scenarios, mortgage card

**After:**
- PropertyHeroCard (with image, price info, floor plan button)
- SnapshotOverviewCards (4 key metrics)
- CompactPaymentTable (detailed payment breakdown with dates and handover badges)
- CompactRentCard (rental income summary with wealth projection button)
- CompactAllExitsCard (exit scenarios with ROE)
- CompactMortgageCard (mortgage analysis)

This will provide a **consistent experience** across:
1. Cashflow Generator (creation side)
2. Direct share links (`/snapshot/:shareToken`)
3. Presentation mode (`/presentation/:shareToken`)

---

## Implementation Notes

- The `SnapshotContent` component is already designed to be reusable and read-only compatible
- Currency/language toggles will be visible but won't persist (acceptable for presentation mode)
- All calculation logic remains the same, only the rendering changes
- Exit scenarios will be pulled from saved data or auto-calculated (same logic as before)
