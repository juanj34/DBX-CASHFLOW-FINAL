
# Fix Exit Cards Theme Colors

## Problem

The exit scenario rows in `CompactAllExitsCard` use `bg-muted/30` which is a generic Tailwind class that doesn't respect the theme system. This creates a light gray background that clashes with the dark theme and makes text hard to read.

**Current (line 100):**
```tsx
className="p-2.5 rounded-lg transition-colors bg-muted/30 hover:bg-muted/50 border border-transparent"
```

The `bg-muted` color is defined as `hsl(var(--muted))` in Tailwind, which may not align with the theme CSS variables.

---

## Solution

Replace the generic `bg-muted` classes with proper theme-aware classes that are defined in the theme system:

| Current | Replacement | Reason |
|---------|-------------|--------|
| `bg-muted/30` | `bg-theme-bg/50` | Uses theme background color with transparency |
| `hover:bg-muted/50` | `hover:bg-theme-border/30` | Subtle hover using theme border color |
| `border border-transparent` | `border border-theme-border/30` | Visible subtle border matching theme |

---

## File to Modify

### `src/components/roi/snapshot/CompactAllExitsCard.tsx`

**Line 100 - Change from:**
```tsx
className="p-2.5 rounded-lg transition-colors bg-muted/30 hover:bg-muted/50 border border-transparent"
```

**To:**
```tsx
className="p-2.5 rounded-lg transition-colors bg-theme-bg/50 hover:bg-theme-border/30 border border-theme-border/30"
```

This ensures:
- Background uses the theme's `bg` color with 50% opacity
- Hover state uses the theme's border color with 30% opacity
- Border is visible but subtle using theme border color

---

## Expected Results

| Theme | Before | After |
|-------|--------|-------|
| Tech Dark | Light gray background (hard to read) | Dark blue-gray matching theme |
| Consultant | Light gray (inconsistent) | White/light gray matching theme |
| Dark Consultant | Light gray (clashing) | Charcoal matching theme |

The exit cards will now properly adapt to whichever theme the user has selected.
