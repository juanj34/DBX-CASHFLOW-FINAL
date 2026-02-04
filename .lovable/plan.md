

# Plan: Verify and Fix AI Payment Plan Extraction for XENIA PDF

## Analysis of the XENIA Payment Plan PDF

The PDF clearly shows a **60/40 standard plan**:

| Payment | Percent | Date | Month from Booking |
|---------|---------|------|-------------------|
| Booking Amount (Today) | 10% | 29-Jan-2026 | Month 0 |
| First Installment | 10% | 01-Mar-2026 | Month 2 |
| 2nd Installment | 10% | 01-May-2026 | Month 4 |
| 3rd Installment | 10% | 01-Jul-2026 | Month 6 |
| 4th Installment | 10% | 01-Sep-2026 | Month 8 |
| 5th Installment | 10% | 01-Nov-2026 | Month 10 |
| **At the Handover** | **40%** | 30-Dec-2026 | Month 11 |

**Expected Extraction:**
- Split: 60/40
- Handover Month from Booking: 11
- hasPostHandover: false
- 7 installments totaling 100%

---

## Potential Issues

### Issue 1: Multi-Page PDF Parsing
The payment schedule is split across two pages:
- **Page 1**: Shows first 3 payments (Booking + 2 installments)
- **Page 2**: Shows remaining 4 payments including "At the Handover - 40%"

The AI must combine data from both pages correctly.

### Issue 2: Date-to-Month Calculation
The system needs to calculate months from explicit dates:
- Booking: 29-Jan-2026
- Handover: 30-Dec-2026
- **Expected:** 11 months (Jan→Dec)

The prompt already has date parsing instructions, but we need to verify it works for this format.

---

## Proposed Improvements

### 1. Enhance Date Parsing Instructions in System Prompt

Add explicit handling for the DD-MMM-YYYY format commonly used in Dubai payment plans:

**File: `supabase/functions/extract-payment-plan/index.ts`**

Update system prompt (around line 81-88) to add:

```text
=== EXPLICIT DATE PARSING FROM SCHEDULE ===
When you see a "Schedule of Payments" table with explicit dates like:
- "29-Jan-2026", "01-Mar-2026", "30-Dec-2026"

1. Identify the FIRST date as the booking date (typically "Today" or "Booking Amount")
2. Calculate months from booking for each payment:
   - "01-Mar-2026" from "29-Jan-2026" = 2 months (Jan→Feb→Mar)
   - "30-Dec-2026" from "29-Jan-2026" = 11 months (Jan→Dec)
3. The "At the Handover" row defines handoverMonthFromBooking
4. Month calculation: (targetYear - bookingYear) * 12 + (targetMonth - bookingMonth)
   - Example: (2026-2026)*12 + (12-1) = 11 months
```

### 2. Strengthen Multi-Page Instruction

Update the instruction text (around line 388):

```text
${images.length > 1 ? 'CRITICAL: These pages are from the SAME document. The payment schedule may continue across pages - combine ALL rows from ALL pages into a single complete schedule. Look for continuation of tables.' : ''}
```

### 3. Add Example Pattern for XENIA-style Plans

Add to system prompt:

```text
=== EXAMPLE: DEVELOPER SALES OFFER FORMAT ===
If you see "SALES OFFER" with "Schedule of Payments" table showing:
| Payment Type | Amount | Date |
| Booking Amount (Today) - 10% | 78,497 | 29-Jan-2026 |
| First Installment - 10% | 78,497 | 01-Mar-2026 |
...
| At the Handover - 40% | 313,986 | 30-Dec-2026 |

Extract as:
- 7 installments (6 time-based + 1 handover)
- Downpayment at Month 0 (10%)
- Installments at Month 2, 4, 6, 8, 10 (10% each, bi-monthly)
- Handover at Month 11 (40%)
- Split: 60/40
- handoverMonthFromBooking: 11
- hasPostHandover: false
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/extract-payment-plan/index.ts` | Add explicit date parsing for DD-MMM-YYYY format, strengthen multi-page handling, add XENIA-style example |

---

## Expected Results After Fix

When processing the XENIA PDF, the extractor should output:

| Field | Expected Value |
|-------|----------------|
| Developer | NYX Real Estate |
| Project | Xenia Residence |
| Unit | 202 |
| Type | studio |
| Size | 560.69 sqft |
| Base Price | 784,966 AED |
| Split | 60/40 |
| Handover Month | 11 |
| hasPostHandover | false |
| Installments | 7 (10%, 10%, 10%, 10%, 10%, 10%, 40%) |

---

## Testing Verification

After implementation:
1. Upload the XENIA PDF through the AI extractor
2. Verify all 7 payments appear (page 1 + page 2 combined)
3. Verify handoverMonthFromBooking = 11
4. Verify the "At the Handover - 40%" is captured with type: "handover"
5. Verify total = 100%

