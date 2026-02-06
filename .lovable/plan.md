
# Plan: Replace Exit Scenarios with Inline Graph in Snapshot View

## Overview

Transform the Exit Scenarios section in the Snapshot view to show an attractive inline graph (similar to `ExitChartModal`) directly visible, instead of requiring users to click to see it. The goal is to make the snapshot more visually impactful and professional.

## Current State

**Problem 1: Exit graph hidden behind modal**
- `CompactAllExitsCard` displays exit scenarios as a list of cards
- User must click to open `ExitChartModal` to see the appreciation graph
- The graph is actually the most visually impressive part

**Problem 2: Visual overlap on graphs**  
- When exit scenarios are close to handover (within 2-3 months), the text labels overlap
- Handover marker and nearby exits collide visually

**Problem 3: UI appears cluttered**
- The card-based list takes up space but isn't as impactful as the graph

## Solution: Create `CompactExitGraphCard`

A new hybrid component that combines:
- A compact appreciation graph (simplified version of `OIGrowthCurve`)
- Exit scenario summary cards below the graph (inspired by the reference image)

## Implementation Details

### 1. Create New Component: `CompactExitGraphCard.tsx`

**Location:** `src/components/roi/snapshot/CompactExitGraphCard.tsx`

**Features:**
- Inline SVG appreciation curve (not a modal)
- Compact height (~280-320px total)
- Exit markers on the curve with smart positioning to avoid overlap
- Summary cards below showing Profit, ROE, Hold time
- No click required - everything visible immediately

**Layout:**
```text
+----------------------------------------------+
| ICON  EXIT SCENARIOS                         |
+----------------------------------------------+
|                                              |
|     [APPRECIATION CURVE WITH MARKERS]        |
|     Exit 1 ●    Exit 2 ●    🔑 Handover     |
|                                              |
+----------------------------------------------+
| #1  6m Aug'26                    40% built   |
| PROFIT        ROE          HOLD              |
| +AED 45,764   13%          6m                |
|               26.1%/yr     Aug'26            |
| Capital: 350K  →  Value: 830K                |
+----------------------------------------------+
| #2  9m Nov'26                    75% built   |
| ...                                          |
+----------------------------------------------+
```

### 2. Smart Marker Positioning

**Collision detection algorithm:**
```typescript
// Check for label collisions and compute offsets
const exitPositions = exitScenarios.map(month => xScale(month));
const handoverPosition = xScale(totalMonths);

// For each exit, determine label placement:
// - If within 40px of handover → offset left or right
// - If within 40px of another exit → stagger vertically
// - Otherwise → center above marker
```

**Label placement rules:**
| Condition | Action |
|-----------|--------|
| Exit < handover by ≤3 months | Offset label LEFT |
| Exit > handover by ≤3 months | Offset label RIGHT |
| Two exits within 3 months | Stagger Y positions |
| Handover marker | Always centered, white styling |

### 3. Simplified Curve

Remove complexity from the graph for snapshot:
- No construction % bar below
- No phase labels (Under Constr., Post-HO, etc.)
- Just the appreciation curve + exit markers + handover
- Base price line as reference

### 4. Exit Summary Cards (Below Graph)

Using the reference image layout:

```tsx
<div className="grid grid-cols-3 gap-3">
  {/* Profit */}
  <div>
    <span className="text-[10px] text-gray-500">PROFIT</span>
    <span className="text-lg font-bold text-green-400">+AED 45,764</span>
  </div>
  
  {/* ROE */}
  <div>
    <span className="text-[10px] text-gray-500">ROE</span>
    <span className="text-2xl font-bold text-theme-accent">13%</span>
    <span className="text-xs text-gray-500">26.1%/yr</span>
  </div>
  
  {/* Hold Time */}
  <div>
    <span className="text-[10px] text-gray-500">HOLD</span>
    <span className="text-lg font-bold">6m</span>
    <span className="text-xs text-gray-500">Aug'26</span>
  </div>
</div>

{/* Capital → Value row */}
<div className="text-xs text-gray-500">
  Capital: AED 350,385 → Value: AED 830,730
</div>
```

### 5. Update SnapshotContent

Replace `CompactAllExitsCard` usage with new `CompactExitGraphCard`:

**File:** `src/components/roi/snapshot/SnapshotContent.tsx`

```tsx
// Replace:
{showExits && (
  <CompactAllExitsCard ... onClick={() => setExitModalOpen(true)} />
)}

// With:
{showExits && (
  <CompactExitGraphCard
    inputs={inputs}
    calculations={calculations}
    exitScenarios={exitScenarios}
    currency={currency}
    rate={rate}
  />
)}
```

### 6. Remove Exit Modal Trigger

Since the graph is now inline:
- Remove the `onClick={() => setExitModalOpen(true)}` 
- Keep `ExitChartModal` available but not needed for main view
- The summary cards could optionally open the modal for more detail

---

## Visual Improvements

### No Overlap Strategy

**Smart offset calculation:**
```typescript
const calculateLabelPosition = (exitMonth: number, allExits: number[], handoverMonth: number) => {
  const distanceFromHandover = Math.abs(exitMonth - handoverMonth);
  const isBeforeHandover = exitMonth < handoverMonth;
  
  // Check proximity to handover
  if (distanceFromHandover <= 3) {
    return {
      xOffset: isBeforeHandover ? -50 : 50,
      textAnchor: isBeforeHandover ? 'end' : 'start',
      yOffset: 0
    };
  }
  
  // Check proximity to other exits
  const nearbyExits = allExits.filter(m => 
    m !== exitMonth && Math.abs(m - exitMonth) <= 3
  );
  
  if (nearbyExits.length > 0) {
    const index = allExits.indexOf(exitMonth);
    return {
      xOffset: 0,
      textAnchor: 'middle',
      yOffset: (index % 2) * 20 // Stagger alternating exits
    };
  }
  
  return { xOffset: 0, textAnchor: 'middle', yOffset: 0 };
};
```

### Graph Styling (Matching Premium Aesthetic)

- Curve: Lime (#CCFF00) gradient to Cyan (#22d3d1)
- Markers: Concentric circles with glow effect
- Labels: Background pill with semi-transparent fill
- Handover: White marker with 🔑 or special styling

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/roi/snapshot/CompactExitGraphCard.tsx` | **CREATE** - New hybrid graph + cards component |
| `src/components/roi/snapshot/SnapshotContent.tsx` | **MODIFY** - Replace CompactAllExitsCard with CompactExitGraphCard |
| `src/components/roi/snapshot/index.ts` | **MODIFY** - Export new component |

---

## Technical Notes

- Reuse `calculateExitScenario()` and `calculateExitPrice()` from `constructionProgress.ts`
- Keep calculations consistent with existing ROE logic
- SVG viewBox scaled for compact height (~180px chart area)
- Cards below use reference image grid layout
- No framer-motion needed for inline static display
