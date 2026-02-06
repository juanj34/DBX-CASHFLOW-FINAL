

# Plan: Fix Graph Labels & Enhanced Exit Marker Tooltips

## Problems Identified

Looking at the screenshot:

1. **Label Overlap Issue**: At the start of the graph (month 0), there are overlapping numbers - "785K" from the Y-axis and "785K" from the base marker are colliding
2. **Exit Marker Hover**: When hovering over exit markers, user wants to see detailed info including "Equity In"
3. **General Hover**: The current curve hover shows month/price but not enough context

---

## Solution

### 1. Fix Base Label Overlap

Remove the duplicate "Base: 785K" text that appears on top of the Y-axis labels. Instead, show a clean base marker dot without redundant label.

**Before:**
```
817K   785K←Base:785K  (overlapping!)
       ●
```

**After:**
```
817K                    
       ●←─ Base
```

### 2. Enhanced Exit Marker Hover State

Add a `hoveredExit` state that tracks when mouse is near an exit point. When hovering on an exit marker, show a detailed tooltip card:

| Field | Value |
|-------|-------|
| Exit X | Month 32 |
| Exit Price | 999K |
| Equity In | 285K |
| Net Gain | +215K |
| ROE | 9.8%/yr |

### 3. Refine Scenarios Calculation

Update the `scenarios` memo to include `equityDeployed` from `calculateExitScenario` so we can display it in the tooltip.

---

## Technical Implementation

### File: `src/components/roi/snapshot/CompactExitGraphCard.tsx`

#### Changes Overview

| Line Range | Change |
|------------|--------|
| 23 | Add `hoveredExitIndex` state for exit marker hover |
| 105-128 | Update scenarios memo to include `equityDeployed` and `totalCapital` |
| 253-260 | Remove redundant base price label text (keep only the small marker) |
| 277-289 | Simplify base marker - just dot + "Base" label below |
| 317-360 | Add exit marker hover detection and enhanced tooltip |

#### New State

```tsx
const [hoveredExitIndex, setHoveredExitIndex] = useState<number | null>(null);
```

#### Updated Scenarios Memo

```tsx
const scenarios = useMemo(() => {
  if (basePrice <= 0) return [];
  return exitScenarios.map((exitMonths) => {
    const scenarioResult = calculateExitScenario(
      exitMonths,
      basePrice,
      totalMonths,
      inputs,
      calculations.totalEntryCosts
    );
    
    const isHandover = Math.abs(exitMonths - totalMonths) <= 1;
    const netGain = scenarioResult.exitPrice - basePrice;
    
    return {
      exitMonths,
      exitPrice: scenarioResult.exitPrice,
      netGain,
      annualizedROE: scenarioResult.annualizedROE,
      equityDeployed: scenarioResult.equityDeployed,  // NEW
      totalCapital: scenarioResult.totalCapital,        // NEW (Equity + Entry Costs)
      isHandover,
    };
  });
}, [...]);
```

#### Remove Base Label Overlap

Current code (lines 253-260):
```tsx
<text
  x={padding.left + 4}
  y={yScale(basePrice) - 6}
  fill="hsl(var(--theme-text-muted))"
  fontSize="9"
>
  Base: {formatCurrencyShort(basePrice, 'AED')}  // REMOVE THIS
</text>
```

Replace with simple "Base" label at bottom:
```tsx
<text
  x={xScale(0)}
  y={height - padding.bottom + 12}
  fill="hsl(var(--theme-text-muted))"
  fontSize="8"
  textAnchor="middle"
>
  Base
</text>
```

#### Enhanced Exit Marker with Hover

```tsx
{scenarios.map((scenario, index) => {
  const x = xScale(scenario.exitMonths);
  const y = yScale(scenario.exitPrice);
  const isHovered = hoveredExitIndex === index;
  
  return (
    <g 
      key={scenario.exitMonths}
      onMouseEnter={() => setHoveredExitIndex(index)}
      onMouseLeave={() => setHoveredExitIndex(null)}
      style={{ cursor: 'pointer' }}
    >
      {/* Marker circle - larger hit area */}
      <circle cx={x} cy={y} r="12" fill="transparent" />
      
      {/* Visible marker */}
      <circle cx={x} cy={y} r={isHovered ? 8 : 6} 
        fill={scenario.isHandover ? "hsl(var(--theme-accent))" : "hsl(142.1 76.2% 36.3%)"} 
        className="transition-all duration-150"
      />
      <circle cx={x} cy={y} r={isHovered ? 4 : 3} fill="hsl(var(--theme-card))" />
      
      {/* Price label above */}
      <text x={x} y={y - 14} ...>
        {formatCurrencyShort(scenario.exitPrice, 'AED')}
      </text>
      
      {/* Hover tooltip - detailed info */}
      {isHovered && (
        <g>
          <rect x={x - 55} y={y - 75} width="110" height="55" rx="6" 
            fill="hsl(var(--theme-card))" 
            stroke="hsl(var(--theme-border))" 
          />
          <text x={x} y={y - 60} textAnchor="middle" fontSize="9">
            {scenario.isHandover ? '🔑 Handover' : `Exit ${index + 1}`} • {scenario.exitMonths}m
          </text>
          <text x={x - 48} y={y - 46} fontSize="8" fill="muted">Equity In:</text>
          <text x={x + 48} y={y - 46} textAnchor="end" fontWeight="bold">
            {formatCurrencyShort(scenario.totalCapital, 'AED')}
          </text>
          <text x={x - 48} y={y - 34} fontSize="8" fill="muted">Net Gain:</text>
          <text x={x + 48} y={y - 34} textAnchor="end" fill="green">
            +{formatCurrencyShort(scenario.netGain, 'AED')}
          </text>
          <text x={x - 48} y={y - 22} fontSize="8" fill="muted">ROE:</text>
          <text x={x + 48} y={y - 22} textAnchor="end" fill="green">
            {scenario.annualizedROE.toFixed(1)}%/yr
          </text>
        </g>
      )}
    </g>
  );
})}
```

---

## Visual Result

### Graph (Fixed Labels)

```text
┌─────────────────────────────────────────┐
│ 1.1M ─────────────────────────────────  │
│ 999K ─────────────────────────● 999K    │
│ 911K ───────────────● 879K              │
│ 817K ───────●                           │
│ 722K ●                                  │
│      ╎        ╎        ╎        ╎       │
│     Base     7m    🔑12m      28m  Exit1│
└─────────────────────────────────────────┘
```

### Exit Marker Hover Tooltip

```text
        ┌─────────────────┐
        │ Exit 1 • 32m    │
        │ Equity In: 285K │
        │ Net Gain: +215K │
        │ ROE: 9.8%/yr    │
        └─────────────────┘
              ●
```

### Exit Cards (Unchanged - Already Compact)

```text
┌─────────────┐ ┌─────────────┐
│ 🔑 Handover │ │ ① Exit 1    │
│   +170K     │ │   +215K     │
│ 12m • 45% ROE│ │ 32m • 9.8% ROE│
└─────────────┘ └─────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/CompactExitGraphCard.tsx` | Add hover state, fix label overlap, enhance exit marker tooltips with equity/gain/ROE |

