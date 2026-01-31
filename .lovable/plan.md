

# Fix Currency & Language Button Visibility in Light Themes

## Problem

The currency (AED) and language (EN) dropdown buttons in the Snapshot View hero card use hardcoded `text-white` styling. This works when there's a background image (because of the dark gradient overlay), but becomes invisible when:
1. No background image is set
2. The fallback gradient uses light theme colors (Consultant theme)

**Current styling:**
```tsx
<SelectTrigger className="... bg-white/10 border-white/20 text-white ...">
```

On the Consultant theme without a background image:
- Background: Light gray gradient (`from-theme-card` = white)
- Text: White (`text-white`)
- **Result: Invisible buttons**

---

## Solution

Make the select triggers **theme-aware** by checking if there's a background image:
- **With background image**: Keep white styling (readable over dark overlay)
- **Without background image**: Use theme-aware colors

---

## Implementation

**File: `src/components/roi/PropertyHeroCard.tsx`**

### Change 1: Add helper variable (around line 174)

```typescript
const backgroundImage = project?.hero_image_url || heroImageUrl || buildingRenderUrl;
const hasBackgroundImage = !!backgroundImage; // NEW: boolean for conditional styling
```

### Change 2: Update Currency SelectTrigger (lines 235-243)

From:
```tsx
<SelectTrigger className="w-[90px] h-7 bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs">
```

To:
```tsx
<SelectTrigger className={cn(
  "w-[90px] h-7 text-xs",
  hasBackgroundImage 
    ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
    : "bg-theme-bg-alt hover:bg-theme-card-alt border-theme-border text-theme-text"
)}>
```

### Change 3: Update Language SelectTrigger (lines 256-258)

From:
```tsx
<SelectTrigger className="w-[65px] h-7 bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs">
```

To:
```tsx
<SelectTrigger className={cn(
  "w-[65px] h-7 text-xs",
  hasBackgroundImage 
    ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
    : "bg-theme-bg-alt hover:bg-theme-card-alt border-theme-border text-theme-text"
)}>
```

---

## Result

| Scenario | Currency/Language Buttons |
|----------|---------------------------|
| With hero image (any theme) | White text on semi-transparent background |
| Without hero image (Tech Dark) | Theme text on dark card background |
| Without hero image (Consultant) | Dark text on light card background ✓ |
| Without hero image (Dark Consultant) | Light text on charcoal background |

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/roi/PropertyHeroCard.tsx` | Add `hasBackgroundImage` variable and use `cn()` for conditional styling on both SelectTrigger components |

