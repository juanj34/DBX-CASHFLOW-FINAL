
# Plan: Fix Payment Breakdown - Add Journey Subtotal and Percentages

## Problem Summary

The Payment Breakdown in the Cashflow View is missing critical information:

| Section | Current | Expected |
|---------|---------|----------|
| **The Entry** | Shows 10% subtotal ✓ | Good |
| **The Journey** | Shows amounts only, NO subtotal | Need % per payment + subtotal row |
| **Handover** | Shows 40% + amount ✓ | Good |

Looking at the screenshot:
- 9 journey payments show amounts (AED 960,000, AED 480,000, etc.)
- But NO percentage per payment
- NO subtotal at the end of the journey section
- The total appears to be 50% of the property but this isn't displayed

---

## Technical Changes

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

#### 1. Add percentage to each journey payment label (lines 420-421)

**Current:**
```tsx
<span className="text-xs text-theme-text-muted truncate">{labelWithDate}</span>
```

**Fixed - Add percentage before the label:**
```tsx
<span className="text-xs text-theme-text-muted truncate">
  {payment.paymentPercent}% · {labelWithDate}
</span>
```

This will change:
- "Month 1 (Feb 2026) → AED 960,000" 
- TO: "10% · Month 1 (Feb 2026) → AED 960,000"

#### 2. Add Journey Subtotal row after all journey payments (after line 456)

Add a subtotal row showing the total journey percentage and amount:

```tsx
{/* Journey Subtotal */}
{preHandoverPayments.length > 0 && (
  <div className="pt-1 border-t border-theme-border mt-1">
    <DottedRow 
      label={`${t('subtotalLabel')} (${journeyPercent}%)`}
      value={getDualValue(journeyTotal).primary}
      secondaryValue={getDualValue(journeyTotal).secondary}
      bold
      valueClassName="text-cyan-400"
    />
  </div>
)}
```

#### 3. Calculate journeyPercent (add near line 212)

The `journeyTotal` is already calculated. Need to add the percentage:

```tsx
// Calculate journey percentage
const journeyPercent = preHandoverPayments.reduce(
  (sum, p) => sum + p.paymentPercent, 0
);
```

---

### Additional Issue: Year 0 Removal in YearByYearWealthTable

As per the previous request, also need to:

**File: `src/components/roi/secondary/YearByYearWealthTable.tsx`**

Remove lines 64-83 (Year 0 data push) and simplify to only show Years 1-10.

Also remove the now-unused props:
- `offPlanBasePrice`
- `secondaryBasePrice`

**File: `src/pages/OffPlanVsSecondary.tsx`**

Remove the base price props being passed to `YearByYearWealthTable`.

---

## Expected Result

### Payment Breakdown (After Fix)

```
THE ENTRY
EOI / Booking Fee                           AED 100,000
Downpayment Balance                         AED 860,000
Subtotal (10%)                              AED 960,000
DLD Fee (4%)                                AED 384,000
Oqood / Admin Fee                           AED 1,700
Total Entry                                 AED 1,345,700

THE JOURNEY (47MO)
10% · Month 1 (Feb 2026)                    AED 960,000
5% · Month 7 (Aug 2026)                     AED 480,000
5% · Month 11 (Dec 2026)                    AED 480,000
5% · Month 14 (Mar 2027)                    AED 480,000
5% · Month 20 (Sep 2027)                    AED 480,000
5% · Month 27 (Apr 2028)                    AED 480,000
5% · Month 32 (Sep 2028)                    AED 480,000
5% · Month 39 (Apr 2029)                    AED 480,000
5% · Month 44 (Sep 2029)                    AED 480,000
──────────────────────────────────────────
Subtotal (50%)                              AED 4,800,000   ← NEW

HANDOVER (40%)
Final Payment                               AED 3,840,000

Base Property Price                         AED 9,600,000
Fees (DLD + Oqood)                          AED 385,700
Total Investment                            AED 9,985,700
```

### Year-by-Year Wealth Table (After Fix)

| Before | After |
|--------|-------|
| Year 0 (duplicate of Year 1) | **Removed** |
| Year 1: AED 10.87M | Year 1: AED 10.87M (first row) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Add % to each payment label, add Journey subtotal row |
| `src/components/roi/secondary/YearByYearWealthTable.tsx` | Remove Year 0 logic, remove base price props |
| `src/pages/OffPlanVsSecondary.tsx` | Remove base price props from table component |
