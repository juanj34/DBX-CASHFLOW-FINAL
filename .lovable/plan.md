
# Plan: Fix Snapshot Payment Display for Post-Handover Plans

## Problem Summary

The Snapshot's `CompactPaymentTable` incorrectly displays post-handover payment plans. Looking at your screenshot:

- Payments continue through and past handover (Month 18-51)
- But the table still shows **"HANDOVER (55%)" with "Final Payment"**
- This doesn't make sense - there IS no final payment when you have continuous installments

### Current (Wrong) Behavior:
```
THE ENTRY      → Correct
THE JOURNEY    → Shows payments including some after handover
HANDOVER (55%) → Shows wrong! There's no 55% final payment
─────────────────────
Total Investment
```

### Expected (Correct) Behavior for Post-Handover Plans:
```
THE ENTRY           → Downpayment + fees
THE JOURNEY (PRE)   → Installments BEFORE handover
ON HANDOVER (0-1%)  → Only if onHandoverPercent > 0
POST-HANDOVER       → Installments AFTER handover date
─────────────────────
Total Investment
```

---

## Technical Solution

### File: `src/components/roi/snapshot/CompactPaymentTable.tsx`

#### 1. Reorganize Payment Display Logic

**Current logic (lines 98-115):**
```typescript
if (hasPostHandoverPlan) {
  handoverPercent = inputs.onHandoverPercent || 0;
  handoverAmount = basePrice * handoverPercent / 100;
  postHandoverTotal = (inputs.postHandoverPayments || []).reduce(...);
} else {
  handoverPercent = 100 - inputs.preHandoverPercent;
  handoverAmount = basePrice * handoverPercent / 100;
}
```

The calculation is fine, but the **UI sections** need to change.

#### 2. Split "The Journey" into Pre and Post Sections

When `hasPostHandoverPlan` is true:

- **The Journey (Pre-Handover)**: Show only `additionalPayments` that fall BEFORE handover
- **On Handover**: Show `onHandoverPercent` only if > 0
- **Post-Handover Installments**: Show `postHandoverPayments` list

#### 3. Detailed Changes

**A. Filter pre-handover vs post-handover installments (around line 153):**

```typescript
// For standard plans, all additionalPayments are pre-handover
// For post-handover plans, filter by date
const preHandoverPayments = hasPostHandoverPlan 
  ? sortedPayments.filter(p => {
      if (p.type !== 'time') return true; // construction-based = pre-handover
      return !isPaymentPostHandover(p.triggerValue, bookingMonth, bookingYear, handoverQuarter, handoverYear);
    })
  : sortedPayments;
```

**B. Conditionally render "Handover" section (lines 327-341):**

Replace:
```tsx
{/* Section: Handover */}
<div>
  <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold mb-2">
    Handover ({handoverPercent}%)
  </div>
  <div className="space-y-1">
    <DottedRow 
      label="Final Payment"
      value={getDualValue(handoverAmount).primary}
      ...
    />
  </div>
</div>
```

With conditional rendering:
```tsx
{/* Section: On Handover - only show for standard plans OR if onHandoverPercent > 0 */}
{(!hasPostHandoverPlan || handoverPercent > 0) && (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold mb-2">
      {hasPostHandoverPlan ? `On Handover (${handoverPercent}%)` : `Handover (${handoverPercent}%)`}
    </div>
    <div className="space-y-1">
      <DottedRow 
        label={hasPostHandoverPlan ? "Handover Payment" : "Final Payment"}
        value={getDualValue(handoverAmount).primary}
        ...
      />
    </div>
  </div>
)}

{/* Section: Post-Handover Installments - only for post-handover plans */}
{hasPostHandoverPlan && (inputs.postHandoverPayments || []).length > 0 && (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-purple-400 font-semibold mb-2">
      Post-Handover ({inputs.postHandoverPercent || 0}%)
    </div>
    <div className="space-y-1">
      {(inputs.postHandoverPayments || []).map((payment, index) => {
        const amount = basePrice * (payment.paymentPercent / 100);
        const monthsAfterHandover = payment.triggerValue;
        const label = `Month +${monthsAfterHandover}`;
        // Calculate actual date
        ...
        return (
          <DottedRow 
            key={index}
            label={`${label} (${dateStr})`}
            value={getDualValue(amount).primary}
            secondaryValue={getDualValue(amount).secondary}
          />
        );
      })}
      <div className="pt-1 border-t border-theme-border mt-1">
        <DottedRow 
          label="Subtotal Post-Handover"
          value={getDualValue(postHandoverTotal).primary}
          bold
          valueClassName="text-purple-400"
        />
      </div>
    </div>
  </div>
)}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/roi/snapshot/CompactPaymentTable.tsx` | Add post-handover section, conditionally render handover section, filter journey payments |

---

## Result

After changes, for a post-handover plan (like your 51 monthly payments):

```text
┌─────────────────────────────────────────────┐
│ ⬢ PAYMENT BREAKDOWN                         │
├─────────────────────────────────────────────┤
│ THE ENTRY                                   │
│   Downpayment (20%) .............. AED XX   │
│   DLD + Oqood .................... AED XX   │
│   Total Entry .................... AED XX   │
├─────────────────────────────────────────────┤
│ THE JOURNEY (17mo)                          │
│   Month 1 (Feb 2026) ............. AED 6,019│
│   ...                                       │
│   Month 17 (Jun 2027) 🔑 Handover. AED 6,019│
│   Subtotal ....................... AED XX   │
├─────────────────────────────────────────────┤
│ POST-HANDOVER (51%)                         │
│   Month +1 (Jul 2027) ............ AED 6,019│
│   Month +2 (Aug 2027) ............ AED 6,019│
│   ...                                       │
│   Month +34 (Apr 2030) ........... AED 6,019│
│   Subtotal Post-Handover ......... AED XX   │
├─────────────────────────────────────────────┤
│ Base Property Price .............. AED XX   │
│ Transaction Fees ................. AED XX   │
│ Total Investment ................. AED XX   │
└─────────────────────────────────────────────┘
```

This accurately represents the post-handover payment structure without the misleading "Final Payment" section.
