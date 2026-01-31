

# Fix Booking Date Default to Today's Date

## Problem

When loading the configurator for a new quote, the booking date defaults to **January 2025** instead of **today's date**. This happens because the migration defaults in `inputMigration.ts` use hardcoded values, not dynamic date functions.

---

## Root Cause Analysis

| File | Current Value | Should Be |
|------|---------------|-----------|
| `inputMigration.ts` line 18 | `bookingMonth: 1` | `new Date().getMonth() + 1` |
| `inputMigration.ts` line 19 | `bookingYear: 2025` | `new Date().getFullYear()` |
| `ROICalculator.tsx` line 24-25 | `bookingMonth: 1, bookingYear: 2025` | Dynamic today's date |

The `types.ts` file already has the correct pattern with `getCurrentMonth()` and `getCurrentYear()` helper functions, but `inputMigration.ts` (which handles loading/migration of saved quotes) uses hardcoded static values.

---

## Solution

### 1. Update `inputMigration.ts`

Add dynamic date functions and use them in `DEFAULT_INPUT_VALUES`:

```typescript
// Add at top of file (after imports)
const getCurrentMonth = () => new Date().getMonth() + 1;
const getCurrentYear = () => new Date().getFullYear();

const DEFAULT_INPUT_VALUES: OIInputs = {
  // ... other fields ...
  bookingMonth: getCurrentMonth(),  // Was: 1
  bookingYear: getCurrentYear(),    // Was: 2025
  handoverQuarter: 4,
  handoverYear: getCurrentYear() + 2,  // Was: 2027
  // ... rest unchanged ...
};
```

### 2. Update `ROICalculator.tsx`

Fix the initial state to use dynamic dates:

```typescript
const [inputs, setInputs] = useState<ROIInputs>({
  basePrice: 800000,
  rentalYieldPercent: 8.5,
  appreciationRate: 10,
  bookingMonth: new Date().getMonth() + 1,  // Was: 1
  bookingYear: new Date().getFullYear(),    // Was: 2025
  handoverMonth: 6,
  handoverYear: new Date().getFullYear() + 3,  // Was: 2028
  resaleThresholdPercent: 40,
  oiHoldingMonths: 30,
});
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/inputMigration.ts` | Replace hardcoded dates with dynamic `getCurrentMonth()`/`getCurrentYear()` |
| `src/pages/ROICalculator.tsx` | Update initial state to use `new Date()` for booking/handover dates |

---

## Result

- New quotes will always start with **today's date** as the booking date
- Handover year will default to **current year + 2** (or +3 for ROI calculator)
- Existing saved quotes will continue to work (their saved values won't be overwritten)

