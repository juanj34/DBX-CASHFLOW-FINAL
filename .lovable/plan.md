

# Complete AI Payment Plan Extraction + Configurator Alignment

## Executive Summary

After comprehensive analysis of the codebase, I've identified **7 critical gaps** that must be fixed to ensure the AI extractor, manual configurator, and snapshot display all work together seamlessly for ALL payment plan types:

1. **Standard plans** (e.g., 30/70 with lump sum at handover)
2. **Post-handover plans** (e.g., 30/70 with payments extending past handover)  
3. **Construction-linked plans** (e.g., payments at 30%, 50%, 70% completion)
4. **Mixed plans** (combination of time + construction milestones)
5. **Various date formats** (days, months, calendar dates, quarters)

---

## Current State: What Works vs What's Broken

### Working Components

| Component | Status | Notes |
|-----------|--------|-------|
| `PaymentMilestone.type` | ✅ | Supports `time`, `construction`, `post-handover` |
| `constructionProgress.ts` | ✅ | S-curve for construction-to-timeline conversion |
| `CompactPaymentTable` | ✅ | Shows construction payments as "X% Built" with estimated date |
| `PaymentSection` UI | ✅ | Has Time/Construction toggle in installment rows |
| `useOICalculations` | ✅ | Handles construction triggers via S-curve |

### Broken/Missing

| Issue | Impact |
|-------|--------|
| AI doesn't calculate `handoverMonthFromBooking` | User must manually set handover Q/Y |
| Post-handover trigger values are relative | Configurator expects absolute months |
| Split semantics differ for post-handover | 30/70 = 30% construction / 70% on+after handover |
| No days-to-months conversion | "60 days" format not handled |
| No calendar date conversion | "February 2026" format not handled |
| Construction installments not prioritized | AI might miss "30% Complete" patterns |
| Handover calculation missing | Even with extracted month, Q/Y not calculated |

---

## Solution Architecture

### Data Flow After Fix

```text
PDF Input                    AI Extraction                    Configurator
─────────────────────────────────────────────────────────────────────────────
"In 26 months: 4%"    →    handoverMonthFromBooking: 26  →   handoverQ: Q3
"4th month after HO"  →    triggerValue: 30 (absolute)   →   type: 'time'
"30% Built: 5%"       →    type: 'construction'          →   type: 'construction'
"60 days: 2%"         →    triggerValue: 2               →   Month 2
"February 2026"       →    triggerValue: 13              →   Month 13
```

---

## Technical Changes

### 1. Update TypeScript Types

**File:** `src/lib/paymentPlanTypes.ts`

Add `handoverMonthFromBooking` to support calculated handover dates:

```typescript
export interface ExtractedPaymentStructure {
  paymentSplit?: string;
  hasPostHandover: boolean;
  handoverQuarter?: 1 | 2 | 3 | 4;
  handoverYear?: number;
  handoverMonthFromBooking?: number;  // NEW: e.g., 26 (calculated from installments)
  onHandoverPercent?: number;
  postHandoverPercent?: number;
}
```

---

### 2. Update Edge Function Schema + Prompt

**File:** `supabase/functions/extract-payment-plan/index.ts`

**A. Add to schema:**

```typescript
paymentStructure: {
  properties: {
    // ... existing
    handoverMonthFromBooking: {
      type: "number",
      description: "Month number from booking when handover occurs. Calculate from the LAST pre-handover payment's month number, or from explicit completion date."
    }
  }
}

installments: {
  items: {
    properties: {
      type: {
        type: "string",
        enum: ["time", "construction", "handover", "post-handover"],
        description: "time = months from booking, construction = % complete milestone, handover = on completion, post-handover = after handover (use ABSOLUTE months from booking, not relative)"
      },
      triggerValue: {
        type: "number",
        description: "For time: ABSOLUTE months from booking. For construction: completion %. For post-handover: ABSOLUTE months from booking (e.g., handover at month 26, '4th after' = 30)"
      }
    }
  }
}
```

**B. Enhanced System Prompt:**

```text
HANDOVER MONTH DETECTION - HIGHEST PRIORITY:
- Find the LAST pre-handover payment's month = handoverMonthFromBooking
- Example: "In 24m", "In 25m", "In 26m" then "Completion" → handoverMonthFromBooking = 26
- This is MORE RELIABLE than trying to extract explicit quarter/year

DATE FORMAT NORMALIZATION - ALL to absolute months from booking:
1. "In X months" / "Month X" / "After X months" → triggerValue = X
2. "X days after booking" → triggerValue = Math.round(X / 30)
3. "60 days" → 2 months, "90 days" → 3 months
4. "February 2026" with booking Jan 2025 → Calculate: (2026-2025)*12 + (2-1) = 13
5. "Q3 2027" → Mid-quarter month (Aug = 8), calculate from booking
6. If no booking context, use document date or current date

CONSTRUCTION MILESTONE DETECTION - CRITICAL:
- Keywords: "% complete", "completion", "built", "structure", "foundation", "roof"
- "On 30% completion" → type: "construction", triggerValue: 30
- "At foundation" → type: "construction", triggerValue: 10 (estimate)
- "Topping out" / "Structure complete" → type: "construction", triggerValue: 70
- Construction milestones are ALWAYS pre-handover
- Include S-curve note: "Estimated date based on typical construction progress"

POST-HANDOVER ABSOLUTE TRIGGER VALUES - CRITICAL:
- For "4th Month after Completion" with handoverMonthFromBooking = 26:
  - triggerValue = 26 + 4 = 30 (ABSOLUTE from booking)
- For "2 years post-handover" with handover at month 26:
  - triggerValue = 26 + 24 = 50
- ALL installments must use ABSOLUTE months from booking
- The receiving system determines post-handover status by comparing dates

SPLIT SEMANTICS - TWO MODES:
1. STANDARD PLANS: "30/70" = 30% during construction, 70% lump sum ON handover
2. POST-HANDOVER PLANS: "30/70" = 30% during construction, 70% ON + AFTER handover combined
   - Set hasPostHandover = true
   - The 70% includes BOTH the completion payment AND all post-handover installments
   - Calculate: preHandoverTotal = sum(booking + pre-handover installments)
   - Calculate: handoverAndPostTotal = sum(on-handover + post-handover installments)

INSTALLMENT OUTPUT FORMAT:
- Use type = "time" for all month-based payments (pre or post handover)
- Use type = "construction" for milestone-based payments (e.g., "30% complete")
- Use type = "handover" ONLY for explicit "On Completion" / "On Handover" payment
- The configurator will auto-categorize pre/post based on date vs handover date
```

---

### 3. Rewrite Mapping Logic in ClientSection.tsx

**File:** `src/components/roi/configurator/ClientSection.tsx`

```typescript
const handleAIExtraction = (extractedData: ExtractedPaymentPlan) => {
  // ... existing property info update ...
  
  if (!setInputs || !inputs) {
    toast.success('Property data imported!');
    setShowAIExtractor(false);
    return;
  }
  
  // === STEP 1: Calculate handover Q/Y from handoverMonthFromBooking ===
  let handoverQuarter = extractedData.paymentStructure.handoverQuarter || inputs.handoverQuarter;
  let handoverYear = extractedData.paymentStructure.handoverYear || inputs.handoverYear;
  
  if (extractedData.paymentStructure.handoverMonthFromBooking) {
    const handoverMonths = extractedData.paymentStructure.handoverMonthFromBooking;
    const bookingDate = new Date(inputs.bookingYear, inputs.bookingMonth - 1);
    const handoverDate = new Date(bookingDate);
    handoverDate.setMonth(handoverDate.getMonth() + handoverMonths);
    
    handoverYear = handoverDate.getFullYear();
    handoverQuarter = Math.floor(handoverDate.getMonth() / 3) + 1;
  }
  
  // === STEP 2: Find special installments ===
  // Downpayment (month 0)
  const downpayment = extractedData.installments.find(
    i => i.type === 'time' && i.triggerValue === 0
  );
  const downpaymentPercent = downpayment?.paymentPercent || inputs.downpaymentPercent;
  
  // Explicit handover payment
  const handoverPayment = extractedData.installments.find(i => i.type === 'handover');
  const onHandoverPercent = handoverPayment?.paymentPercent || 0;
  
  // === STEP 3: Calculate totals for validation ===
  const postHandoverInstallments = extractedData.installments.filter(i => 
    i.type === 'post-handover'
  );
  const postHandoverTotal = postHandoverInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);
  
  // === STEP 4: Determine pre-handover percent from split ===
  let preHandoverPercent = inputs.preHandoverPercent;
  if (extractedData.paymentStructure.paymentSplit) {
    const [pre] = extractedData.paymentStructure.paymentSplit.split('/').map(Number);
    if (!isNaN(pre)) preHandoverPercent = pre;
  }
  
  // === STEP 5: Convert ALL installments to configurator format ===
  // Keep construction type as-is, convert post-handover to time (configurator derives from date)
  const additionalPayments = extractedData.installments
    .filter(i => {
      if (i.type === 'time' && i.triggerValue === 0) return false; // Skip downpayment
      if (i.type === 'handover') return false; // Skip explicit handover marker
      return true;
    })
    .map((inst, idx) => ({
      id: inst.id || `ai-${Date.now()}-${idx}`,
      // KEEP construction type, convert post-handover to time
      type: inst.type === 'construction' 
        ? 'construction' as const 
        : 'time' as const,
      triggerValue: inst.triggerValue, // Already absolute from AI
      paymentPercent: inst.paymentPercent,
    }))
    .sort((a, b) => a.triggerValue - b.triggerValue);
  
  // === STEP 6: Update inputs with complete structure ===
  setInputs(prev => ({
    ...prev,
    basePrice: extractedData.property?.basePrice || prev.basePrice,
    downpaymentPercent,
    preHandoverPercent,
    onHandoverPercent,
    additionalPayments,
    hasPostHandoverPlan: extractedData.paymentStructure.hasPostHandover || postHandoverTotal > 0,
    postHandoverPercent: postHandoverTotal || extractedData.paymentStructure.postHandoverPercent || 0,
    handoverQuarter,
    handoverYear,
  }));
  
  toast.success('Quote data imported from AI extraction!');
  setShowAIExtractor(false);
};
```

---

### 4. Sync PaymentSection.tsx

**File:** `src/components/roi/configurator/PaymentSection.tsx`

Apply identical mapping logic to the `handleAIExtraction` function (lines 243-300). The logic should mirror ClientSection exactly.

---

### 5. Update ExtractedDataPreview.tsx

**File:** `src/components/roi/configurator/ExtractedDataPreview.tsx`

Add editable field for `handoverMonthFromBooking` and improve construction display:

```tsx
// In Payment Structure section, add after handoverYear:
<div>
  <Label className="text-xs">Handover Month (from booking)</Label>
  <Input
    type="number"
    value={data.paymentStructure.handoverMonthFromBooking || ''}
    onChange={(e) => updateStructure('handoverMonthFromBooking', parseInt(e.target.value) || undefined)}
    placeholder="Auto-detected"
    className="h-8 text-sm font-mono"
  />
  <p className="text-[10px] text-muted-foreground mt-0.5">
    Last pre-handover month (e.g., 26)
  </p>
</div>

// Update INSTALLMENT_TYPES to show better labels:
const INSTALLMENT_TYPES = [
  { value: "time", label: "Month #" },
  { value: "construction", label: "% Built" },
  { value: "handover", label: "Completion" },
  { value: "post-handover", label: "Post-HO" },
];

// Add visual indicator for construction type in the table:
// Show "%" suffix for construction, "mo" suffix for time
{inst.type === 'construction' ? (
  <span className="text-[9px] text-orange-400">@{inst.triggerValue}% built</span>
) : inst.type === 'post-handover' ? (
  <span className="text-[9px] text-purple-400">+{inst.triggerValue - (data.paymentStructure.handoverMonthFromBooking || 0)} after HO</span>
) : (
  <span className="text-[9px] text-gray-400">M{inst.triggerValue}</span>
)}
```

---

### 6. Add S-Curve Disclaimer for Construction Payments

**File:** `src/components/roi/snapshot/CompactPaymentTable.tsx`

The snapshot already estimates dates for construction payments using the S-curve (line 243-245). Add a small disclaimer:

```tsx
// For construction-based payments, add tooltip or note
if (payment.type === 'construction') {
  return (
    <span className="flex items-center gap-1">
      {payment.triggerValue}% Built
      <InfoTooltip content="Estimated date based on typical Dubai construction S-curve. Actual timing may vary." />
    </span>
  );
}
```

---

## Files to Modify Summary

| File | Changes |
|------|---------|
| `src/lib/paymentPlanTypes.ts` | Add `handoverMonthFromBooking` to `ExtractedPaymentStructure` |
| `supabase/functions/extract-payment-plan/index.ts` | Update schema + comprehensive prompt for all date formats |
| `src/components/roi/configurator/ClientSection.tsx` | Complete rewrite of `handleAIExtraction` with handover calculation |
| `src/components/roi/configurator/PaymentSection.tsx` | Sync `handleAIExtraction` with ClientSection logic |
| `src/components/roi/configurator/ExtractedDataPreview.tsx` | Add handover month field + improve construction display |

---

## Scenario Validation Matrix

After these fixes, ALL scenarios will work correctly:

| Scenario | AI Extraction | Configurator | Snapshot |
|----------|--------------|--------------|----------|
| **Standard 30/70** | Split detected, no post-HO | preHandoverPercent=30, toggle OFF | 3-column footer |
| **Post-HO 30/70** | hasPostHandover=true | toggle ON, payments auto-categorized | 4-column footer |
| **"In 26 months"** | handoverMonthFromBooking=26 | Q3 2028 calculated | Correct handover highlight |
| **"60 days after booking"** | triggerValue=2 | Month 2 payment | "Feb 2026" |
| **"February 2026"** | triggerValue=13 (from booking) | Month 13 | "Feb 2026" |
| **"4th month after HO"** | triggerValue=30 (if HO at 26) | Auto-categorized as post-HO | Purple highlight |
| **"30% Built"** | type=construction, trigger=30 | Shows "Build" type | "~Apr 2026 (est)" |
| **"On 50% completion"** | type=construction, trigger=50 | Build milestone | S-curve date |

---

## Testing Checklist

After implementation, verify with these PDFs:

1. **Standard plan**: 30/70 with lump sum at handover
2. **Post-handover plan**: 30/70 with 52 monthly installments after
3. **Days-based**: "60 days", "90 days after booking"
4. **Calendar dates**: "February, June, October 2026"
5. **Construction milestones**: "On 30% complete", "At foundation"
6. **Mixed plan**: Months + construction milestones together

Verify in each case:
- [ ] Post-handover toggle set correctly (ON/OFF)
- [ ] Handover Q/Y calculated correctly from month
- [ ] All installments populate (time + construction)
- [ ] Snapshot display matches configurator
- [ ] Footer shows correct percentages
- [ ] Construction payments show "% Built" with estimated date
- [ ] No manual adjustment needed

