

# Plan: Modernize Snapshot UI - Better Scannability, Colors & Simplification

## Screenshot Analysis

Looking at the current snapshot, I see several issues:

### Problems Identified:

1. **Exit Scenario Cards** - Ugly gray backgrounds (`bg-black/30`) look washed out and dated. Grid doesn't handle 5 cards well (leaves orphan)

2. **Rental Income Card** - Too cluttered:
   - "+4%/yr" badge in hero section adds noise
   - "Gross" and "Service" lines visible by default (should be hidden)
   - "Gross: 9.0%" and "Net: 7.7%" badges too prominent

3. **Graph Padding** - Still has excessive padding (`px-3 pt-2`, `p-3`) wasting space

4. **Color Consistency** - Some gray tones feel off for the dark theme

---

## Solution Overview

### Part 1: Exit Scenario Cards - Modern Premium Look

**Grid Logic Fix (5 items in single row):**
```tsx
// Dynamic grid based on count
scenarios.length === 2 ? "grid-cols-2" :
scenarios.length <= 4 ? "grid-cols-4" :
"grid-cols-5" // 5 items in one row
```

**Card Styling Upgrade:**
```tsx
// Before (ugly gray):
className="bg-black/30 backdrop-blur-sm border rounded-lg"

// After (premium glass with gradient):
className="bg-gradient-to-br from-black/50 to-black/30 backdrop-blur-md 
           border border-white/10 rounded-xl shadow-lg"
```

**Colored Borders by Type:**
| Type | Border |
|------|--------|
| Pre-Handover | `border-l-2 border-l-theme-accent` (lime) |
| Handover (🔑) | `border-l-2 border-l-white` + key icon |
| Post-Handover | `border-l-2 border-l-green-500` |

### Part 2: Reduce Graph Padding

**Before:**
```tsx
const padding = { top: 40, right: 20, bottom: 30, left: 45 };
<div className="px-3 pt-2 pb-1">
<div className="p-3">
```

**After:**
```tsx
const padding = { top: 25, right: 15, bottom: 20, left: 35 };
<div className="px-2 pt-1">
<div className="p-2 pt-1">
```

### Part 3: Simplify Rental Income Card

**Hide in Collapsible Dropdown:**
- Gross annual rent
- Service charges line
- Gross/Net yield badges

**Keep Visible:**
- 7-Year Average (hero)
- Year 1 Net (secondary hero)

**Remove from Hero:**
- "+4%/yr" badge (unnecessary clutter)

**New Layout:**
```text
┌─────────────────────────────────────┐
│ 🏠 RENTAL INCOME          📅 Table │
├─────────────────────────────────────┤
│ 7-YEAR AVERAGE                      │
│ AED 68,325/yr                       │
├─────────────────────────────────────┤
│ ● LONG-TERM                         │
│ ┌─────────────────────────────────┐ │
│ │ Year 1 Net    AED 60,555       │ │
│ │              (AED 5,046/mo)    │ │
│ └─────────────────────────────────┘ │
│           ▼ View breakdown          │  ← Click to expand
│     [Hidden: Gross, Service, %s]    │
└─────────────────────────────────────┘
```

---

## Implementation Details

### File 1: `CompactExitGraphCard.tsx`

| Line | Change |
|------|--------|
| 84 | Reduce padding: `{ top: 25, right: 15, bottom: 20, left: 35 }` |
| 184 | Change `px-3 pt-2 pb-1` → `px-2 pt-1` |
| 354-358 | Update grid logic for 5 columns when needed |
| 363-372 | Modernize card backgrounds with premium gradient |
| 365 | Add left border color accent for type differentiation |

**New Card Grid Logic:**
```tsx
<div className={cn(
  "grid gap-2",
  scenarios.length === 2 ? "grid-cols-2" :
  scenarios.length <= 4 ? "grid-cols-4" :
  "grid-cols-5"
)}>
```

**New Card Classes:**
```tsx
className={cn(
  "bg-gradient-to-br from-black/50 to-black/30 backdrop-blur-md",
  "border border-white/10 rounded-xl shadow-lg p-2 text-center",
  "border-l-2",
  isHandover ? "border-l-white" :
  scenario.isPostHandover ? "border-l-green-500" :
  "border-l-theme-accent"
)}
```

### File 2: `CompactRentCard.tsx`

| Line | Change |
|------|--------|
| 1 | Add import for `Collapsible` components and `ChevronDown` |
| 121-124 | Remove the "+4%/yr" badge from hero section |
| 152-173 | Wrap Gross, Service, and badge rows in `Collapsible` |

**Collapsible Implementation:**
```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

// After Year 1 hero box:
<Collapsible>
  <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-theme-text-muted hover:text-theme-text w-full justify-center py-1.5 transition-colors">
    <span>View breakdown</span>
    <ChevronDown className="w-3 h-3 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-1 pt-1 animate-accordion-down">
    <DottedRow label="Gross" value={...} />
    <DottedRow label="− Service" value={...} />
    <div className="flex gap-2 pt-1">
      {/* Yield badges */}
    </div>
  </CollapsibleContent>
</Collapsible>
```

---

## Visual Comparison

### Exit Cards Before/After:

**Before (ugly gray, orphan card):**
```text
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ gray   │ │ gray   │ │ gray   │ │ gray   │
└────────┘ └────────┘ └────────┘ └────────┘
┌────────┐
│ orphan │  ← 5th card alone on second row
└────────┘
```

**After (premium gradient, all 5 in row):**
```text
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ lime │ │ white│ │ green│ │ green│ │ green│
│ edge │ │ edge │ │ edge │ │ edge │ │ edge │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘
  10m      🔑11m    18m      24m      32m
```

### Rental Income Before/After:

**Before (cluttered):**
```text
7-YEAR AVERAGE        +4%/yr   ← Remove
Year 1 Net: AED 60,555
Gross ........... AED 70,647   ← Hide
− Service ....... -AED 10,092  ← Hide
[Gross: 9.0%] [Net: 7.7%]      ← Hide
```

**After (clean):**
```text
7-YEAR AVERAGE
Year 1 Net: AED 60,555 (AED 5,046/mo)
        ▼ View breakdown       ← Tap to expand
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `CompactExitGraphCard.tsx` | Reduce padding, fix 5-col grid, premium card styling with colored borders |
| `CompactRentCard.tsx` | Remove +4% badge, wrap Gross/Service/badges in Collapsible |

