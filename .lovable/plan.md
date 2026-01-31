
# Fix Exit Chart: Handover Value vs Exit Scenarios

## Problem

The chart currently shows confusing overlapping markers when an exit scenario is set exactly at the handover month:

```text
Before:
                    ↓ Exit #3 (€297K)
                    ↓ Handover (€297K)
                    •←── Same point, two markers!
```

This is confusing because:
1. Handover is a **milestone** (when you get the keys), not necessarily a sale
2. Having both "Exit #3" and "Handover" at the same spot creates visual noise
3. Users don't understand which value to trust

---

## Solution

### 1. Filter Exit Scenarios at Handover Month

In `OIGrowthCurve.tsx`, exclude any exit that falls exactly on `totalMonths` from the exit markers:

```typescript
// Filter out exit scenarios that fall exactly on handover month
const exitMarkersData = useMemo(() => {
  return exitScenarios
    .filter(month => month !== totalMonths) // ← NEW: Skip handover-month exits
    .map((month, index) => {
      const scenario = calculateExitScenario(month, basePrice, totalMonths, inputs, totalEntryCosts);
      return {
        scenario,
        exitMonth: month,
        originalIndex: exitScenarios.indexOf(month), // Keep original numbering
      };
    });
}, [exitScenarios, basePrice, totalMonths, inputs, totalEntryCosts]);
```

### 2. Show "Handover Value" as a Dedicated Marker

Change the handover marker label from "Handover" to "🔑 Handover Value" and remove the ROE display (since it's not an exit):

```typescript
{/* Handover marker - now just showing property value, not exit */}
<g style={{ ... }}>
  {/* Handover label */}
  <text x={xScale(totalMonths)} y={yScale(handoverPrice) - 24}
        fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
    🔑 Handover Value
  </text>
  
  {/* Handover price - just the property value at completion */}
  <text x={xScale(totalMonths)} y={yScale(handoverPrice) - 10}
        fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
    {formatCurrencyShort(handoverPrice, currency, rate)}
  </text>
  
  {/* NO ROE shown - handover is a milestone, not an exit */}
  
  {/* Marker circles */}
  <circle cx={xScale(totalMonths)} cy={yScale(handoverPrice)}
          r="8" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
  <circle cx={xScale(totalMonths)} cy={yScale(handoverPrice)}
          r="4" fill="#ffffff" />
</g>
```

### 3. Calculate `handoverPrice` Instead of Full Scenario

Since we're not treating handover as an exit, just calculate the property value:

```typescript
// Just the price at handover (not a full exit scenario)
const handoverPrice = useMemo(() => {
  return calculateExitPrice(totalMonths, basePrice, totalMonths, inputs);
}, [totalMonths, basePrice, inputs]);
```

### 4. Keep Exit Numbering Consistent

When filtering out handover-month exits, maintain original numbering so users still see "Exit #1, #2, #4" (skipping #3 if that was at handover):

```typescript
// Original index tracking
const exitMarkersData = useMemo(() => {
  let exitNumber = 0;
  return exitScenarios
    .map((month, originalIndex) => {
      // Skip handover-month exits
      if (month === totalMonths) return null;
      
      exitNumber++;
      const scenario = calculateExitScenario(month, basePrice, totalMonths, inputs, totalEntryCosts);
      return {
        scenario,
        exitMonth: month,
        label: `Exit ${exitNumber}`,
        exitNumber,
      };
    })
    .filter(Boolean);
}, [exitScenarios, basePrice, totalMonths, inputs, totalEntryCosts]);
```

---

## Visual Result

```text
Before (Confusing):
────────────────────────────────
                    Exit #3 (€297K) ← Redundant
                    Handover (€297K) ← Overlapping
                    •
────────────────────────────────

After (Clear):
────────────────────────────────
                    Exit #3 (+6mo, €320K)
                    🔑 Handover Value (€297K) ← Milestone only
                    •
────────────────────────────────
```

---

## Edge Cases

1. **All exits after handover**: Chart works normally, shows Handover Value + post-handover exits
2. **All exits before handover**: Chart shows construction-phase exits + Handover Value milestone
3. **Mixed exits**: Pre-handover, handover milestone, post-handover exits all render correctly
4. **Exit exactly at handover removed from user selection**: The exit won't appear as a marker, but Handover Value will

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/OIGrowthCurve.tsx` | Filter handover-month exits, change handover marker to "Handover Value" without ROE |

---

## Technical Details

The key change is separating two concepts:
- **Handover**: When you receive the property (milestone marker with property value)
- **Exit**: When you sell the property (actionable scenario with ROE calculation)

The `calculateExitPrice()` function calculates the property value at any month, while `calculateExitScenario()` calculates the full exit metrics (capital deployed, profit, ROE). We use only `calculateExitPrice()` for the handover marker.
