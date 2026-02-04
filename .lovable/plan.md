

# Plan: Fixes for Quote Creation Issues, Configurator Step Persistence, and AI Import Payment Plan Erasure

## Summary of Issues Found

Based on code analysis, I identified three related bugs:

### Issue 1: Strange Refresh When Creating New Quote
**Root Cause:** When clicking "New Quote", the flow involves:
1. `handleNewQuote()` navigates to `/cashflow-generator` with `{ state: { openConfigurator: true } }`
2. This triggers a full component remount (state reset in `useEffect` at line 161-210)
3. Then `createDraft()` creates a new quote and navigates AGAIN to `/cashflow/${newId}` with `{ state: { openConfigurator: true } }`
4. This double navigation causes the "refresh" feeling

**The Problem:** The flow creates a working draft, navigates, then opens the configurator - but the navigation itself causes a visual refresh.

### Issue 2: Configurator Opens on Wrong Step
**Root Cause:** In `ConfiguratorLayout.tsx` line 140:
```typescript
const savedState = (quoteId && !isNewQuote) ? loadConfiguratorState() : null;
```

The `isNewQuote` prop is computed in `OICalculator.tsx` line 546:
```typescript
isNewQuote={!!(quoteId && !quote?.project_name && !quote?.developer && inputs.basePrice === 0)}
```

**The Problem:** 
- When creating a new quote, `createDraft()` is called, which creates a quote with empty data
- But then `inputs.basePrice` might be set to `800000` (default from `NEW_QUOTE_OI_INPUTS`)
- This makes `isNewQuote` evaluate to `false`, so `loadConfiguratorState()` is called
- If there's stale state in localStorage from a previous session, it loads that step (not step 1)

### Issue 3: Payment Plans Erased After AI Import
**Root Cause:** The AI extractor in LocationSection only applies property data, NOT payment plan data:

```typescript
// LocationSection.tsx lines 54-80
const handleAIExtraction = (extractedData: ExtractedPaymentPlan) => {
  // Only updates clientInfo and basePrice
  // Does NOT update payment plan installments!
  
  onClientInfoChange({ ... }); // Updates developer, project, unit
  
  if (extractedData.property?.basePrice) {
    setInputs(prev => ({ ...prev, basePrice: extractedData.property!.basePrice! }));
  }
  
  toast.success('Property data imported!');
  // Payment plan data is LOST here!
};
```

**The Problem:** When using AI import from Step 1 (Location), only property info is applied. The user expects payment data too, but it's discarded.

---

## Proposed Fixes

### Fix 1: Eliminate Double Navigation on New Quote

**File: `src/pages/OICalculator.tsx`**

Change the flow so we don't navigate twice:

```typescript
// Current problematic flow (lines 230-243):
const handleNewQuote = useCallback(() => {
  // ... checks ...
  localStorage.removeItem('cashflow-configurator-state');
  localStorage.removeItem('cashflow_configurator_open');
  navigate('/cashflow-generator', { replace: true, state: { openConfigurator: true } });
}, [navigate, isWorkingDraftWithContent]);
```

**Solution:** Navigate directly to a new quote without the intermediate `/cashflow-generator` step:

```typescript
const handleNewQuote = useCallback(async () => {
  if (isWorkingDraftWithContent) {
    setPendingAction('new');
    setShowUnsavedDialog(true);
    return;
  }
  
  // Clear configurator state
  localStorage.removeItem('cashflow-configurator-state');
  localStorage.removeItem('cashflow_configurator_open');
  
  // Create draft first, then navigate once
  const newId = await createDraft();
  if (newId) {
    navigate(`/cashflow/${newId}`, { replace: true, state: { openConfigurator: true } });
  } else {
    // Fallback: navigate to generator
    navigate('/cashflow-generator', { replace: true, state: { openConfigurator: true } });
  }
}, [navigate, isWorkingDraftWithContent, createDraft]);
```

### Fix 2: Always Clear Configurator State for New Quotes

**File: `src/components/roi/configurator/ConfiguratorLayout.tsx`**

Improve the detection logic and always start at step 1 for new quotes:

```typescript
// Line 140 - Current:
const savedState = (quoteId && !isNewQuote) ? loadConfiguratorState() : null;

// Proposed - More robust check:
const savedState = useMemo(() => {
  // Never load saved state for new quotes
  if (isNewQuote) return null;
  
  // Only load saved state if we have a real quote with data
  if (!quoteId) return null;
  
  const loaded = loadConfiguratorState();
  
  // Validate the loaded state is for the current quote (add quoteId to storage)
  // For now, just check if we have meaningful data
  return loaded;
}, [quoteId, isNewQuote]);
```

**Also add a useEffect to clear state when `isNewQuote` changes:**

```typescript
useEffect(() => {
  if (isNewQuote) {
    localStorage.removeItem(CONFIGURATOR_STATE_KEY);
    setActiveSection('location');
    setVisitedSections(new Set(['location']));
  }
}, [isNewQuote]);
```

### Fix 3: Apply Full Payment Plan from AI Import in LocationSection

**File: `src/components/roi/configurator/LocationSection.tsx`**

Update `handleAIExtraction` to also apply payment plan data (like PaymentSection does):

```typescript
const handleAIExtraction = (extractedData: ExtractedPaymentPlan, bookingDate: { month: number; year: number }) => {
  const sqfToM2 = (sqf: number) => Math.round(sqf * SQF_TO_M2 * 10) / 10;
  
  // Update client info with extracted property details
  onClientInfoChange({
    ...clientInfo,
    developer: extractedData.property?.developer || clientInfo.developer,
    projectName: extractedData.property?.projectName || clientInfo.projectName,
    unit: extractedData.property?.unitNumber || clientInfo.unit,
    unitType: extractedData.property?.unitType || clientInfo.unitType,
    unitSizeSqf: extractedData.property?.unitSizeSqft || clientInfo.unitSizeSqf,
    unitSizeM2: extractedData.property?.unitSizeSqft 
      ? sqfToM2(extractedData.property.unitSizeSqft) 
      : clientInfo.unitSizeM2,
  });
  
  // === NEW: Apply the FULL payment plan data ===
  // Reuse the same logic from PaymentSection.handleAIExtraction
  
  // Find handover payment
  const handoverPayment = extractedData.installments.find(i => i.type === 'handover');
  
  // Calculate handover timing
  let handoverMonth: number | undefined;
  let handoverYear = inputs.handoverYear;
  let handoverQuarter = inputs.handoverQuarter;
  
  if (handoverPayment && handoverPayment.triggerValue > 0) {
    const bookingDateObj = new Date(bookingDate.year, bookingDate.month - 1);
    const handoverDateObj = new Date(bookingDateObj);
    handoverDateObj.setMonth(handoverDateObj.getMonth() + handoverPayment.triggerValue);
    handoverMonth = handoverDateObj.getMonth() + 1;
    handoverYear = handoverDateObj.getFullYear();
    handoverQuarter = Math.ceil(handoverMonth / 3) as 1 | 2 | 3 | 4;
  } else if (extractedData.paymentStructure.handoverMonthFromBooking) {
    const bookingDateObj = new Date(bookingDate.year, bookingDate.month - 1);
    const handoverDateObj = new Date(bookingDateObj);
    handoverDateObj.setMonth(handoverDateObj.getMonth() + extractedData.paymentStructure.handoverMonthFromBooking);
    handoverMonth = handoverDateObj.getMonth() + 1;
    handoverYear = handoverDateObj.getFullYear();
    handoverQuarter = Math.ceil(handoverMonth / 3) as 1 | 2 | 3 | 4;
  }
  
  // Find downpayment
  const downpayment = extractedData.installments.find(i => i.type === 'time' && i.triggerValue === 0);
  const downpaymentPercent = downpayment?.paymentPercent || inputs.downpaymentPercent;
  
  // Calculate pre-handover percent
  let preHandoverPercent = inputs.preHandoverPercent;
  if (extractedData.paymentStructure.paymentSplit) {
    const [pre] = extractedData.paymentStructure.paymentSplit.split('/').map(Number);
    if (!isNaN(pre)) preHandoverPercent = pre;
  } else {
    const preHOInstallments = extractedData.installments.filter(i => 
      i.type === 'time' || i.type === 'construction'
    );
    const preHOTotal = preHOInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);
    if (preHOTotal > 0 && preHOTotal <= 100) preHandoverPercent = preHOTotal;
  }
  
  // Convert installments (excluding downpayment and handover)
  const additionalPayments = extractedData.installments
    .filter(i => {
      if (i.type === 'time' && i.triggerValue === 0) return false;
      if (i.type === 'handover') return false;
      return true;
    })
    .map((inst, idx) => ({
      id: inst.id || `ai-${Date.now()}-${idx}`,
      type: inst.type === 'construction' ? 'construction' as const : 'time' as const,
      triggerValue: inst.triggerValue,
      paymentPercent: inst.paymentPercent,
    }))
    .sort((a, b) => a.triggerValue - b.triggerValue);
  
  // Post-handover handling
  const postHandoverInstallments = extractedData.installments.filter(i => i.type === 'post-handover');
  const postHandoverTotal = postHandoverInstallments.reduce((sum, i) => sum + i.paymentPercent, 0);
  const hasPostHandover = extractedData.paymentStructure.hasPostHandover || postHandoverTotal > 0;
  
  // Update inputs with FULL payment plan
  setInputs(prev => ({
    ...prev,
    // Property
    basePrice: extractedData.property?.basePrice || prev.basePrice,
    unitSizeSqf: extractedData.property?.unitSizeSqft || prev.unitSizeSqf,
    // Booking date
    bookingMonth: bookingDate.month,
    bookingYear: bookingDate.year,
    // Payment structure
    downpaymentPercent,
    preHandoverPercent,
    additionalPayments,
    hasPostHandoverPlan: hasPostHandover,
    postHandoverPercent: postHandoverTotal,
    // Handover timing
    handoverMonth,
    handoverQuarter,
    handoverYear,
  }));
  
  toast.success('Property data and payment plan imported!');
};
```

**Also update the PaymentPlanExtractor call to pass bookingDate:**

```typescript
<PaymentPlanExtractor
  open={showAIExtractor}
  onOpenChange={setShowAIExtractor}
  existingBookingMonth={inputs.bookingMonth}
  existingBookingYear={inputs.bookingYear}
  onApply={(data, bookingDate) => handleAIExtraction(data, bookingDate)}
/>
```

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/pages/OICalculator.tsx` | Fix double navigation in handleNewQuote - create draft first, navigate once | High |
| `src/components/roi/configurator/ConfiguratorLayout.tsx` | Clear localStorage state for new quotes, always start at step 1 | High |
| `src/components/roi/configurator/LocationSection.tsx` | Apply full payment plan from AI extraction, not just property info | High |

---

## Expected Results

1. **New Quote Creation:** Single smooth navigation, no visual refresh
2. **Configurator Step:** Always starts at Step 1 (Location) for new quotes
3. **AI Import:** Payment plans extracted in Step 1 will persist and be visible in Step 3 (Payment)

---

## Testing Notes

After implementation:
1. Click "New Quote" from an existing quote - verify smooth transition, no double refresh
2. Verify configurator opens at Step 1 (Location) for new quotes
3. Upload a payment plan PDF in Step 1 (AI Auto-Fill)
4. Navigate to Step 3 (Payment) and verify installments are populated correctly

