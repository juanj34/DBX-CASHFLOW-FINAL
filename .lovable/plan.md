
# Plan: Move Gap Payment Warning to Bottom of Mortgage Section

## Problem

When the "Gap Payment Required" warning appears, it's positioned immediately after the header toggle (line 105-125), pushing all the main controls (Financing, Term, Interest Rate sliders) down. This causes a jarring UI shift that feels disruptive.

---

## Solution

Move the Gap Payment warning to the **bottom** of the section, just before the Reset button. This keeps the main controls (sliders) in a fixed position, providing a stable UI experience.

---

## Current Layout Order:

```
1. Header + Toggle
2. 🟡 Gap Warning (HERE - pushes everything down)
3. Financing / Term sliders (2x2 grid)
4. Interest Rate slider
5. Monthly Payment Summary
6. Advanced Settings (collapsible)
7. Reset Button
```

## New Layout Order:

```
1. Header + Toggle
2. Financing / Term sliders (2x2 grid)
3. Interest Rate slider
4. Monthly Payment Summary
5. Advanced Settings (collapsible)
6. 🟡 Gap Warning (MOVED HERE - no more UI shift)
7. Reset Button
```

---

## Technical Changes

### File: `src/components/roi/configurator/MortgageSection.tsx`

Move the Gap Warning block (lines 104-125) from its current position to just before the Reset button (before line 311).

**Before (current location - line 104):**
```tsx
{mortgageInputs.enabled && (
  <>
    {/* Gap Warning - Theme Style */}
    {hasGap && (
      <div className="p-3 bg-theme-card border border-amber-500/30 rounded-lg">
        ...
      </div>
    )}

    {/* Main Controls - Compact 2x2 Grid */}
    <div className="grid grid-cols-2 gap-2">
```

**After (moved to bottom):**
```tsx
{mortgageInputs.enabled && (
  <>
    {/* Main Controls - Compact 2x2 Grid */}
    <div className="grid grid-cols-2 gap-2">
      ...
    </div>

    {/* Monthly Payment Summary */}
    ...

    {/* Advanced Settings - Collapsible */}
    ...

    {/* Gap Warning - At bottom to avoid UI shift */}
    {hasGap && (
      <div className="p-3 bg-theme-card border border-amber-500/30 rounded-lg">
        ...
      </div>
    )}

    {/* Reset Button */}
    <Button ... />
  </>
)}
```

---

## Visual Comparison

### Before (Gap Warning at Top):
```
┌─────────────────────────────────────────┐
│ 🏠 Mortgage Calculator          [ON]   │
├─────────────────────────────────────────┤
│ ⚠️ Gap Payment Required                 │  ← Appears here
│ Your pre-handover (45%) don't cover...  │  ← Pushes sliders down
│ [████████░░░░░░░░░░░░░░░░░░░░░]        │
├─────────────────────────────────────────┤
│ Financing 50%     │    Term 15y        │  ← Shifts position
│ [──────●─────]    │  [────●──────]     │
├─────────────────────────────────────────┤
│ Interest Rate                    4.9%   │
```

### After (Gap Warning at Bottom):
```
┌─────────────────────────────────────────┐
│ 🏠 Mortgage Calculator          [ON]   │
├─────────────────────────────────────────┤
│ Financing 50%     │    Term 15y        │  ← Fixed position!
│ [──────●─────]    │  [────●──────]     │
├─────────────────────────────────────────┤
│ Interest Rate                    4.9%   │
│ [────●─────────────────────────]       │
├─────────────────────────────────────────┤
│ Monthly Payment: AED 12,345            │
├─────────────────────────────────────────┤
│ ▶ Advanced Settings                     │
├─────────────────────────────────────────┤
│ ⚠️ Gap Payment Required                 │  ← Appears here
│ Your pre-handover (45%) don't cover...  │  ← No layout shift!
│ [████████░░░░░░░░░░░░░░░░░░░░░]        │
├─────────────────────────────────────────┤
│ 🔄 Reset to Defaults                    │
└─────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/configurator/MortgageSection.tsx` | Move Gap Warning block from line 104-125 to just before Reset button (line 311) |

---

## Benefits

1. **Stable UI** - Sliders stay in place regardless of gap status
2. **No jarring shifts** - Warning appears below, expanding downward
3. **Better UX** - Users can adjust sliders without the UI jumping
4. **Still visible** - Warning is still prominently displayed with amber styling
