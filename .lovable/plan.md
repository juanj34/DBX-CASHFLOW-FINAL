

# Plan: Remove Generate Section from Payment Configurator

## Understanding the Issue

The "⚡ Generate" section (Step 3) shows:
- **4** × **6** mo @ **2.5** %
- A projection: "4×2.5% = 10.0% (need: 25.0%)"

This is **unnecessary** because:
1. Developers provide the payment plan structure (e.g., "40/60 with 10 installments at 2% each during construction")
2. Users just need to **input the installments** they're given, not calculate them
3. The formula creates confusion ("need: 25.0%") when the developer's plan is already defined

---

## Solution

Remove the "Generate" section entirely. Users will:
1. Select the **Split** (e.g., 40/60)
2. Set the **Downpayment** percentage
3. **Add installments manually** using the "+" button in the Installments list

The "Installments" section already has an "Add" button (`addAdditionalPayment`) that lets users add payments one-by-one, which is how real-world payment plans work.

---

## Technical Changes

### File: `src/components/roi/configurator/PaymentSection.tsx`

#### 1. Remove Generate Section (lines 338-409)

Delete the entire Step 3 "Generate" block:
```tsx
{/* Auto-Generate Card - Compact */}
<div className="space-y-2 p-3 bg-[#1a1f2e] rounded-lg border border-[#CCFF00]/30">
  <div className="flex items-center gap-2">
    <div className="w-5 h-5 rounded-full bg-[#CCFF00]/20 ...">3</div>
    <Zap className="w-3.5 h-3.5 text-[#CCFF00]" />
    <span className="text-sm font-medium text-[#CCFF00]">Generate</span>
  </div>
  
  {/* Input fields for numPayments, interval, percent */}
  ...
  
  {/* Projection summary */}
  <div className="text-xs text-gray-500 ml-7 font-mono">
    {numPayments}×{percentPerPayment}% = ...
  </div>
</div>
```

#### 2. Remove Related State Variables (lines 44-46)

Remove these unused state variables:
```typescript
const [numPayments, setNumPayments] = useState(4);
const [paymentInterval, setPaymentInterval] = useState(6);
const [percentPerPayment, setPercentPerPayment] = useState(2.5);
```

#### 3. Remove `handleGeneratePayments` Function (lines 113-127)

This function is no longer needed:
```typescript
const handleGeneratePayments = () => { ... };
```

#### 4. Add "Add Installment" Button to Installments Header

Replace the existing Installments header with one that includes an add button:
```tsx
<div className="flex justify-between items-center cursor-pointer hover:opacity-80">
  <div className="flex items-center gap-2">
    <label className="text-sm text-gray-300 font-medium">Installments</label>
    <span className="text-xs text-gray-500">({inputs.additionalPayments.length})</span>
    <Button
      type="button"
      onClick={(e) => { e.stopPropagation(); addAdditionalPayment(); }}
      size="sm"
      className="h-5 px-1.5 bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 text-[9px]"
    >
      <Plus className="w-2.5 h-2.5" /> Add
    </Button>
  </div>
  {/* ... validation badge and chevron ... */}
</div>
```

---

## Visual Comparison

### Before (3 Steps):
```
┌──────────────────────────────────────────────┐
│ ① Split        [30/70] [40/60] [45/55] ...  │
├──────────────────────────────────────────────┤
│ ② Down         [──────○──────] 20%          │
├──────────────────────────────────────────────┤
│ ③ ⚡ Generate   [4]×[6] mo @ [2.5] %  [Go]  │  ← REMOVED
│    4×2.5% = 10.0% (need: 25.0%)             │
├──────────────────────────────────────────────┤
│ Installments (4)            [✓]       ▼     │
│ ...                                          │
└──────────────────────────────────────────────┘
```

### After (2 Steps + Direct Add):
```
┌──────────────────────────────────────────────┐
│ ① Split        [30/70] [40/60] [45/55] ...  │
├──────────────────────────────────────────────┤
│ ② Down         [──────○──────] 20%          │
├──────────────────────────────────────────────┤
│ Installments (4)  [+ Add]       [✓]    ▼    │  ← Direct add button
│ ...                                          │
└──────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/configurator/PaymentSection.tsx` | Remove Generate section, remove related state/functions, add "Add" button to Installments header |

---

## Benefits

1. **Simpler UI** - Fewer inputs to understand
2. **Matches real workflow** - Developers give you the plan, you just enter it
3. **No confusing "need: X%" messages** - The validation badge already shows if you're over/under
4. **More space** - One less section taking up room

