

# Plan: Add Post-Handover Total to Payment Breakdown + Tenant Contribution Analysis

## Problem Summary

1. **Payment Breakdown Grand Total** - Currently shows the total including post-handover payments, but doesn't show a sub-total for just the post-handover portion in the footer summary
2. **Post-Handover Coverage Card** - Shows per-installment and monthly equivalent, but doesn't show:
   - Total tenant contribution (rent × months)
   - Net out-of-pocket (what investor ACTUALLY pays after tenant covers portion)
   - Clear breakdown: "You pay X, Tenant pays Y, Net cost Z"

---

## Technical Changes

### File 1: `src/components/roi/snapshot/CompactPaymentTable.tsx`

**Change: Add Post-Handover subtotal row in Grand Total section (lines 436-462)**

Currently the footer shows:
- Base Property Price
- Transaction Fees
- **Total Investment**

For post-handover plans, add a subtotal breakdown showing:
- Pre-Handover Total (entry + journey + on handover)
- Post-Handover Total
- **Grand Total**

```tsx
{/* Grand Total with Fee Breakdown */}
<div className="pt-2 border-t border-theme-border space-y-1">
  {/* Property Price */}
  <DottedRow 
    label={t('basePropertyPrice')}
    value={getDualValue(basePrice).primary}
    secondaryValue={getDualValue(basePrice).secondary}
    className="text-xs"
  />
  {/* Transaction Fees */}
  <DottedRow 
    label={t('transactionFees')}
    value={getDualValue(dldFee + oqoodFee).primary}
    secondaryValue={getDualValue(dldFee + oqoodFee).secondary}
    className="text-xs"
    valueClassName="text-theme-text-muted"
  />
  
  {/* NEW: Show subtotals for post-handover plans */}
  {hasPostHandoverPlan && postHandoverTotal > 0 && (
    <>
      <div className="pt-1 mt-1 border-t border-dashed border-theme-border/50">
        <DottedRow 
          label="Paid Until Handover"
          value={getDualValue(totalUntilHandover).primary}
          secondaryValue={getDualValue(totalUntilHandover).secondary}
          className="text-xs"
          valueClassName="text-green-400"
        />
        <DottedRow 
          label="Post-Handover Balance"
          value={getDualValue(postHandoverTotal).primary}
          secondaryValue={getDualValue(postHandoverTotal).secondary}
          className="text-xs"
          valueClassName="text-purple-400"
        />
      </div>
    </>
  )}
  
  {/* Total Investment */}
  <DottedRow 
    label={t('totalInvestmentLabel')}
    value={getDualValue(grandTotal).primary}
    secondaryValue={getDualValue(grandTotal).secondary}
    bold
    className="text-sm"
    labelClassName="text-sm"
    valueClassName="text-sm"
  />
</div>
```

---

### File 2: `src/components/roi/snapshot/CompactPostHandoverCard.tsx`

**Change: Add tenant contribution analysis (lines 156-197)**

Add new calculations and display rows:
1. **Total Tenant Contribution** = monthlyRent × actualDurationMonths
2. **Your Net Payment** = postHandoverTotal - tenantContribution
3. **Effective Property Cost** = grandTotal - tenantContribution (optional summary)

```tsx
// NEW CALCULATIONS (after line 99):
// Total tenant contribution over the post-handover period
const totalTenantContribution = monthlyRent * actualDurationMonths;

// What investor actually pays out of pocket (after tenant covers portion)
const netOutOfPocket = Math.max(0, postHandoverTotal - totalTenantContribution);

// Coverage breakdown
const tenantCoversPercent = postHandoverTotal > 0 
  ? Math.min(100, Math.round((totalTenantContribution / postHandoverTotal) * 100))
  : 0;
```

**Updated content section:**
```tsx
{/* Content */}
<div className="p-3 space-y-1.5">
  {/* Post-HO Total */}
  <DottedRow 
    label={`${t('postHandoverPayments')} (${Math.round(postHandoverPercent)}%)`}
    value={getDualValue(postHandoverTotal).primary}
    secondaryValue={getDualValue(postHandoverTotal).secondary}
  />
  
  {/* Per Installment Amount */}
  <DottedRow 
    label={`Per Installment (${numberOfPayments}x)`}
    value={getDualValue(perInstallmentAmount).primary}
    secondaryValue={getDualValue(perInstallmentAmount).secondary}
    valueClassName="text-purple-400"
  />
  
  {/* Separator - WHO PAYS WHAT */}
  <div className="pt-2 mt-1 border-t border-dashed border-theme-border/50">
    <div className="text-[9px] uppercase tracking-wide text-theme-text-muted mb-1.5 flex items-center gap-1">
      <Wallet className="w-2.5 h-2.5" />
      Who Pays What
    </div>
    
    {/* Your Investment (You Pay) */}
    <DottedRow 
      label="You Pay"
      value={getDualValue(netOutOfPocket).primary}
      secondaryValue={getDualValue(netOutOfPocket).secondary}
      bold
      valueClassName={netOutOfPocket > 0 ? "text-red-400" : "text-green-400"}
    />
    
    {/* Tenant Covers */}
    <DottedRow 
      label={`Tenant Covers (${actualDurationMonths}mo rent)`}
      value={`+${getDualValue(totalTenantContribution).primary}`}
      secondaryValue={getDualValue(totalTenantContribution).secondary}
      valueClassName="text-cyan-400"
    />
  </div>
  
  {/* Summary Insight */}
  <div className="pt-1.5 mt-1 border-t border-theme-border">
    <div className={cn(
      "p-2 rounded-lg text-center text-[11px]",
      tenantCoversPercent >= 100 
        ? "bg-green-500/10 border border-green-500/30 text-green-400"
        : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
    )}>
      {tenantCoversPercent >= 100 ? (
        <>Tenant fully covers post-handover! You get +{getDualValue(totalTenantContribution - postHandoverTotal).primary} surplus</>
      ) : (
        <>Tenant covers {tenantCoversPercent}% • Your net: {getDualValue(netOutOfPocket).primary}</>
      )}
    </div>
  </div>
</div>
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `CompactPaymentTable.tsx` | Add "Paid Until Handover" + "Post-Handover Balance" subtotals in footer for post-handover plans |
| `CompactPostHandoverCard.tsx` | Add "Who Pays What" section showing tenant contribution vs. investor out-of-pocket |

---

## Expected Result

**Payment Breakdown Footer:**
```
Base Property Price         AED 1,196,713
Transaction Fees            AED 52,856
─────────────────────────────────────────
Paid Until Handover         AED 710,048   (green)
Post-Handover Balance       AED 538,521   (purple)
─────────────────────────────────────────
Total Investment            AED 1,249,569
```

**Post-Handover Coverage Card:**
```
Post-Handover (45%)         AED 538,521
Per Installment (45x)       AED 11,967

── Who Pays What ────────────────────────
You Pay                     AED 342,521   (red)
Tenant Covers (45mo rent)   +AED 196,000  (cyan)

┌────────────────────────────────────────┐
│ Tenant covers 36% • Your net: €78,200  │
└────────────────────────────────────────┘
```

