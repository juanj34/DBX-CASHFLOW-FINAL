
# Fix AI Payment Plan Extractor: Apply Booking Date to Configurator

## Problem Analysis

When using the AI Payment Plan Extractor:
1. User selects a booking date (today, existing, or custom) in the extraction sheet
2. This date is sent to the AI for calculating payment timelines
3. AI extracts handover timing correctly (e.g., "Month 23 from booking")
4. **BUT**: When clicking "Apply to Configurator", the booking date chosen in the extractor is **never applied** to the configurator's Property section

As a result:
- The "Booking Date" dropdown in PropertySection still shows the old/default value (January 2026 in your screenshot)
- The "Handover Date" doesn't update correctly because it's derived from the booking date + offset
- User expects these fields to auto-fill based on their AI extraction choices

## Root Cause

In `PaymentSection.tsx` → `handleAIExtraction()`:

```typescript
setInputs(prev => ({
  ...prev,
  downpaymentPercent,
  preHandoverPercent,
  // ...
  handoverMonth,
  handoverQuarter,
  handoverYear,
  // basePrice is applied if extracted
  ...(data.property?.basePrice && { basePrice: data.property.basePrice }),
  // ❌ MISSING: bookingMonth and bookingYear are NOT being applied
}));
```

The booking date selected in the extractor sheet (`getBookingDate()`) is only used for API calculation but never flows back to the configurator state.

## Solution

### 1. Add `bookingDate` to the extraction data flow

Currently, `PaymentPlanExtractor` passes `bookingDate` to the edge function but doesn't include it in the `onApply` callback data. We need to:

**Option A (Preferred - No type changes):** Track the booking date in the extractor and pass it with the extracted data
- Store the selected booking date in the extractor component
- Include it in the `handleApply` call alongside the extracted data

**Option B:** Extend `ExtractedPaymentPlan` type to include booking date (requires type file changes)

### 2. Update `handleAIExtraction` to apply booking date

When the extraction is applied, set:
- `bookingMonth` from the extractor's selected booking date
- `bookingYear` from the extractor's selected booking date

## Implementation Plan

### Step 1: Modify `PaymentPlanExtractor.tsx`

Update the component to pass the booking date alongside the extracted data:

```typescript
// Change the onApply signature to include booking date
interface PaymentPlanExtractorProps {
  // ...existing props
  onApply: (data: ExtractedPaymentPlan, bookingDate: { month: number; year: number }) => void;
}

// In handleApply:
const handleApply = (data: ExtractedPaymentPlan) => {
  const booking = getBookingDate();
  onApply(data, { month: booking.month!, year: booking.year! });
  // ...rest
};
```

### Step 2: Update `PaymentSection.tsx`

Modify `handleAIExtraction` to:
1. Accept the booking date parameter
2. Apply `bookingMonth` and `bookingYear` to inputs

```typescript
const handleAIExtraction = (
  data: ExtractedPaymentPlan, 
  bookingDate: { month: number; year: number }
) => {
  // Existing logic for deriving handover...
  
  setInputs(prev => ({
    ...prev,
    // NEW: Apply the booking date from extractor
    bookingMonth: bookingDate.month,
    bookingYear: bookingDate.year,
    // Existing fields
    downpaymentPercent,
    preHandoverPercent,
    handoverQuarter,
    handoverYear,
    // ...etc
  }));
};
```

### Step 3: Recalculate Handover from New Booking Date

Since handover is calculated as an offset from booking, ensure the calculation uses the applied booking date:

```typescript
// When applying extraction:
const bookingDate = new Date(selectedBookingYear, selectedBookingMonth - 1);
const handoverDate = new Date(bookingDate);
handoverDate.setMonth(handoverDate.getMonth() + handoverMonthFromBooking);

const handoverMonth = handoverDate.getMonth() + 1;
const handoverYear = handoverDate.getFullYear();
const handoverQuarter = Math.ceil(handoverMonth / 3) as 1 | 2 | 3 | 4;
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/configurator/PaymentPlanExtractor.tsx` | Update `onApply` to include booking date parameter |
| `src/components/roi/configurator/PaymentSection.tsx` | Update `handleAIExtraction` to accept and apply booking date |

## Expected Outcome

After applying an AI-extracted payment plan:
1. **Booking Date** in PropertySection updates to match the extractor selection (e.g., "January 2026" if user chose today's date)
2. **Handover Date** updates to the correctly calculated Q/Year based on booking + offset
3. All payment milestones align with the correct timeline
4. Footer shows accurate totals (100%)

## Additional Property Fields (Bonus)

The AI already extracts other property fields that could also be applied:
- `property.developer` → Could update client info
- `property.projectName` → Could update client info
- `property.unitSizeSqft` → Could update `unitSizeSqf` in inputs

These could be added as optional enhancements in the same change.
