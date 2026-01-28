
# Plan: Comprehensive Configurator UI Overhaul

## Problems Identified from Screenshots

1. **"55% over" badge still showing** - Line 85 calculation uses wrong formula for post-handover
2. **Footer floating over content** - `sticky bottom-0` covers installments when scrolling
3. **Installment numbering starts at 2** - Line 471 uses `{index + 2}` instead of `{index + 1}`
4. **Numbers being cut off** - `w-4 h-4` with `text-[8px]` is too small for double digits (35, 36, etc.)
5. **Text too small throughout** - Most text is `text-[8px]` or `text-[9px]`, hard to read
6. **Footer navigation too tall** - Takes ~100px, could be ~60px with tighter layout

---

## Technical Changes

### File 1: `src/components/roi/configurator/PaymentSection.tsx`

#### A. Fix "remaining to distribute" calculation (line 85)

```typescript
// FROM:
const remainingToDistribute = inputs.preHandoverPercent - inputs.downpaymentPercent - additionalPaymentsTotal;

// TO:
// For post-handover: all installments + downpayment should equal 100%
// For standard: pre-handover installments + downpayment should equal preHandoverPercent
let remainingToDistribute: number;
if (hasPostHandoverPlan) {
  remainingToDistribute = 100 - inputs.downpaymentPercent - additionalPaymentsTotal;
} else {
  remainingToDistribute = inputs.preHandoverPercent - inputs.downpaymentPercent - additionalPaymentsTotal;
}
```

#### B. Fix installment numbering (line 471)

```typescript
// FROM:
{index + 2}

// TO:
{index + 1}
```

#### C. Fix badge size for 2-digit numbers (lines 465-472)

```tsx
// FROM:
<div className={cn(
  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] shrink-0",
  ...
)}>
  {index + 2}
</div>

// TO:
<div className={cn(
  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0",
  ...
)}>
  {index + 1}
</div>
```

#### D. Make footer static, not sticky (line 576)

```tsx
// FROM:
<div className="sticky bottom-0 bg-[#0d1117] pt-2 -mx-4 px-4 pb-1 border-t border-[#2a3142]">

// TO:
<div className="mt-3 pt-2 pb-1 border-t border-[#2a3142]">
```

#### E. Increase text sizes throughout the component

| Element | Current | New |
|---------|---------|-----|
| Section title | `text-base` | `text-lg` |
| Section description | `text-xs` | `text-sm` |
| Step labels (Split, Down, Generate) | `text-xs` | `text-sm` |
| Step badges | `text-[8px]` | `text-xs` |
| Split buttons | `text-[10px]` | `text-xs` |
| Downpayment amount | `text-[9px]` | `text-xs` |
| Generate inputs | `text-[10px]` | `text-xs` |
| Installment row badges | `text-[8px]` | `text-[10px]` |
| Installment dates | `text-[8px]` | `text-[10px]` |
| Footer labels | `text-[8px]`/`text-[9px]` | `text-[10px]` |
| Footer values | `text-[10px]` | `text-xs` |

---

### File 2: `src/components/roi/configurator/ConfiguratorLayout.tsx`

#### A. Make footer more compact (lines 668-773)

Merge progress steps and navigation into a more compact layout:

```tsx
{/* Footer Navigation - COMPACT */}
<div className="shrink-0 border-t border-theme-border bg-theme-bg-alt">
  <div className="flex items-center justify-between px-6 py-2.5">
    {/* Previous button */}
    <Button variant="outline" size="sm" onClick={goToPreviousSection} disabled={!canGoBack} ...>
      <ChevronLeft /> Back
    </Button>
    
    {/* Center: Steps inline */}
    <div className="flex items-center gap-0.5">
      {SECTIONS.map((section, index) => {
        const isComplete = isSectionComplete(section);
        const isActive = section === activeSection;
        return (
          <button key={section} onClick={() => navigateToSection(section)} className="group">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all
              ${isActive ? 'bg-theme-accent text-theme-bg scale-110' : 
                isComplete ? 'bg-green-500 text-white' : 
                'bg-theme-card border border-theme-border text-theme-text-muted group-hover:border-theme-text'}`}
            >
              {isComplete && !isActive ? <Check className="w-2.5 h-2.5" /> : index + 1}
            </div>
          </button>
        );
      })}
    </div>
    
    {/* Right: Progress text + Next button */}
    <div className="flex items-center gap-3">
      <span className="text-xs text-theme-text-muted hidden sm:block">
        {currentIndex + 1}/{SECTIONS.length}
      </span>
      <Button size="sm" onClick={goToNextSection} ...>
        Next <ChevronRight />
      </Button>
    </div>
  </div>
</div>
```

This removes:
- Separate progress bar section with labels
- The visual progress line
- Per-step labels underneath circles

**Result**: Footer shrinks from ~100px to ~50px

---

## Visual Before/After

### Payment Section Text Sizes

**Before (too small):**
```
① Split                          [text-[8px] badge, text-xs label]
  [30/70] [40/60] ...            [text-[10px] buttons]
  
② Down (EOI AED 50,000)          [text-[9px] amounts]
  [──────○──────] [20] %         [text-xs inputs]

③ ⚡ Generate                     [text-xs label]
  [51]×[1] mo @ [1] %            [text-[10px] inputs]
  51×1% = 51.0% (need: 25.0%)    [text-[9px] projection]

Installments (0)                 [text-xs]
│ (35) ⏱▾  34  Nov28 PH  1%  🗑 │ [text-[8px] everywhere - CUTS OFF]
```

**After (readable):**
```
① Split                          [text-xs badge, text-sm label]  
  [30/70] [40/60] ...            [text-xs buttons]
  
② Down (EOI AED 50,000)          [text-xs amounts]
  [──────○──────] [20] %         [text-sm inputs]

③ ⚡ Generate                     [text-sm label]
  [51]×[1] mo @ [1] %            [text-xs inputs]
  51×1% = 51.0% (need: 25.0%)    [text-xs projection]

Installments (0)                 [text-sm]
│ (35) ⏱▾  34  Nov2028 PH  1%  🗑│ [text-[10px] - FITS]
```

### Footer Layout

**Before (~100px):**
```
┌──────────────────────────────────────────────────────────────┐
│  ●─────●─────●─────●─────●─────●─────●─────●─────●          │
│  ①    ②    ③    ④    ⑤    ⑥    ⑦    ⑧    ⑨              │
│  Client Prop  Media Pay  Value Growth Exit Rent Mort        │
├──────────────────────────────────────────────────────────────┤
│  [← Previous]         Step 4 of 9 • 44%           [Next →]  │
└──────────────────────────────────────────────────────────────┘
```

**After (~50px):**
```
┌──────────────────────────────────────────────────────────────┐
│ [← Back]   ①②③④⑤⑥⑦⑧⑨   4/9         [Next →]│
└──────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/configurator/PaymentSection.tsx` | Fix calculation, fix numbering, enlarge badges, remove sticky footer, increase text sizes |
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Compact footer into single row, remove progress line and labels |

---

## Summary of All Fixes

| Issue | Fix |
|-------|-----|
| 55% over badge wrong | Calculate `remainingToDistribute` against 100% when `hasPostHandoverPlan` |
| Footer covers installments | Remove `sticky bottom-0`, make it static in document flow |
| Numbering starts at 2 | Change `{index + 2}` to `{index + 1}` |
| Numbers cut off | Increase badge from `w-4 h-4` to `w-5 h-5`, font from `text-[8px]` to `text-[10px]` |
| Text too small | Increase sizes: `text-[8px]` → `text-[10px]`, `text-[9px]` → `text-xs`, `text-xs` → `text-sm` |
| Footer too tall | Merge progress steps inline with nav buttons, remove labels |
