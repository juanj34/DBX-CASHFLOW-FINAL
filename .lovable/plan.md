
# Post-Handover Exit Scenarios Implementation

## Current State Analysis

### What Exists Now
The exit scenario system is designed primarily for **pre-handover** exits:

1. **ExitsSection.tsx (Configurator)** - Line 97: `handleAddExit()` caps exits at `totalMonths - 1`
   ```typescript
   if (newMonth > 0 && newMonth < totalMonths) {
   ```

2. **ExitScenariosCards.tsx** - Line 289: Slider max is `totalMonths - 1`
   ```typescript
   max={totalMonths - 1}
   ```

3. **OIGrowthCurve.tsx** - Line 56: X-axis ends at handover
   ```typescript
   const xScale = (months: number) => padding.left + (months / totalMonths) * chartWidth;
   ```

4. **calculateExitPrice** (constructionProgress.ts) - Lines 388-432: Already supports post-handover with Growth + Mature phases

5. **calculateEquityAtExitWithDetails** (constructionProgress.ts) - Lines 162-309: Already handles post-handover payments correctly

**Good news**: The calculation engine already supports post-handover! The limitation is purely in the UI.

---

## What Needs to Change

### 1. Configurator (ExitsSection.tsx)
**Current**: Only allows exits up to `totalMonths - 1`

**New Behavior**:
- Allow exits beyond handover (e.g., +6mo, +12mo, +24mo, +36mo after handover)
- Add quick-add buttons for post-handover intervals
- Change slider max from `totalMonths - 1` to `totalMonths + 60` (5 years post-HO)
- Visual differentiation between pre-handover and post-handover exit cards

**UI Changes**:
```
Quick Add Buttons:
[18mo] [24mo] [30%] [50%] [80%] [Handover] | [+6mo] [+1yr] [+2yr] [+3yr] [+]

Exit Cards:
- Pre-handover: Show construction %, milestone labels
- Post-handover: Show "Post-Handover +X months" label, phase (Growth/Mature)
```

### 2. Exit Cards Display (ExitScenariosCards.tsx)
**Current**: Shows construction milestone tags ("Early Structure", "50% Complete", etc.)

**New Behavior**:
- For post-handover exits, show different tags: "Growth Phase" / "Mature Phase"
- Show rental income accumulated if holding
- Different color scheme for post-HO cards (maybe green tint vs yellow)

**Add new metrics for post-HO exits**:
- Property value at exit (with appreciation)
- Accumulated rental income if held to that point
- Net position = Profit + Rental Income

### 3. Growth Curve Chart (OIGrowthCurve.tsx)
**Current**: X-axis ends at handover

**New Behavior**:
- Extend X-axis to show post-handover growth (up to max exit point + buffer)
- Show phase transitions: Construction → Growth → Mature
- Add visual markers for post-handover exit points
- Different gradient colors for each phase

**Visual Design**:
```
|                                 _______________/  Mature
|                        ________/
|              _________/  Growth
|    _________/
|___/  Construction
|__________________________|______________|_________________
0                     Handover      +5yrs              +10yrs
```

### 4. Snapshot/Client View (CompactAllExitsCard.tsx)
**Current**: Shows exit scenarios with construction % and milestone

**New Behavior**:
- For post-handover: Show "After Handover" badge instead of construction %
- Show "Growth" or "Mature" phase instead of construction milestone
- Include rental income note for post-HO scenarios

### 5. Data Model Updates
**No changes needed** - the calculation engine already handles this!

The `calculateExitPrice()` function already computes:
- Construction phase (months ≤ totalMonths) using constructionAppreciation
- Growth phase (months > totalMonths, < totalMonths + growthPeriodYears*12) using growthAppreciation
- Mature phase (beyond growth) using matureAppreciation

---

## Technical Implementation

### File: `src/components/roi/configurator/ExitsSection.tsx`

1. **Allow post-handover exits**:
```typescript
// Line 81: Change condition to allow 5 years post-handover
if (newMonth > 0 && newMonth <= totalMonths + 60) {
  // ... create exit
}

// Line 97: Same for handleAddExitAtMonth
if (month > 0 && month <= totalMonths + 60 && !exits.some(...)) {
```

2. **Add post-handover quick-add buttons**:
```typescript
// After "Handover" button, add:
{[6, 12, 24, 36].map(offset => {
  const month = totalMonths + offset;
  return (
    <Button
      key={`post-${offset}`}
      variant="outline"
      size="sm"
      onClick={() => handleAddExitAtMonth(month)}
      disabled={exits.some(e => e.monthsFromBooking === month)}
      className="..."
    >
      +{offset >= 12 ? `${offset/12}yr` : `${offset}mo`}
    </Button>
  );
})}
```

3. **Update slider max**:
```typescript
// Line 314-315
max={totalMonths + 60}  // Allow up to 5 years post-handover
```

4. **Update card display for post-handover**:
```typescript
const isPostHandover = exit.monthsFromBooking > totalMonths;
const postHandoverMonths = exit.monthsFromBooking - totalMonths;
const phase = postHandoverMonths > inputs.growthPeriodYears * 12 ? 'Mature' : 'Growth';

// In card render:
{isPostHandover ? (
  <span className="text-green-400">+{postHandoverMonths}mo Post-HO ({phase})</span>
) : (
  <span>{getExitDate(exit.monthsFromBooking)}</span>
)}
```

### File: `src/components/roi/ExitScenariosCards.tsx`

1. **Update slider max** (line 289):
```typescript
max={totalMonths + 60}
```

2. **Update milestone logic** (add new function):
```typescript
const getPostHandoverPhase = (monthsAfterHandover: number, growthPeriodYears: number) => {
  const yearsAfter = monthsAfterHandover / 12;
  if (yearsAfter <= growthPeriodYears) {
    return { 
      icon: <Rocket className="w-3 h-3" />, 
      label: 'Growth Phase', 
      color: 'text-green-400 bg-green-400/10' 
    };
  }
  return { 
    icon: <Shield className="w-3 h-3" />, 
    label: 'Mature Phase', 
    color: 'text-blue-400 bg-blue-400/10' 
  };
};
```

3. **Update card header to show phase instead of construction %**:
```typescript
const isPostHandover = exitScenarios[index] > totalMonths;
const monthsAfterHandover = exitScenarios[index] - totalMonths;

// In header:
{isPostHandover ? (
  <>
    <span className="text-green-400 text-xs">+{monthsAfterHandover}mo</span>
    {getPostHandoverPhase(monthsAfterHandover, inputs.growthPeriodYears)}
  </>
) : (
  <>
    <span>{progressPercent}% built</span>
    {milestone}
  </>
)}
```

### File: `src/components/roi/OIGrowthCurve.tsx`

1. **Extend X-axis beyond handover**:
```typescript
// Calculate max exit month for chart scaling
const maxExitMonth = Math.max(...exitScenarios, totalMonths);
const chartMaxMonth = Math.max(totalMonths + 12, maxExitMonth + 6); // At least 1 year post-HO

// Update scale
const xScale = (months: number) => padding.left + (months / chartMaxMonth) * chartWidth;
```

2. **Extend curve path beyond handover**:
```typescript
const curvePath = useMemo(() => {
  const points: { x: number; y: number }[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const month = progress * chartMaxMonth; // Use chartMaxMonth, not totalMonths
    const price = calculateExitPrice(month, basePrice, totalMonths, inputs);
    points.push({ x: month, y: price });
  }
  // ... create path
}, [basePrice, totalMonths, chartMaxMonth, inputs, xScale, yScale]);
```

3. **Add phase transition markers**:
```typescript
// Add vertical line at handover
<line
  x1={xScale(totalMonths)}
  y1={padding.top}
  x2={xScale(totalMonths)}
  y2={height - padding.bottom}
  stroke="#CCFF00"
  strokeWidth="1"
  strokeDasharray="4,4"
  opacity="0.5"
/>
<text x={xScale(totalMonths)} y={height - 36} fill="#CCFF00" fontSize="8" textAnchor="middle">
  Handover
</text>

// Growth → Mature transition if visible
{chartMaxMonth > totalMonths + growthPeriodYears * 12 && (
  <line
    x1={xScale(totalMonths + growthPeriodYears * 12)}
    ...
  />
)}
```

4. **Color-code curve segments**:
```typescript
<defs>
  <linearGradient id="curveGradientPhased" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset={`${(totalMonths / chartMaxMonth) * 100}%`} stopColor="#CCFF00" />
    <stop offset={`${((totalMonths + growthPeriodYears * 12) / chartMaxMonth) * 100}%`} stopColor="#22d3d1" />
    <stop offset="100%" stopColor="#64748b" />
  </linearGradient>
</defs>
```

### File: `src/components/roi/snapshot/CompactAllExitsCard.tsx`

1. **Update scenario display for post-handover**:
```typescript
const isPostHandover = exitMonths > calculations.totalMonths;
const monthsAfterHandover = exitMonths - calculations.totalMonths;
const phase = monthsAfterHandover > (inputs.growthPeriodYears || 5) * 12 ? 'Mature' : 'Growth';

// Replace construction % badge:
{isPostHandover ? (
  <div className="flex items-center gap-1">
    <Rocket className="w-3 h-3 text-green-400" />
    <span className="text-xs text-green-400 font-medium">
      {phase} (+{monthsAfterHandover}mo)
    </span>
  </div>
) : (
  <div className="flex items-center gap-1">
    <Hammer className="w-3 h-3 text-orange-400" />
    <span className="text-xs text-orange-400 font-medium">
      {constructionPct.toFixed(0)}% built
    </span>
  </div>
)}
```

---

## UI/UX Considerations

### Post-Handover Exit Card Design
```
┌─────────────────────────────────────┐
│ Exit 4  +12mo Post-HO  [Growth]     │
├─────────────────────────────────────┤
│         48% RETURN                  │
│   Return on Cash Invested           │
│      [Excellent] · 9.6%/year        │
├─────────────────────────────────────┤
│ Profit: +AED 450,000 (Net)          │
├─────────────────────────────────────┤
│ 💰 Cash at Exit: AED 1,200,000      │
│    + Entry Costs: AED 75,000        │
│ 🎯 Exit Value: AED 2,150,000        │
│    (Year 1 Rent: AED 95,000)        │
└─────────────────────────────────────┘
```

### Phase Badge Colors
- **Construction**: Orange (#f97316) - Building/in-progress
- **Growth**: Green (#22c55e) - Rapid appreciation
- **Mature**: Blue (#3b82f6) - Stable/established

---

## Implementation Order

1. **ExitsSection.tsx** - Allow post-HO exits in configurator
2. **ExitScenariosCards.tsx** - Update cards to show post-HO correctly
3. **OIGrowthCurve.tsx** - Extend chart beyond handover
4. **CompactAllExitsCard.tsx** - Update snapshot view
5. Test with existing calculation engine (no changes needed)

---

## Testing Checklist

With a 27-month project:
- [ ] Can add exit at +6mo (month 33)
- [ ] Can add exit at +12mo (month 39)
- [ ] Slider allows up to +60mo post-HO
- [ ] Exit cards show "Growth Phase" or "Mature Phase"
- [ ] Growth curve extends to show post-HO exits
- [ ] Chart shows handover vertical line
- [ ] ROE calculations account for 100% equity (full payment)
- [ ] Appreciation uses growthAppreciation rate post-handover
- [ ] Snapshot view displays post-HO exits correctly
