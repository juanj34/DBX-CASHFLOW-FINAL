

# Plan: Fix Payment Footer + Compact UI

## Two Problems to Fix

### Problem 1: Footer Shows Wrong "Handover" for Post-Handover Plans
The footer calculates:
```typescript
const handoverPercent = 100 - inputs.preHandoverPercent;  // = 55% for 45/55 split
const totalPayment = preHandoverTotal + handoverPercent;   // = 100% + 55% = 155% ❌
```

But for post-handover plans, there's NO lump sum at handover. The payments are:
- **Pre-Handover**: Downpayment + installments before handover
- **On Handover**: Small amount (0-5%) or nothing
- **Post-Handover**: Installments after handover

### Problem 2: UI is Too Cramped
From previous discussion - the configurator needs more compact spacing.

---

## Solution

### For Post-Handover Plans: New 4-Column Footer

When `hasPostHandoverPlan` is enabled, show:
```
┌──────────────────────────────────────────────────────────────────────┐
│  PRE-HO       ON-HAND       POST-HO        TOTAL                    │
│   45%           1%           54%       =   100% ✓                   │
└──────────────────────────────────────────────────────────────────────┘
```

When `hasPostHandoverPlan` is **disabled** (standard plan), keep current:
```
┌──────────────────────────────────────────────────────────────────────┐
│  PRE-HANDOVER        HANDOVER          TOTAL                        │
│      45%               55%          =  100% ✓                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Technical Changes

### File: `src/components/roi/configurator/PaymentSection.tsx`

#### 1. Fix Calculation Logic (lines 54-64)

```typescript
// Calculate totals differently based on post-handover mode
const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;

// Pre-handover is always the same
const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;

// Handover and Post-handover depend on mode
let handoverPercent: number;
let postHandoverTotal: number = 0;
let totalPayment: number;

if (hasPostHandoverPlan) {
  // Post-handover mode: specific on-handover + post installments
  handoverPercent = inputs.onHandoverPercent || 0;
  postHandoverTotal = (inputs.postHandoverPayments || []).reduce((sum, m) => sum + m.paymentPercent, 0);
  totalPayment = preHandoverTotal + handoverPercent + postHandoverTotal;
} else {
  // Standard mode: remaining goes to handover
  handoverPercent = 100 - inputs.preHandoverPercent;
  totalPayment = preHandoverTotal + handoverPercent;
}

const isValidTotal = Math.abs(totalPayment - 100) < 0.5;
```

#### 2. Conditional Footer Rendering (lines 558-597)

**Standard Plan Footer (current 3 columns):**
```tsx
{!hasPostHandoverPlan && (
  <div className="flex items-center gap-3">
    {/* Pre-Handover | Handover | Total */}
  </div>
)}
```

**Post-Handover Plan Footer (new 4 columns):**
```tsx
{hasPostHandoverPlan && (
  <div className="flex items-center gap-2">
    {/* Pre-HO */}
    <div className="flex-1 flex items-center gap-1.5 min-w-0">
      <div className="w-2 h-2 rounded-full bg-[#CCFF00] shrink-0" />
      <span className="text-[9px] text-gray-500 uppercase truncate">Pre-HO</span>
      <span className="text-xs font-mono text-white ml-auto">{preHandoverTotal.toFixed(0)}%</span>
    </div>
    
    <div className="h-5 w-px bg-[#2a3142]" />
    
    {/* On Handover */}
    <div className="flex-1 flex items-center gap-1.5 min-w-0">
      <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
      <span className="text-[9px] text-gray-500 uppercase truncate">On-HO</span>
      <span className="text-xs font-mono text-white ml-auto">{handoverPercent}%</span>
    </div>
    
    <div className="h-5 w-px bg-[#2a3142]" />
    
    {/* Post-Handover */}
    <div className="flex-1 flex items-center gap-1.5 min-w-0">
      <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
      <span className="text-[9px] text-gray-500 uppercase truncate">Post-HO</span>
      <span className="text-xs font-mono text-purple-400 ml-auto">{postHandoverTotal.toFixed(0)}%</span>
    </div>
    
    <div className="h-5 w-px bg-[#2a3142]" />
    
    {/* Total */}
    <div className="flex-1 flex items-center gap-1.5 min-w-0">
      {isValidTotal ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <AlertCircle className="w-3 h-3 text-red-400" />}
      <span className="text-[9px] text-gray-500 uppercase">Total</span>
      <span className={`text-xs font-mono font-bold ml-auto ${isValidTotal ? 'text-green-400' : 'text-red-400'}`}>
        {totalPayment.toFixed(0)}%
      </span>
    </div>
  </div>
)}
```

#### 3. Compact UI Changes (throughout file)

- Reduce container spacing: `space-y-4` → `space-y-2`
- Reduce step block padding: `p-3` → `p-2`
- Reduce step badges: `w-5 h-5` → `w-4 h-4`
- Increase installments list height: `max-h-72` → `max-h-[50vh]`
- Reduce row heights: `h-6` → `h-5`
- Reduce font sizes in rows: `text-xs` → `text-[10px]`

---

## Result

### Before (Post-Handover Plan):
```
PRE-HANDOVER  100%  |  HANDOVER  55%  |  TOTAL  155% ❌
```

### After (Post-Handover Plan):
```
PRE-HO  49%  |  ON-HO  0%  |  POST-HO  51%  |  TOTAL  100% ✓
```

### Standard Plan (unchanged):
```
PRE-HANDOVER  45%  |  HANDOVER  55%  |  TOTAL  100% ✓
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/configurator/PaymentSection.tsx` | Fix footer calculation logic, add conditional 4-column footer for post-handover, compact UI throughout |

