
# Plan: Fix Three Issues

## Issues to Fix

### Issue 1: Property Price Input (Alt-Tab + Initial Character)
**Problem:** 
- Line 111 in PropertySection.tsx: `value={Number(basePriceInput.replace(/,/g, '')).toLocaleString() || basePriceInput}`
- When `basePriceInput` is empty: `Number("").toLocaleString()` returns `"NaN"`, then fallback shows raw input
- Alt-tab triggers `onBlur` → `handleBasePriceBlur()` → useEffect syncs state, causing visual "jump"

**Solution:**
1. Simplify value prop to just use `basePriceInput`
2. Add a `useRef` to track if user is actively editing (prevents useEffect from overwriting during typing)
3. Improve `handleBasePriceBlur` to handle empty/invalid input gracefully

### Issue 2: Payment Generator Missing
**Problem:**
- The "Generate" button that auto-creates installments based on (count × interval) is missing from `PaymentSection.tsx`
- The feature exists in `OIInputModal.tsx` (lines 287-310) but was never ported to the new configurator UI

**Solution:**
Add the auto-generate functionality back to `PaymentSection.tsx`:
- Add state for `numPayments` and `paymentInterval`
- Add collapsible "Quick Fill" section with inputs and "Generate" button
- Port the `handleGeneratePayments()` logic from OIInputModal

---

## Technical Changes

### File 1: `src/components/roi/configurator/PropertySection.tsx`

**Change 1:** Add editing ref (line ~14)
```tsx
import { useState, useEffect, useRef } from "react";
// ...
const isEditingRef = useRef(false);
```

**Change 2:** Guard useEffect from overwriting during editing (line 34-40)
```tsx
useEffect(() => {
  if (isEditingRef.current) return; // Don't overwrite while user is typing
  setBasePriceInput(
    currency === 'USD' 
      ? Math.round(inputs.basePrice / DEFAULT_RATE).toLocaleString()
      : inputs.basePrice.toLocaleString()
  );
}, [inputs.basePrice, currency]);
```

**Change 3:** Simplify value and add editing tracking (line 109-114)
```tsx
<Input
  type="text"
  value={basePriceInput}
  onChange={(e) => {
    isEditingRef.current = true;
    setBasePriceInput(e.target.value.replace(/,/g, ''));
  }}
  onBlur={() => {
    isEditingRef.current = false;
    handleBasePriceBlur();
  }}
  className="w-44 h-10 text-right bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-lg pl-14"
/>
```

**Change 4:** Improve handleBasePriceBlur to handle empty input (line 60-72)
```tsx
const handleBasePriceBlur = () => {
  const cleanedValue = basePriceInput.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleanedValue);
  
  if (!cleanedValue || isNaN(num) || num <= 0) {
    // Reset to current stored value if invalid
    setBasePriceInput(
      currency === 'USD' 
        ? Math.round(inputs.basePrice / DEFAULT_RATE).toLocaleString()
        : inputs.basePrice.toLocaleString()
    );
    return;
  }
  
  const aedValue = currency === 'USD' ? num * DEFAULT_RATE : num;
  const clamped = Math.min(Math.max(aedValue, 500000), 50000000);
  setInputs(prev => ({ ...prev, basePrice: clamped }));
  setBasePriceInput(
    currency === 'USD' 
      ? Math.round(clamped / DEFAULT_RATE).toLocaleString()
      : clamped.toLocaleString()
  );
};
```

---

### File 2: `src/components/roi/configurator/PaymentSection.tsx`

**Change 1:** Add state for generator (after line 46)
```tsx
const [numPayments, setNumPayments] = useState(4);
const [paymentInterval, setPaymentInterval] = useState(3);
const [showGenerator, setShowGenerator] = useState(false);
```

**Change 2:** Add handleGeneratePayments function (after line 182)
```tsx
const handleGeneratePayments = () => {
  // Calculate remaining percentage to distribute
  const remaining = hasPostHandoverPlan 
    ? 100 - inputs.downpaymentPercent
    : inputs.preHandoverPercent - inputs.downpaymentPercent;
  
  const percentPerPayment = numPayments > 0 ? remaining / numPayments : 0;
  const newPayments: PaymentMilestone[] = [];
  
  for (let i = 0; i < numPayments; i++) {
    newPayments.push({
      id: `auto-${Date.now()}-${i}`,
      type: 'time',
      triggerValue: paymentInterval * (i + 1),
      paymentPercent: parseFloat(percentPerPayment.toFixed(2))
    });
  }
  
  setInputs(prev => ({
    ...prev,
    additionalPayments: newPayments
  }));
  setShowInstallments(true);
  setShowGenerator(false);
};
```

**Change 3:** Add Quick Fill UI inside the Installments section (after line 329, inside CollapsibleContent)

Add a "Quick Fill" collapsible with:
- Number of payments input (1-50)
- Interval input in months (1-12)
- "Generate" button

```tsx
{/* Quick Fill Generator */}
<Collapsible open={showGenerator} onOpenChange={setShowGenerator} className="mt-2">
  <CollapsibleTrigger asChild>
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full h-6 text-[10px] border-dashed border-[#2a3142] text-gray-500 hover:bg-[#2a3142] hover:text-white"
    >
      <Zap className="w-3 h-3 mr-1" />
      Quick Fill
      {showGenerator ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="pt-2">
    <div className="p-2 bg-[#0d1117] rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 block mb-0.5"># Payments</label>
          <Input
            type="text"
            inputMode="numeric"
            value={numPayments}
            onChange={(e) => setNumPayments(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            className="h-7 text-center bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 block mb-0.5">Interval (mo)</label>
          <Input
            type="text"
            inputMode="numeric"
            value={paymentInterval}
            onChange={(e) => setPaymentInterval(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
            className="h-7 text-center bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-xs"
          />
        </div>
      </div>
      <div className="text-[10px] text-gray-400 text-center">
        {numPayments} × {((hasPostHandoverPlan ? 100 - inputs.downpaymentPercent : inputs.preHandoverPercent - inputs.downpaymentPercent) / numPayments).toFixed(2)}% every {paymentInterval} month(s)
      </div>
      <Button
        type="button"
        onClick={handleGeneratePayments}
        size="sm"
        className="w-full h-7 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-semibold text-xs"
      >
        <Zap className="w-3 h-3 mr-1" />
        Generate {numPayments} Payments
      </Button>
    </div>
  </CollapsibleContent>
</Collapsible>
```

**Change 4:** Import Zap icon (line 2)
```tsx
import { Plus, Trash2, Clock, Building2, Home, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Info, Key, Calendar, Zap } from "lucide-react";
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `PropertySection.tsx` | Add editing ref, guard useEffect, simplify input value, improve blur handler |
| `PaymentSection.tsx` | Add Quick Fill generator: state, handler function, collapsible UI with inputs |

---

## Expected Behavior After Fix

### Property Price Input:
- Typing works normally without characters appearing/disappearing
- Alt-tab no longer randomly reformats the value while typing
- Empty/invalid input resets to last valid value on blur

### Payment Generator:
- "Quick Fill" button appears below the installments header
- User can set # of payments (e.g., 4) and interval (e.g., 3 months)
- Clicking "Generate" creates evenly-distributed installments automatically
- Works for both standard and post-handover plans
