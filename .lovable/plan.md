
# Plan: Fix Payment Validation for Post-Handover Plans

## Root Cause

The "Next" button is disabled because **two validation functions** in `ConfiguratorLayout.tsx` use the old calculation that doesn't account for `hasPostHandoverPlan`:

### Location 1: `isSectionComplete` (lines 192-195)
```typescript
const totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
// 20% + 51% + 55% = 126% → WRONG for post-handover
```

### Location 2: `canProceedFromCurrentSection` (lines 276-279)
```typescript
const totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
// Same wrong calculation
```

Both should match the **corrected logic** in `PaymentSection.tsx` (which was already fixed):
```typescript
if (hasPostHandoverPlan) {
  // Post-handover: all installments + downpayment = 100%
  totalPayment = downpayment + allInstallmentsTotal;
} else {
  // Standard: preHandoverTotal + handoverBalance = 100%
  totalPayment = preHandoverTotal + (100 - preHandoverPercent);
}
```

---

## Technical Changes

### File: `src/components/roi/configurator/ConfiguratorLayout.tsx`

#### Change 1: Fix `isSectionComplete` (lines 191-196)

Replace:
```typescript
// Calculate payment validation
const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
const totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
const isPaymentValid = Math.abs(totalPayment - 100) < 0.01;
```

With:
```typescript
// Calculate payment validation - must match PaymentSection logic
const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;

let totalPayment: number;
if (hasPostHandoverPlan) {
  // Post-handover: downpayment + all installments = 100%
  totalPayment = inputs.downpaymentPercent + additionalPaymentsTotal;
} else {
  // Standard: pre-handover + handover balance = 100%
  const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
  totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
}
const isPaymentValid = Math.abs(totalPayment - 100) < 0.5;
```

#### Change 2: Fix `canProceedFromCurrentSection` (lines 275-280)

Replace:
```typescript
// Calculate payment validation
const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
const totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
const isPaymentValid = Math.abs(totalPayment - 100) < 0.01;
```

With:
```typescript
// Calculate payment validation - must match PaymentSection logic
const additionalPaymentsTotal = inputs.additionalPayments.reduce((sum, m) => sum + m.paymentPercent, 0);
const hasPostHandoverPlan = inputs.hasPostHandoverPlan ?? false;

let totalPayment: number;
if (hasPostHandoverPlan) {
  // Post-handover: downpayment + all installments = 100%
  totalPayment = inputs.downpaymentPercent + additionalPaymentsTotal;
} else {
  // Standard: pre-handover + handover balance = 100%
  const preHandoverTotal = inputs.downpaymentPercent + additionalPaymentsTotal;
  totalPayment = preHandoverTotal + (100 - inputs.preHandoverPercent);
}
const isPaymentValid = Math.abs(totalPayment - 100) < 0.5;
```

Also update the tolerance from `0.01` to `0.5` to be consistent with `PaymentSection.tsx` (allows for minor rounding).

---

## Result

### Before (Post-Handover Plan with 20% down + 80% installments):
```
Validation: 20% + 80% + 55% = 155% ❌
Next button: DISABLED
Footer badge: "Must equal 100%"
```

### After:
```
Validation: 20% + 80% = 100% ✓
Next button: ENABLED
Footer badge: (none)
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Fix payment validation in both `isSectionComplete` and `canProceedFromCurrentSection` to handle `hasPostHandoverPlan` |

---

## Note on Consistency

This aligns the validation logic in `ConfiguratorLayout.tsx` with the already-corrected logic in `PaymentSection.tsx`, ensuring:

1. The footer badge in PaymentSection shows ✓ when valid
2. The step indicator shows ✓ when valid  
3. The "Next" button enables when valid
4. All use the same formula: **post-handover mode = downpayment + installments = 100%**
