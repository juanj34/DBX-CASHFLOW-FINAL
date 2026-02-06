

# Plan: Redesign Exit Graph Card - Larger Graph + Horizontal Cards

## Problem Summary

The current design has:
1. **Graph too small** (140px height) - not imposing enough
2. **Cards are vertical** - each scenario is a tall vertical card taking too much space
3. **Background plain** - numbers don't stand out enough

## Solution

### 1. Make Graph Bigger & More Imposing

**Current:** `height = 140px`  
**New:** `height = 200px`

Add visual enhancements:
- Gradient background inside the chart area
- Stronger glow effects on markers
- Thicker curve stroke (2 → 3px)
- Better contrast on labels

```tsx
// New dimensions
const width = 400;
const height = 200;  // Was 140
const padding = { top: 40, right: 20, bottom: 30, left: 45 };
```

Add background styling:
```tsx
{/* Dark gradient background for chart area */}
<rect
  x={padding.left}
  y={padding.top}
  width={chartWidth}
  height={chartHeight}
  rx="8"
  fill="url(#chartBgGradient)"
/>

<defs>
  <linearGradient id="chartBgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
    <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
  </linearGradient>
</defs>
```

### 2. Horizontal Exit Cards (3-4 in a row)

Replace vertical `space-y-2` cards with a horizontal grid of small square cards:

**Current Layout:**
```
┌─────────────────────────────┐
│ #1  6m   Profit ROE Hold    │ ← tall card
├─────────────────────────────┤
│ #2  9m   Profit ROE Hold    │ ← tall card
├─────────────────────────────┤
│ #3  12m  Profit ROE Hold    │ ← tall card
└─────────────────────────────┘
```

**New Layout:**
```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ #1 6m  │ │ #2 9m  │ │ #3 12m │ │ #4 24m │
│  13%   │ │  18%   │ │  22%   │ │  35%   │
│ ROE    │ │ ROE    │ │ ROE    │ │ ROE    │
│ +45K   │ │ +62K   │ │ +78K   │ │ +120K  │
└────────┘ └────────┘ └────────┘ └────────┘
```

**Implementation:**
```tsx
{/* Horizontal Exit Cards */}
<div className="p-3 pt-0">
  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
    {scenarios.map((scenario) => (
      <div 
        key={scenario.exitMonths}
        className="bg-black/30 backdrop-blur-sm border border-theme-border/40 rounded-lg p-2.5 text-center"
      >
        {/* Exit Number + Months */}
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-[10px] font-bold text-theme-accent">
            #{scenario.exitNumber}
          </span>
          <span className="text-xs text-theme-text-muted">
            {scenario.exitMonths}m
          </span>
        </div>
        
        {/* Hero ROE - Big & Bold */}
        <span className="text-2xl font-black font-mono text-green-400 block">
          {scenario.trueROE?.toFixed(0)}%
        </span>
        <span className="text-[8px] text-theme-text-muted uppercase">ROE</span>
        
        {/* Profit */}
        <div className="mt-1 pt-1 border-t border-theme-border/20">
          <span className="text-xs font-bold text-green-400/80">
            +{formatCurrencyShort(scenario.trueProfit, 'AED')}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>
```

### 3. Visual Improvements

| Element | Before | After |
|---------|--------|-------|
| Chart height | 140px | 200px |
| Curve stroke | 2px | 3px |
| Card layout | Vertical stack | Horizontal grid (3-4 cols) |
| Card size | Full width, tall | Square, compact |
| Background | Plain | Dark gradient with blur |
| Hero metric | 3 cols (Profit/ROE/Hold) | ROE dominant, profit secondary |
| Number visibility | Medium | High contrast with backdrop |

### 4. Responsive Grid

```tsx
// 3 columns on mobile, 4 on larger screens
className="grid grid-cols-3 gap-2 sm:grid-cols-4"
```

If there are only 2 scenarios → `grid-cols-2`
If there are 3+ scenarios → `grid-cols-3 sm:grid-cols-4`

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/CompactExitGraphCard.tsx` | Increase graph height, add background gradient, convert cards to horizontal grid, simplify card content to ROE-dominant |

