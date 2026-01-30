
# Plan: Theme-Aware Loading States

## Problem
The loading screens shown during page transitions use hardcoded dark colors (#0f172a, #1a1f2e, #2a3142) instead of theme tokens. When using the light "Consultant" theme, users see a jarring dark flash before the page content loads.

## Affected Components

| Component | Location | Issue |
|-----------|----------|-------|
| `CashflowSkeleton` | `src/components/roi/CashflowSkeleton.tsx` | Full skeleton with all hardcoded hex colors |
| `ProtectedRoute` | `src/components/auth/ProtectedRoute.tsx` | Already uses theme tokens (OK) |
| `Home.tsx` | Loading spinner | Already uses theme tokens (OK) |

The main culprit is `CashflowSkeleton.tsx` which is used across multiple pages:
- `OICalculator.tsx` (Cashflow Generator)
- `SnapshotView.tsx` (Shared quote view)
- `CashflowView.tsx` (Legacy cashflow view)
- `CashflowDashboard.tsx` (Legacy dashboard)

## Solution
Replace all hardcoded hex colors in `CashflowSkeleton.tsx` with theme-aware CSS classes.

### Color Mapping

| Hardcoded | Theme Token |
|-----------|-------------|
| `bg-[#0f172a]` | `bg-theme-bg` |
| `bg-[#1a1f2e]` | `bg-theme-card` |
| `bg-[#2a3142]` | `bg-theme-border` |
| `border-[#2a3142]` | `border-theme-border` |
| `bg-[#CCFF00]/20` | `bg-theme-accent/20` |

## Changes

### File: `src/components/roi/CashflowSkeleton.tsx`

1. **Main container** (line 5): `bg-[#0f172a]` becomes `bg-theme-bg`

2. **Header** (line 7): 
   - `border-[#2a3142]` becomes `border-theme-border`
   - `bg-[#0f172a]/80` becomes `bg-theme-bg/80`

3. **All Skeleton elements**: Replace `bg-[#2a3142]` with `bg-theme-border`

4. **All card containers**: 
   - `bg-[#1a1f2e]` becomes `bg-theme-card`
   - `border-[#2a3142]` becomes `border-theme-border`

5. **Accent skeleton elements**: Replace `bg-[#CCFF00]/20` with `bg-theme-accent/20`

6. **CardSkeleton, ChartSkeleton, TableSkeleton** exports: Apply same token replacements

## Visual Result

### Tech Dark Theme (current appearance)
Dark navy background, dark gray skeletons - unchanged

### Consultant (Light) Theme (fixed)
Light gray background, white/light gray skeletons - now consistent with the light theme

## Impact
- Smooth transitions: No more dark flash when navigating between pages in light theme
- Theme consistency: Loading states match the selected theme
- Applies to all pages using `CashflowSkeleton`
