
# Fix Currency/Language Dropdown Buttons in Consultant Theme

## Problem
In the Consultant (light) theme, the currency and language dropdown **trigger buttons** in the Snapshot sidebar appear with poor contrast - likely a white or very light background making them hard to see or distinguish.

## Root Cause
The `SelectTrigger` base component (line 20 of `select.tsx`) uses `bg-background` as the default background class. While `SnapshotViewSidebar.tsx` passes `bg-theme-card-alt`, there may be CSS specificity issues, or the background is too close to the surrounding card color in light theme.

In Consultant theme:
- `--theme-card`: `0 0% 100%` (pure white)
- `--theme-card-alt`: `210 17% 95%` (very light gray - almost white)
- `--theme-border`: `214 20% 90%` (light gray border)

This creates near-invisible buttons when the sidebar card is white and the button is also white/near-white.

## Solution
For light themes, dropdown triggers need **higher contrast** against their container. The fix is to:

1. **In `SnapshotViewSidebar.tsx`**: Change `bg-theme-card-alt` to `bg-theme-bg-alt` for the SelectTrigger buttons - this provides better contrast in light themes (off-white vs pure white card)

2. **Ensure proper text contrast**: The `text-theme-text` class should already handle this correctly

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/SnapshotViewSidebar.tsx` | Lines 174, 193, 262 - Change SelectTrigger `bg-theme-card-alt` to `bg-theme-bg-alt` for better contrast in light themes |

## Specific Changes

**Desktop Currency Select (line 174)**:
```tsx
// Before
<SelectTrigger className="w-full h-9 bg-theme-card-alt border-theme-border text-theme-text">

// After
<SelectTrigger className="w-full h-9 bg-theme-bg-alt border-theme-border text-theme-text">
```

**Desktop Language Select (line 193)**:
```tsx
// Before
<SelectTrigger className="w-full h-9 bg-theme-card-alt border-theme-border text-theme-text">

// After
<SelectTrigger className="w-full h-9 bg-theme-bg-alt border-theme-border text-theme-text">
```

**Mobile Currency Select (line 262)**:
```tsx
// Before
<SelectTrigger className="w-20 h-8 bg-theme-card-alt border-theme-border text-theme-text text-xs">

// After
<SelectTrigger className="w-20 h-8 bg-theme-bg-alt border-theme-border text-theme-text text-xs">
```

## Theme Values Reference
- **Tech Dark**: `bg-theme-bg-alt` = dark navy (good contrast against card)
- **Consultant**: `bg-theme-bg-alt` = `210 17% 95%` (off-white, visible against white card)
- **Consultant Dark**: `bg-theme-bg-alt` = dark slate (good contrast)

This ensures the dropdown buttons stand out from the sidebar container in all themes.

## Testing Checklist
- [ ] Currency dropdown button visible in Consultant (light) theme
- [ ] Language dropdown button visible in Consultant (light) theme
- [ ] Both dropdowns still look correct in Tech Dark theme
- [ ] Mobile header dropdowns also have correct styling
- [ ] Dropdown content (menu items) remain readable
