

# Plan: Fix AI Payment Plan Extractor for Snapshot Documents

## Problem Analysis

The AI extractor is producing incorrect results when parsing **cashflow snapshot PDFs** (the system's own generated output):

### What's Being Extracted (Incorrect):
| Field | Extracted | Expected |
|-------|-----------|----------|
| Month 0 | 5.57% EOI | Should be combined 20% |
| Month 0 | 13.6% Downpayment | ↑ |
| Handover Month | 14 | ~17 (Jul 2027) |
| Handover Payment | Missing/not visible | 40% |
| Total shown | ~59% visible | Should show 100% |

### Root Causes:

1. **Snapshot Format Not Recognized**: The AI extractor's prompt is designed for raw developer payment plans (brochures), not for the system's own snapshot output format which has:
   - "PAYMENT BREAKDOWN" with Entry/Journey/Handover sections
   - Exit scenarios showing "17m Jul'27" for 100% Built
   - DLD/Oqood fees separated from property payments

2. **Entry Payment Split**: The snapshot shows EOI (50K) and Downpayment Balance (107K) as separate line items, but they should be treated as a single 20% downpayment

3. **Handover Month Calculation**: The AI is looking for "In X months" patterns but the snapshot uses "17m Jul'27" format in the exit scenarios section

4. **Missing Handover Payment**: The 40% "Final Payment" in the "HANDOVER" section isn't being captured

---

## Proposed Solution

### Option A: Update Extractor to Recognize Snapshot Format (Recommended)
Add specific instructions to the system prompt to handle the cashflow snapshot format:

**File: `supabase/functions/extract-payment-plan/index.ts`**

Add to system prompt:
```text
=== LOVABLE CASHFLOW SNAPSHOT FORMAT ===
If the document is a "MONTHLY CASHFLOW STATEMENT" or shows "PAYMENT BREAKDOWN" with:
- THE ENTRY section (EOI/Booking + Downpayment Balance + DLD)
- THE JOURNEY section (monthly payments)
- HANDOVER section (Final Payment)

Then apply these rules:
1. COMBINE "EOI / Booking Fee" + "Downpayment Balance" as a SINGLE downpayment at Month 0
   - Ignore DLD Fee and Oqood/Admin (they are not part of the price split)
2. Look for "EXIT SCENARIOS" to find handover timing:
   - "17m Jul'27" = 17 months from booking, handoverMonthFromBooking = 17
   - "100% Built" indicates handover completion
3. The "HANDOVER (X%)" section contains the on-handover percentage
4. Calculate the split from section headers (e.g., "20% Entry + 40% Journey + 40% Handover = 60/40 split")
```

### Specific Changes:

**1. Add snapshot format detection (lines 44-148):**
```typescript
// Add after UNIT TYPE MAPPING section
=== LOVABLE CASHFLOW SNAPSHOT FORMAT DETECTION ===
If you see these indicators, this is a SYSTEM-GENERATED SNAPSHOT:
- "MONTHLY CASHFLOW STATEMENT" header
- "PAYMENT BREAKDOWN" with "THE ENTRY", "THE JOURNEY", "HANDOVER" sections
- "EXIT SCENARIOS" table with dates like "6m Aug'26", "17m Jul'27"
- "CASH TO START", "RENTAL INCOME", "BREAKEVEN" metrics

FOR SNAPSHOT FORMAT:
1. Ignore DLD Fee, Oqood/Admin, and other fees - only extract property price payments
2. Calculate total Entry as: EOI + Downpayment Balance (output as SINGLE Month 0 payment)
3. Journey payments are already shown with Month X format
4. HANDOVER section shows the on-handover percentage
5. For handover timing: Find "100% Built" in EXIT SCENARIOS (e.g., "17m Jul'27" = month 17)
6. The split is shown next to "CASH TO START" (e.g., "60/40")
```

**2. Update the instruction text (around line 365):**
Add snapshot-specific guidance:
```typescript
let instructionText = `Analyze the following payment plan document...

DOCUMENT TYPE DETECTION:
- If this is a "MONTHLY CASHFLOW STATEMENT" (system-generated snapshot), combine Entry fees as single downpayment
- If this is a developer brochure/payment plan PDF, extract individual milestones

For SNAPSHOT format, find handover month from "EXIT SCENARIOS" table (look for "100% Built" row like "17m Jul'27" = month 17)
```

**3. Improve handover month extraction in post-processing (lines 483-530):**
```typescript
// Add fallback: try to detect from any month format in warnings or labels
if (!extractedData.paymentStructure.handoverMonthFromBooking) {
  // Look for patterns like "17m" in labels
  const allLabels = extractedData.installments.map(i => i.label || '').join(' ');
  const monthMatch = allLabels.match(/(\d+)m\s+[A-Za-z]+'\d{2}/);
  if (monthMatch) {
    extractedData.paymentStructure.handoverMonthFromBooking = parseInt(monthMatch[1]);
  }
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/extract-payment-plan/index.ts` | Add snapshot format detection, update system prompt, improve handover extraction |

---

## Expected Results After Fix

When processing the same snapshot PDF, the extractor should output:

| Field | Current | After Fix |
|-------|---------|-----------|
| Downpayment | 5.57% + 13.6% separate | 20% combined at Month 0 |
| Handover Month | 14 | 17 |
| Split | Calculated wrong | 60/40 (from header) |
| Installments | Missing 40% handover | Complete 100% |

---

## Alternative Option B: Add User Warning

If we don't want to complicate the extractor, we could:
1. Detect when a snapshot is uploaded (by looking for "MONTHLY CASHFLOW STATEMENT")
2. Show a warning: "This appears to be a generated cashflow statement. Please upload the original payment plan PDF for accurate extraction."

This would be simpler but less user-friendly.

---

## Recommendation

**Go with Option A** - Update the extractor to handle both formats. This makes the tool more robust and handles the case where users accidentally upload snapshots instead of original payment plans.

