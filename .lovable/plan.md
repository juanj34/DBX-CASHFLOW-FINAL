

# Plan: Modern Exit Graph Redesign

## Problem Analysis

Looking at the screenshot reference ("Property Appreciation" modal), the current `CompactExitGraphCard` is missing:

1. **Y-axis labels** - No value scale on left side (should show 746K, 834K, 923K, 1.0M, 1.1M)
2. **Base price line** - Missing horizontal dashed line with "Base: 785K" label
3. **Proper X-axis** - Should show month intervals (0mo, 2mo, 4mo... Handover)
4. **Exit markers on curve** - Points with labels should be ON the curve, not floating
5. **Cards below are ugly** - Faded black `from-black/50 to-black/30` looks bad, should be clean themed cards

## Solution: Redesign to Match Reference

### Graph Improvements

| Element | Before | After |
|---------|--------|-------|
| Y-axis | None | Show 5 price ticks with labels (746K, 834K, etc.) |
| X-axis | "0", "🔑 11m", "14m" | Show intervals: 0mo, 2mo, 4mo... Handover |
| Base line | None | Horizontal dashed gray line with "Base: 785K" label |
| Curve | Thick gradient | Same cyan-to-green gradient, 2.5px stroke |
| Exit markers | Floating boxes above curve | Dots on curve + vertical dashed line down |
| Padding | `{ top: 20, right: 10, bottom: 18, left: 10 }` | `{ top: 40, right: 40, bottom: 45, left: 60 }` to fit Y-axis labels |

### Card Improvements

**Before (faded black):**
```tsx
className="bg-gradient-to-br from-black/50 to-black/30 backdrop-blur-md"
```

**After (clean theme cards):**
```tsx
className="bg-theme-bg/80 border border-theme-border rounded-xl"
// With handover getting special white border
```

---

## Technical Implementation

### File: `src/components/roi/snapshot/CompactExitGraphCard.tsx`

#### 1. Increase SVG Height & Padding

```tsx
// Current:
const width = 400;
const height = 140;
const padding = { top: 20, right: 10, bottom: 18, left: 10 };

// New - more room for labels:
const width = 420;
const height = 180;
const padding = { top: 30, right: 30, bottom: 40, left: 55 };
```

#### 2. Add Y-Axis Values & Labels

```tsx
// Calculate Y-axis ticks (5 values from minValue to maxValue)
const yAxisValues = useMemo(() => {
  const range = maxValue - minValue;
  const step = range / 4;
  return Array.from({ length: 5 }, (_, i) => minValue + step * i);
}, [minValue, maxValue]);

// In SVG:
{yAxisValues.map((value, i) => (
  <g key={`y-${i}`}>
    {/* Grid line */}
    <line
      x1={padding.left}
      y1={yScale(value)}
      x2={width - padding.right}
      y2={yScale(value)}
      stroke="hsl(var(--theme-border))"
      strokeDasharray="3,3"
      opacity="0.3"
    />
    {/* Label */}
    <text
      x={padding.left - 8}
      y={yScale(value)}
      fill="hsl(var(--theme-text-muted))"
      fontSize="9"
      textAnchor="end"
      dominantBaseline="middle"
    >
      {formatCurrencyShort(value, 'AED')}
    </text>
  </g>
))}
```

#### 3. Add Base Price Dashed Line

```tsx
{/* Base price horizontal dashed line */}
<line
  x1={padding.left}
  y1={yScale(basePrice)}
  x2={width - padding.right}
  y2={yScale(basePrice)}
  stroke="#64748b"
  strokeWidth="1"
  strokeDasharray="6,3"
  opacity="0.6"
/>
<text
  x={padding.left + 5}
  y={yScale(basePrice) - 6}
  fill="#64748b"
  fontSize="9"
>
  Base: {formatCurrencyShort(basePrice, 'AED')}
</text>
```

#### 4. Improve X-Axis Labels

```tsx
// Generate time interval labels (0mo, 2mo, 4mo... Handover)
const xAxisLabels = useMemo(() => {
  const labels: number[] = [];
  const step = Math.ceil(chartMaxMonth / 6);
  for (let m = 0; m <= chartMaxMonth; m += step) {
    labels.push(m);
  }
  // Ensure handover month is included
  if (!labels.includes(totalMonths)) {
    labels.push(totalMonths);
  }
  return labels.sort((a, b) => a - b);
}, [chartMaxMonth, totalMonths]);

// Render:
{xAxisLabels.map(months => (
  <text
    key={months}
    x={xScale(months)}
    y={height - padding.bottom + 15}
    fill={months === totalMonths ? "hsl(var(--theme-text))" : "hsl(var(--theme-text-muted))"}
    fontSize="9"
    fontWeight={months === totalMonths ? "bold" : "normal"}
    textAnchor="middle"
  >
    {months === totalMonths ? 'Handover' : `${months}mo`}
  </text>
))}
```

#### 5. Redesign Exit Markers on Curve

Replace floating boxes with clean markers on the curve:

```tsx
{scenarios.map((scenario, index) => {
  const x = xScale(scenario.exitMonths);
  const y = yScale(scenario.exitPrice);
  const isHandover = scenario.isHandover;
  const markerColor = isHandover ? '#ffffff' : 'hsl(var(--theme-accent))';
  
  return (
    <g key={scenario.exitMonths}>
      {/* Vertical dashed line from marker to X-axis */}
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={height - padding.bottom}
        stroke={markerColor}
        strokeWidth="1"
        strokeDasharray="3,3"
        opacity="0.4"
      />
      
      {/* Marker dot on curve */}
      <circle cx={x} cy={y} r="7" fill="hsl(var(--theme-card))" stroke={markerColor} strokeWidth="2" />
      <circle cx={x} cy={y} r="3" fill={markerColor} />
      
      {/* Small label above marker */}
      <text
        x={x}
        y={y - 14}
        fill="hsl(var(--theme-text))"
        fontSize="9"
        fontWeight="bold"
        textAnchor="middle"
      >
        {formatCurrencyShort(scenario.exitPrice, 'AED')}
      </text>
    </g>
  );
})}
```

#### 6. Fix Exit Cards - Clean Theme

Remove the ugly faded black background:

```tsx
// Before (ugly):
className="bg-gradient-to-br from-black/50 to-black/30 backdrop-blur-md border border-white/10"

// After (clean theme cards):
className={cn(
  "bg-theme-bg/90 border rounded-xl p-2.5 text-center transition-colors",
  isHandover 
    ? "border-white/50 bg-white/5" 
    : scenario.isPostHandover 
      ? "border-green-500/30 hover:border-green-500/50" 
      : "border-theme-border hover:border-theme-accent/50"
)}
```

---

## Visual Comparison

### Graph Before → After

**Before:**
```text
┌────────────────────────────────┐
│  [no Y-axis]                   │
│        ╱────curve──────        │
│  ┌──┐╱  [floating boxes]       │
│  └──┘                          │
│──────────────────────────────  │
│  0       🔑11m           14m   │
└────────────────────────────────┘
```

**After:**
```text
┌────────────────────────────────────┐
│ 1.1M ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │
│ 1.0M ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ● 999K    │
│ 923K ╌╌╌╌╌╌╌╌╌╌╌╌ ●───────────    │
│ 834K ╌╌╌╌╌╌╌╌ ●──────────────────  │
│ 746K ┄┄┄┄┄┄┄┄┄┄ Base: 785K ┄┄┄┄┄  │
│      ╎    ╎    ╎    ╎    ╎        │
│     0mo  2mo  4mo  6mo  Handover  │
└────────────────────────────────────┘
```

### Cards Before → After

**Before (faded black):**
```text
┌─────────┐
│ bg-black│  <- ugly gray/black
│   17%   │
│  +142K  │
└─────────┘
```

**After (clean theme):**
```text
┌─────────┐
│ bg-theme│  <- clean card background
│   17%   │
│  +142K  │
│  32m    │
└─────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/CompactExitGraphCard.tsx` | Increase dimensions, add Y-axis, add base price line, improve X-axis, clean markers, fix card styling |

