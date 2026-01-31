

# Add Handover Row to Wealth Projection Tables

## Problem Statement

The Wealth Projection displays property values by **calendar year** (2026, 2027, 2028...), but handover happens at a specific **quarter** (e.g., Q4 2029). Currently, users cannot see the exact value at the handover moment, which is a critical milestone.

**Current State:**
| 2026 | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 |
|------|------|------|------|------|------|------|
| 9.6M | 11.0M | 12.7M | 14.6M | 15.2M | 15.8M | 16.4M |
| Constr | Constr | Constr | Constr | Growth | Growth | Growth |

**Desired State:**
| 2026 | 2027 | 2028 | 2029 | 🔑 Q4'29 | 2030 | 2031 | 2032 |
|------|------|------|------|----------|------|------|------|
| 9.6M | 11.0M | 12.7M | 14.4M | **14.6M** | 15.2M | 15.8M | 16.4M |
| Constr | Constr | Constr | Constr | **Handover** | Growth | Growth | Growth |

The handover column should:
- Show the exact property value at handover (using monthly appreciation up to that point)
- Display with a special badge/highlight (🔑 icon, green styling)
- Insert between the handover year and the following year

---

## Technical Implementation

### Approach: Insert Handover as Dedicated Data Point

Since handover occurs mid-year (at a specific quarter), we need to:

1. Calculate the property value at the **exact handover month** using monthly compounding
2. Insert this as a special row/column between the handover year and next year
3. Style it distinctly (green highlight, 🔑 badge)

### Calculation Logic

```typescript
// Given:
// - handoverQuarter: 1-4 (Q1=Feb, Q2=May, Q3=Aug, Q4=Nov)
// - handoverYear: e.g., 2029
// - bookingYear: e.g., 2026
// - basePrice: e.g., 9.6M
// - constructionAppreciation: e.g., 12%

// Calculate months from booking to handover
const handoverMonth = quarterToMonth(handoverQuarter); // Q4 = month 11
const bookingDate = new Date(bookingYear, bookingMonth - 1);
const handoverDate = new Date(handoverYear, handoverMonth - 1);
const monthsToHandover = Math.round((handoverDate - bookingDate) / (30 * 24 * 60 * 60 * 1000));

// Calculate value at exact handover using monthly appreciation
const monthlyRate = Math.pow(1 + constructionAppreciation / 100, 1/12) - 1;
const handoverValue = basePrice * Math.pow(1 + monthlyRate, monthsToHandover);
```

---

## Files to Modify

### 1. `src/components/roi/snapshot/WealthProjectionTable.tsx`

**Changes:**
- Add props: `handoverQuarter`, `handoverYear`, `handoverMonth`, `bookingMonth`
- Insert a "Handover" row after the construction phase ends
- Calculate exact handover value using monthly compounding
- Style with green background and 🔑 badge

**Interface Update:**
```typescript
interface WealthProjectionTableProps {
  // ... existing props ...
  handoverQuarter: number;  // NEW
  handoverYear: number;     // NEW
  handoverMonth?: number;   // NEW (optional, can derive from quarter)
}
```

**Data Structure Update:**
```typescript
interface YearRow {
  year: number;
  value: number;
  phase: string;
  appreciation: number;
  annualRent: number;
  cumulativeRent: number;
  isHandover?: boolean;  // NEW: Flag for handover row
  label?: string;        // NEW: Custom label (e.g., "🔑 Q4'29")
}
```

---

### 2. `src/components/roi/snapshot/WealthProjectionTimeline.tsx`

**Changes:**
- Add props: `handoverQuarter`, `handoverYear`
- Insert handover column with special styling
- Increase from 7 columns to 8 (7 years + handover)
- Use smaller spacing to fit extra column

**Visual Update:**
```text
| 2026 | 2027 | 2028 | 2029 | 🔑Q4'29 | 2030 | 2031 | 2032 |
  ●──────●──────●──────●───────◉───────●──────●──────●
Constr Constr Constr Constr Handover Growth Growth Growth
```

The handover column gets:
- Larger dot (◉ vs ●)
- Green background glow
- 🔑 icon in label
- Bold value

---

### 3. `src/components/roi/export/ExportWealthTimeline.tsx`

**Changes:**
- Same logic as WealthProjectionTimeline but with inline styles
- Add handover column between appropriate years
- Green styling for handover column

---

### 4. `src/components/roi/snapshot/WealthProjectionModal.tsx`

**Changes:**
- Pass new props (handoverQuarter, handoverYear) to `WealthProjectionTable`

---

### 5. `src/components/roi/snapshot/SnapshotContent.tsx`

**Changes:**
- Calculate and pass `handoverQuarter`, `handoverYear` to `WealthProjectionModal`
- Pass to any `WealthProjectionTimeline` instances

---

### 6. Parent Components Using These Timelines

Update all parent components to pass the new handover props:
- `SnapshotContent.tsx`
- `ExportSnapshotDOM.tsx`
- Any other views using wealth projection

---

## Layout Strategy for 8 Columns

Since we're adding an extra column (7 years + handover), we need to adjust spacing:

**Option A: Reduce Year 7**
Show years 1-6 + Handover + Year 7 (drop year 8)

**Option B: Compress All (Preferred)**
Keep all 7 years but use `grid-cols-8` with tighter gaps:
```css
grid-template-columns: repeat(8, 1fr);
gap: 4px; /* Reduced from 8px */
```

**Option C: Dynamic Insert**
Insert handover column only where it belongs in the sequence, maintaining 8 total columns.

---

## Handover Value Calculation

Use the same `calculateExitPrice` function from `constructionProgress.ts` for consistency:

```typescript
import { calculateExitPrice } from '../constructionProgress';

const handoverValue = calculateExitPrice(
  monthsToHandover,
  basePrice,
  totalMonths,
  {
    constructionAppreciation,
    growthAppreciation,
    matureAppreciation,
    growthPeriodYears,
  }
);
```

This ensures the handover value matches exit scenario calculations perfectly.

---

## Visual Design

### Timeline Column (Handover)

```
    🔑 Q4'29
    ─────────
    14.6M
    €3.3M
       ◉      ← Larger dot with glow
    Handover  ← Green text
```

**Styling:**
- Background: `bg-green-500/10`
- Border: `border border-green-500/30`
- Dot: Larger (16px vs 12px), green with glow
- Label: Green bold text

### Table Row (Handover)

```
| 🔑 Q4'29 | 14.6M | - | Handover |
```

**Styling:**
- Row background: `bg-green-500/10`
- Left border: `border-l-4 border-green-500`
- Badge: `bg-green-500/20 text-green-400`

---

## Summary of Changes

| File | Type | Description |
|------|------|-------------|
| `WealthProjectionTable.tsx` | Modify | Add handover row with special styling |
| `WealthProjectionTimeline.tsx` | Modify | Add handover column in horizontal timeline |
| `ExportWealthTimeline.tsx` | Modify | Static export version with handover column |
| `WealthProjectionModal.tsx` | Modify | Pass handover props to table |
| `SnapshotContent.tsx` | Modify | Pass handover props to modal and timeline |
| `ExportSnapshotDOM.tsx` | Modify | Pass handover props to export timeline |

---

## Prop Requirements

Each component needs these additional props:
```typescript
handoverQuarter: number;  // 1-4 (Q1, Q2, Q3, Q4)
handoverYear: number;     // Calendar year (e.g., 2029)
bookingMonth: number;     // 1-12 (for exact month calculation)
bookingYear: number;      // Already exists in most components
```

These are all available in `inputs: OIInputs` which is already passed to most components.

