
# Fix AI Payment Plan Extraction to Match Configurator Logic

## Problem Analysis

The AI extraction produces payment data that doesn't properly map to the configurator's structure:

| AI Extracts | Configurator Expects |
|-------------|---------------------|
| Raw installments array | `downpaymentPercent`, `preHandoverPercent`, `additionalPayments[]` |
| `hasPostHandover: true` | Toggle ON + categorize payments by date |
| Individual installments | Split (e.g., "30/70") + proper pre/post categorization |
| `paymentSplit: "30/70"` | `preHandoverPercent: 30` |

### Current Issues

1. **Post-handover toggle not activating** - Even when extracted as `true`, the UI doesn't reflect this
2. **Split not matching** - Extracted split like "30/70" should set `preHandoverPercent: 30`
3. **Installments miscategorized** - Post-handover payments need to be identified by comparing their trigger dates to handover date
4. **Downpayment calculation wrong** - First installment at month 0 should be the downpayment, but current logic doesn't handle all cases

---

## Solution Architecture

### 1. Enhance AI Extraction Mapping (Edge Function)

Update the system prompt to be more explicit about:
- Booking payment = Month 0 = Downpayment
- Calculate split from pre-handover total vs post-handover total
- Mark post-handover installments with proper type

### 2. Fix ClientSection.tsx `handleAIExtraction`

The comprehensive handler needs to:

```typescript
const handleAIExtraction = (data: ExtractedPaymentPlan) => {
  // 1. Find downpayment (month 0 or "On Booking")
  const downpayment = data.installments.find(i => 
    i.type === 'time' && i.triggerValue === 0
  );
  const downpaymentPercent = downpayment?.paymentPercent || 0;
  
  // 2. Calculate pre-handover vs post-handover totals
  const preHandoverInstallments = data.installments.filter(i => 
    i.type !== 'post-handover' && i.type !== 'handover'
  );
  const postHandoverInstallments = data.installments.filter(i => 
    i.type === 'post-handover'
  );
  
  const preHandoverTotal = preHandoverInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);
  const postHandoverTotal = postHandoverInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);
  
  // 3. Determine the split
  let preHandoverPercent = preHandoverTotal;
  if (data.paymentStructure.paymentSplit) {
    // Parse explicit split like "30/70"
    const [pre] = data.paymentStructure.paymentSplit.split('/').map(Number);
    if (!isNaN(pre)) preHandoverPercent = pre;
  }
  
  // 4. Convert installments to PaymentMilestone format
  // EXCLUDE: downpayment (month 0) and explicit handover entries
  const additionalPayments = data.installments
    .filter(i => {
      if (i.type === 'time' && i.triggerValue === 0) return false; // Skip downpayment
      if (i.type === 'handover') return false; // Skip handover markers
      return true;
    })
    .map((inst, idx) => ({
      id: inst.id || `ai-${Date.now()}-${idx}`,
      type: inst.type === 'post-handover' ? 'time' : inst.type as 'time' | 'construction',
      triggerValue: inst.triggerValue,
      paymentPercent: inst.paymentPercent,
    }));
  
  // 5. Update inputs with proper structure
  setInputs(prev => ({
    ...prev,
    basePrice: data.property?.basePrice || prev.basePrice,
    downpaymentPercent,
    preHandoverPercent,
    additionalPayments,
    hasPostHandoverPlan: data.paymentStructure.hasPostHandover || postHandoverTotal > 0,
    postHandoverPercent: postHandoverTotal,
    handoverQuarter: data.paymentStructure.handoverQuarter || prev.handoverQuarter,
    handoverYear: data.paymentStructure.handoverYear || prev.handoverYear,
  }));
};
```

### 3. Fix PaymentSection.tsx `handleAIExtraction`

Same logic as ClientSection - ensure both handlers are consistent.

### 4. Improve Edge Function Post-Handover Detection

Update the extraction logic to:
- Better detect post-handover payments (any payment with months > handover)
- Calculate `postHandoverPercent` from sum of post-handover installments
- Ensure `hasPostHandover` is `true` when any installments extend past handover

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/extract-payment-plan/index.ts` | Improve system prompt for post-handover detection, calculate split from totals |
| `src/components/roi/configurator/ClientSection.tsx` | Rewrite `handleAIExtraction` with proper mapping logic |
| `src/components/roi/configurator/PaymentSection.tsx` | Sync `handleAIExtraction` with ClientSection logic |

---

## Detailed Mapping Logic

### From Extracted Data to Configurator State

```
ExtractedPaymentPlan:
├── installments[]
│   ├── type: 'time' | 'construction' | 'handover' | 'post-handover'
│   ├── triggerValue: number (months or %)
│   └── paymentPercent: number
├── paymentStructure.hasPostHandover: boolean
└── paymentStructure.paymentSplit: "30/70"

                ↓ MAPS TO ↓

OIInputs:
├── downpaymentPercent: installments[0] where triggerValue=0
├── preHandoverPercent: from split or calculated
├── additionalPayments[]: all except downpayment & handover
├── hasPostHandoverPlan: true if post-handover exists
└── postHandoverPercent: sum of post-handover installments
```

### Post-Handover Installment Handling

When `hasPostHandoverPlan: true`:
1. Set the toggle ON
2. Post-handover installments have `type: 'post-handover'` in extracted data
3. Convert them to `type: 'time'` with appropriate `triggerValue` (months from booking)
4. The configurator will auto-highlight them purple based on handover date comparison

---

## Visual Result After Fix

After applying these changes, when AI extracts a 30/70 post-handover plan:

- Toggle: "Allow Payments Past Handover" = ON
- Split: "30/70" selected
- Downpayment: 5%
- Installments: 52 entries spanning pre and post-handover
- Footer: Shows Pre | On-HO | Post | Total layout

---

## Edge Function Prompt Enhancement

Add to system prompt:
```
POST-HANDOVER CALCULATION:
- Sum all payments with type "post-handover" to get postHandoverPercent
- Set hasPostHandover = true if postHandoverPercent > 0
- Pre-handover payments are: booking + all construction milestones + time-based payments BEFORE handover
- Calculate payment split from totals if not explicitly stated: pre/post

SPLIT CALCULATION:
- If document shows "30/70" → preHandover=30, remaining=70
- If no explicit split, calculate: preHandoverTotal = sum(booking + pre-handover installments)
- The split should represent: (during construction) / (on or after completion)
```

---

## Summary

The fix involves three key changes:

1. **Edge Function**: Better extraction prompts for post-handover detection and split calculation
2. **ClientSection**: Comprehensive mapping from `ExtractedPaymentPlan` to `OIInputs`
3. **PaymentSection**: Sync the handler to use identical mapping logic

This ensures AI-extracted payment plans properly populate:
- The post-handover toggle
- The split selection
- The downpayment percentage
- All installments with correct categorization
