

# Plan: Improve Key Insights Cards + Fix Configurator Modal Bugs

## Problems Identified

### 1. Key Insights Cards Need Improvement
**User feedback:**
- "Entry Ticket" is obvious and not worth showing - everyone knows off-plan requires less capital upfront
- "Multiplier" should also show the actual property value at Year 10, not just the multiplier
- Need a new card for "Total Wealth Created at Year 10"

### 2. Configurator Modal Bugs
**Issues found in `ComparisonConfiguratorModal.tsx`:**

a. **Property name is erased on reopen**
   - The `propertyName` state is in `SecondaryPropertyStep.tsx` but resets each time the modal reopens
   - It's not passed to/from the parent modal or saved with the secondary inputs

b. **Secondary inputs change when reopening**
   - Lines 82-88: Reset effect only checks `!initialQuoteId` but doesn't respect `initialSecondaryInputs`
   - Lines 91-105: The quote selection effect overwrites secondaryInputs every time `selectedQuote` changes

c. **Cannot click outside to close**
   - By default, Radix Dialog closes on overlay click. This should work already.
   - Need to verify there's no `onInteractOutside` preventing this behavior

---

## Technical Changes

### File 1: `src/components/roi/secondary/ComparisonKeyInsights.tsx`

#### Replace "Entry Ticket" with "Total Wealth" card

Remove the Entry Ticket card (index 0) and replace with a Total Wealth card:

| Before | After |
|--------|-------|
| 1. Entry Ticket | 1. **10-Year Wealth** (Property Value + Net Rent) |
| 2. Multiplier | 2. Multiplier (+ show property value) |
| 3. Income During Build | 3. Income During Build |
| 4. Construction Bonus | 4. Construction Bonus |

**New props needed:**
```typescript
interface ComparisonKeyInsightsProps {
  // ... existing
  offPlanPropertyValue10Y: number;      // NEW: Year 10 property value
  secondaryPropertyValue10Y: number;    // NEW: Year 10 property value
}
```

**Change card 1 (Entry Ticket → Total Wealth):**
```typescript
{
  key: 'wealth10',
  title: t.totalWealth,
  subtitle: t.after10Years,
  icon: Gem,  // New icon
  showComparison: true,
  offPlanValue: formatValue(metrics.offPlanWealthYear10 + offPlanTotalCapital),
  secondaryValue: formatValue(secondaryWealth10 + secondaryCashCapital),
  badge: null,
  winner: (metrics.offPlanWealthYear10 + offPlanTotalCapital) > (secondaryWealth10 + secondaryCashCapital) 
    ? 'offplan' : 'secondary',
}
```

**Enhance card 2 (Multiplier) to show property value:**
- Add secondary row showing "→ AED X.XM" (the final property value after 10 years)
- This shows both the multiplier (2.1x) and the actual resulting value

---

### File 2: `src/components/roi/secondary/types.ts`

#### Add propertyName to SecondaryInputs (optional addition)

Consider adding:
```typescript
export interface SecondaryInputs {
  // ... existing
  propertyName?: string; // NEW: Optional name for saving/display
}
```

This allows the property name to persist with the secondary inputs.

---

### File 3: `src/components/roi/secondary/ComparisonConfiguratorModal.tsx`

#### Fix 1: Reset logic should respect initial values

**Lines 82-88** - Current:
```typescript
useEffect(() => {
  if (open && !initialQuoteId) {
    setStep(1);
    setSelectedQuote(null);
  }
}, [open, initialQuoteId]);
```

**Fixed:**
```typescript
useEffect(() => {
  if (open) {
    // Only reset if no initial data is provided
    if (!initialQuoteId && !initialSecondaryInputs) {
      setStep(1);
      setSelectedQuote(null);
      setSecondaryInputs(DEFAULT_SECONDARY_INPUTS);
    } else if (initialSecondaryInputs) {
      // Respect provided initial inputs
      setSecondaryInputs(initialSecondaryInputs);
    }
  }
}, [open, initialQuoteId, initialSecondaryInputs]);
```

#### Fix 2: Don't overwrite secondaryInputs when quote is already selected

**Lines 91-105** - Current:
```typescript
useEffect(() => {
  if (selectedQuote?.inputs) {
    const inputs = selectedQuote.inputs as OIInputs;
    setSecondaryInputs(prev => ({
      ...prev,
      purchasePrice: inputs.basePrice || prev.purchasePrice,
      // ... etc
    }));
  }
}, [selectedQuote]);
```

**Fixed - Only run on first quote selection, not on re-renders:**
```typescript
const [hasInitializedFromQuote, setHasInitializedFromQuote] = useState(false);

useEffect(() => {
  // Only initialize from quote if we haven't already AND we don't have initial inputs
  if (selectedQuote?.inputs && !hasInitializedFromQuote && !initialSecondaryInputs) {
    const inputs = selectedQuote.inputs as OIInputs;
    setSecondaryInputs(prev => ({
      ...prev,
      purchasePrice: inputs.basePrice || prev.purchasePrice,
      // ... etc
    }));
    setHasInitializedFromQuote(true);
  }
}, [selectedQuote, hasInitializedFromQuote, initialSecondaryInputs]);

// Reset the flag when modal closes
useEffect(() => {
  if (!open) {
    setHasInitializedFromQuote(false);
  }
}, [open]);
```

#### Fix 3: Ensure click-outside works

The Radix Dialog should handle this by default. Verify the `DialogContent` doesn't have `onPointerDownOutside` or `onInteractOutside` handlers that prevent closing.

If it still doesn't work, explicitly add to `DialogContent`:
```tsx
<DialogContent 
  className="..."
  onPointerDownOutside={() => onOpenChange(false)}
>
```

---

### File 4: `src/components/roi/secondary/SecondaryPropertyStep.tsx`

#### Move propertyName state up to parent

Instead of local state, accept it as a prop:

**Add to props:**
```typescript
interface SecondaryPropertyStepProps {
  inputs: SecondaryInputs;
  onChange: (inputs: SecondaryInputs) => void;
  propertyName: string;              // NEW
  onPropertyNameChange: (name: string) => void;  // NEW
  // ... rest
}
```

Then in `ComparisonConfiguratorModal.tsx`, manage the propertyName state there and pass it down.

---

### File 5: `src/pages/OffPlanVsSecondary.tsx`

#### Pass new props to ComparisonKeyInsights

```typescript
// Calculate Year 10 property values
const offPlanPropertyValue10Y = useMemo(() => {
  return offPlanCalcs.yearlyProjections[9]?.propertyValue || 0;
}, [offPlanCalcs]);

const secondaryPropertyValue10Y = useMemo(() => {
  return secondaryCalcs.yearlyProjections[9]?.propertyValue || 0;
}, [secondaryCalcs]);

// Pass to component
<ComparisonKeyInsights
  // ... existing props
  offPlanPropertyValue10Y={offPlanPropertyValue10Y}
  secondaryPropertyValue10Y={secondaryPropertyValue10Y}
/>
```

---

## Expected Results

### Key Insights Cards (After Fix)

| Position | Card Name | Off-Plan | Secondary |
|----------|-----------|----------|-----------|
| 1 | **Total Wealth (10Y)** | AED 15.2M | AED 14.8M |
| 2 | Multiplier | 2.1x → 12.4M | 1.8x → 13.2M |
| 3 | Income During Build | No income | +AED 2.8M |
| 4 | Construction Bonus | +AED 1.27M | — |

### Modal Behavior (After Fix)

| Action | Before | After |
|--------|--------|-------|
| Reopen configurator | Values reset, name erased | Values preserved, name stays |
| Click outside modal | Nothing | Modal closes |
| Select saved property | Overwrites on every render | Only on first selection |

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/roi/secondary/ComparisonKeyInsights.tsx` | Modify | Replace Entry Ticket with Total Wealth, add property value to Multiplier |
| `src/components/roi/secondary/ComparisonConfiguratorModal.tsx` | Modify | Fix reset logic, add initialization flag, ensure click-outside works |
| `src/components/roi/secondary/SecondaryPropertyStep.tsx` | Modify | Accept propertyName as prop instead of local state |
| `src/pages/OffPlanVsSecondary.tsx` | Modify | Pass Year 10 property values, manage propertyName state |

