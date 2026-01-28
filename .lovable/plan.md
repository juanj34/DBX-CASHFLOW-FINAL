
# Plan: Payment Generator Enhancements

## Summary of Changes

Three improvements to the Payment Section configurator:

1. **Add "% per payment" input** to the pre-handover installments generator
2. **Move Post-Handover toggle** to the top of the Payment section
3. **Add Reset button** to clear generated installments

---

## 1. Add % Per Payment to Pre-Handover Generator

Currently the pre-handover generator shows:
```
[4] payments × [6] mo     [Generate]
```

After change:
```
[4] payments × [6] mo @ [2.5] %     [Generate]   [Reset]
```

### Technical Changes

**File: `src/components/roi/configurator/PaymentSection.tsx`**

- Add new state for percent per payment (line ~48):
```typescript
const [percentPerPayment, setPercentPerPayment] = useState(2.5);
```

- Update `handleGeneratePayments` to use the user-defined percentage:
```typescript
const handleGeneratePayments = () => {
  const newPayments: PaymentMilestone[] = [];
  
  for (let i = 0; i < numPayments; i++) {
    newPayments.push({
      id: `auto-${Date.now()}-${i}`,
      type: 'time',
      triggerValue: paymentInterval * (i + 1),
      paymentPercent: percentPerPayment  // Use exact user-defined percentage
    });
  }
  
  setInputs(prev => ({ ...prev, additionalPayments: newPayments }));
  setShowInstallments(true);
};
```

- Add the % input field to the generator UI (after the `mo` input):
```tsx
<span className="text-gray-600">@</span>
<div className="flex items-center gap-1">
  <Input
    type="text"
    inputMode="decimal"
    value={percentPerPayment || ''}
    onChange={(e) => handleNumberInputChange(e.target.value, setPercentPerPayment, 0.1, 50)}
    className="w-12 h-7 bg-[#0d1117] border-[#2a3142] text-[#CCFF00] font-mono text-center text-xs"
  />
  <span className="text-[10px] text-gray-500">%</span>
</div>
```

---

## 2. Move Post-Handover Toggle to Top

Currently the toggle is at the bottom (line 503-518). Move it right after the section title.

### New Order:
1. Title + description
2. **Post-Handover Toggle** ← moved here
3. Payment Split (Step 1)
4. Downpayment (Step 2)
5. Generate Installments (Step 3)
6. Installments List
7. Footer Summary

### Technical Changes

- Cut the toggle from lines 503-518 and insert after the title section (after line 182)

---

## 3. Add Reset Button to Clear Payments

Add a "Reset" button next to the Generate button that clears all installments.

### Technical Changes

- Add `handleResetPayments` function:
```typescript
const handleResetPayments = () => {
  setInputs(prev => ({ ...prev, additionalPayments: [] }));
  setShowInstallments(false);
};
```

- Add Reset button next to Generate button:
```tsx
{inputs.additionalPayments.length > 0 && (
  <Button
    type="button"
    onClick={handleResetPayments}
    size="sm"
    variant="outline"
    className="h-7 px-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
  >
    <Trash2 className="w-3 h-3" />
  </Button>
)}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/configurator/PaymentSection.tsx` | Add % per payment state, update generator logic, add reset function, move toggle, add UI inputs |

---

## Visual Result

### Generator After Changes:
```
┌─────────────────────────────────────────────────────────────┐
│  Payment Plan                                               │
│  Configure your payment schedule and milestones             │
├─────────────────────────────────────────────────────────────┤
│  📅 Allow Payments Past Handover              [  Toggle  ]  │  ← MOVED TO TOP
├─────────────────────────────────────────────────────────────┤
│ ① Payment Split                                             │
│     [30/70] [40/60] [50/50] [60/40] [Custom]               │
├─────────────────────────────────────────────────────────────┤
│ ② Downpayment                                               │
│     [─────────○─────────] [20] %                           │
├─────────────────────────────────────────────────────────────┤
│ ③ ⚡ Generate Installments                                  │
│                                                             │
│    [4] payments × [6] mo @ [2.5] %    [⚡ Generate] [🗑]    │  ← NEW % INPUT + RESET
│                                                             │
│    4 × 2.5% = 10% (adjust if needed)                       │  ← NEW PROJECTION
└─────────────────────────────────────────────────────────────┘
```

---

## Additional UX Enhancement

Add a projection summary similar to post-handover:
```tsx
<div className="text-[10px] text-gray-500 ml-7 mt-1 font-mono">
  {numPayments} × {percentPerPayment}% = {(numPayments * percentPerPayment).toFixed(1)}%
  {Math.abs(numPayments * percentPerPayment - (inputs.preHandoverPercent - inputs.downpaymentPercent)) > 0.5 && (
    <span className="text-amber-400 ml-1">
      (remaining: {(inputs.preHandoverPercent - inputs.downpaymentPercent).toFixed(1)}%)
    </span>
  )}
</div>
```
