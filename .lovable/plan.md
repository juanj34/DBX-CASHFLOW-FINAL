

# Configurator UX Overhaul: Streamlined Steps + Simple Navigation

## Overview

This plan addresses two main issues:
1. **Buggy checkmark indicators** - Remove them entirely, just show step numbers with current highlighted
2. **Too many steps** - Consolidate from 9 sections to 4 combined sections
3. **Missing hotkey visibility** - Add keyboard shortcut hints to footer

---

## Part 1: Simplified Step Indicators (Quick Fix)

### Current State (Buggy)
```
✓ ✓ ✓ ✓ ⑤ ✓  7  ✓ ✓
```
- Checkmarks depend on complex `isSectionComplete` logic
- Some sections show checkmarks incorrectly
- Confusing visual feedback

### New Design (Clean)
```
①  ②  ③  ④  ⑤  ⑥  ⑦  ⑧  ⑨
                ●
```
- All steps show numbers
- Current step highlighted with accent color + scale
- No checkmarks, no completion logic needed

**File: `src/components/roi/configurator/ConfiguratorLayout.tsx`**

Update lines 704-738:

```typescript
{/* Center: Inline Step indicators */}
<div className="flex items-center gap-1.5">
  {SECTIONS.map((section, index) => {
    const isActive = section === activeSection;
    const isPast = index < currentIndex;
    
    return (
      <Tooltip key={section}>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigateToSection(section)}
            className="group"
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200",
              isActive 
                ? "bg-theme-accent text-theme-bg scale-110 ring-2 ring-theme-accent/30" 
                : isPast
                  ? "bg-theme-accent/20 text-theme-accent"
                  : "bg-theme-bg-alt border border-theme-border text-theme-text-muted group-hover:border-theme-accent group-hover:text-theme-text"
            )}>
              {index + 1}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {section.charAt(0).toUpperCase() + section.slice(1)}
        </TooltipContent>
      </Tooltip>
    );
  })}
</div>
```

**Changes:**
- Remove `isComplete` check entirely
- Add `isPast` for subtle styling on visited steps (accent tint)
- Always show number, never checkmarks
- Add ring effect on active step for better visibility

---

## Part 2: Add Visible Hotkey Hints

Add keyboard shortcut hints in the footer navigation:

```typescript
{/* Left side: Back button + Hotkey hints */}
<div className="flex items-center gap-3">
  <Button variant="ghost" size="sm" onClick={goToPreviousSection} disabled={!canGoBack}>
    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
    Back
  </Button>
  
  {/* Hotkey hints - desktop only */}
  <div className="hidden md:flex items-center gap-2 text-[10px] text-theme-text-muted/60">
    <span className="flex items-center gap-0.5">
      <kbd className="px-1 py-0.5 bg-theme-bg-alt/50 rounded border border-theme-border/50 text-[9px]">←</kbd>
      <kbd className="px-1 py-0.5 bg-theme-bg-alt/50 rounded border border-theme-border/50 text-[9px]">→</kbd>
    </span>
    <span className="flex items-center gap-0.5">
      <kbd className="px-1 py-0.5 bg-theme-bg-alt/50 rounded border border-theme-border/50 text-[9px]">1</kbd>
      <span>-</span>
      <kbd className="px-1 py-0.5 bg-theme-bg-alt/50 rounded border border-theme-border/50 text-[9px]">9</kbd>
    </span>
  </div>
</div>
```

---

## Part 3: Consolidate Sections (9 → 4)

### New Section Structure

| Step | Name | Contains | Fields |
|------|------|----------|--------|
| **1** | Project | Client | Developer, project, zone, unit, clients |
| **2** | Investment | Property + Payment | Price, dates, entry costs, payment plan |
| **3** | Returns | Appreciation + Rent + Exits | Growth rates, rental yield, exit scenarios |
| **4** | Extras | Value + Media + Mortgage | Differentiators, images, financing |

### Implementation

**New Files to Create:**

1. **`src/components/roi/configurator/InvestmentSection.tsx`**
   - Embeds PropertySection + PaymentSection in collapsible cards
   - Single scrollable view

2. **`src/components/roi/configurator/ReturnsSection.tsx`**
   - Embeds AppreciationSection + RentSection + ExitsSection
   - Collapsible cards for each

3. **`src/components/roi/configurator/ExtrasSection.tsx`**
   - Embeds ValueSection + ImagesSection + MortgageSection
   - All collapsed by default (optional settings)

**Update ConfiguratorLayout.tsx:**

```typescript
// OLD
const SECTIONS = ['client', 'property', 'images', 'payment', 'value', 'appreciation', 'exits', 'rent', 'mortgage'];

// NEW
const SECTIONS = ['project', 'investment', 'returns', 'extras'];
```

---

## Visual Result

### Before (9 steps, checkmarks)
```
✓ ✓ ✓ ✓ ⑤ ✓  7  ✓ ✓    ← Confusing, buggy
```

### After (4 steps, numbers only)
```
①  ②  ③  ④     ← Clean, simple
       ●        (current step highlighted)

← → 1-4         ← Hotkey hints visible
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Update step indicators (remove checkmarks), add hotkey hints, update SECTIONS array |
| `src/components/roi/configurator/types.ts` | Update ConfiguratorSection type |
| `src/components/roi/configurator/InvestmentSection.tsx` | CREATE - Combined Property + Payment |
| `src/components/roi/configurator/ReturnsSection.tsx` | CREATE - Combined Appreciation + Rent + Exits |
| `src/components/roi/configurator/ExtrasSection.tsx` | CREATE - Combined Value + Media + Mortgage |
| `src/components/roi/configurator/index.ts` | Export new sections |

---

## Benefits

- **56% fewer steps** (9 → 4)
- **No buggy checkmarks** - Just simple number highlighting
- **Visible hotkeys** - Users discover shortcuts naturally
- **Faster quotes** - Most users only need steps 1-3, Extras is optional
- **Cleaner mental model** - Project → Investment → Returns → Extras

