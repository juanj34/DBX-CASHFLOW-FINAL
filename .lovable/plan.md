
# Plan: Fix Presentation Issues - COMPLETED

## Changes Made

### 1. ✅ Exit Scenarios Showing AED 0 - FIXED
**Files Modified:**
- `src/components/roi/snapshot/CompactAllExitsCard.tsx` - Now calculates scenarios dynamically using `calculateExitScenario()` instead of looking up from pre-calculated list
- `src/components/roi/compare/ExitComparison.tsx` - Same fix, calculates dynamically

**Result:** Exit scenarios now show correct values (profit, ROE, capital invested) regardless of exit month configuration.

### 2. ✅ Currency/Rate Passed to Comparison Components - FIXED
**File Modified:** `src/components/presentation/PresentationPreview.tsx`
- PaymentComparison now receives `currency` and `exchangeRate` props
- GrowthComparisonChart now receives `currency` and `exchangeRate` props
- ExitComparison now receives `currency` and `exchangeRate` props

### 3. ✅ Toggle View Button - CLARIFIED
The presentation view already forces `viewMode="snapshot"` at line 684 of PresentationPreview.tsx.
The currency and language selectors are NOT view toggles - they are legitimate controls for switching display preferences.

### 4. ✅ Export All Button - FIXED
**File Modified:** `src/pages/PresentationView.tsx`
- "Export All" now exports all quotes sequentially with 500ms delay between each
- Button now shows for any number of quotes (not just >1)

### 5. Download Button for Each Quote
The NavItem component at lines 337-349 already includes a download button for each quote. If not visible, may need CSS adjustment or browser refresh.

---

## Still TODO (User Requested)

### Drag/Reorder Cards in Comparison View
- Add @dnd-kit for sortable comparison cards
- Allow users to reorder properties in comparison view

### Post-Handover Payment Plan Visualization Improvements
- Better 4-part breakdown visualization
- "Total to Handover" vs "Total Post-Handover" amounts

---

## Technical Notes

**Exit Scenario Calculation:**
Using `calculateExitScenario()` from `constructionProgress.ts` ensures:
- Correct exit price based on phased appreciation
- Accurate total capital deployed at exit point
- Proper ROE calculations with entry costs factored in
