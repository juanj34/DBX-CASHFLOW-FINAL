
# Fix Pre-Handover Payment Counting for Standard Plans

## Problem Analysis

When a user adds an installment that falls in the handover quarter (e.g., a 5% payment in the same month as handover), the current logic incorrectly excludes it from the pre-handover total because:

1. `isPaymentPostHandover()` uses `>=` comparison, so payments **on** the handover date are treated as "post-handover"
2. This causes the pre-handover sum to miss these payments
3. The total doesn't add up to 100%, blocking the "Next" button

### Current (Broken) Logic

```
User adds: 20% booking + 75% installments + 5% @ Month 27 (handover month)
preHandoverPercent = 100 (from split selector)

isPaymentPostHandover(Month 27) = TRUE (5% excluded!)
preHandoverInstallmentsTotal = 75% (missing the 5%)
preHandoverTotal = 20% + 75% = 95%
handoverPercent = 100 - 100 = 0%
totalPayment = 95% + 0% = 95% ← INVALID!
```

### Expected Logic

For **standard plans** (no post-handover toggle):
- ALL installments in `additionalPayments` are pre-handover by definition
- The handover payment is simply `100 - preHandoverPercent` (a derived balance)
- We should NOT filter installments by date for standard plans

```
User adds: 20% booking + 75% installments + 5% @ Month 27
preHandoverPercent = 100 (from split selector)

Standard mode: ALL additionalPayments count as pre-handover
preHandoverInstallmentsTotal = 75% + 5% = 80%
preHandoverTotal = 20% + 80% = 100%
handoverPercent = 100 - 100 = 0%
totalPayment = 100% + 0% = 100% ← VALID!
```

## Solution

### Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/configurator/PaymentSection.tsx` | For standard plans, don't filter installments by date - all are pre-handover |
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Ensure validation matches the same logic |
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Apply same fix for display consistency |

### Code Changes

#### 1. PaymentSection.tsx - Fix Pre-Handover Calculation (lines 60-72)

```typescript
// Calculate pre-handover vs post-handover totals
// CRITICAL FIX: For standard plans (no post-handover toggle), 
// ALL installments are pre-handover by definition.
// Only filter by date when hasPostHandoverPlan = true.
const preHandoverPayments = hasPostHandoverPlan 
  ? inputs.additionalPayments.filter(p => {
      if (p.type !== 'time') return true; // construction milestones = pre-handover
      return !isPaymentPostHandover(p.triggerValue, inputs.bookingMonth, inputs.bookingYear, inputs.handoverQuarter, inputs.handoverYear);
    })
  : inputs.additionalPayments; // Standard mode: ALL are pre-handover

const postHandoverPayments = hasPostHandoverPlan
  ? inputs.additionalPayments.filter(p => {
      if (p.type !== 'time') return false;
      return isPaymentPostHandover(p.triggerValue, inputs.bookingMonth, inputs.bookingYear, inputs.handoverQuarter, inputs.handoverYear);
    })
  : []; // Standard mode: NO post-handover payments
```

#### 2. CompactPaymentTable.tsx - Match the Same Logic

Apply the same conditional filtering in the snapshot view so payment display is consistent.

#### 3. Validation Consistency

The validation in `ConfiguratorLayout.tsx` already uses `additionalPaymentsTotal` for all installments, which is correct. The fix in `PaymentSection.tsx` will align the display with the validation.

## Expected Behavior After Fix

**Standard Plan (100/0 with 5% in handover month):**
```
Installments: 20% booking + 75% during construction + 5% @ handover month
preHandoverPercent = 100

preHandoverInstallmentsTotal = 80% (ALL installments)
preHandoverTotal = 20% + 80% = 100%
handoverPercent = 100 - 100 = 0%
totalPayment = 100% ✓
```

**Standard Plan (30/70 with 5% in handover month):**
```
Installments: 10% booking + 15% during construction + 5% @ handover month
preHandoverPercent = 30

preHandoverInstallmentsTotal = 20% (ALL installments)
preHandoverTotal = 10% + 20% = 30%
handoverPercent = 100 - 30 = 70%
totalPayment = 30% + 70% = 100% ✓
```

**Post-Handover Plan (Date filtering still applies):**
```
Toggle: hasPostHandoverPlan = true
Installments: 10% booking + 10% during construction + 5% @ handover month + 75% over 5 years

preHandoverPayments = 10% (filtered: only pre-handover date)
postHandoverPayments = 5% + 75% = 80% (filtered: handover+ dates)
totalPayment = 10% + 10% + 80% = 100% ✓
```

## Key Insight

The fundamental rule is:
- **Standard plans**: "Handover payment" = the remaining balance (100 - preHandoverPercent), NOT a tracked installment
- **Post-handover plans**: Date-based filtering matters because there's an explicit split between pre/on/post handover payments

By only applying date filtering when `hasPostHandoverPlan = true`, we ensure standard plans correctly count all installments as pre-handover.
